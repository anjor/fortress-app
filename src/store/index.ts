// Fortress - Zustand Store
// State management for the FI planning dashboard

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  MonthlySnapshot,
  FortressConfig,
  HeadlineMetrics,
  CashflowTableRow,
  ScenarioCostTableRow,
  MinimumIncomeRow,
  AssumptionSet,
} from '../types';
import { DEFAULT_CONFIG, getActiveAssumptions } from '../types';
import {
  calculateHeadlineMetrics,
  calculateCashflowTable,
  calculateScenarioCostTable,
  calculateMinimumIncomeTable,
} from '../lib/calculations';
import { isSameMonth } from '../lib/date-utils';

// Helper to revive Date objects from stored JSON
function reviveDates(state: any) {
  if (state.latestSnapshot?.date) {
    state.latestSnapshot.date = new Date(state.latestSnapshot.date);
  }
  if (state.snapshotHistory) {
    state.snapshotHistory = state.snapshotHistory.map((snapshot: any) => ({
      ...snapshot,
      date: new Date(snapshot.date),
    }));
  }
  return state;
}


interface FortressStore {
  // State
  latestSnapshot: MonthlySnapshot | null;
  snapshotHistory: MonthlySnapshot[];
  config: FortressConfig;
  hasCompletedOnboarding: boolean;

  // Computed (cached after calculation)
  headlineMetrics: HeadlineMetrics | null;
  cashflowTable: CashflowTableRow[];
  scenarioCostTable: ScenarioCostTableRow[];
  minimumIncomeTable: MinimumIncomeRow[];
  assumptions: AssumptionSet[];

  // Actions
  updateSnapshot: (snapshot: MonthlySnapshot) => { action: 'added' | 'updated'; date: Date };
  updateConfig: (config: Partial<FortressConfig>) => void;
  recalculate: () => void;
  markOnboardingComplete: () => void;
  resetStore: () => void;
}

export const useFortressStore = create<FortressStore>()(
  persist(
    (set, get) => ({
      // Initial state
      latestSnapshot: null,
      snapshotHistory: [],
      config: DEFAULT_CONFIG,
      hasCompletedOnboarding: false,
      headlineMetrics: null,
      cashflowTable: [],
      scenarioCostTable: [],
      minimumIncomeTable: [],
      assumptions: getActiveAssumptions(DEFAULT_CONFIG),

      // Update snapshot and recalculate
      updateSnapshot: (snapshot) => {
        const { snapshotHistory, config } = get();

        // Check for duplicate month
        const existingIndex = snapshotHistory.findIndex(s =>
          isSameMonth(s.date, snapshot.date)
        );

        let action: 'added' | 'updated';
        let newHistory: MonthlySnapshot[];

        if (existingIndex >= 0) {
          // Replace existing snapshot
          action = 'updated';
          newHistory = [...snapshotHistory];
          newHistory[existingIndex] = snapshot;
        } else {
          // Add new snapshot
          action = 'added';
          newHistory = [snapshot, ...snapshotHistory];
        }

        // Sort and limit to 36 months
        newHistory = newHistory
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 36);

        // Get previous snapshot for comparison
        const previousSnapshot = newHistory[1] || null;
        const assumptions = getActiveAssumptions(config);

        // Calculate all metrics
        const headlineMetrics = calculateHeadlineMetrics(snapshot, previousSnapshot, config);
        const cashflowTable = calculateCashflowTable(snapshot, config, undefined, assumptions, snapshot.date.getFullYear());
        const scenarioCostTable = calculateScenarioCostTable(config, undefined, snapshot.date.getFullYear());
        const minimumIncomeTable = calculateMinimumIncomeTable(snapshot, config);

        set({
          latestSnapshot: snapshot,
          snapshotHistory: newHistory,
          headlineMetrics,
          cashflowTable,
          scenarioCostTable,
          minimumIncomeTable,
          assumptions,
        });

        return { action, date: snapshot.date };
      },

      // Update configuration
      updateConfig: (partialConfig) => {
        const { config, latestSnapshot } = get();
        const newConfig = { ...config, ...partialConfig };
        const assumptions = getActiveAssumptions(newConfig);

        set({
          config: newConfig,
          ...(latestSnapshot ? {} : { assumptions }),
        });

        // Recalculate if we have data
        if (latestSnapshot) {
          get().recalculate();
        }
      },

      // Recalculate all metrics
      recalculate: () => {
        const { latestSnapshot, snapshotHistory, config } = get();

        if (!latestSnapshot) return;

        const previousSnapshot = snapshotHistory[1] || null;
        const assumptions = getActiveAssumptions(config);

        const headlineMetrics = calculateHeadlineMetrics(latestSnapshot, previousSnapshot, config);
        const cashflowTable = calculateCashflowTable(latestSnapshot, config, undefined, assumptions, latestSnapshot.date.getFullYear());
        const scenarioCostTable = calculateScenarioCostTable(config, undefined, latestSnapshot.date.getFullYear());
        const minimumIncomeTable = calculateMinimumIncomeTable(latestSnapshot, config);

        set({
          headlineMetrics,
          cashflowTable,
          scenarioCostTable,
          minimumIncomeTable,
          assumptions,
        });
      },

      // Mark onboarding as complete
      markOnboardingComplete: () => {
        set({ hasCompletedOnboarding: true });
      },

      // Reset to initial state
      resetStore: () => {
        set({
          latestSnapshot: null,
          snapshotHistory: [],
          config: DEFAULT_CONFIG,
          hasCompletedOnboarding: false,
          headlineMetrics: null,
          cashflowTable: [],
          scenarioCostTable: [],
          minimumIncomeTable: [],
          assumptions: getActiveAssumptions(DEFAULT_CONFIG),
        });
      },
    }),
    {
      name: 'fortress-store',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Only persist raw data, recalculate on load
      partialize: (state) => ({
        latestSnapshot: state.latestSnapshot,
        snapshotHistory: state.snapshotHistory,
        config: state.config,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
      // Revive Date objects on load
      merge: (persistedState, currentState) => {
        const revived = reviveDates(persistedState);
        return { ...currentState, ...revived };
      },
      // Recalculate metrics on rehydration
      onRehydrateStorage: () => (state) => {
        if (state?.latestSnapshot) {
          setTimeout(() => state.recalculate(), 0);
        }
      },
    }
  )
);

// ============================================================================
// Demo Data (for initial development)
// ============================================================================

export function loadDemoData() {
  const demoSnapshot: MonthlySnapshot = {
    id: 'demo-dec-2025',
    date: new Date('2025-12-02'),
    currentAccounts: 19248,
    savingsAccounts: 62518,
    isas: 614271,
    pensions: 885576,
    taxableAccounts: 513808,
    houseEquity: 474514,
    businessAssets: 166140,
    investmentAssets: 999599,
    total: 3735674,
    businessRevenueYTD: 526259,
    partner2IncomeYTD: 50400,
    personalExpensesYTD: 126515,
    businessExpensesYTD: 42829,
    totalExpensesYTD: 169344,
  };

  useFortressStore.getState().updateSnapshot(demoSnapshot);
}

export default useFortressStore;
