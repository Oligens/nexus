/**
 * ATIBON Control Hub — service de lancement de sonde.
 *
 * Deux modes :
 *  - SIMULATION : exécution d'une routine locale, clairement identifiée comme fictive.
 *  - LIVE       : appel HTTP réel vers le backend Python `atibon.py` (API locale),
 *                 avec transmission des paramètres complets (cible, port, modules,
 *                 autorisation légale `--i-have-authorization`).
 *
 * En mode LIVE, l'exécution est BLOQUÉE si la case d'autorisation n'est pas cochée.
 */

import { nexusApiRequest } from './nexusApi';
import { telemetryTransport } from './telemetryTransport';

export const PROBE_MODULES = [
  'fingerprint',
  'protocol-cover',
  'auth-bypass',
  'ad-test',
] as const;

export type ProbeModule = (typeof PROBE_MODULES)[number];

export interface ProbeRequestPayload {
  targetHost: string;
  targetPort: number;
  modules: ProbeModule[];
  /** Correspond à l'argument obligatoire `--i-have-authorization` de atibon.py */
  iHaveAuthorization: boolean;
  mode: 'live';
}

export interface ProbeRunResult {
  accepted: boolean;
  runId?: string;
  message: string;
  transport: 'http' | 'websocket';
  /** Chemin SSE fourni par l'API Bridge (ex: /api/probe/LIVE-XXXX/stream) */
  streamPath?: string;
}

const DEFAULT_LIVE_PATH = '/api/probe/run';

/** URL de base de l'API Bridge ATIBON (défaut : serveur pont local sur le port 3001). */
function bridgeBase(): string {
  const configured = (import.meta.env.VITE_NEXUS_API_URL as string | undefined)?.replace(/\/$/, '');
  return configured ?? 'http://127.0.0.1:3001';
}

/**
 * Ouvre un flux Server-Sent Events vers l'API Bridge pour alimenter le
 * « NEURAL TELEMETRY STREAM » en temps réel (stdout/stderr d'atibon.py).
 * Retourne une fonction de fermeture.
 */
export function openProbeTelemetryStream(
  streamPath: string,
  onEvent: (event: { ts?: string; type?: string; level?: string; message?: string }) => void,
  onClose?: () => void,
): () => void {
  const source = new EventSource(`${bridgeBase()}${streamPath}`);
  source.onmessage = (event: MessageEvent<string>) => {
    try {
      onEvent(JSON.parse(event.data) as { ts?: string; type?: string; level?: string; message?: string });
    } catch {
      /* trame non JSON (: ping, etc.) — ignorée */
    }
  };
  source.onerror = () => {
    source.close();
    onClose?.();
  };
  return () => source.close();
}

function wsUrlFor(path: string): string | null {
  const configured = import.meta.env.VITE_NEXUS_TELEMETRY_WS_URL as string | undefined;
  if (!configured) return null;
  try {
    const url = new URL(configured);
    url.pathname = path;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Émet une requête HTTP/WebSocket vers le backend Python (`atibon.py`) via l'API locale.
 * WebSocket en priorité si un endpoint est configuré, sinon HTTP POST classique.
 */
async function submitLiveProbeHttp(payload: ProbeRequestPayload): Promise<ProbeRunResult> {
  const response = await nexusApiRequest<{
    accepted?: boolean;
    run_id?: string;
    message?: string;
    stream?: string;
  }>(DEFAULT_LIVE_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
    timeoutMs: 15000,
  });
  return {
    accepted: response.accepted !== false,
    runId: response.run_id,
    message: response.message ?? 'Sonde LIVE acceptée par le backend ATIBON.',
    transport: 'http',
    streamPath: typeof response.stream === 'string' ? response.stream : undefined,
  };
}

function submitLiveProbeWebSocket(payload: ProbeRequestPayload): Promise<ProbeRunResult> {
  return new Promise((resolve, reject) => {
    const url = wsUrlFor(DEFAULT_LIVE_PATH);
    if (!url || !telemetryTransport.configured) {
      reject(new Error('Aucun endpoint API/WS configuré pour le mode LIVE (VITE_NEXUS_API_URL).'));
      return;
    }
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch {
      reject(new Error('Connexion WebSocket au backend ATIBON impossible.'));
      return;
    }
    const timer = window.setTimeout(() => {
      socket.close();
      reject(new Error('Délai dépassé : le backend ATIBON n\'a pas répondu.'));
    }, 15000);
    socket.onopen = () => socket.send(JSON.stringify({ action: 'probe-run', ...payload }));
    socket.onmessage = (event: MessageEvent<string>) => {
      window.clearTimeout(timer);
      let accepted = true;
      let message = 'Sonde LIVE transmise au backend ATIBON via WebSocket.';
      let runId: string | undefined;
      try {
        const parsed: unknown = JSON.parse(event.data);
        if (parsed && typeof parsed === 'object') {
          const value = parsed as { accepted?: unknown; run_id?: unknown; message?: unknown };
          if (value.accepted === false) accepted = false;
          if (typeof value.message === 'string') message = value.message;
          if (typeof value.run_id === 'string') runId = value.run_id;
        }
      } catch {
        /* trame texte simple : conservée comme message */
        if (typeof event.data === 'string' && event.data.trim()) message = event.data.trim();
      }
      socket.close();
      resolve({ accepted, runId, message, transport: 'websocket' });
    };
    socket.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('Erreur WebSocket : le backend ATIBON est injoignable.'));
    };
  });
}

/**
 * Lance la sonde.
 *  - Mode LIVE sans autorisation légale : lance une Error (alerte visuelle à afficher).
 *  - Mode LIVE autorisé : émet la requête HTTP/WebSocket vers `atibon.py`.
 *  - Mode SIMULATION : routine locale explicitement marquée « SIMULATION ».
 */
export async function launchProbe(
  params: {
    targetHost: string;
    targetPort: number;
    modules: ProbeModule[];
    authorized: boolean;
  },
  isSimulation: boolean,
): Promise<ProbeRunResult> {
  if (!isSimulation) {
    if (!params.authorized) {
      throw new Error(
        'EXÉCUTION BLOQUÉE : en mode LIVE, la case « --i-have-authorization » doit être cochée ' +
          'avant toute sonde réelle (autorisation écrite exigée).',
      );
    }
    const payload: ProbeRequestPayload = {
      targetHost: params.targetHost,
      targetPort: params.targetPort,
      modules: [...params.modules],
      iHaveAuthorization: true,
      mode: 'live',
    };
    try {
      return await submitLiveProbeHttp(payload);
    } catch (httpError) {
      try {
        return await submitLiveProbeWebSocket(payload);
      } catch (wsError) {
        const reason = httpError instanceof Error ? httpError.message : String(httpError);
        const wsReason = wsError instanceof Error ? wsError.message : String(wsError);
        throw new Error(`Backend ATIBON injoignable :: ${reason} / ${wsReason}`);
      }
    }
  }

  // ── Mode SIMULATION : aucune requête réseau, sortie explicitement fictive ──
  await new Promise((resolve) => window.setTimeout(resolve, 400));
  return {
    accepted: true,
    runId: `SIM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    message:
      `SIMULATION :: sonde fictive sur ${params.targetHost}:${params.targetPort} ` +
      `[${params.modules.join(', ') || 'aucun module'}] — aucune requête réseau émise.`,
    transport: 'http',
  };
}
