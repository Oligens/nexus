# NEXUS

NEXUS est une interface React/Vite de contrôle, d'enregistrement de cibles et de visualisation de télémétrie.

## Architecture

- **React + TypeScript + Vite** : application frontend.
- **Live Target Viewport** : enregistre et sélectionne les cibles fournies par l'utilisateur.
- **Neural Telemetry Stream** : affiche uniquement les événements réellement reçus ou saisis par l'utilisateur.
- **Adaptive Control & Metrics** : expose des paramètres de contrôle locaux et affiche les métriques lorsqu'une source réelle les fournit.
- **GlassPanel + index.css** : système visuel Luxury Sci-Fi Glassmorphism.

## État des données

Le frontend ne contient volontairement aucune cible, adresse IP, métrique, paquet ou log fictif préchargé. Les valeurs de télémétrie restent `null` ou les collections restent vides tant qu'aucune source réelle n'est connectée.

## Développement

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

> Les boutons de contrôle du frontend modifient uniquement l'état local tant qu'aucune API, WebSocket ou autre source de données réelle n'est configurée.

## API Bridge (Node.js/Express) — `bridge/`

Serveur pont entre l'ATIBON Control Hub (React, :3000) et le backend Python `atibon.py`.

```bash
cd bridge && npm install        # express + cors
npm run bridge                  # depuis la racine (ou: node bridge/server.js)
```

Endpoints : `POST /api/probe/run` (garde-fou 403 si `iHaveAuthorization !== true`,
spawn sécurisé de `python atibon.py --target-host … --target-port … --i-have-authorization …`),
`GET /api/probe/:runId/stream` (SSE temps réel → NEURAL TELEMETRY STREAM),
`GET /api/probe/:runId/logs` (JSON), `GET /api/health`.
Variables : `PORT` (3001), `ATIBON_PYTHON`, `ATIBON_SCRIPT`, `CORS_ORIGINS` (voir `bridge/.env.example`).
Frontend : définir `VITE_NEXUS_API_URL=http://127.0.0.1:3001` (défaut intégré sinon).
