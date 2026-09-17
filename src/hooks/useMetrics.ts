import { useEffect, useState } from 'react';
import { nexusEventBus } from '../services/nexusEventBus';
import { EMPTY_METRICS, type NexusMetrics } from '../types/nexus';

export function useMetrics() {
  const [metrics, setMetrics] = useState<NexusMetrics>(EMPTY_METRICS);

  useEffect(() => {
    const unsubscribe = nexusEventBus.on('metrics_received', (incoming) => {
      setMetrics((current) => ({ ...current, ...incoming }));
    });
    return () => { unsubscribe(); };
  }, []);

  return { metrics, setMetrics };
}
