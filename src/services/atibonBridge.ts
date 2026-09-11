/**
 * ATIBON -> NEXUS defensive bridge.
 *
 * This adapter deliberately exposes only safe, defensive data contracts:
 * target registration, health/status normalization and telemetry ingestion.
 * It does not execute exploits, persistence, C2, evasion or anti-forensics.
 */

export type AtibonTargetStatus = 'online' | 'offline' | 'degraded' | 'unknown';

export interface AtibonTarget {
  id: string;
  name: string;
  host: string;
  port?: number;
  protocol?: 'http' | 'https' | 'tcp' | 'tls';
  status: AtibonTargetStatus;
  lastSeenAt?: string | null;
  metadata?: Record<string, string>;
}

export interface AtibonTelemetryEvent {
  id: string;
  targetId: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  source?: string;
  metrics?: Record<string, number | null>;
}

export interface AtibonSnapshot {
  targets: AtibonTarget[];
  telemetry: AtibonTelemetryEvent[];
}

export function createEmptyAtibonSnapshot(): AtibonSnapshot {
  return { targets: [], telemetry: [] };
}

export function normalizeAtibonTarget(input: AtibonTarget): AtibonTarget {
  return {
    ...input,
    id: input.id.trim(),
    name: input.name.trim(),
    host: input.host.trim(),
    lastSeenAt: input.lastSeenAt ?? null,
  };
}

export function normalizeTelemetryEvent(input: AtibonTelemetryEvent): AtibonTelemetryEvent {
  return {
    ...input,
    id: input.id.trim(),
    targetId: input.targetId.trim(),
    message: input.message.trim(),
    timestamp: input.timestamp || new Date().toISOString(),
  };
}

/**
 * Adds an event to a bounded local buffer without fabricating telemetry.
 * The event must originate from a real ATIBON/transport source.
 */
export function appendTelemetry(
  current: AtibonTelemetryEvent[],
  event: AtibonTelemetryEvent,
  maxEntries = 500,
): AtibonTelemetryEvent[] {
  const next = [...current, normalizeTelemetryEvent(event)];
  return next.slice(Math.max(0, next.length - maxEntries));
}
