// UK tax calculations: PAYE net and owner-managed business extraction.
//
// These are pure functions of (gross, TaxParams). The TaxParams come from
// the config so users can update rates without code changes.

import type { TaxParams, PartnerIncome } from '../types';

export const DEFAULT_TAX: TaxParams = {
  personalAllowance: 12_570,
  paTaperStart: 100_000,
  basicRateTop: 50_270,
  higherRateTop: 125_140,
  basicRate: 0.20,
  higherRate: 0.40,
  additionalRate: 0.45,

  niPrimaryThreshold: 12_570,
  niUpperEarningsLimit: 50_270,
  niMainRate: 0.08,
  niAdditionalRate: 0.02,

  corporationTaxRate: 0.25,
  dividendAllowance: 500,
  dividendBasicRate: 0.0875,
  dividendHigherRate: 0.3375,
};

/** Income tax owed on a gross PAYE salary, including the PA taper above £100k. */
export function incomeTaxOnSalary(salary: number, t: TaxParams): number {
  if (salary <= t.personalAllowance) return 0;

  const band1 = Math.max(0, Math.min(salary, t.basicRateTop) - t.personalAllowance);
  const band2 = Math.max(0, Math.min(salary, t.paTaperStart) - t.basicRateTop);
  const band3 = Math.max(0, Math.min(salary, t.higherRateTop) - t.paTaperStart);
  const band4 = Math.max(0, salary - t.higherRateTop);

  let tax = band1 * t.basicRate + band2 * t.higherRate + band3 * t.higherRate + band4 * t.additionalRate;

  if (salary > t.paTaperStart) {
    const lostPA = Math.min(t.personalAllowance, (salary - t.paTaperStart) / 2);
    tax += lostPA * t.higherRate;
  }
  return tax;
}

/** Employee National Insurance on a salary. */
export function employeeNI(salary: number, t: TaxParams): number {
  if (salary <= t.niPrimaryThreshold) return 0;
  const band1 = Math.min(salary, t.niUpperEarningsLimit) - t.niPrimaryThreshold;
  const band2 = Math.max(0, salary - t.niUpperEarningsLimit);
  return band1 * t.niMainRate + band2 * t.niAdditionalRate;
}

/** Net take-home from a gross PAYE salary. */
export function payeNet(salary: number, t: TaxParams): number {
  if (salary <= 0) return 0;
  return salary - incomeTaxOnSalary(salary, t) - employeeNI(salary, t);
}

/** Binary search the gross PAYE salary required to net a target. */
export function grossForNet(targetNet: number, t: TaxParams): number {
  if (targetNet <= 0) return 0;
  let lo = targetNet, hi = targetNet * 3;
  while (payeNet(hi, t) < targetNet) hi *= 1.5;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (payeNet(mid, t) >= targetNet) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi);
}

// ---------------------------------------------------------------------------
// Business extraction (owner-managed Ltd)
// ---------------------------------------------------------------------------

export interface BusinessDistribution {
  familyNet: number;          // total net cash reaching the household this year
  retained: number;           // company cash retained after extraction
  pensionContrib: number;     // pension paid into by the company
  corporationTax: number;
  dividendTax: number;
}

/**
 * Distribute the year's gross revenue from an owner-managed Ltd between
 * salary, employer pension contribution, dividends, and retained profit.
 *
 * Tax-efficient default: each partner draws a salary up to the NI/PA
 * threshold, then dividends up to the basic rate band. Profit beyond that
 * stays in the company (loan reservoir).
 */
export function distributeBusiness(
  revenue: number,
  businessExpenses: number,
  partner1: PartnerIncome,
  partner2: PartnerIncome,
  t: TaxParams,
): BusinessDistribution {
  const r = Math.max(0, revenue);

  const salaryTotal = partner1.salaryComponent + partner2.salaryComponent;
  const targetPension = partner1.pensionContribAnnual + partner2.pensionContribAnnual;

  const profitBeforePension = r - businessExpenses - salaryTotal;
  const pensionContrib = profitBeforePension >= targetPension
    ? targetPension
    : Math.max(0, profitBeforePension);

  const profitAfterPension = Math.max(0, profitBeforePension - pensionContrib);
  const corporationTax = profitAfterPension * t.corporationTaxRate;
  const profitAfterCT = profitAfterPension - corporationTax;

  const targetDividends = partner1.dividendTarget + partner2.dividendTarget;
  const dividendsPaid = Math.min(targetDividends, profitAfterCT);

  const dividendsAboveAllowance = Math.max(0, dividendsPaid - 2 * t.dividendAllowance);
  const dividendTax = dividendsAboveAllowance * t.dividendBasicRate;

  const familyNet = salaryTotal + dividendsPaid - dividendTax;
  const retained = Math.max(0, profitAfterCT - dividendsPaid);

  return { familyNet, retained, pensionContrib, corporationTax, dividendTax };
}
