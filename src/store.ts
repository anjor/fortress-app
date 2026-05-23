// Zustand store: holds the editable FortressConfig and persists it to
// localStorage. Sim runs are derived on demand by tab components.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FortressConfig } from './types';
import { DEMO_CONFIG } from './data/demoConfig';

interface FortressStore {
  config: FortressConfig;
  setConfig: (config: FortressConfig) => void;
  updateConfig: (patch: Partial<FortressConfig>) => void;
  reset: () => void;
}

export const useFortressStore = create<FortressStore>()(
  persist(
    (set) => ({
      config: DEMO_CONFIG,
      setConfig: (config) => set({ config }),
      updateConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
      reset: () => set({ config: DEMO_CONFIG }),
    }),
    {
      name: 'fortress-config-v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
