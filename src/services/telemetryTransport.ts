import type { TelemetryEntry, NexusMetrics } from '../types/nexus';
import { nexusEventBus } from './nexusEventBus';

export type TelemetryTransportState = 'disconnected' | 'connecting' | 'connected' | 'error';
type TelemetryListener = (entry: TelemetryEntry) => void;
const WS_URL = (import.meta.env.VITE_NEXUS_TELEMETRY_WS_URL as string | undefined)?.trim();

class TelemetryTransport {
  private socket: WebSocket | null = null;
  private listeners = new Set<TelemetryListener>();
  private state: TelemetryTransportState = 'disconnected';

  get configured() { return Boolean(WS_URL); }
  getState() { return this.state; }
  private setState(state: TelemetryTransportState) { this.state = state; nexusEventBus.emit('transport_state', { state }); }
  subscribe(listener: TelemetryListener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }

  connect() {
    if (!WS_URL || this.socket) return;
    this.setState('connecting');
    try {
      this.socket = new WebSocket(WS_URL);
      this.socket.onopen = () => this.setState('connected');
      this.socket.onclose = () => { this.socket = null; this.setState('disconnected'); };
      this.socket.onerror = () => this.setState('error');
      this.socket.onmessage = (event) => {
        const entry = this.parseMessage(event.data);
        if (!entry) return;
        this.listeners.forEach((listener) => listener(entry));
        nexusEventBus.emit('telemetry_received', { message: entry.message, source: entry.source });
        const metrics = this.extractMetrics(event.data);
        if (metrics) nexusEventBus.emit('metrics_received', metrics);
      };
    } catch { this.socket = null; this.setState('error'); }
  }

  disconnect() { this.socket?.close(); this.socket = null; this.setState('disconnected'); }

  private parseMessage(raw: unknown): TelemetryEntry | null {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    if (typeof raw !== 'string') return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null && 'message' in parsed) {
        const value = parsed as { message?: unknown; level?: unknown; source?: unknown; timestamp?: unknown };
        if (typeof value.message !== 'string' || !value.message.trim()) return null;
        const level = value.level === 'warning' || value.level === 'error' ? value.level : 'info';
        return { id, timestamp: typeof value.timestamp === 'string' ? value.timestamp : timestamp, message: value.message, level, source: typeof value.source === 'string' ? value.source : undefined };
      }
    } catch { /* raw text frame */ }
    return raw.trim() ? { id, timestamp, message: raw.trim(), level: 'info' } : null;
  }

  private extractMetrics(raw: unknown): Partial<NexusMetrics> | null {
    if (typeof raw !== 'string') return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null || !('metrics' in parsed)) return null;
      const candidate = (parsed as { metrics?: unknown }).metrics;
      if (typeof candidate !== 'object' || candidate === null) return null;
      const source = candidate as Record<string, unknown>;
      const keys: (keyof NexusMetrics)[] = ['latency', 'packetLoss', 'uptime', 'connections', 'shieldIntegrity', 'cpu', 'mem', 'io', 'net'];
      return Object.fromEntries(keys.filter((key) => typeof source[key] === 'number').map((key) => [key, source[key]]));
    } catch { return null; }
  }
}

export const telemetryTransport = new TelemetryTransport();
