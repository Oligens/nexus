/**
 * ATIBON NEXUS — Defensive Security Engine
 *
 * Single-file integration layer for NEXUS.
 *
 * This file intentionally converts the supplied ATIBON prototype into a
 * defensive, auditable component. It does NOT implement exploitation,
 * credential bypass, persistence, lateral movement, C2, payload obfuscation,
 * anti-forensics, destructive actions, or AV-evasion.
 *
 * Design goals:
 * - one self-contained file;
 * - no external ATIBON connection required;
 * - explicit target authorization;
 * - passive analysis of observations supplied by NEXUS;
 * - bounded optional health checks only;
 * - deterministic reports suitable for the NEXUS HUD.
 */

export type AtibonTargetStatus = 'Active' | 'Compromised' | 'Standby';
export type AtibonFindingSeverity = 'info' | 'low' | 'medium' | 'high';

export interface AtibonTarget {
  id: string;
  name: string;
  host: string;
  port?: number;
  protocol?: 'http' | 'https';
  status?: AtibonTargetStatus;
  authorized?: boolean;
  metadata?: Record<string, string>;
}

export interface AtibonObservation {
  timestamp?: number;
  statusCode?: number;
  latencyMs?: number;
  responseBytes?: number;
  responseHash?: string;
  headers?: Record<string, string>;
  error?: string;
}

export interface AtibonFinding {
  severity: AtibonFindingSeverity;
  code: string;
  title: string;
  description: string;
  evidence?: Record<string, unknown>;
}

export interface AtibonReport {
  engine: 'ATIBON-NEXUS';
  version: '1.0-safe';
  target: Pick<AtibonTarget, 'id' | 'name' | 'host' | 'port' | 'protocol'>;
  generatedAt: number;
  observations: number;
  findings: AtibonFinding[];
  metrics: {
    averageLatencyMs: number | null;
    minLatencyMs: number | null;
    maxLatencyMs: number | null;
    errorRate: number | null;
    responseBytesAverage: number | null;
  };
}

export interface AtibonNexusEngine {
  readonly name: 'ATIBON-NEXUS';
  readonly version: '1.0-safe';
  authorize(target: AtibonTarget): boolean;
  registerTarget(target: AtibonTarget): AtibonTarget;
  analyze(target: AtibonTarget, observations: AtibonObservation[]): AtibonReport;
  healthCheck(target: AtibonTarget, timeoutMs?: number): Promise<AtibonObservation>;
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const SAFE_SUFFIXES = ['.local', '.test', '.internal', '.lan', '.home'];
const MAX_TIMEOUT_MS = 5000;
const MAX_BODY_BYTES = 64 * 1024;

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/^\[|\]$/g, '');
}

function isPrivateIPv4(host: string): boolean {
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254);
}

function isAuthorizedHost(host: string): boolean {
  const normalized = normalizeHost(host);
  return LOOPBACK_HOSTS.has(normalized) ||
    SAFE_SUFFIXES.some((suffix) => normalized.endsWith(suffix)) ||
    isPrivateIPv4(normalized);
}

function finiteNumbers(values: Array<number | undefined>): number[] {
  return values.filter((value): value is number => Number.isFinite(value));
}

function average(values: number[]): number | null {
  return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3)) : null;
}

function sha256Hex(data: ArrayBuffer): Promise<string> {
  return crypto.subtle.digest('SHA-256', data).then((hash) =>
    Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join(''),
  );
}

function pushFinding(
  findings: AtibonFinding[],
  severity: AtibonFindingSeverity,
  code: string,
  title: string,
  description: string,
  evidence?: Record<string, unknown>,
): void {
  findings.push({ severity, code, title, description, evidence });
}

function buildReport(target: AtibonTarget, observations: AtibonObservation[]): AtibonReport {
  const latencies = finiteNumbers(observations.map((item) => item.latencyMs));
  const sizes = finiteNumbers(observations.map((item) => item.responseBytes));
  const errors = observations.filter((item) => item.error || (item.statusCode !== undefined && item.statusCode >= 500)).length;
  const findings: AtibonFinding[] = [];

  if (!target.authorized) {
    pushFinding(
      findings,
      'high',
      'TARGET_NOT_AUTHORIZED',
      'Cible non autorisée',
      'ATIBON-NEXUS refuse toute analyse active tant que la cible n’est pas explicitement marquée comme autorisée.',
    );
  }

  if (!observations.length) {
    pushFinding(
      findings,
      'info',
      'NO_OBSERVATIONS',
      'Aucune observation',
      'Le moteur attend des données réelles provenant de NEXUS. Aucun résultat fictif n’est généré.',
    );
  }

  const insecureTransport = target.protocol === 'http';
  if (insecureTransport) {
    pushFinding(
      findings,
      'medium',
      'PLAINTEXT_TRANSPORT',
      'Transport HTTP',
      'La cible utilise HTTP. HTTPS doit être privilégié lorsque le service le permet.',
    );
  }

  const serverErrors = observations.filter((item) => (item.statusCode ?? 0) >= 500).length;
  if (serverErrors > 0) {
    pushFinding(
      findings,
      'medium',
      'SERVER_ERRORS',
      'Erreurs serveur observées',
      'Des réponses 5xx ont été observées dans les données fournies par NEXUS.',
      { count: serverErrors },
    );
  }

  const averageLatencyMs = average(latencies);
  if (averageLatencyMs !== null && averageLatencyMs > 1000) {
    pushFinding(
      findings,
      'low',
      'HIGH_LATENCY',
      'Latence élevée',
      'La latence moyenne dépasse 1 seconde sur les observations fournies.',
      { averageLatencyMs },
    );
  }

  const securityHeaders = observations.flatMap((item) =>
    Object.keys(item.headers ?? {}).map((key) => key.toLowerCase()),
  );
  const securityHeaderSet = new Set(securityHeaders);
  const missingHeaders = ['content-security-policy', 'x-content-type-options']
    .filter((header) => !securityHeaderSet.has(header));

  if (missingHeaders.length && observations.some((item) => item.statusCode !== undefined)) {
    pushFinding(
      findings,
      'low',
      'SECURITY_HEADERS_REVIEW',
      'En-têtes de sécurité à vérifier',
      'Certains en-têtes de sécurité courants n’ont pas été observés. Cette indication est informative et doit être vérifiée selon le contexte applicatif.',
      { missingHeaders },
    );
  }

  return {
    engine: 'ATIBON-NEXUS',
    version: '1.0-safe',
    target: {
      id: target.id,
      name: target.name,
      host: target.host,
      port: target.port,
      protocol: target.protocol,
    },
    generatedAt: Date.now(),
    observations: observations.length,
    findings,
    metrics: {
      averageLatencyMs,
      minLatencyMs: latencies.length ? Math.min(...latencies) : null,
      maxLatencyMs: latencies.length ? Math.max(...latencies) : null,
      errorRate: observations.length ? Number(((errors / observations) * 100).toFixed(2)) : null,
      responseBytesAverage: average(sizes),
    },
  };
}

export function createAtibonNexusEngine(): AtibonNexusEngine {
  const targets = new Map<string, AtibonTarget>();

  const authorize = (target: AtibonTarget): boolean => {
    return Boolean(target.authorized) && isAuthorizedHost(target.host);
  };

  const registerTarget = (target: AtibonTarget): AtibonTarget => {
    const normalized: AtibonTarget = {
      ...target,
      id: target.id.trim(),
      name: target.name.trim(),
      host: normalizeHost(target.host),
      port: target.port ?? (target.protocol === 'https' ? 443 : 80),
      authorized: authorize(target),
    };

    if (!normalized.id || !normalized.name || !normalized.host) {
      throw new Error('ATIBON-NEXUS: identifiant, nom et hôte sont obligatoires.');
    }

    if (!normalized.authorized) {
      throw new Error('ATIBON-NEXUS: cible refusée. Utilisez uniquement une cible explicitement autorisée et locale/interne.');
    }

    targets.set(normalized.id, normalized);
    return normalized;
  };

  const analyze = (target: AtibonTarget, observations: AtibonObservation[]): AtibonReport => {
    const registered = targets.get(target.id) ?? target;
    return buildReport(registered, observations);
  };

  const healthCheck = async (target: AtibonTarget, timeoutMs = 3000): Promise<AtibonObservation> => {
    if (!authorize(target)) {
      throw new Error('ATIBON-NEXUS: health check refusé pour une cible non autorisée.');
    }

    const protocol = target.protocol ?? 'http';
    const port = target.port ?? (protocol === 'https' ? 443 : 80);
    const base = `${protocol}://${target.host}:${port}`;
    const controller = new AbortController();
    const timeout = Math.min(Math.max(timeoutMs, 100), MAX_TIMEOUT_MS);
    const timer = window.setTimeout(() => controller.abort(), timeout);
    const started = performance.now();

    try {
      const response = await fetch(`${base}/health`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      const contentLength = response.headers.get('content-length');
      const responseBytes = contentLength ? Math.min(Number(contentLength) || 0, MAX_BODY_BYTES) : undefined;
      const body = responseBytes === undefined ? await response.arrayBuffer() : undefined;
      const boundedBody = body ? body.slice(0, MAX_BODY_BYTES) : undefined;
      const responseHash = boundedBody ? await sha256Hex(boundedBody) : undefined;

      return {
        timestamp: Date.now(),
        statusCode: response.status,
        latencyMs: Number((performance.now() - started).toFixed(2)),
        responseBytes: responseBytes ?? boundedBody?.byteLength,
        responseHash,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      return {
        timestamp: Date.now(),
        latencyMs: Number((performance.now() - started).toFixed(2)),
        error: error instanceof Error ? error.message : 'Health check failed',
      };
    } finally {
      window.clearTimeout(timer);
    }
  };

  return {
    name: 'ATIBON-NEXUS',
    version: '1.0-safe',
    authorize,
    registerTarget,
    analyze,
    healthCheck,
  };
}

export const atibonNexus = createAtibonNexusEngine();

export default atibonNexus;
