# ATIBON + NEXUS

ATIBON is integrated as the defensive security boundary around NEXUS target registration and operator actions.

## What is connected

- explicit operator authorization before target registration;
- rejection of public endpoints by default;
- local/private endpoint validation for the browser control plane;
- audit-event generation for operator actions;
- event bus integration for security decisions and telemetry state;
- API action routing through `VITE_NEXUS_API_URL`;
- WebSocket telemetry routing through `VITE_NEXUS_TELEMETRY_WS_URL`.

## Runtime configuration

```env
VITE_NEXUS_API_URL=http://127.0.0.1:8080/api
VITE_NEXUS_TELEMETRY_WS_URL=ws://127.0.0.1:8080/telemetry
```

These values are examples of configuration shape, not live endpoints and are never used as fallback runtime data.

## ATIBON safety boundary

The supplied ATIBON Red-Team Simulator contains capabilities for exploitation, post-exploitation, C2, credential/authentication bypass, phishing/social engineering, antivirus evasion and anti-forensics. Those offensive capabilities are **not wired into the NEXUS UI or execution path**.

NEXUS instead consumes the defensive concepts: authorization gating, target validation, auditability and real telemetry transport. This preserves the security architecture without turning the dashboard into an automated offensive control panel.

## Data policy

No mock targets, generated packet streams, fabricated metrics or pre-populated terminal logs are created by the new services. Empty state is the default until a real API/WebSocket source provides data.
