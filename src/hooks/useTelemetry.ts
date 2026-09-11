import { useCallback, useEffect, useState } from 'react';
import type { TelemetryEntry } from '../types/nexus';
import { telemetryTransport } from '../services/telemetryTransport';

export function useTelemetry() {
  const [entries, setEntries] = useState<TelemetryEntry[]>([]);
  const [transportState, setTransportState] = useState(telemetryTransport.getState());

  useEffect(() => {
    const unsubscribe = telemetryTransport.subscribe((entry) => {
      setEntries((prev) => [...prev, entry].slice(-140));
    });
    return () => unsubscribe();
  }, []);

  const connect = useCallback(() => telemetryTransport.connect(), []);
  const disconnect = useCallback(() => telemetryTransport.disconnect(), []);
  const clear = useCallback(() => setEntries([]), []);

  useEffect(() => {
    const interval = window.setInterval(() => setTransportState(telemetryTransport.getState()), 250);
    return () => window.clearInterval(interval);
  }, []);

  return { entries, transportState, configured: telemetryTransport.configured, connect, disconnect, clear };
}
