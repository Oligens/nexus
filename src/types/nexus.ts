export type TargetStatus = 'Active' | 'Compromised' | 'Standby';

export interface TargetNode {
  id: string;
  name: string;
  region: string;
  status: TargetStatus;
  endpoint?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TelemetryEntry {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  source?: string;
}

export interface NexusMetrics {
  latency: number | null;
  packetLoss: number | null;
  uptime: number | null;
  connections: number | null;
  shieldIntegrity: number | null;
  cpu: number | null;
  mem: number | null;
  io: number | null;
  net: number | null;
}

export const EMPTY_METRICS: NexusMetrics = {
  latency: null,
  packetLoss: null,
  uptime: null,
  connections: null,
  shieldIntegrity: null,
  cpu: null,
  mem: null,
  io: null,
  net: null,
};
