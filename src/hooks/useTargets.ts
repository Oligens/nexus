import { useCallback, useEffect, useState } from 'react';
import type { TargetNode } from '../types/nexus';
import { nexusEventBus } from '../services/nexusEventBus';
import { targetService } from '../services/targetService';

export function useTargets() {
  const [targets, setTargets] = useState<TargetNode[]>(() => targetService.list());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    return nexusEventBus.on('target_registered', () => setTargets(targetService.list()));
  }, []);

  const register = useCallback((target: Omit<TargetNode, 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const saved = targetService.save({ ...target, createdAt: now, updatedAt: now });
    setTargets(targetService.list());
    setSelectedId(saved.id);
    nexusEventBus.emit('target_registered', { targetId: saved.id });
    return saved;
  }, []);

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    nexusEventBus.emit('target_selected', { targetId: id });
  }, []);

  const updateStatus = useCallback((id: string, status: TargetNode['status']) => {
    const updated = targetService.update(id, { status });
    setTargets(targetService.list());
    if (updated && status === 'Standby') nexusEventBus.emit('target_isolated', { targetId: id });
    return updated;
  }, []);

  return { targets, selectedId, selected: targets.find((target) => target.id === selectedId) ?? null, register, select, updateStatus };
}
