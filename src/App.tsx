import React, { useState, useEffect } from 'react';
import LiveTargetViewport from './components/LiveTargetViewport';
import NeuralTelemetryStream from './components/NeuralTelemetryStream';
import AdaptiveControlMetrics from './components/AdaptiveControlMetrics';

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemLoad, setSystemLoad] = useState(42);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setSystemLoad(prev => Math.max(20, Math.min(90, prev + (Math.random() - 0.5) * 5)));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="w-screen h-screen bg-[#0B0F19] overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      <div className="absolute inset-0 hex-overlay"></div>
      
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00F0FF] opacity-[0.02] rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4AF37] opacity-[0.02] rounded-full blur-3xl"></div>

      {/* Main layout */}
      <div className="relative z-10 w-full h-full flex flex-col p-3 gap-3">
        {/* Top header bar */}
        <header className="flex items-center justify-between px-4 py-2 glass-panel">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-[#00F0FF] rounded-sm transform rotate-45 animate-pulse-shield"></div>
              <h1 className="text-sm font-bold font-[Orbitron] tracking-wider text-[#00F0FF] neon-cyan">
                NEXUS STRESS-HUD
              </h1>
            </div>
            <span className="text-[9px] text-gray-600 border-l border-gray-700 pl-4">
              RESILIENCE SIMULATION ENGINE v4.2.1
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-gray-500">SYS LOAD:</span>
              <div className="w-20 h-1.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${systemLoad}%`,
                    background: systemLoad > 70 ? '#ff4444' : systemLoad > 50 ? '#D4AF37' : '#00F0FF',
                    boxShadow: `0 0 5px ${systemLoad > 70 ? '#ff4444' : '#00F0FF'}40`
                  }}
                ></div>
              </div>
              <span className="text-[9px] font-mono text-[#00F0FF]">{systemLoad.toFixed(0)}%</span>
            </div>
            <div className="text-xs font-mono text-[#D4AF37] neon-gold">
              {formatTime(currentTime)}
            </div>
          </div>
        </header>

        {/* Main content grid */}
        <div className="flex-1 grid grid-cols-[1fr_380px] gap-3 min-h-0">
          {/* Left: Live Target Viewport */}
          <div className="min-h-0">
            <LiveTargetViewport />
          </div>

          {/* Right: Neural Telemetry Stream */}
          <div className="min-h-0">
            <NeuralTelemetryStream />
          </div>
        </div>

        {/* Bottom: Adaptive Control & Metrics */}
        <div className="h-[200px] min-h-[180px]">
          <AdaptiveControlMetrics />
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none">
        <div className="absolute top-2 left-2 w-6 h-[1px] bg-[#D4AF37] opacity-50"></div>
        <div className="absolute top-2 left-2 w-[1px] h-6 bg-[#D4AF37] opacity-50"></div>
      </div>
      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
        <div className="absolute top-2 right-2 w-6 h-[1px] bg-[#D4AF37] opacity-50"></div>
        <div className="absolute top-2 right-2 w-[1px] h-6 bg-[#D4AF37] opacity-50"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none">
        <div className="absolute bottom-2 left-2 w-6 h-[1px] bg-[#D4AF37] opacity-50"></div>
        <div className="absolute bottom-2 left-2 w-[1px] h-6 bg-[#D4AF37] opacity-50"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none">
        <div className="absolute bottom-2 right-2 w-6 h-[1px] bg-[#D4AF37] opacity-50"></div>
        <div className="absolute bottom-2 right-2 w-[1px] h-6 bg-[#D4AF37] opacity-50"></div>
      </div>
    </div>
  );
};

export default App;
