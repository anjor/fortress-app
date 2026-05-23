import { describe, it, expect } from 'vitest';
import {
  simulate,
  simulateTrajectory,
  findMinIncome,
  findStopAge,
  findFINumber,
  equityNetForPricePerShare,
} from './simulation';
import { buildSimOptions } from './buildSimOptions';
import { DEMO_CONFIG } from '../data/demoConfig';
import { PRESETS, DEFAULT_PRESET_ID } from './presets';
import type { ScenarioState } from './useScenarioState';

const centralPreset = PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!;
const state: ScenarioState = {
  ...centralPreset.state,
  incomeType: 'business',
  expectedRev: 300_000,
};

describe('simulation engine', () => {
  it('runs a full trajectory to terminal age', () => {
    const opts = buildSimOptions(DEMO_CONFIG, state, {
      lifestyle: 'base',
      windfall: 'none',
      revenue: 400_000,
    });
    const traj = simulateTrajectory(opts);
    expect(traj[0].age).toBe(DEMO_CONFIG.primaryPartnerAge);
    expect(traj[traj.length - 1].age).toBeLessThanOrEqual(DEMO_CONFIG.terminalAge);
    // Pension should unlock — last point should have pension == 0
    expect(traj[traj.length - 1].pension).toBe(0);
  });

  it('returns -Infinity when revenue is far too low', () => {
    const opts = buildSimOptions(DEMO_CONFIG, state, {
      lifestyle: 'combined',
      windfall: 'none',
      revenue: 0,
    });
    expect(simulate(opts)).toBe(-Infinity);
  });

  it('returns a positive terminal balance with ample revenue', () => {
    const opts = buildSimOptions(DEMO_CONFIG, state, {
      lifestyle: 'base',
      windfall: 'none',
      revenue: 800_000,
    });
    expect(simulate(opts)).toBeGreaterThan(0);
  });

  it('findMinIncome is monotonic across lifestyle complexity', () => {
    const base = findMinIncome(buildSimOptions(DEMO_CONFIG, state, { lifestyle: 'base', windfall: 'none' }));
    const combined = findMinIncome(buildSimOptions(DEMO_CONFIG, state, { lifestyle: 'combined', windfall: 'none' }));
    expect(base ?? 0).toBeLessThanOrEqual(combined ?? Infinity);
  });

  it('findMinIncome decreases with more windfalls', () => {
    const none = findMinIncome(buildSimOptions(DEMO_CONFIG, state, { lifestyle: 'combined', windfall: 'none' }));
    const all = findMinIncome(buildSimOptions(DEMO_CONFIG, state, { lifestyle: 'combined', windfall: 'all' }));
    expect(all ?? 0).toBeLessThanOrEqual(none ?? Infinity);
  });

  it('findStopAge respects monotonicity in revenue', () => {
    const low = findStopAge(buildSimOptions(DEMO_CONFIG, state, { lifestyle: 'base', windfall: 'none', revenue: 250_000 }));
    const high = findStopAge(buildSimOptions(DEMO_CONFIG, state, { lifestyle: 'base', windfall: 'none', revenue: 700_000 }));
    // higher revenue → earlier stop age (smaller or equal number)
    expect(high ?? 99).toBeLessThanOrEqual(low ?? 99);
  });

  it('findFINumber returns a finite number for the base lifestyle', () => {
    const fi = findFINumber(buildSimOptions(DEMO_CONFIG, state, { lifestyle: 'base', windfall: 'none' }));
    expect(fi).not.toBeNull();
    expect(fi).toBeGreaterThanOrEqual(0);
  });

  it('equityNetForPricePerShare interpolates within table', () => {
    const table = DEMO_CONFIG.equity.priceTable;
    const lo = table[0];
    const hi = table[1];
    const mid = (lo.pricePerShare + hi.pricePerShare) / 2;
    const interp = equityNetForPricePerShare(mid, table);
    expect(interp).toBeGreaterThan(lo.netAtExit);
    expect(interp).toBeLessThan(hi.netAtExit);
  });

  it('equityNetForPricePerShare returns 0 at zero', () => {
    expect(equityNetForPricePerShare(0, DEMO_CONFIG.equity.priceTable)).toBe(0);
  });
});
