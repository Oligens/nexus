import React, { useState, useEffect, useRef } from 'react';
import GlassPanel from './GlassPanel';

const generateTelemetryLine = (): string => {
  const patterns = [
    () => `[${timestamp()}] NEURAL_SYNC :: payload_hash=0x${hex(8)} status=VERIFIED`,
    () => `[${timestamp()}] LOAD_EVAL :: throughput=${rand(100, 9999)}req/s latency=${rand(5, 200)}ms`,
    () => `[${timestamp()}] ROUTE_PROBE :: /api/${randomPath()} → ${rand(200, 200) === 200 ? '200 OK' : '429 RATE_LIMIT'}`,
    () => `[${timestamp()}] SHIELD_CHECK :: integrity=${rand(85, 100)}% vectors=${rand(12, 48)} blocked=${rand(0, 5)}`,
    () => `[${timestamp()}] DATA_STREAM :: chunk_id=${hex(6)} size=${rand(1, 64)}KB encrypted=AES-256`,
    () => `[${timestamp()}] STRESS_IDX :: cpu_load=${rand(10, 95)}% mem_pressure=${rand(20, 88)}% io_wait=${rand(1, 30)}ms`,
    () => `[${timestamp()}] ALGO_PASS :: fitness=${(Math.random() * 2 + 3).toFixed(2)} generation=${rand(100, 999)}`,
    () => `[${timestamp()}] NET_SCAN :: peer=${rand(1, 255)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)} rtt=${rand(1, 50)}ms`,
    () => `[${timestamp()}] CACHE_HIT :: ratio=${(Math.random() * 30 + 70).toFixed(1)}% evictions=${rand(0, 12)} warm=true`,
    () => `[${timestamp()}] AUTH_LAYER :: token_valid=true scope=admin-${rand(1, 5)} session_ttl=${rand(120, 3600)}s`,
    () => `[${timestamp()}] FLOW_CTRL :: bandwidth=${rand(100, 1000)}Mbps throttle=${rand(0, 100)}% priority=HIGH`,
    () => `[${timestamp()}] INTEGRITY :: checksum=SHA256:${hex(12)} verified=true chain=${rand(1000, 9999)}`,
  ];
  return patterns[Math.floor(Math.random() * patterns.length)]();
};

const timestamp = () => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
};

const hex = (len: number) => Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('');
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomPath = () => {
  const paths = ['users', 'metrics', 'health', 'config', 'stream', 'nodes', 'auth', 'data', 'sync', 'probe'];
  return paths[Math.floor(Math.random() * paths.length)];
};

const NeuralTelemetryStream: React.FC = () => {
  const [lines, setLines] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [totalPackets, setTotalPackets] = useState(0);
  const [activeThreads, setActiveThreads] = useState(8);

  useEffect(() => {
    // Initialize with some lines
    const initialLines = Array.from({ length: 30 }, () => generateTelemetryLine());
    setLines(initialLines);

    const interval = setInterval(() => {
      setLines(prev => {
        const newLines = [...prev, generateTelemetryLine()];
        return newLines.slice(-100); // Keep last 100 lines
      });
      setTotalPackets(prev => prev + 1);
      setActiveThreads(Math.floor(Math.random() * 4) + 6);
    }, 200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  const getLineColor = (line: string): string => {
    if (line.includes('SHIELD') || line.includes('INTEGRITY')) return '#D4AF37';
    if (line.includes('STRESS') || line.includes('CRITICAL') || line.includes('RATE_LIMIT')) return '#ff6b6b';
    if (line.includes('NEURAL') || line.includes('ALGO')) return '#00F0FF';
    return '#00cc88';
  };

  return (
    <GlassPanel title="Neural Telemetry Stream" icon="⟁" className="h-full flex flex-col">
      {/* Header stats */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[rgba(0,240,255,0.1)]">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500">PACKETS:</span>
          <span className="text-[10px] text-[#00F0FF] font-bold">{totalPackets.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-gray-500">THREADS:</span>
          <span className="text-[10px] text-[#D4AF37] font-bold">{activeThreads}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-blink"></div>
          <span className="text-[10px] text-[#00F0FF]">LIVE</span>
        </div>
      </div>

      {/* Telemetry stream */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 custom-scrollbar"
        style={{ maxHeight: 'calc(100% - 80px)' }}
      >
        {lines.map((line, idx) => (
          <div 
            key={idx} 
            className="text-[10px] leading-relaxed font-mono mb-0.5 opacity-90 hover:opacity-100 transition-opacity"
            style={{ color: getLineColor(line) }}
          >
            <span className="text-gray-600 mr-1">{String(idx).padStart(4, '0')}</span>
            {line}
          </div>
        ))}
        {/* Cursor blink */}
        <div className="flex items-center mt-1">
          <span className="text-[#00F0FF] text-[10px]">▊</span>
          <span className="text-[10px] text-gray-600 ml-2 animate-blink">AWAITING_INPUT...</span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-4 py-2 border-t border-[rgba(0,240,255,0.1)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-1 rounded-full bg-green-400"></div>
          <span className="text-[9px] text-gray-500">STREAM ACTIVE</span>
        </div>
        <span className="text-[9px] text-gray-600">BUF: 100/100</span>
      </div>
    </GlassPanel>
  );
};

export default NeuralTelemetryStream;
