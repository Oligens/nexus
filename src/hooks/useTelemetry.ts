import { useCallback, useEffect, useState } from 'react';
import type { TelemetryEntry } from '../types/nexus';
import { telemetryTransport } from '../services/telemetryTransport';

export function useTelemetry() {
  const [entries, setEntries] = useState<TelemetryEntry[]>([]);
  const [transportState, setTransportState] = useState(telemetryTransport.getState());

  useEffect(() => {
    const unsubscribe = telemetryTransport.subscribe((entry) => setEntries((prev) => [...prev, entry].slice(-140)));
    return () => { unsubscribe(); };
  }, []);

  const connect = useCallback(() => telemetryTransport.connect(), []);
  const disconnect = useCallback(() => telemetryTransport.disconnect(), []);
  const clear = useCallback(() => setEntries([]), []);
  const addOperatorNote = useCallback((message: string) => {
    const value = message.trim();
    if (!value) return;
    const entry: TelemetryEntry = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), message: value, level: 'info', source: 'operator-note' };
    setEntries((prev) => [...prev, entry].slice(-140));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setTransportState(telemetryTransport.getState()), 250);
    return () => window.clearInterval(interval);
  }, []);

  return { entries, transportState, configured: telemetryTransport.configured, connect, disconnect, clear, addOperatorNote };
}
