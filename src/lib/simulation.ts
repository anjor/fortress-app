// Year-by-year financial simulation.
//
// All values are in real (today's £) terms. Growth applied each year is the
// real return; inflation is netted out by the caller.

import type {
  FortressConfig,
  SimOptions,
  TrajectoryPoint,
  Lifestyle,
} from '../types';
import { distributeBusiness, payeNet } from './uk-tax';

/** Annual household spend at a given primary-partner age. */
export function annualSpend(
  age: number,
  lifestyle: Lifestyle,
  houseAge: number,
  secondaryPerChild: number,
  cfg: FortressConfig,
): number {
  const e = cfg.expenses;
  let s = e.personalAnnual;
  if (age >= e.mortgageEndAge) s -= e.mortgageAnnualPortion;

  // School fees per child (primary → secondary), using child age = today's age + (age - primaryPartnerAge)
  for (const ageNow of cfg.childAges) {
    const kidAge = ageNow + (age - cfg.primaryPartnerAge);
    if (kidAge >= e.primarySchoolAgeStart && kidAge < e.primarySchoolAgeEnd) {
      s += e.primarySchoolPerChild;
    } else if (kidAge >= e.secondarySchoolAgeStart && kidAge < e.secondarySchoolAgeEnd) {
      s += secondaryPerChild;
    }
  }

  const houseOn = lifestyle === 'house' || lifestyle === 'combined';
  if (houseOn && age >= houseAge && age < houseAge + cfg.houseUpgrade.durationYears) {
    s += cfg.houseUpgrade.annualExtraCost;
  }

  const uniOn = lifestyle === 'university' || lifestyle === 'combined';
  if (uniOn && cfg.university.enabled) {
    for (const ageNow of cfg.childAges) {
      // primary-partner age when child turns startChildAge
      const uniStartParentAge = cfg.primaryPartnerAge + (cfg.university.startChildAge - ageNow);
      if (age >= uniStartParentAge && age < uniStartParentAge + cfg.university.durationYears) {
        s += cfg.university.annualPerChild;
      }
    }
  }
  return s;
}

interface SimResult {
  terminalLiquid: number;
  trajectory: TrajectoryPoint[];
  ranOut: boolean;
  ranOutAge?: number;
}

const BANKRUPTCY_FLOOR = -2_500_000;

function runSimulation(opts: SimOptions): SimResult {
  const cfg = opts.config;
  const g = 1 + opts.growth;

  let liquid = opts.initLiquidOverride ?? cfg.initialLiquid;
  let pension = opts.initPensionOverride ?? cfg.initialPensions;
  let houseDone = false;
  const houseOn = opts.lifestyle === 'house' || opts.lifestyle === 'combined';

  const trajectory: TrajectoryPoint[] = [];
  let ranOut = false;
  let ranOutAge: number | undefined;

  for (let age = cfg.primaryPartnerAge; age <= cfg.terminalAge; age++) {
    let familyNet = 0;
    let retained = 0;
    let pensionAdd = 0;

    // Primary partner income while still working
    if (age < opts.stopAge) {
      if (opts.mode === 'business') {
        const d = distributeBusiness(
          opts.revenue,
          cfg.expenses.businessAnnual,
          cfg.partner1,
          cfg.partner2,
          cfg.tax,
        );
        familyNet += d.familyNet;
        retained += d.retained;
        pensionAdd += d.pensionContrib;
      } else {
        familyNet += payeNet(Math.max(0, opts.revenue), cfg.tax);
      }
    }

    // Partner 2 external income (e.g. side employment) — added on top
    if (
      opts.partner2ExternalNet > 0 &&
      age >= opts.partner2ExternalStartAge &&
      age < opts.partner2ExternalEndAge
    ) {
      familyNet += opts.partner2ExternalNet;
    }

    // Windfalls
    if (opts.useEquity && age === opts.equityAge) liquid += opts.equityNet;
    if (opts.useInheritance && age === opts.inheritanceAge) liquid += opts.inheritanceAmount;
    if (opts.useAlternate) {
      const a = cfg.alternateExit;
      if (age >= a.dividendStartAge && age < opts.alternateExitAge) {
        familyNet += opts.alternateDividend;
      }
      if (age >= opts.alternateSalaryStartAge && age < opts.alternateExitAge) {
        familyNet += opts.alternateSalaryGross * a.salaryNetRatio;
      }
      if (age === opts.alternateExitAge) liquid += opts.alternateExitLump;
    }

    // Spend
    let spend = annualSpend(age, opts.lifestyle, opts.houseAge, opts.secondarySchoolPerChild, cfg);
    if (houseOn && age === opts.houseAge && !houseDone) {
      spend += cfg.houseUpgrade.downPayment;
      houseDone = true;
    }

    liquid += familyNet + retained - spend;
    pension += pensionAdd;

    // Real growth
    liquid *= g;
    pension *= g;

    // Pension unlock
    if (age === cfg.pensionUnlockAge) {
      liquid += pension;
      pension = 0;
    }

    trajectory.push({
      age,
      liquid: Math.round(liquid),
      pension: Math.round(pension),
      total: Math.round(liquid + pension),
      working: age < opts.stopAge,
    });

    if (liquid < BANKRUPTCY_FLOOR) {
      ranOut = true;
      ranOutAge = age;
      break;
    }
  }

  return { terminalLiquid: liquid, trajectory, ranOut, ranOutAge };
}

/** Terminal liquid wealth after running to terminalAge. -Infinity if ran out. */
export function simulate(opts: SimOptions): number {
  const r = runSimulation(opts);
  return r.ranOut ? -Infinity : r.terminalLiquid;
}

/** Full year-by-year trajectory (for charting). */
export function simulateTrajectory(opts: SimOptions): TrajectoryPoint[] {
  return runSimulation(opts).trajectory;
}

/** Binary search the minimum gross revenue/salary required to stay solvent. */
export function findMinIncome(opts: SimOptions): number | null {
  if (simulate({ ...opts, revenue: 0 }) >= 0) return 0;
  let lo = 0, hi = 900_000;
  if (simulate({ ...opts, revenue: hi }) < 0) {
    // Try a higher ceiling.
    hi = 5_000_000;
    if (simulate({ ...opts, revenue: hi }) < 0) return null;
  }
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    if (simulate({ ...opts, revenue: mid }) >= 0) hi = mid;
    else lo = mid;
  }
  return Math.round(hi / 1000) * 1000;
}

/** Earliest primary-partner stop age that keeps the trajectory solvent. */
export function findStopAge(opts: SimOptions): number | null {
  const cfg = opts.config;
  for (let stopAge = cfg.primaryPartnerAge; stopAge <= 65; stopAge++) {
    if (simulate({ ...opts, stopAge }) >= 0) return stopAge;
  }
  return null;
}

/** Total wealth (liquid + pensions, ex house) required today to retire now. */
export function findFINumber(opts: SimOptions): number | null {
  const cfg = opts.config;
  const baseLiquid = cfg.initialLiquid;
  const basePension = cfg.initialPensions;
  const baseTotal = baseLiquid + basePension;
  const liquidFrac = baseTotal === 0 ? 0.7 : baseLiquid / baseTotal;
  const pensionFrac = 1 - liquidFrac;

  const simWith = (total: number) =>
    simulate({
      ...opts,
      revenue: 0,
      stopAge: cfg.primaryPartnerAge,
      initLiquidOverride: total * liquidFrac,
      initPensionOverride: total * pensionFrac,
    });

  if (simWith(0) >= 0) return 0;
  let hi = baseTotal === 0 ? 1_000_000 : baseTotal;
  while (simWith(hi) < 0) {
    hi *= 2;
    if (hi > 200_000_000) return null;
  }
  let lo = 0;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    if (simWith(mid) >= 0) hi = mid;
    else lo = mid;
  }
  return Math.round(hi / 1000) * 1000;
}

/** Interpolate the equity exit net from a price-per-share table. */
export function equityNetForPricePerShare(
  pps: number,
  table: { pricePerShare: number; netAtExit: number }[],
): number {
  if (table.length === 0 || pps <= 0) return 0;
  const sorted = [...table].sort((a, b) => a.pricePerShare - b.pricePerShare);
  if (pps <= sorted[0].pricePerShare) {
    return sorted[0].netAtExit * (pps / sorted[0].pricePerShare);
  }
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1];
    if (pps >= a.pricePerShare && pps <= b.pricePerShare) {
      const frac = (pps - a.pricePerShare) / (b.pricePerShare - a.pricePerShare);
      return a.netAtExit + frac * (b.netAtExit - a.netAtExit);
    }
  }
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const slope = (last.netAtExit - prev.netAtExit) / (last.pricePerShare - prev.pricePerShare);
  return last.netAtExit + slope * (pps - last.pricePerShare);
}
