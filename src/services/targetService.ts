import type { TargetNode } from '../types/nexus';

const STORAGE_KEY = 'nexus.targets.v1';

const canUseStorage = () => typeof window !== 'undefined' && !!window.localStorage;

export const targetService = {
  list(): TargetNode[] {
    if (!canUseStorage()) return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as TargetNode[]) : [];
    } catch {
      return [];
    }
  },

  save(target: TargetNode) {
    const next = [...this.list().filter((item) => item.id !== target.id), target];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return target;
  },

  update(id: string, patch: Partial<TargetNode>) {
    const next = this.list().map((target) => target.id === id
      ? { ...target, ...patch, updatedAt: new Date().toISOString() }
      : target);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next.find((target) => target.id === id) ?? null;
  },

  remove(id: string) {
    const next = this.list().filter((target) => target.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  },
};
