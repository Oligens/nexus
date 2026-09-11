import type { NexusMetrics } from '../types/nexus';

export type NexusEventMap = {
  target_registered: { targetId: string };
  target_selected: { targetId: string | null };
  target_isolated: { targetId: string };
  telemetry_received: { message: string; source?: string };
  metrics_received: Partial<NexusMetrics>;
  transport_state: { state: 'connecting' | 'connected' | 'disconnected' | 'error' };
  security_decision: { allowed: boolean; reason: string };
};

type Listener<T> = (payload: T) => void;

class NexusEventBus {
  private listeners = new Map<keyof NexusEventMap, Set<Listener<never>>>();

  on<K extends keyof NexusEventMap>(event: K, listener: Listener<NexusEventMap[K]>) {
    const set = this.listeners.get(event) ?? new Set<Listener<never>>();
    set.add(listener as Listener<never>);
    this.listeners.set(event, set);
    return () => set.delete(listener as Listener<never>);
  }

  emit<K extends keyof NexusEventMap>(event: K, payload: NexusEventMap[K]) {
    this.listeners.get(event)?.forEach((listener) => listener(payload as never));
  }
}

export const nexusEventBus = new NexusEventBus();
