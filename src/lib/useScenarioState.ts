// Shared slider state for the Min Income and Stop Age tabs.
//
// State is held in the parent App so flipping between tabs preserves the
// user's tweaks. Setters track which preset (if any) is active; once a
// slider is moved manually, activePreset clears to null ("Custom").

import { useCallback, useMemo, useState } from 'react';
import { equityNetForPricePerShare } from './simulation';
import { PRESETS, DEFAULT_PRESET_ID } from './presets';
import type { FortressConfig, IncomeSearchMode, PresetState } from '../types';

export interface ScenarioState extends PresetState {
  // Income search mode (which tax model to use)
  incomeType: IncomeSearchMode;
  // Expected revenue (for margin analysis) — not part of presets
  expectedRev: number;
}

const initialFor = (presetId: string): ScenarioState => {
  const p = PRESETS.find((x) => x.id === presetId) ?? PRESETS[1];
  return {
    ...p.state,
    incomeType: 'business',
    expectedRev: 300_000,
  };
};

export function useScenarioState(_config: FortressConfig) {
  const [state, setState] = useState<ScenarioState>(initialFor(DEFAULT_PRESET_ID));
  const [activePreset, setActivePreset] = useState<string | null>(DEFAULT_PRESET_ID);

  const updateField = useCallback(<K extends keyof ScenarioState>(key: K, value: ScenarioState[K]) => {
    setActivePreset(null);
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  // Some setters should NOT clear the preset (e.g. growth changes by preset)
  const updateFieldSilent = useCallback(<K extends keyof ScenarioState>(key: K, value: ScenarioState[K]) => {
    setState((s) => ({ ...s, [key]: value }));
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    const p = PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    setActivePreset(presetId);
    setState((s) => ({ ...s, ...p.state }));
  }, []);

  return {
    state,
    updateField,
    updateFieldSilent,
    activePreset,
    applyPreset,
  };
}

/** Derive convenience values from scenario state + config. */
export function useDerivedScenario(state: ScenarioState, config: FortressConfig) {
  return useMemo(() => {
    const equityNet = equityNetForPricePerShare(state.equityPricePerShare, config.equity.priceTable);
    const equityAge = config.primaryPartnerAge + state.equityYearsOut;
    const alternateSalaryStartAge = config.primaryPartnerAge + state.alternateSalaryStartYears;
    const alternateSalaryNet = state.alternateSalaryK * config.alternateExit.salaryNetRatio;
    const partner2StartAge = config.primaryPartnerAge + state.partner2StartYears;
    const partner2EndAge = partner2StartAge + state.partner2DurationYears;

    return {
      equityNet,
      equityAge,
      alternateSalaryStartAge,
      alternateSalaryNet,
      partner2StartAge,
      partner2EndAge,
    };
  }, [state, config]);
}
