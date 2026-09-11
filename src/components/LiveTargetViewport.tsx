import React, { useState, useEffect } from 'react';
import GlassPanel from './GlassPanel';

const LiveTargetViewport: React.FC = () => {
  const [latency, setLatency] = useState(23);
  const [packetLoss, setPacketLoss] = useState(0.02);
  const [status, setStatus] = useState<'STABLE' | 'LOADING' | 'STRESSED'>('STABLE');
  const [uptime, setUptime] = useState(99.97);
  const [connections, setConnections] = useState(1247);
  const [shieldIntegrity, setShieldIntegrity] = useState(94);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => Math.max(8, Math.min(180, prev + (Math.random() - 0.5) * 20)));
      setPacketLoss(prev => Math.max(0, Math.min(5, prev + (Math.random() - 0.5) * 0.5)));
      setConnections(prev => Math.max(800, Math.min(2000, prev + Math.floor((Math.random() - 0.5) * 100))));
      setShieldIntegrity(prev => Math.max(70, Math.min(100, prev + (Math.random() - 0.5) * 3)));
      
      if (latency > 100) setStatus('STRESSED');
      else if (latency > 50) setStatus('LOADING');
      else setStatus('STABLE');
    }, 1500);

    return () => clearInterval(interval);
  }, [latency]);

  const statusColor = status === 'STABLE' ? '#00F0FF' : status === 'LOADING' ? '#D4AF37' : '#ff4444';
  const statusLabel = status === 'STABLE' ? '● NOMINAL' : status === 'LOADING' ? '◐ ELEVATED' : '◉ CRITICAL';

  return (
    <GlassPanel title="Live Target Viewport" icon="◈" className="h-full flex flex-col">
      <div className="flex-1 relative p-4 overflow-hidden">
        {/* Background grid effect */}
        <div className="absolute inset-0 bg-grid opacity-50"></div>
        
        {/* Scan line effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent opacity-30 animate-scan-line"></div>
        </div>

        {/* Central viewport simulation */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Top status bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full animate-pulse-shield"
                style={{ backgroundColor: statusColor, boxShadow: `0 0 10px ${statusColor}` }}
              ></div>
              <span className="text-xs font-bold tracking-wider" style={{ color: statusColor }}>
                {statusLabel}
              </span>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              TARGET: <span className="text-[#00F0FF]">sys-core-07.nexus</span>
            </div>
          </div>

          {/* Main display area */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative">
              {/* Rotating shield ring */}
              <div className="absolute inset-[-40px] border border-[rgba(0,240,255,0.2)] rounded-full animate-rotate-slow"></div>
              <div className="absolute inset-[-25px] border border-[rgba(212,175,55,0.15)] rounded-full animate-rotate-slow" style={{ animationDirection: 'reverse', animationDuration: '15s' }}></div>
              
              {/* Central hex display */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-[rgba(0,240,255,0.3)] rounded-lg transform rotate-45 animate-pulse-shield"></div>
                <div className="absolute inset-2 border border-[rgba(212,175,55,0.2)] rounded-lg transform rotate-45"></div>
                
                <div className="text-center z-10">
                  <div className="text-3xl font-bold font-[Orbitron] neon-cyan">
                    {uptime.toFixed(2)}%
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">
                    System Integrity
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom metrics */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <MetricBox label="LATENCY" value={`${latency.toFixed(0)}ms`} color="#00F0FF" />
            <MetricBox label="PACKET LOSS" value={`${packetLoss.toFixed(2)}%`} color={packetLoss > 2 ? '#ff4444' : '#D4AF37'} />
            <MetricBox label="CONNECTIONS" value={connections.toString()} color="#00F0FF" />
            <MetricBox label="SHIELD" value={`${shieldIntegrity.toFixed(0)}%`} color={shieldIntegrity > 85 ? '#00F0FF' : '#D4AF37'} />
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};

const MetricBox: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="glass-panel-gold p-2 text-center">
    <div className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">{label}</div>
    <div className="text-sm font-bold font-mono" style={{ color, textShadow: `0 0 8px ${color}40` }}>
      {value}
    </div>
  </div>
);

export default LiveTargetViewport;
