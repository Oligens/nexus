import React, { useState, useEffect } from 'react';
import GlassPanel from './GlassPanel';

const AdaptiveControlMetrics: React.FC = () => {
  const [velocity, setVelocity] = useState(65);
  const [intensity, setIntensity] = useState(40);
  const [threads, setThreads] = useState(75);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [circularMetrics, setCircularMetrics] = useState({ cpu: 72, mem: 58, io: 45, net: 83 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCircularMetrics({
        cpu: Math.max(20, Math.min(95, circularMetrics.cpu + (Math.random() - 0.5) * 8)),
        mem: Math.max(30, Math.min(90, circularMetrics.mem + (Math.random() - 0.5) * 5)),
        io: Math.max(10, Math.min(85, circularMetrics.io + (Math.random() - 0.5) * 10)),
        net: Math.max(40, Math.min(99, circularMetrics.net + (Math.random() - 0.5) * 6)),
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [circularMetrics]);

  const scenarios = [
    { id: 'recon', label: 'RECON', icon: '◉', desc: 'Reconnaissance Scan' },
    { id: 'robustness', label: 'ROBUST', icon: '◆', desc: 'Route Robustness Test' },
    { id: 'load', label: 'LOAD', icon: '⬡', desc: 'Load Analysis' },
    { id: 'flood', label: 'FLOOD', icon: '◈', desc: 'Stress Flood Test' },
  ];

  const handleScenario = (id: string) => {
    setActiveScenario(activeScenario === id ? null : id);
  };

  return (
    <GlassPanel title="Adaptive Control & Metrics" icon="⬢" className="h-full">
      <div className="p-4 h-full flex flex-col gap-4">
        {/* Top row: Sliders + Circular metrics */}
        <div className="flex gap-4 flex-1">
          {/* Velocity sliders */}
          <div className="flex-1 flex flex-col gap-3">
            <SliderControl 
              label="SIM VELOCITY" 
              value={velocity} 
              onChange={setVelocity} 
              color="#00F0FF"
            />
            <SliderControl 
              label="STRESS INTENSITY" 
              value={intensity} 
              onChange={setIntensity} 
              color="#D4AF37"
            />
            <SliderControl 
              label="THREAD POOL" 
              value={threads} 
              onChange={setThreads} 
              color="#00cc88"
            />
          </div>

          {/* Circular performance gauges */}
          <div className="flex gap-3 items-center">
            <CircularGauge label="CPU" value={circularMetrics.cpu} color="#00F0FF" />
            <CircularGauge label="MEM" value={circularMetrics.mem} color="#D4AF37" />
            <CircularGauge label="I/O" value={circularMetrics.io} color="#00cc88" />
            <CircularGauge label="NET" value={circularMetrics.net} color="#a855f7" />
          </div>
        </div>

        {/* Bottom row: Scenario buttons */}
        <div className="flex gap-3 items-center">
          <span className="text-[9px] uppercase tracking-wider text-gray-500 mr-2">SCENARIOS:</span>
          {scenarios.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => handleScenario(scenario.id)}
              className={`
                relative px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider
                transition-all duration-300 border
                ${activeScenario === scenario.id 
                  ? 'bg-[rgba(0,240,255,0.15)] border-[#00F0FF] text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)]' 
                  : 'bg-[rgba(255,255,255,0.02)] border-[rgba(212,175,55,0.3)] text-gray-400 hover:border-[#00F0FF] hover:text-[#00F0FF] hover:shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                }
              `}
              title={scenario.desc}
            >
              <span className="mr-1">{scenario.icon}</span>
              {scenario.label}
              {activeScenario === scenario.id && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00F0FF] animate-blink"></span>
              )}
            </button>
          ))}
          
          {/* Status indicator */}
          <div className="ml-auto flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${activeScenario ? 'bg-[#00F0FF] animate-pulse-shield' : 'bg-gray-600'}`}></div>
            <span className="text-[9px] text-gray-500 uppercase">
              {activeScenario ? `EXEC: ${activeScenario.toUpperCase()}` : 'IDLE'}
            </span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};

const SliderControl: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}> = ({ label, value, onChange, color }) => (
  <div className="flex items-center gap-3">
    <span className="text-[9px] uppercase tracking-wider text-gray-500 w-28">{label}</span>
    <input
      type="range"
      min="0"
      max="100"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="flex-1"
      style={{ accentColor: color }}
    />
    <span 
      className="text-xs font-bold font-mono w-10 text-right"
      style={{ color, textShadow: `0 0 5px ${color}40` }}
    >
      {value}%
    </span>
  </div>
);

const CircularGauge: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
          {/* Background circle */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="4"
          />
          {/* Progress circle */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            style={{ 
              transition: 'stroke-dashoffset 1s ease-in-out',
              filter: `drop-shadow(0 0 3px ${color}60)`
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold font-mono" style={{ color }}>
            {value.toFixed(0)}
          </span>
        </div>
      </div>
      <span className="text-[8px] uppercase tracking-wider text-gray-500">{label}</span>
    </div>
  );
};

export default AdaptiveControlMetrics;
