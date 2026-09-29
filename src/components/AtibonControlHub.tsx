/**
 * ATIBON Control Hub — interface de contrôle principale.
 *
 * Bascule SIMULATION / LIVE :
 *  - SIMULATION : routine locale fictive (aucune requête réseau).
 *  - LIVE       : appel HTTP/WebSocket vers le backend Python `atibon.py`
 *                 avec les paramètres complets (cible, port, modules sélectionnés)
 *                 et le flag d'autorisation légale `--i-have-authorization`.
 *
 * En mode LIVE, l'exécution est bloquée et une alerte visuelle claire est
 * affichée si la case d'autorisation n'est pas cochée.
 */

import React, { useState } from 'react';
import { AlertTriangle, Radio, ShieldCheck } from 'lucide-react';
import { launchProbe, PROBE_MODULES, type ProbeModule } from '../services/probeService';

export function AtibonHub() {
    const [targetHost, setTargetHost] = useState('127.0.0.1');
    const [targetPort, setTargetPort] = useState(8080);
    const [selectedModules, setSelectedModules] = useState<ProbeModule[]>(['fingerprint']);
    // Case à cocher d'autorisation légale — correspond à `--i-have-authorization` (atibon.py)
    const [authorized, setAuthorized] = useState(false);
    // ── Toggle Switch Simulation / Live (mode LIVE par défaut) ──
    const [isSimulation, setIsSimulation] = useState(false);
    const [output, setOutput] = useState('En attente de lancement...');
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const toggleModule = (module: ProbeModule) => {
        setSelectedModules((prev) => prev.includes(module)
            ? prev.filter((entry) => entry !== module)
            : [...prev, module]);
    };

    const handleLaunchProbe = async () => {
        setAlertMessage(null);
        setLoading(true);
        try {
            const result = await launchProbe(
                { targetHost: targetHost.trim(), targetPort, modules: selectedModules, authorized },
                isSimulation,
            );
            setOutput(`[${result.runId ?? '—'}] ${result.message}`);
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            setAlertMessage(reason);
            setOutput(`Erreur : ${reason}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-slate-900 text-cyan-400 rounded-xl border border-cyan-500/30">
            <h2 className="text-xl font-bold mb-4">ATIBON Security Hub</h2>

            {/* ── Toggle Switch SIMULATION / LIVE ── */}
            <div className="flex items-center gap-3 mb-4">
                <span className={`text-xs font-bold uppercase ${isSimulation ? 'text-cyan-300' : 'text-slate-500'}`}>Simulation</span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={!isSimulation}
                    onClick={() => { setIsSimulation((prev) => !prev); setAlertMessage(null); }}
                    className={`relative inline-flex h-6 w-12 shrink-0 items-center rounded-full border transition-all ${isSimulation ? 'border-cyan-400/60 bg-cyan-400/15' : 'border-red-500/70 bg-red-500/25'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full transition-all ${isSimulation ? 'translate-x-1.5 bg-cyan-300' : 'translate-x-7 bg-red-400'}`} />
                </button>
                <span className={`text-xs font-bold uppercase ${isSimulation ? 'text-slate-500' : 'text-red-400'}`}>Live</span>
                <span className="ml-auto text-[10px] text-slate-500">{isSimulation ? 'MODE SIMULATION — local fictif' : 'MODE LIVE — backend atibon.py'}</span>
            </div>

            <div className="flex flex-col gap-4 mb-4">
                <label className="text-sm">
                    Cible (Hôte) :
                    <input
                        type="text"
                        value={targetHost}
                        onChange={(e) => setTargetHost(e.target.value)}
                        className="ml-2 p-2 bg-slate-800 border border-slate-700 rounded text-white w-64"
                        placeholder="127.0.0.1"
                    />
                </label>
                <label className="text-sm">
                    Port :
                    <input
                        type="number"
                        min={1}
                        max={65535}
                        value={targetPort}
                        onChange={(e) => setTargetPort(Number(e.target.value) || 1)}
                        className="ml-2 p-2 bg-slate-800 border border-slate-700 rounded text-white w-28"
                    />
                </label>
                <div className="text-sm">
                    Modules sélectionnés :
                    <div className="mt-2 flex flex-wrap gap-2">
                        {PROBE_MODULES.map((module) => (
                            <button
                                key={module}
                                type="button"
                                onClick={() => toggleModule(module)}
                                className={`px-3 py-1 rounded border text-xs font-bold uppercase transition-all ${selectedModules.includes(module) ? 'border-cyan-400 bg-cyan-400/15 text-cyan-300' : 'border-slate-700 bg-slate-800 text-slate-500 hover:border-cyan-500/50'}`}
                            >
                                {module}
                            </button>
                        ))}
                    </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                        type="checkbox"
                        checked={authorized}
                        onChange={(e) => setAuthorized(e.target.checked)}
                        className="h-4 w-4 accent-cyan-400"
                    />
                    <ShieldCheck size={15} className="text-cyan-400" />
                    J&apos;ai l&apos;autorisation écrite d&apos;auditer cette cible (--i-have-authorization)
                </label>

                {/* Alerte visuelle claire si exécution LIVE bloquée sans autorisation */}
                {alertMessage !== null && (
                    <div role="alert" className="flex items-start gap-2 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <span className="font-bold">{alertMessage}</span>
                    </div>
                )}
                {!isSimulation && !authorized && (
                    <p className="text-xs text-red-400">⚠ Mode LIVE actif : l&apos;envoi réel au backend est bloqué tant que l&apos;autorisation légale n&apos;est pas cochée.</p>
                )}

                <button
                    onClick={handleLaunchProbe}
                    disabled={loading}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded transition flex items-center justify-center gap-2"
                >
                    <Radio size={16} />
                    {loading ? 'Sonde en cours...' : isSimulation ? 'LANCER SONDE (SIMULATION)' : 'LANCER SONDE (LIVE)'}
                </button>
            </div>
            <pre className="p-4 bg-black text-green-400 rounded overflow-x-auto text-sm whitespace-pre-wrap">
                {output}
            </pre>
        </div>
    );
}

export default AtibonHub;
