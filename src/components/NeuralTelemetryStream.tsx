import React, { useEffect, useRef, useState } from 'react';
import { Activity, Pause, Play, Terminal, Trash2 } from 'lucide-react';
import GlassPanel from './GlassPanel';

const timestamp = () => { const now = new Date(); return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}.${now.getMilliseconds().toString().padStart(3,'0')}`; };
const hex = (len: number) => Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPath = () => ['users','metrics','health','config','stream','nodes','auth','data','sync','probe'][rand(0,9)];
const generateTelemetryLine = (): string => [
  () => `[${timestamp()}] NEURAL_SYNC :: payload_hash=0x${hex(8)} status=VERIFIED`,
  () => `[${timestamp()}] LOAD_EVAL :: throughput=${rand(100,9999)}req/s latency=${rand(5,200)}ms`,
  () => `[${timestamp()}] ROUTE_PROBE :: /api/${randomPath()} → 200 OK`,
  () => `[${timestamp()}] SHIELD_CHECK :: integrity=${rand(85,100)}% vectors=${rand(12,48)} blocked=${rand(0,5)}`,
  () => `[${timestamp()}] DATA_STREAM :: chunk_id=${hex(6)} size=${rand(1,64)}KB encrypted=AES-256`,
  () => `[${timestamp()}] STRESS_IDX :: cpu_load=${rand(10,95)}% mem_pressure=${rand(20,88)}% io_wait=${rand(1,30)}ms`,
  () => `[${timestamp()}] ALGO_PASS :: fitness=${(Math.random()*2+3).toFixed(2)} generation=${rand(100,999)}`,
  () => `[${timestamp()}] CACHE_HIT :: ratio=${(Math.random()*30+70).toFixed(1)}% evictions=${rand(0,12)} warm=true`,
  () => `[${timestamp()}] FLOW_CTRL :: bandwidth=${rand(100,1000)}Mbps throttle=${rand(0,100)}% priority=HIGH`,
  () => `[${timestamp()}] INTEGRITY :: checksum=SHA256:${hex(12)} verified=true chain=${rand(1000,9999)}`,
][rand(0,9)]();

const NeuralTelemetryStream: React.FC = () => {
  const [lines, setLines] = useState<string[]>(() => Array.from({ length: 38 }, generateTelemetryLine));
  const [totalPackets, setTotalPackets] = useState(0);
  const [activeThreads, setActiveThreads] = useState(8);
  const [streaming, setStreaming] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!streaming) return;
    const interval = window.setInterval(() => {
      setLines((prev) => [...prev, generateTelemetryLine()].slice(-140));
      setTotalPackets((prev) => prev + 1);
      setActiveThreads(rand(6,9));
    }, 250);
    return () => window.clearInterval(interval);
  }, [streaming]);

  useEffect(() => { if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight; }, [lines]);

  const getLineColor = (line: string) => line.includes('SHIELD') || line.includes('INTEGRITY') ? '#D4AF37' : line.includes('STRESS') ? '#ff6b6b' : line.includes('NEURAL') || line.includes('ALGO') ? '#00F0FF' : '#d6e2f0';

  return (
    <GlassPanel title="Neural Telemetry Stream" icon="⟁" className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center gap-3 px-3 py-2 border-b border-[#D4AF37]/20">
        <div className="flex items-center gap-2"><Activity size={12} className="text-[#00F0FF]" /><span className="text-[9px] text-gray-500">PACKETS</span><span className="text-[10px] text-[#00F0FF] font-bold">{totalPackets.toLocaleString()}</span></div>
        <div className="flex items-center gap-2"><span className="text-[9px] text-gray-500">THREADS</span><span className="text-[10px] text-[#D4AF37] font-bold">{activeThreads}</span></div>
        <div className="ml-auto flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${streaming ? 'bg-[#00F0FF] animate-blink' : 'bg-gray-600'}`} /><span className="text-[9px] text-[#00F0FF]">{streaming ? 'LIVE' : 'PAUSED'}</span></div>
        <button aria-label={streaming ? 'Pause stream' : 'Resume stream'} onClick={() => setStreaming((v) => !v)} className="terminal-tool">{streaming ? <Pause size={12}/> : <Play size={12}/>}</button>
        <button aria-label="Clear telemetry" onClick={() => setLines([])} className="terminal-tool"><Trash2 size={12}/></button>
      </div>

      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar p-3 bg-[#030711]/60 terminal-text" aria-live="polite">
        {lines.map((line, idx) => <div key={`${idx}-${line}`} className="whitespace-pre leading-5 opacity-90 hover:opacity-100" style={{ color: getLineColor(line) }}><span className="text-gray-600 mr-2 select-none">{String(idx).padStart(4,'0')}</span>{line}</div>)}
        <div className="flex items-center mt-1"><Terminal size={11} className="text-[#00F0FF] mr-2"/><span className="text-[10px] text-gray-600 animate-blink">AWAITING_INPUT...</span></div>
      </div>
      <div className="shrink-0 px-3 py-2 border-t border-[#D4AF37]/20 flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]"/><span className="text-[8px] text-gray-500">STREAM {streaming ? 'ACTIVE' : 'SUSPENDED'}</span></div><span className="text-[8px] text-gray-600">BUF: {lines.length}/140</span></div>
    </GlassPanel>
  );
};
export default NeuralTelemetryStream;
