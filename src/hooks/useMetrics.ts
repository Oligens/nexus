import { useEffect, useState } from 'react';
import { nexusEventBus } from '../services/nexusEventBus';
import { EMPTY_METRICS, type NexusMetrics } from '../types/nexus';

export function useMetrics() {
  const [metrics, setMetrics] = useState<NexusMetrics>(EMPTY_METRICS);

  useEffect(() => {
    const stopTelemetry = nexusEventBus.on('telemetry_received', ({ message }) => {
      // Metrics are intentionally not inferred from arbitrary text. A real backend
      // can emit structured metric events and update this hook without mocks.
      if (!message.trim()) return;
    });
    return () => stopTelemetry();
  }, []);

  return { metrics, setMetrics };
}
