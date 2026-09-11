import { nexusEventBus } from './nexusEventBus';

export interface AtibonDecision {
  allowed: boolean;
  reason: string;
  normalizedHost: string;
}

/**
 * ATIBON is the defensive security boundary for NEXUS.
 * It validates operator intent and rejects obvious public targets in the UI.
 * It does not execute exploits, persistence, credential bypass, C2, evasion,
 * phishing, destructive actions, or log/timestamp manipulation.
 */
export function evaluateAtibonTarget(endpoint: string, explicitAuthorization: boolean): AtibonDecision {
  const value = endpoint.trim();
  if (!value) return { allowed: false, reason: 'Endpoint absent.', normalizedHost: '' };
  if (!explicitAuthorization) return { allowed: false, reason: 'Autorisation explicite requise par ATIBON.', normalizedHost: '' };

  let url: URL;
  try {
    url = new URL(value.includes('://') ? value : `http://${value}`);
  } catch {
    return { allowed: false, reason: 'Endpoint invalide.', normalizedHost: '' };
  }

  const host = url.hostname.toLowerCase();
  const isLocalName = ['localhost', '::1'].includes(host) || host.endsWith('.local') || host.endsWith('.test') || host.endsWith('.internal') || host.endsWith('.lan') || host.endsWith('.home');
  const octets = host.split('.').map(Number);
  const isIpv4 = octets.length === 4 && octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255);
  const isPrivateIpv4 = isIpv4 && (
    octets[0] === 10 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127)
  );

  const allowed = isLocalName || isPrivateIpv4;
  const reason = allowed ? 'Cible locale/privée autorisée pour le mode défensif.' : 'ATIBON refuse les endpoints publics par défaut.';
  const decision = { allowed, reason, normalizedHost: host };
  nexusEventBus.emit('security_decision', { allowed, reason });
  return decision;
}

export function createAtibonAuditEvent(action: string, targetId?: string) {
  return {
    action,
    targetId: targetId ?? null,
    timestamp: new Date().toISOString(),
    module: 'ATIBON',
    mode: 'defensive',
  } as const;
}
