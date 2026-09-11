import React, { useEffect, useState } from 'react';
import LiveTargetViewport from './components/LiveTargetViewport';
import NeuralTelemetryStream from './components/NeuralTelemetryStream';
import AdaptiveControlMetrics from './components/AdaptiveControlMetrics';

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <main className="nexus-shell w-full h-screen overflow-y-auto overflow-x-hidden bg-[#070B19] text-white">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute inset-0 hex-overlay pointer-events-none" />
      <div className="relative z-10 min-h-screen w-full flex flex-col gap-3 p-3">
        <header className="glass-panel shrink-0 flex min-h-14 items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex shrink-0 items-center gap-2"><div className="w-3 h-3 border-2 border-[#00F0FF] rounded-sm rotate-45" /><h1 className="text-sm font-bold font-[Orbitron] tracking-wider text-[#00F0FF] neon-cyan whitespace-nowrap">NEXUS STRESS-HUD</h1></div>
            <span className="hidden lg:block truncate border-l border-gray-700 pl-4 text-[9px] text-gray-500">LIVE DATA CONTROL SURFACE</span>
          </div>
          <div className="flex shrink-0 items-center gap-4 sm:gap-6"><div className="hidden sm:flex items-center gap-2"><span className="text-[9px] text-gray-500">SYS LOAD:</span><span className="text-[9px] font-mono text-gray-500">N/A</span></div><div className="text-xs font-mono text-[#D4AF37] neon-gold">{formatTime(currentTime)}</div></div>
        </header>

        <section className="flex-1 min-h-[620px] grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] gap-3">
          <div className="min-w-0 min-h-[620px]"><LiveTargetViewport /></div>
          <div className="min-w-0 min-h-[620px]"><NeuralTelemetryStream /></div>
        </section>

        <section className="shrink-0 min-h-[190px] h-[220px]"><AdaptiveControlMetrics /></section>
      </div>
      <div className="corner corner-tl" /><div className="corner corner-tr" /><div className="corner corner-bl" /><div className="corner corner-br" />
    </main>
  );
};
export default App;
