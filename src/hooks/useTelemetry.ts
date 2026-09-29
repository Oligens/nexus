import { useCallback, useEffect, useState } from 'react';
import type { TelemetryEntry } from '../types/nexus';
import { nexusEventBus } from '../services/nexusEventBus';
import { telemetryTransport } from '../services/telemetryTransport';

export function useTelemetry() {
  const [entries, setEntries] = useState<TelemetryEntry[]>([]);
  const [transportState, setTransportState] = useState(telemetryTransport.getState());

  useEffect(() => {
    const unsubscribe = nexusEventBus.on('telemetry_received', (event) => {
      const entry: TelemetryEntry = {
        id: event.id ?? crypto.randomUUID(),
        timestamp: event.timestamp ?? new Date().toISOString(),
        message: event.message,
        level: event.level ?? 'info',
        source: event.source,
      };
      setEntries((previous) => [...previous, entry].slice(-140));
    });
    return () => { unsubscribe(); };
  }, []);

  const connect = useCallback(() => telemetryTransport.connect(), []);
  const disconnect = useCallback(() => telemetryTransport.disconnect(), []);
  const clear = useCallback(() => setEntries([]), []);
  const addOperatorNote = useCallback((message: string) => {
    const value = message.trim();
    if (!value) return;
    nexusEventBus.emit('telemetry_received', { message: value, level: 'info', source: 'operator-note' });
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setTransportState(telemetryTransport.getState()), 250);
    return () => window.clearInterval(interval);
  }, []);

  return { entries, transportState, configured: telemetryTransport.configured, connect, disconnect, clear, addOperatorNote };
}
