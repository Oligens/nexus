const API_BASE = (import.meta.env.VITE_NEXUS_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function nexusApiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  if (!API_BASE) throw new Error('NEXUS API non configurée: VITE_NEXUS_API_URL est absent.');

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? 8000);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    });
    if (!response.ok) throw new Error(`NEXUS API ${response.status}`);
    return await response.json() as T;
  } finally {
    window.clearTimeout(timeout);
  }
}
