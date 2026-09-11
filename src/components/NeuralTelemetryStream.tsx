import React, { useEffect, useRef, useState } from 'react';
import { Activity, Pause, Play, Terminal, Trash2, Wifi } from 'lucide-react';
import GlassPanel from './GlassPanel';
import { useTelemetry } from '../hooks/useTelemetry';

const NeuralTelemetryStream: React.FC = () => {
  const { entries, transportState, configured, connect, disconnect, clear } = useTelemetry();
  const [streaming, setStreaming] = useState(false);
  const [input, setInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [entries]);

  useEffect(() => {
    if (streaming) connect(); else disconnect();
    return () => disconnect();
  }, [streaming, connect, disconnect]);

  const levelClass = (level: 'info' | 'warning' | 'error') => ({ info: 'text-[#d6e2f0]', warning: 'text-[#D4AF37]', error: 'text-[#ff6b6b]' }[level]);

  const submitManualEntry = (event: React.FormEvent) => {
    event.preventDefault();
    // Manual entry remains a user action; it is not presented as received telemetry.
    setInput('');
  };

  return (
    <GlassPanel title="Neural Telemetry Stream" icon="⟁" className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center gap-3 px-3 py-2 border-b border-[#D4AF37]/20">
        <div className="flex items-center gap-2"><Activity size={12} className="text-[#D4AF37]" /><span className="text-[9px] text-gray-500">ENTRIES</span><span className="text-[10px] text-[#D4AF37] font-bold">{entries.length}</span></div>
        <div className="ml-auto flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${transportState === 'connected' ? 'bg-[#00F0FF]' : transportState === 'error' ? 'bg-[#ff6b6b]' : 'bg-gray-600'}`} /><span className="text-[9px] text-gray-500">{transportState.toUpperCase()}</span></div>
        <button aria-label={streaming ? 'Disconnect telemetry' : 'Connect telemetry'} onClick={() => setStreaming((value) => !value)} className="terminal-tool">{streaming ? <Pause size={12}/> : <Play size={12}/>}</button>
        <button aria-label="Clear telemetry" onClick={clear} className="terminal-tool" disabled={entries.length === 0}><Trash2 size={12}/></button>
      </div>

      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar p-3 bg-[#030711]/60 terminal-text" aria-live="polite">
        {entries.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center px-5"><Terminal size={25} className="text-[#D4AF37]/50 mb-3" /><p className="text-[10px] uppercase tracking-widest text-gray-400">Aucun flux de télémétrie</p><p className="text-[8px] text-gray-600 mt-2">{configured ? 'Connectez le transport pour recevoir les événements réels.' : 'Configurez VITE_NEXUS_TELEMETRY_WS_URL pour connecter une source réelle.'}</p></div> : entries.map((entry, idx) => <div key={entry.id} className={`whitespace-pre-wrap break-all leading-5 opacity-90 hover:opacity-100 ${levelClass(entry.level)}`}><span className="text-gray-600 mr-2 select-none">{String(idx).padStart(4,'0')}</span><span className="text-gray-600 mr-2">[{entry.timestamp}]</span>{entry.source ? `[${entry.source}] ` : ''}{entry.message}</div>)}
      </div>

      <form onSubmit={submitManualEntry} className="shrink-0 px-3 py-2 border-t border-[#D4AF37]/20 flex gap-2">
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Commande opérateur / note locale..." className="nexus-input flex-1" aria-label="Operator note" />
        <button type="submit" disabled={!input.trim()} className="quick-mini px-3"><Terminal size={12} /> NOTE</button>
      </form>
      <div className="shrink-0 px-3 py-2 border-t border-[#D4AF37]/20 flex items-center justify-between"><div className="flex items-center gap-2"><Wifi size={10} className="text-[#D4AF37]"/><span className="text-[8px] text-gray-500">TRANSPORT {transportState.toUpperCase()}</span></div><span className="text-[8px] text-gray-600">BUF: {entries.length}/140</span></div>
    </GlassPanel>
  );
};
export default NeuralTelemetryStream;
