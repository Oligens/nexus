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
