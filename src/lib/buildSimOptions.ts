// Build a SimOptions from config + scenario state + per-cell overrides.

import type { FortressConfig, SimOptions, Lifestyle, WindfallScenario } from '../types';
import { equityNetForPricePerShare } from './simulation';
import type { ScenarioState } from './useScenarioState';

export interface CellSettings {
  lifestyle: Lifestyle;
  windfall: WindfallScenario;
  stopAgeOverride?: number;
  revenue?: number;
}

export function buildSimOptions(
  config: FortressConfig,
  state: ScenarioState,
  cell: CellSettings,
): SimOptions {
  const equityNet = equityNetForPricePerShare(state.equityPricePerShare, config.equity.priceTable);
  const equityAge = config.primaryPartnerAge + state.equityYearsOut;
  const alternateSalaryStartAge = config.primaryPartnerAge + state.alternateSalaryStartYears;
  const partner2StartAge = config.primaryPartnerAge + state.partner2StartYears;
  const partner2EndAge = partner2StartAge + state.partner2DurationYears;

  const useEquity = cell.windfall === 'equity' || cell.windfall === 'all';
  const useInheritance = cell.windfall === 'inheritance' || cell.windfall === 'all';
  const useAlternate = cell.windfall === 'alternate' || cell.windfall === 'all';

  return {
    config,
    growth: state.growth,
    mode: state.incomeType,
    lifestyle: cell.lifestyle,
    revenue: cell.revenue ?? 0,
    stopAge: cell.stopAgeOverride ?? state.stopAge,
    houseAge: state.houseAge,

    equityNet,
    equityAge,
    inheritanceAmount: state.inheritanceK * 1000,
    inheritanceAge: state.inheritanceAge,
    alternateExitLump: state.alternateExitK * 1000,
    alternateExitAge: state.alternateExitAge,
    alternateDividend: state.alternateDividendK * 1000,
    alternateSalaryGross: state.alternateSalaryK * 1000,
    alternateSalaryStartAge,

    useEquity,
    useInheritance,
    useAlternate,

    secondarySchoolPerChild: state.secondarySchoolPerKid * 1000,

    partner2ExternalNet: state.partner2IncomeK * 1000,
    partner2ExternalStartAge: partner2StartAge,
    partner2ExternalEndAge: partner2EndAge,
  };
}
