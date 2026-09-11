import React, { useMemo, useState } from 'react';
import { Activity, Database, Lock, Radio, RefreshCw, ScanLine, Target, Wifi } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { useTargets } from '../hooks/useTargets';
import { useMetrics } from '../hooks/useMetrics';
import { evaluateAtibonTarget, createAtibonAuditEvent } from '../services/atibonGateway';
import { nexusApiRequest } from '../services/nexusApi';
import type { TargetStatus } from '../types/nexus';

type ActionName = 'probe' | 'isolate' | 'telemetry-sync';

const LiveTargetViewport: React.FC = () => {
  const { targets, selectedId, selected, register, select, updateStatus } = useTargets();
  const { metrics } = useMetrics();
  const [targetId, setTargetId] = useState('');
  const [targetName, setTargetName] = useState('');
  const [targetRegion, setTargetRegion] = useState('');
  const [targetEndpoint, setTargetEndpoint] = useState('');
  const [targetStatus, setTargetStatus] = useState<TargetStatus>('Standby');
  const [authorized, setAuthorized] = useState(false);
  const [actionState, setActionState] = useState('SYSTEM WAITING');

  const selectedLabel = useMemo(() => selected?.name ?? 'NONE', [selected]);

  const addTarget = (event: React.FormEvent) => {
    event.preventDefault();
    const id = targetId.trim();
    const name = targetName.trim();
    if (!id || !name) return;
    if (targetEndpoint.trim()) {
      const decision = evaluateAtibonTarget(targetEndpoint, authorized);
      if (!decision.allowed) { setActionState(`ATIBON BLOCKED :: ${decision.reason}`); return; }
    } else if (!authorized) {
      setActionState('ATIBON :: EXPLICIT AUTHORIZATION REQUIRED');
      return;
    }
    register({ id, name, region: targetRegion.trim() || 'UNSPECIFIED', status: targetStatus, endpoint: targetEndpoint.trim() || undefined });
    setTargetId(''); setTargetName(''); setTargetRegion(''); setTargetEndpoint(''); setTargetStatus('Standby');
    setActionState(`ATIBON REGISTERED :: ${name}`);
  };

  const executeAction = async (action: ActionName) => {
    if (!selected) { setActionState('SELECT OR REGISTER A TARGET'); return; }
    if (action === 'isolate') {
      updateStatus(selected.id, 'Standby');
      setActionState(`ATIBON ISOLATION STATE :: ${selected.name}`);
      return;
    }
    try {
      await nexusApiRequest(`/targets/${encodeURIComponent(selected.id)}/actions/${action}`, { method: 'POST', body: JSON.stringify(createAtibonAuditEvent(action, selected.id)) });
      setActionState(`${action.toUpperCase()} ACCEPTED :: ${selected.name}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'API indisponible';
      setActionState(`ACTION NOT SENT :: ${reason}`);
    }
  };

  const statusClass = (status: TargetStatus) => ({ Active: 'badge-active', Compromised: 'badge-dead', Standby: 'badge-idle' }[status]);
  const metric = (value: number | null, suffix = '') => value === null ? '—' : `${value}${suffix}`;

  return (
    <GlassPanel title="Live Target Viewport" icon="◈" className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="relative z-10 h-full min-h-0 grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] gap-3">
          <aside className="glass-panel-dark min-h-0 flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-[#D4AF37]/20 flex items-center justify-between"><div className="flex items-center gap-2 text-[10px] tracking-widest text-[#D4AF37]"><Target size={13} /> TARGETS</div><span className="text-[9px] text-gray-500">{targets.length} NODES</span></div>
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-2">
              {targets.length === 0 ? <div className="h-full min-h-32 flex flex-col items-center justify-center text-center px-4"><Target size={22} className="text-[#D4AF37]/50 mb-3" /><p className="text-[10px] uppercase tracking-widest text-gray-400">Aucune cible active</p><p className="text-[8px] text-gray-600 mt-2">Enregistrez une cible autorisée pour initialiser le viewport.</p></div> : targets.map((target) => <button key={target.id} onClick={() => select(target.id)} className={`w-full text-left rounded-lg border p-3 transition-all ${selectedId === target.id ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 bg-white/[0.02] hover:border-[#D4AF37]/50'}`}><div className="flex items-center justify-between gap-2"><span className="text-[11px] font-bold text-white truncate">{target.name}</span><span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${statusClass(target.status)}`}>{target.status}</span></div><div className="mt-2 text-[8px] text-gray-500 truncate">{target.id} · {target.region}</div></button>)}
            </div>
            <div className="border-t border-white/10 p-2 grid grid-cols-2 gap-2"><button onClick={() => executeAction('probe')} disabled={!selected} className="quick-mini"><ScanLine size={12} /> SCAN</button><button onClick={() => executeAction('telemetry-sync')} disabled={!selected} className="quick-mini"><RefreshCw size={12} /> SYNC</button></div>
          </aside>

          <div className="min-w-0 min-h-0 flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-3"><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full border border-[#D4AF37]" /><span className="text-[10px] font-bold tracking-widest text-[#D4AF37]">LIVE TARGET</span></div><div className="text-[9px] font-mono text-gray-500 truncate">TARGET: <span className="text-[#00F0FF]">{selectedLabel}</span></div></div>
            <div className="flex-1 min-h-0 glass-panel-dark relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-grid-fine opacity-60" />
              {selected ? <><div className="relative"><div className="absolute inset-[-55px] border border-[#00F0FF]/20 rounded-full" /><div className="absolute inset-[-35px] border border-[#D4AF37]/20 rounded-full" /><div className="relative w-52 h-52 flex items-center justify-center"><div className="absolute inset-0 border-2 border-[#00F0FF]/30 rounded-lg rotate-45" /><div className="absolute inset-3 border border-[#D4AF37]/25 rounded-lg rotate-45" /><div className="text-center z-10"><div className="text-4xl font-bold font-[Orbitron] text-white">{metric(metrics.uptime, '%')}</div><div className="text-[9px] uppercase tracking-[0.25em] text-gray-500 mt-2">SYSTEM INTEGRITY</div><div className="mt-3 text-[9px] text-[#D4AF37]">{actionState}</div></div></div></div><div className="absolute left-3 top-3 text-[8px] text-gray-600 font-mono">NODE_ID: {selected.id}<br />REGION: {selected.region}</div><div className="absolute right-3 top-3 flex items-center gap-1 text-[8px] text-gray-500"><Wifi size={11} /> {selected.endpoint ? 'ENDPOINT REGISTERED' : 'WAITING FOR LINK'}</div><div className="absolute left-3 bottom-3 right-3 grid grid-cols-2 sm:grid-cols-4 gap-2"><MetricBox label="LATENCY" value={metric(metrics.latency, 'ms')} /><MetricBox label="PACKET LOSS" value={metric(metrics.packetLoss, '%')} /><MetricBox label="CONNECTIONS" value={metric(metrics.connections)} /><MetricBox label="SHIELD" value={metric(metrics.shieldIntegrity, '%')} /></div></> : <div className="text-center px-6"><Target size={28} className="mx-auto text-[#D4AF37]/50 mb-4" /><p className="text-[11px] uppercase tracking-widest text-gray-300">Système en attente de connexion...</p><p className="text-[8px] text-gray-600 mt-2">Aucune télémétrie n'est disponible tant qu'une cible réelle n'est pas sélectionnée et connectée.</p></div>}
            </div>

            <form onSubmit={addTarget} className="mt-3 glass-panel-gold p-3">
              <div className="flex items-center gap-2 mb-2 text-[9px] tracking-widest text-[#D4AF37]"><Activity size={13} /> REGISTER TARGET <span className="ml-auto text-[8px] text-gray-500">ATIBON GATE</span></div>
              <div className="grid grid-cols-2 xl:grid-cols-5 gap-2"><input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="Target ID" className="nexus-input" /><input value={targetName} onChange={(e) => setTargetName(e.target.value)} placeholder="Target name" className="nexus-input" /><input value={targetRegion} onChange={(e) => setTargetRegion(e.target.value)} placeholder="Region / channel" className="nexus-input" /><input value={targetEndpoint} onChange={(e) => setTargetEndpoint(e.target.value)} placeholder="Endpoint (local/private)" className="nexus-input" /><select value={targetStatus} onChange={(e) => setTargetStatus(e.target.value as TargetStatus)} className="nexus-input"><option value="Standby">Standby</option><option value="Active">Active</option><option value="Compromised">Compromised</option></select></div>
              <label className="mt-2 flex items-center gap-2 text-[8px] uppercase tracking-wider text-gray-500"><input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} /> Je confirme être autorisé à administrer cette cible.</label>
              <button type="submit" className="quick-action mt-2 w-full" disabled={!targetId.trim() || !targetName.trim()}><Target size={15} /> Enregistrer la cible</button>
            </form>

            <div className="mt-3 glass-panel-gold p-3"><div className="flex items-center gap-2 mb-2 text-[9px] tracking-widest text-[#D4AF37]"><Activity size={13} /> QUICK ACTIONS <span className="ml-auto text-[8px] text-gray-500">ATIBON PROTECTED</span></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-2"><button onClick={() => executeAction('probe')} disabled={!selected} className="quick-action"><Radio size={15} /> Lancer Sonde</button><button onClick={() => executeAction('isolate')} disabled={!selected} className="quick-action"><Lock size={15} /> Isoler Cible</button><button onClick={() => executeAction('telemetry-sync')} disabled={!selected} className="quick-action"><Database size={15} /> Sync Télémétrie</button></div></div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};

const MetricBox: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="glass-panel-gold p-2 text-center rounded-md"><div className="text-[8px] uppercase tracking-wider text-gray-500">{label}</div><div className="text-xs font-bold font-mono mt-0.5 text-[#D4AF37]">{value}</div></div>;
export default LiveTargetViewport;
