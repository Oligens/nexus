import React, { useState } from 'react';
import { AtibonNexus } from '../atibonNexus';

export function AtibonHub() {
    const [targetDomain, setTargetDomain] = useState('cleefolig.com');
    const [authToken, setAuthToken] = useState('');
    const [auditOutput, setAuditOutput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRunAudit = async () => {
        setLoading(true);
        try {
            const nexus = new AtibonNexus();
            const result = await nexus.executeAudit({
                targetHost: targetDomain, // Utilise le domaine saisi (ex: cleefolig.com)
                useTls: true, // Recommandé pour un site en ligne HTTPS
                authorizationToken: authToken,
                modules: {
                    exploit: true,
                    authBypass: true,
                    protocolCover: true
                }
            });
            setAuditOutput(result);
        } catch (error: any) {
            setAuditOutput(`Erreur : ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-slate-900 text-cyan-400 rounded-xl border border-cyan-500/30">
            <h2 className="text-xl font-bold mb-4">ATIBON Security Hub</h2>
            <div className="flex flex-col gap-4 mb-4">
                <label>
                    Cible (Domaine / URL) :
                    <input 
                        type="text" 
                        value={targetDomain} 
                        onChange={(e) => setTargetDomain(e.target.value)}
                        className="ml-2 p-2 bg-slate-800 border border-slate-700 rounded text-white w-80"
                        placeholder="cleefolig.com"
                    />
                </label>
                <label>
                    Jeton d'autorisation :
                    <input 
                        type="password" 
                        value={authToken} 
                        onChange={(e) => setAuthToken(e.target.value)}
                        className="ml-2 p-2 bg-slate-800 border border-slate-700 rounded text-white w-80"
                        placeholder="Votre jeton secret"
                    />
                </label>
                <button 
                    onClick={handleRunAudit}
                    disabled={loading}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded transition"
                >
                    {loading ? 'Audit en cours...' : 'Lancer l\'audit sur la cible'}
                </button>
            </div>
            <pre className="p-4 bg-black text-green-400 rounded overflow-x-auto text-sm">
                {auditOutput || 'En attente de lancement...'}
            </pre>
        </div>
    );
}