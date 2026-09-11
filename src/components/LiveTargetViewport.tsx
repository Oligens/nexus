import React, { useEffect, useState } from 'react';
import { Activity, Database, Lock, Radio, RefreshCw, ScanLine, Target, Wifi } from 'lucide-react';
import GlassPanel from './GlassPanel';

type TargetStatus = 'Active' | 'Compromised' | 'Standby';
interface TargetNode { id: string; name: string; region: string; status: TargetStatus; score: number; }

const initialTargets: TargetNode[] = [
  { id: 'sys-core-07', name: 'SYS-CORE-07', region: 'CORE / PRIMARY', status: 'Active', score: 98 },
  { id: 'edge-node-12', name: 'EDGE-NODE-12', region: 'EDGE / EAST', status: 'Compromised', score: 61 },
  { id: 'relay-03', name: 'RELAY-03', region: 'RELAY / SOUTH', status: 'Standby', score: 84 },
  { id: 'vault-21', name: 'VAULT-21', region: 'SECURE / ARCHIVE', status: 'Active', score: 93 },
];

const LiveTargetViewport: React.FC = () => {
  const [selectedId, setSelectedId] = useState(initialTargets[0].id);
  const [targets, setTargets] = useState(initialTargets);
  const [latency, setLatency] = useState(23);
  const [packetLoss, setPacketLoss] = useState(0.02);
  const [uptime, setUptime] = useState(99.97);
  const [connections, setConnections] = useState(1247);
  const [shieldIntegrity, setShieldIntegrity] = useState(94);
  const [actionState, setActionState] = useState('SYSTEM READY');
  const selected = targets.find((target) => target.id === selectedId) ?? targets[0];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setLatency((prev) => Math.max(8, Math.min(180, prev + (Math.random() - 0.5) * 20)));
      setPacketLoss((prev) => Math.max(0, Math.min(5, prev + (Math.random() - 0.5) * 0.5)));
      setConnections((prev) => Math.max(800, Math.min(2000, prev + Math.floor((Math.random() - 0.5) * 100))));
      setShieldIntegrity((prev) => Math.max(70, Math.min(100, prev + (Math.random() - 0.5) * 3)));
      setUptime((prev) => Math.max(97, Math.min(100, prev + (Math.random() - 0.01) * 0.02)));
    }, 1500);
    return () => window.clearInterval(interval);
  }, []);

  const runAction = (label: string) => {
    setActionState(`${label.toUpperCase()} :: ${selected.name}`);
    window.setTimeout(() => setActionState('SYSTEM READY'), 1800);
  };

  const isolateTarget = () => {
    setTargets((prev) => prev.map((target) => target.id === selectedId ? { ...target, status: 'Standby' } : target));
    runAction('TARGET ISOLATED');
  };

  const statusClass = (status: TargetStatus) => ({ Active: 'badge-active', Compromised: 'badge-dead', Standby: 'badge-idle' }[status]);

  return (
    <GlassPanel title="Live Target Viewport" icon="◈" className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none"><div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent opacity-25 animate-scan-line" /></div>

        <div className="relative z-10 h-full min-h-0 grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] gap-3">
          <aside className="glass-panel-dark min-h-0 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-[#D4AF37]/20 flex items-center justify-between"><div className="flex items-center gap-2 text-[10px] tracking-widest text-[#D4AF37]"><Target size={13} /> TARGETS</div><span className="text-[9px] text-gray-500">{targets.length} NODES</span></div>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-2">
              {targets.map((target) => (
                <button key={target.id} onClick={() => setSelectedId(target.id)} className={`w-full text-left rounded-lg border p-3 transition-all ${selectedId === target.id ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_18px_rgba(212,175,55,0.12)]' : 'border-white/10 bg-white/[0.02] hover:border-[#D4AF37]/50'}`}>
                  <div className="flex items-center justify-between gap-2"><span className="text-[11px] font-bold text-white truncate">{target.name}</span><span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${statusClass(target.status)}`}>{target.status}</span></div>
                  <div className="mt-2 flex items-center justify-between text-[8px] text-gray-500"><span>{target.region}</span><span>{target.score}%</span></div>
                  <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${target.score}%` }} /></div>
                </button>
              ))}
            </div>
            <div className="border-t border-white/10 p-2 grid grid-cols-2 gap-2"><button onClick={() => runAction('SCAN ALL')} className="quick-mini"><ScanLine size={12} /> SCAN</button><button onClick={() => runAction('SYNC')} className="quick-mini"><RefreshCw size={12} /> SYNC</button></div>
          </aside>

          <div className="min-w-0 min-h-0 flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-3"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-pulse-shield" /><span className="text-[10px] font-bold tracking-widest text-[#00F0FF]">● LIVE TARGET</span></div><div className="text-[9px] font-mono text-gray-500 truncate">TARGET: <span className="text-[#00F0FF]">{selected.name}.nexus</span></div></div>

            <div className="flex-1 min-h-0 glass-panel-dark relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-grid-fine opacity-60" />
              <div className="relative scale-[0.72] sm:scale-90 lg:scale-100">
                <div className="absolute inset-[-55px] border border-[#00F0FF]/20 rounded-full animate-rotate-slow" /><div className="absolute inset-[-35px] border border-[#D4AF37]/20 rounded-full animate-rotate-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }} />
                <div className="relative w-52 h-52 flex items-center justify-center"><div className="absolute inset-0 border-2 border-[#00F0FF]/30 rounded-lg rotate-45 animate-pulse-shield" /><div className="absolute inset-3 border border-[#D4AF37]/25 rounded-lg rotate-45" /><div className="text-center z-10"><div className="text-4xl font-bold font-[Orbitron] text-white neon-cyan">{uptime.toFixed(2)}%</div><div className="text-[9px] uppercase tracking-[0.25em] text-gray-500 mt-2">SYSTEM INTEGRITY</div><div className="mt-3 text-[9px] text-[#D4AF37]">{actionState}</div></div></div>
              </div>
              <div className="absolute left-3 top-3 text-[8px] text-gray-600 font-mono">NODE_ID: {selected.id}<br />CHANNEL: SECURE-LIVE</div><div className="absolute right-3 top-3 flex items-center gap-1 text-[8px] text-[#00F0FF]"><Wifi size={11} /> LINKED</div>
              <div className="absolute left-3 bottom-3 right-3 grid grid-cols-2 sm:grid-cols-4 gap-2"><MetricBox label="LATENCY" value={`${latency.toFixed(0)}ms`} color="#00F0FF" /><MetricBox label="PACKET LOSS" value={`${packetLoss.toFixed(2)}%`} color={packetLoss > 2 ? '#ff4444' : '#D4AF37'} /><MetricBox label="CONNECTIONS" value={connections.toString()} color="#00F0FF" /><MetricBox label="SHIELD" value={`${shieldIntegrity.toFixed(0)}%`} color="#D4AF37" /></div>
            </div>

            <div className="mt-3 glass-panel-gold p-3"><div className="flex items-center gap-2 mb-2 text-[9px] tracking-widest text-[#D4AF37]"><Activity size={13} /> QUICK ACTIONS <span className="ml-auto text-[8px] text-gray-500">TOUCH CONTROL</span></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-2"><button onClick={() => runAction('PROBE LAUNCHED')} className="quick-action"><Radio size={15} /> Lancer Sonde</button><button onClick={isolateTarget} className="quick-action"><Lock size={15} /> Isoler Cible</button><button onClick={() => runAction('TELEMETRY SYNC')} className="quick-action"><Database size={15} /> Sync Télémétrie</button></div></div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};

const MetricBox: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => <div className="glass-panel-gold p-2 text-center rounded-md"><div className="text-[8px] uppercase tracking-wider text-gray-500">{label}</div><div className="text-xs font-bold font-mono mt-0.5" style={{ color }}>{value}</div></div>;
export default LiveTargetViewport;
