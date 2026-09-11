/**
 * ATIBON NEXUS — Defensive integration module
 *
 * Single-file ATIBON adapter kept intentionally self-contained.
 * It does NOT connect to ATIBON, execute remote commands, scan third-party
 * systems, evade controls, persist secretly, collect credentials, or perform
 * destructive actions. It exposes a small defensive API that NEXUS can call
 * when a trusted local/authorized data source is available.
 */

export type AtibonSeverity = 'info' | 'warning' | 'critical';
export type AtibonTargetStatus = 'active' | 'standby' | 'compromised';

export interface AtibonTarget {
  id: string;
  name: string;
  region?: string;
  status: AtibonTargetStatus;
  authorized: boolean;
  metadata?: Record<string, string>;
}

export interface AtibonTelemetry {
  timestamp: number;
  source: string;
  message: string;
  severity: AtibonSeverity;
  metrics?: Record<string, number | string | null>;
}

export interface AtibonActionResult {
  ok: boolean;
  action: 'probe' | 'isolate' | 'sync';
  targetId?: string;
  message: string;
  timestamp: number;
}

export interface AtibonNexusState {
  targets: AtibonTarget[];
  telemetry: AtibonTelemetry[];
  lastAction: AtibonActionResult | null;
}

/**
 * Creates an empty defensive state. No mock targets or telemetry are inserted.
 */
export function createAtibonNexusState(): AtibonNexusState {
  return { targets: [], telemetry: [], lastAction: null };
}

/**
 * Adds an explicitly authorized target to the local registry.
 * This module never discovers targets automatically.
 */
export function registerAuthorizedTarget(
  state: AtibonNexusState,
  target: AtibonTarget,
): AtibonNexusState {
  if (!target.id.trim() || !target.name.trim() || !target.authorized) return state;

  const exists = state.targets.some((item) => item.id === target.id);
  if (exists) {
    return {
      ...state,
      targets: state.targets.map((item) => (item.id === target.id ? { ...item, ...target } : item)),
    };
  }

  return { ...state, targets: [...state.targets, target] };
}

/**
 * Defensive probe: records an intent only. It never performs network scanning
 * or sends packets. A real transport must be supplied by the host application.
 */
export function requestProbe(state: AtibonNexusState, targetId: string): AtibonNexusState {
  const target = state.targets.find((item) => item.id === targetId);
  const timestamp = Date.now();

  const result: AtibonActionResult = target
    ? {
        ok: target.authorized,
        action: 'probe',
        targetId,
        message: target.authorized
          ? 'Sonde défensive demandée : aucune opération réseau exécutée par ATIBON NEXUS.'
          : 'Action refusée : cible non autorisée.',
        timestamp,
      }
    : { ok: false, action: 'probe', targetId, message: 'Cible inconnue.', timestamp };

  return { ...state, lastAction: result };
}

/**
 * Defensive isolation state transition. It only changes the local registry;
 * it does not disable, attack, disconnect, or alter a remote machine.
 */
export function requestIsolation(state: AtibonNexusState, targetId: string): AtibonNexusState {
  const target = state.targets.find((item) => item.id === targetId);
  const timestamp = Date.now();

  if (!target) {
    return {
      ...state,
      lastAction: { ok: false, action: 'isolate', targetId, message: 'Cible inconnue.', timestamp },
    };
  }

  if (!target.authorized) {
    return {
      ...state,
      lastAction: {
        ok: false,
        action: 'isolate',
        targetId,
        message: 'Isolation refusée : cible non autorisée.',
        timestamp,
      },
    };
  }

  return {
    ...state,
    targets: state.targets.map((item) =>
      item.id === targetId ? { ...item, status: 'standby' } : item,
    ),
    lastAction: {
      ok: true,
      action: 'isolate',
      targetId,
      message: 'État local passé en veille défensive. Aucune action distante exécutée.',
      timestamp,
    },
  };
}

/**
 * Accepts telemetry explicitly supplied by the host. No synthetic events are
 * generated here. Invalid/empty messages are ignored.
 */
export function ingestTelemetry(
  state: AtibonNexusState,
  entry: AtibonTelemetry,
): AtibonNexusState {
  if (!entry.source.trim() || !entry.message.trim()) return state;
  return { ...state, telemetry: [...state.telemetry, entry].slice(-500) };
}

/**
 * Synchronization is intentionally limited to local state bookkeeping. A
 * network/WebSocket transport can be added by the authorized host without
 * changing this file or granting ATIBON autonomous access.
 */
export function requestTelemetrySync(state: AtibonNexusState): AtibonNexusState {
  return {
    ...state,
    lastAction: {
      ok: true,
      action: 'sync',
      message: 'Synchronisation demandée. En attente d’une source de télémétrie autorisée.',
      timestamp: Date.now(),
    },
  };
}

export const ATIBON_NEXUS = {
  version: 'defensive-1.0',
  createAtibonNexusState,
  registerAuthorizedTarget,
  requestProbe,
  requestIsolation,
  ingestTelemetry,
  requestTelemetrySync,
} as const;

export default ATIBON_NEXUS;
