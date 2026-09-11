import React, { useEffect, useRef, useState } from 'react';
import { Activity, Pause, Play, Terminal, Trash2 } from 'lucide-react';
import GlassPanel from './GlassPanel';

interface TelemetryEntry { id: string; timestamp: string; message: string; level?: 'info' | 'warning' | 'error'; }

const NeuralTelemetryStream: React.FC = () => {
  const [entries, setEntries] = useState<TelemetryEntry[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [input, setInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [entries]);

  const appendEntry = (message: string, level: TelemetryEntry['level'] = 'info') => {
    const value = message.trim();
    if (!value) return;
    setEntries((prev) => [...prev, { id: crypto.randomUUID(), timestamp: new Date().toISOString(), message: value, level }].slice(-140));
  };

  const submitEntry = (event: React.FormEvent) => {
    event.preventDefault();
    appendEntry(input);
    setInput('');
  };

  const levelClass = (level: TelemetryEntry['level']) => ({ info: 'text-[#d6e2f0]', warning: 'text-[#D4AF37]', error: 'text-[#ff6b6b]' }[level ?? 'info']);

  return (
    <GlassPanel title="Neural Telemetry Stream" icon="⟁" className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="shrink-0 flex items-center gap-3 px-3 py-2 border-b border-[#D4AF37]/20">
        <div className="flex items-center gap-2"><Activity size={12} className="text-[#D4AF37]" /><span className="text-[9px] text-gray-500">ENTRIES</span><span className="text-[10px] text-[#D4AF37] font-bold">{entries.length}</span></div>
        <div className="ml-auto flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${streaming ? 'bg-[#00F0FF]' : 'bg-gray-600'}`} /><span className="text-[9px] text-gray-500">{streaming ? 'INPUT ENABLED' : 'WAITING'}</span></div>
        <button aria-label={streaming ? 'Disable telemetry input' : 'Enable telemetry input'} onClick={() => setStreaming((value) => !value)} className="terminal-tool">{streaming ? <Pause size={12}/> : <Play size={12}/>}</button>
        <button aria-label="Clear telemetry" onClick={() => setEntries([])} className="terminal-tool" disabled={entries.length === 0}><Trash2 size={12}/></button>
      </div>

      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar p-3 bg-[#030711]/60 terminal-text" aria-live="polite">
        {entries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-5"><Terminal size={25} className="text-[#D4AF37]/50 mb-3" /><p className="text-[10px] uppercase tracking-widest text-gray-400">Aucun flux de télémétrie</p><p className="text-[8px] text-gray-600 mt-2">Les données apparaîtront ici uniquement lorsqu'elles seront reçues ou saisies par une source réelle.</p></div>
        ) : entries.map((entry, idx) => (
          <div key={entry.id} className={`whitespace-pre-wrap break-all leading-5 opacity-90 hover:opacity-100 ${levelClass(entry.level)}`}><span className="text-gray-600 mr-2 select-none">{String(idx).padStart(4,'0')}</span><span className="text-gray-600 mr-2">[{entry.timestamp}]</span>{entry.message}</div>
        ))}
      </div>

      <form onSubmit={submitEntry} className="shrink-0 px-3 py-2 border-t border-[#D4AF37]/20 flex gap-2">
        <input value={input} onChange={(event) => setInput(event.target.value)} disabled={!streaming} placeholder={streaming ? 'Entrée de télémétrie réelle...' : 'Activez l’entrée pour ajouter un événement'} className="nexus-input flex-1" aria-label="Telemetry input" />
        <button type="submit" disabled={!streaming || !input.trim()} className="quick-mini px-3"><Terminal size={12} /> PUSH</button>
      </form>
      <div className="shrink-0 px-3 py-2 border-t border-[#D4AF37]/20 flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"/><span className="text-[8px] text-gray-500">STREAM {streaming ? 'READY FOR INPUT' : 'IDLE'}</span></div><span className="text-[8px] text-gray-600">BUF: {entries.length}/140</span></div>
    </GlassPanel>
  );
};
export default NeuralTelemetryStream;
