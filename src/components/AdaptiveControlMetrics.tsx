import React, { useState } from 'react';
import GlassPanel from './GlassPanel';
import { useMetrics } from '../hooks/useMetrics';
import { nexusApiRequest } from '../services/nexusApi';

const AdaptiveControlMetrics: React.FC = () => {
  const { metrics } = useMetrics();
  const [velocity, setVelocity] = useState<number | null>(null);
  const [intensity, setIntensity] = useState<number | null>(null);
  const [threads, setThreads] = useState<number | null>(null);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [scenarioState, setScenarioState] = useState('IDLE');

  const scenarios = [
    { id: 'recon', label: 'RECON', icon: '◉', desc: 'Authorized reconnaissance workflow' },
    { id: 'robustness', label: 'ROBUST', icon: '◆', desc: 'Route robustness analysis' },
    { id: 'load', label: 'LOAD', icon: '⬡', desc: 'Controlled load analysis' },
    { id: 'flood', label: 'FLOOD', icon: '◈', desc: 'Reserved for an explicitly configured defensive test backend' },
  ];

  const selectScenario = async (id: string) => {
    if (activeScenario === id) { setActiveScenario(null); setScenarioState('IDLE'); return; }
    setActiveScenario(id);
    try {
      await nexusApiRequest(`/scenarios/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify({ velocity, intensity, threads }) });
      setScenarioState(`READY: ${id.toUpperCase()}`);
    } catch (error) {
      setScenarioState(error instanceof Error ? `NOT CONNECTED: ${error.message}` : 'NOT CONNECTED');
    }
  };

  return (
    <GlassPanel title="Adaptive Control & Metrics" icon="⬢" className="h-full">
      <div className="p-4 h-full flex flex-col gap-4">
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 flex flex-col justify-center gap-3">
            <SliderControl label="CONTROL VELOCITY" value={velocity} onChange={setVelocity} />
            <SliderControl label="TEST INTENSITY" value={intensity} onChange={setIntensity} />
            <SliderControl label="THREAD POOL" value={threads} onChange={setThreads} />
          </div>
          <div className="flex gap-3 items-center">
            <CircularGauge label="CPU" value={metrics.cpu} /><CircularGauge label="MEM" value={metrics.mem} /><CircularGauge label="I/O" value={metrics.io} /><CircularGauge label="NET" value={metrics.net} />
          </div>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <span className="text-[9px] uppercase tracking-wider text-gray-500 mr-2">SCENARIOS:</span>
          {scenarios.map((scenario) => <button key={scenario.id} onClick={() => selectScenario(scenario.id)} className={`relative px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${activeScenario === scenario.id ? 'bg-[rgba(0,240,255,0.15)] border-[#00F0FF] text-[#00F0FF]' : 'bg-[rgba(255,255,255,0.02)] border-[rgba(212,175,55,0.3)] text-gray-400 hover:border-[#00F0FF] hover:text-[#00F0FF]'}`} title={scenario.desc}><span className="mr-1">{scenario.icon}</span>{scenario.label}{activeScenario === scenario.id && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00F0FF] animate-blink" />}</button>)}
          <div className="ml-auto flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${activeScenario ? 'bg-[#00F0FF]' : 'bg-gray-600'}`} /><span className="text-[9px] text-gray-500 uppercase">{scenarioState}</span></div>
        </div>
      </div>
    </GlassPanel>
  );
};

const SliderControl: React.FC<{ label: string; value: number | null; onChange: (v: number) => void }> = ({ label, value, onChange }) => <div className="flex items-center gap-3"><span className="text-[9px] uppercase tracking-wider text-gray-500 w-28">{label}</span><input type="range" min="0" max="100" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" aria-label={label} /><span className="text-xs font-bold font-mono w-10 text-right text-[#D4AF37]">{value === null ? '—' : `${value}%`}</span></div>;

const CircularGauge: React.FC<{ label: string; value: number | null }> = ({ label, value }) => { const radius = 28; const circumference = 2 * Math.PI * radius; const progress = value === null ? 0 : (value / 100) * circumference; return <div className="flex flex-col items-center gap-1"><div className="relative w-16 h-16"><svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64"><circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" /><circle cx="32" cy="32" r={radius} fill="none" stroke="#D4AF37" strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round" /></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-[10px] font-bold font-mono text-[#D4AF37]">{value === null ? '—' : value.toFixed(0)}</span></div></div><span className="text-[8px] uppercase tracking-wider text-gray-500">{label}</span></div>; };

export default AdaptiveControlMetrics;
