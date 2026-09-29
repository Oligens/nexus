/**
 * ATIBON Control Hub — API Bridge (Node.js / Express)
 * ====================================================
 * Serveur pont léger entre l'interface React (frontend, http://localhost:3000)
 * et le script de sécurité backend `atibon.py`.
 *
 * Rôle :
 *  1. Recevoir les ordres de sonde du frontend via POST /api/probe/run.
 *  2. Valider IMPÉRATIVEMENT l'autorisation légale (`iHaveAuthorization === true`)
 *     → sinon 403 Forbidden immédiat, aucune exécution.
 *  3. Lancer `python atibon.py` avec child_process.spawn et des arguments CLI
 *     construits dynamiquement (aucun shell → pas d'injection de commandes).
 *  4. Streamer la télémétrie temps réel (stdout/stderr) au format
 *     Server-Sent Events sur GET /api/probe/:runId/stream pour alimenter le
 *     « NEURAL TELEMETRY STREAM » du hub.
 *
 * Lancement :  node bridge/server.js            (ou npm run bridge)
 */

import express from 'express';
import cors from 'cors';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ────────────────────────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT ?? 3001);
const PYTHON_BIN = process.env.ATIBON_PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3');
const ATIBON_SCRIPT = process.env.ATIBON_SCRIPT ?? path.resolve(__dirname, '..', 'backend', 'atibon.py');
const MAX_LOG_LINES_PER_RUN = Number(process.env.ATIBON_MAX_LOG_LINES ?? 5000);

// Origines autorisées (frontend React). Configurable via CORS_ORIGINS="http://a,http://b"
const ALLOWED_ORIGINS = new Set(
  (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
);

// Whitelist stricte des flags/modules acceptés par atibon.py (arguments booléens)
const ALLOWED_FLAGS = new Set([
  '--use-tls',
  '--verbose',
  '--exploit',
  '--post-exploit',
  '--c2',
  '--auth-bypass',
  '--binary-exploit',
  '--social-eng',
  '--protocol-cover',
  '--ad-test',
  '--av-evasion',
  '--anti-forensics',
]);

// Regex défensives pour les paramètres scalaires (pas d'injection d'arguments)
const HOST_RE = /^[A-Za-z0-9._:\-\[\]]{1,253}$/; // hostname / IPv4 / IPv6 entre crochets
const MODULE_TOKEN_RE = /^-{0,2}[a-z][a-z0-9_-]{0,63}$/; // 'fingerprint', '--exploit', 'auth-bypass'...

// Alias frontend → flags réels de atibon.py
const MODULE_ALIASES = { fingerprint: '--verbose' };

// ────────────────────────────────────────────────────────────────
// Registre des exécutions (runs) en mémoire + bus SSE
// ────────────────────────────────────────────────────────────────
/** @type {Map<string, {args: string[], logs: any[], clients: Set<import('http').ServerResponse>, status: string, exitCode: number|null}>} */
const runs = new Map();

function pushEvent(runId, event) {
  const run = runs.get(runId);
  if (!run) return;
  run.logs.push(event);
  if (run.logs.length > MAX_LOG_LINES_PER_RUN) run.logs.shift();
  const frame = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of run.clients) {
    try { res.write(frame); } catch { run.clients.delete(res); }
  }
}

// ────────────────────────────────────────────────────────────────
// Application Express
// ────────────────────────────────────────────────────────────────
const app = express();

app.use(
  cors({
    origin(origin, callback) {
      // Requêtes sans header Origin (curl, healthcheck) ou origines autorisées
      if (!origin || ALLOWED_ORIGINS.has(origin)) return callback(null, true);
      return callback(new Error(`Origine CORS non autorisée : ${origin}`));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
  }),
);
app.use(express.json({ limit: '64kb' }));

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'atibon-api-bridge',
    python: PYTHON_BIN,
    script: ATIBON_SCRIPT,
    scriptExists: fs.existsSync(ATIBON_SCRIPT),
    activeRuns: [...runs.values()].filter((r) => r.status === 'running').length,
  });
});

// ────────────────────────────────────────────────────────────────
// POST /api/probe/run — lancement d'une sonde LIVE
// ────────────────────────────────────────────────────────────────
app.post('/api/probe/run', (req, res) => {
  const { targetHost, targetPort, iHaveAuthorization, modules } = req.body ?? {};

  // ① Garde-fou légal STRICT : iHaveAuthorization doit être exactement `true`
  if (iHaveAuthorization !== true) {
    return res.status(403).json({
      accepted: false,
      error: 'forbidden',
      message: 'Exécution bloquée : autorisation légale non confirmée (--i-have-authorization).',
    });
  }

  // ② Validation des paramètres
  if (typeof targetHost !== 'string' || !HOST_RE.test(targetHost)) {
    return res.status(400).json({ accepted: false, error: 'bad_request', message: 'targetHost invalide.' });
  }
  const port = Number(targetPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return res.status(400).json({ accepted: false, error: 'bad_request', message: 'targetPort invalide (1-65535).' });
  }
  if (!Array.isArray(modules)) {
    return res.status(400).json({ accepted: false, error: 'bad_request', message: 'modules doit être un tableau de chaînes.' });
  }

  // ③ Construction sécurisée des arguments CLI (whitelist, jamais passés par un shell)
  const args = [ATIBON_SCRIPT, '--target-host', targetHost, '--target-port', String(port), '--i-have-authorization'];
  const rejected = [];
  for (const raw of modules) {
    if (typeof raw !== 'string' || !MODULE_TOKEN_RE.test(raw)) {
      rejected.push(String(raw));
      continue;
    }
    const bare = raw.replace(/^-{1,2}/, ''); // 'fingerprint', 'exploit'...
    const mapped = MODULE_ALIASES[bare] ?? bare;
    const flag = mapped.startsWith('--') ? mapped : `--${mapped}`;
    if (ALLOWED_FLAGS.has(flag)) args.push(flag);
    else rejected.push(raw);
  }
  if (rejected.length > 0) {
    return res.status(400).json({
      accepted: false,
      error: 'unknown_modules',
      message: `Modules refusés (hors whitelist atibon.py) : ${rejected.join(', ')}`,
    });
  }

  // ④ Vérification présence du script
  if (!fs.existsSync(ATIBON_SCRIPT)) {
    return res.status(500).json({
      accepted: false,
      error: 'script_missing',
      message: `Script introuvable côté serveur : ${ATIBON_SCRIPT}`,
    });
  }

  // ⑤ Exécution child_process.spawn (array d'args → aucune injection possible)
  const runId = `LIVE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const run = { args: args.slice(1), logs: [], clients: new Set(), status: 'running', exitCode: null };
  runs.set(runId, run);

  let child;
  try {
    child = spawn(PYTHON_BIN, args, {
      cwd: path.dirname(ATIBON_SCRIPT),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    runs.delete(runId);
    return res.status(500).json({ accepted: false, error: 'spawn_failed', message: String(err?.message ?? err) });
  }

  const nowIso = () => new Date().toISOString();
  pushEvent(runId, { ts: nowIso(), type: 'status', level: 'info', message: `Sonde acceptée :: run=${runId} :: python ${args.join(' ')}` });

  const pipeLine = (stream, level) => {
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.trim()) pushEvent(runId, { ts: nowIso(), type: level === 'stderr' ? 'stderr' : 'stdout', level, message: line });
      }
    });
  };
  pipeLine(child.stdout, 'stdout');
  pipeLine(child.stderr, 'stderr');

  child.on('error', (err) => {
    run.status = 'failed';
    pushEvent(runId, { ts: nowIso(), type: 'error', level: 'error', message: `Échec du lancement du processus Python : ${err.message}` });
  });

  child.on('close', (code) => {
    run.status = code === 0 ? 'completed' : 'exited';
    run.exitCode = code;
    pushEvent(runId, { ts: nowIso(), type: 'exit', level: code === 0 ? 'info' : 'warn', message: `Processus atibon.py terminé (code ${code}).`, exitCode: code });
  });

  // ⑥ Réponse immédiate : le frontend se branche ensuite sur le flux SSE
  res.status(202).json({
    accepted: true,
    run_id: runId,
    message: `Sonde LIVE acceptée par l'API Bridge ATIBON (pid ${child.pid ?? '?'}).`,
    stream: `/api/probe/${runId}/stream`,
    args: run.args,
  });
});

// ────────────────────────────────────────────────────────────────
// GET /api/probe/:runId/stream — Server-Sent Events (temps réel)
// ────────────────────────────────────────────────────────────────
app.get('/api/probe/:runId/stream', (req, res) => {
  const run = runs.get(req.params.runId);
  if (!run) return res.status(404).json({ error: 'unknown_run', message: 'Run inconnu.' });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Rejeu de l'historique déjà capturé
  for (const evt of run.logs) res.write(`data: ${JSON.stringify(evt)}\n\n`);
  if (run.status !== 'running') res.write(`data: ${JSON.stringify({ type: 'end', message: 'Fin du flux.' })}\n\n`);

  run.clients.add(res);
  const keepAlive = setInterval(() => res.write(': ping\n\n'), 15000);
  req.on('close', () => { clearInterval(keepAlive); run.clients.delete(res); });
});

// Variante JSON (polling simple si l'UI ne gère pas EventSource)
app.get('/api/probe/:runId/logs', (req, res) => {
  const run = runs.get(req.params.runId);
  if (!run) return res.status(404).json({ error: 'unknown_run' });
  res.json({ run_id: req.params.runId, status: run.status, exitCode: run.exitCode, logs: run.logs });
});

// ────────────────────────────────────────────────────────────────
// Démarrage
// ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[ATIBON BRIDGE] ▶ http://127.0.0.1:${PORT}`);
  console.log(`[ATIBON BRIDGE]   POST /api/probe/run          (lance atibon.py)`);
  console.log(`[ATIBON BRIDGE]   GET  /api/probe/:runId/stream (SSE télémétrie)`);
  console.log(`[ATIBON BRIDGE]   python="${PYTHON_BIN}" script="${ATIBON_SCRIPT}"`);
  console.log(`[ATIBON BRIDGE]   CORS autorisé : ${[...ALLOWED_ORIGINS].join(', ')}`);
});
