// Fortress v3 - Core Calculation Engine
// Runs all FI projections and generates dashboard metrics

import type {
  MonthlySnapshot,
  FortressConfig,
  AssumptionSet,
  ScenarioDefinition,
  ScenarioResult,
  YearlyProjection,
  HeadlineMetrics,
  CashflowTableRow,
  ScenarioCostTableRow,
  MinimumIncomeRow,
} from '../types';
import { DEFAULT_ASSUMPTIONS } from '../types';
import { calculateOptimalExtraction } from './uk-tax';

// ============================================================================
// HEADLINE METRICS
// ============================================================================

export function calculateHeadlineMetrics(
  snapshot: MonthlySnapshot,
  previousSnapshot: MonthlySnapshot | null,
  config: FortressConfig
): HeadlineMetrics {
  const netWorth = snapshot.total;
  const previousNetWorth = previousSnapshot?.total ?? netWorth;
  
  // Asset breakdown
  const liquidAssets = snapshot.isas + snapshot.taxableAccounts + 
                       snapshot.currentAccounts + snapshot.savingsAccounts;
  const businessAssets = snapshot.businessAssets + snapshot.investmentAssets;
  const pensionAssets = snapshot.pensions;
  const propertyEquity = snapshot.houseEquity;
  
  // FI calculations
  const annualExpenses = annualizeYTD(snapshot.totalExpensesYTD, snapshot.date);
  const fiTarget = config.fiTargetMode === 'amount' && config.fiTargetAmount
    ? config.fiTargetAmount
    : annualExpenses * config.fiTargetMultiple;
  const fiProgress = netWorth / fiTarget;
  
  // Time to FI (simplified - assumes current savings rate continues)
  const annualSavings = calculateCurrentSavingsRate(snapshot, config);
  const investableAssets = liquidAssets + businessAssets;
  const timeToFI = calculateYearsToTarget(
    investableAssets, 
    fiTarget - pensionAssets - propertyEquity,  // Need to grow liquid to cover gap
    annualSavings, 
    0.05  // Assume 5% real return for headline
  );
  
  // Runway (if stop earning today)
  const runway = calculateRunway(investableAssets, annualExpenses, 0.05);
  
  return {
    netWorth,
    netWorthChange: netWorth - previousNetWorth,
    netWorthChangePercent: previousNetWorth > 0 
      ? ((netWorth - previousNetWorth) / previousNetWorth) * 100 
      : 0,
    fiTarget,
    fiProgress,
    timeToFI,
    runway,
    liquidAssets,
    pensionAssets,
    businessAssets,
    propertyEquity,
  };
}

// ============================================================================
// CASHFLOW CONCLUSION TABLE
// ============================================================================

export function calculateCashflowTable(
  snapshot: MonthlySnapshot,
  config: FortressConfig,
  scenarios?: ScenarioDefinition[],
  assumptions: AssumptionSet[] = DEFAULT_ASSUMPTIONS,
  currentYear?: number
): CashflowTableRow[] {
  const planYear = currentYear ?? snapshot.date.getFullYear();
  const scenariosToRun = (scenarios && scenarios.length > 0)
    ? scenarios
    : generateScenariosFromConfig(config, planYear);
  return scenariosToRun.map(scenario => {
    const results: { [assumptionId: string]: number } = {};

    assumptions.forEach(assumption => {
      const result = runScenarioToExhaustion(snapshot, config, scenario, assumption);
      results[assumption.id] = result.moneyLastsToAge;
    });

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      results,
    };
  });
}

// ============================================================================
// SCENARIO COST TABLE
// ============================================================================

export function calculateScenarioCostTable(
  config: FortressConfig,
  scenarios?: ScenarioDefinition[],
  currentYear?: number
): ScenarioCostTableRow[] {
  const planYear = currentYear ?? new Date().getFullYear();
  const scenariosToRun = (scenarios && scenarios.length > 0)
    ? scenarios
    : generateScenariosFromConfig(config, planYear);

  const baseline = scenariosToRun[0];
  const childCount = getChildBirthYears(config).length;

  return scenariosToRun.map(scenario => {
    let extraCost = 0;

    // Partner 1 lost income relative to baseline working years
    if (baseline) {
      const baselineYears = Math.max((baseline.partner1WorksUntilAge ?? 0) - (planYear - config.partner1BirthYear), 0);
      const scenarioYears = Math.max((scenario.partner1WorksUntilAge ?? 0) - (planYear - config.partner1BirthYear), 0);
      if (scenarioYears < baselineYears) {
        extraCost += (baselineYears - scenarioYears) * scenario.partner1AnnualRevenue;
      }
    }

    // Career break cost: Lost partner 2 income
    if (scenario.partner2BreakYears > 0) {
      extraCost += scenario.partner2BreakYears * config.partner2GrossAnnual;
    } else if (baseline && scenario.partner2WorksUntilAge < baseline.partner2WorksUntilAge) {
      const baselineYears = Math.max(baseline.partner2WorksUntilAge - (planYear - config.partner2BirthYear), 0);
      const scenarioYears = Math.max(scenario.partner2WorksUntilAge - (planYear - config.partner2BirthYear), 0);
      const yearsLost = Math.max(baselineYears - scenarioYears, 0);
      extraCost += yearsLost * config.partner2GrossAnnual;
    }

    // House upgrade cost
    if (scenario.includeHouseUpgrade) {
      extraCost += config.houseUpgradeBudget;
    }

    // University cost: children × years × annual cost
    if (scenario.includeUniversity) {
      const totalUniversityCost = childCount * config.universityYears * config.universityAnnualCost;
      extraCost += totalUniversityCost;
    }

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      extraCost,
      isBaseline: scenario.id === 'baseline',
    };
  });
}

/**
 * Generate scenario presets using current config values
 * This makes scenarios dynamic instead of hardcoded
 */
function generateScenariosFromConfig(config: FortressConfig, currentYear: number): ScenarioDefinition[] {
  const partner1Revenue = config.partner1IncomeMode === 'business'
    ? config.partner1BusinessRevenue
    : config.partner1EmployedSalary;

  const defaultPartner1Age = config.partner1WorksUntilAge ?? 60;
  const defaultPartner2Age = config.partner2GrossAnnual > 0
    ? config.partner2WorksUntilAge ?? 60
    : 0;

  const children = getChildBirthYears(config);
  const breakStartYear = currentYear + 1;
  const earlyRetireAge = Math.max(defaultPartner1Age - 5, currentYear - config.partner1BirthYear + 1);

  const scenarios: ScenarioDefinition[] = [
    {
      id: 'baseline',
      name: 'Baseline (as entered)',
      shortName: 'Baseline',
      partner1WorksUntilAge: defaultPartner1Age,
      partner2WorksUntilAge: defaultPartner2Age,
      partner1AnnualRevenue: partner1Revenue,
      partner2BreakYears: 0,
      partner2BreakStartYear: 0,
      includeHouseUpgrade: false,
      houseUpgradeYear: 0,
      includeUniversity: children.length > 0,
    },
  ];

  if (config.partner2GrossAnnual > 0) {
    scenarios.push({
      id: 'partner2-break',
      name: `${config.personalization.partner2Name} takes 1 year off`,
      shortName: 'Partner break',
      partner1WorksUntilAge: defaultPartner1Age,
      partner2WorksUntilAge: defaultPartner2Age,
      partner1AnnualRevenue: partner1Revenue,
      partner2BreakYears: 1,
      partner2BreakStartYear: breakStartYear,
      includeHouseUpgrade: false,
      houseUpgradeYear: 0,
      includeUniversity: children.length > 0,
    });
  }

  scenarios.push({
    id: 'earlier-retire',
    name: `${config.personalization.partner1Name} retires 5 years earlier`,
    shortName: 'Early retire',
    partner1WorksUntilAge: earlyRetireAge,
    partner2WorksUntilAge: defaultPartner2Age,
    partner1AnnualRevenue: partner1Revenue,
    partner2BreakYears: 0,
    partner2BreakStartYear: 0,
    includeHouseUpgrade: false,
    houseUpgradeYear: 0,
    includeUniversity: children.length > 0,
  });

  if (config.houseUpgradeBudget > 0 && config.houseUpgradeBudget !== config.currentHouseValue) {
    scenarios.push({
      id: 'house-upgrade',
      name: 'House move / upgrade',
      shortName: 'House move',
      partner1WorksUntilAge: defaultPartner1Age,
      partner2WorksUntilAge: defaultPartner2Age,
      partner1AnnualRevenue: partner1Revenue,
      partner2BreakYears: 0,
      partner2BreakStartYear: 0,
      includeHouseUpgrade: true,
      houseUpgradeYear: currentYear + 2,
      includeUniversity: children.length > 0,
    });
  }

  if (children.length > 0) {
    scenarios.push({
      id: 'education-supported',
      name: 'Pay all university costs',
      shortName: 'University',
      partner1WorksUntilAge: defaultPartner1Age,
      partner2WorksUntilAge: defaultPartner2Age,
      partner1AnnualRevenue: partner1Revenue,
      partner2BreakYears: 0,
      partner2BreakStartYear: 0,
      includeHouseUpgrade: false,
      houseUpgradeYear: 0,
      includeUniversity: true,
    });
  }

  const enabledIds = new Set(config.enabledScenarioIds && config.enabledScenarioIds.length > 0
    ? [...config.enabledScenarioIds, 'baseline']
    : scenarios.map(s => s.id));

  return scenarios.filter(scenario => enabledIds.has(scenario.id));
}

// ============================================================================
// MINIMUM INCOME TABLE
// ============================================================================

export function calculateMinimumIncomeTable(
  snapshot: MonthlySnapshot,
  config: FortressConfig
): MinimumIncomeRow[] {
  const assumptionsNoWindfalls = DEFAULT_ASSUMPTIONS.find(a => a.id === '5-none')!;
  const assumptionsWithWindfalls = DEFAULT_ASSUMPTIONS.find(a => a.id === '5-both')!;
  const retirementAge = config.partner1WorksUntilAge ?? 60;

  return [
    {
      threshold: 'coastfi',
      label: 'CoastFI',
      description: 'Zero real change in net worth',

      // Without windfalls
      partner2Working: findMinimumIncome(snapshot, config, assumptionsNoWindfalls, true, 100),
      partner2Break: findMinimumIncome(snapshot, config, assumptionsNoWindfalls, false, 100),
      payeAlternative: calculatePAYEEquivalent(
        findMinimumIncome(snapshot, config, assumptionsNoWindfalls, true, 100)
      ),

      // With windfalls
      partner2WorkingWithWindfalls: findMinimumIncome(snapshot, config, assumptionsWithWindfalls, true, 100),
      partner2BreakWithWindfalls: findMinimumIncome(snapshot, config, assumptionsWithWindfalls, false, 100),
      payeAlternativeWithWindfalls: calculatePAYEEquivalent(
        findMinimumIncome(snapshot, config, assumptionsWithWindfalls, true, 100)
      ),
    },
    {
      threshold: 'surplus',
      label: 'Surplus',
      description: '+£50k real growth per year',

      // Without windfalls
      partner2Working: findMinimumIncomeForSurplus(snapshot, config, assumptionsNoWindfalls, true, 50000),
      partner2Break: findMinimumIncomeForSurplus(snapshot, config, assumptionsNoWindfalls, false, 50000),
      payeAlternative: calculatePAYEEquivalent(
        findMinimumIncomeForSurplus(snapshot, config, assumptionsNoWindfalls, true, 50000)
      ),

      // With windfalls
      partner2WorkingWithWindfalls: findMinimumIncomeForSurplus(snapshot, config, assumptionsWithWindfalls, true, 50000),
      partner2BreakWithWindfalls: findMinimumIncomeForSurplus(snapshot, config, assumptionsWithWindfalls, false, 50000),
      payeAlternativeWithWindfalls: calculatePAYEEquivalent(
        findMinimumIncomeForSurplus(snapshot, config, assumptionsWithWindfalls, true, 50000)
      ),
    },
    {
      threshold: 'breakeven',
      label: 'Achieve FI',
      description: `Hit FI target by age ${retirementAge}`,

      // Without windfalls
      partner2Working: (() => {
        const result = findMinimumIncomeForFITarget(snapshot, config, assumptionsNoWindfalls, true);
        return result.value;
      })(),
      partner2Break: (() => {
        const result = findMinimumIncomeForFITarget(snapshot, config, assumptionsNoWindfalls, false);
        return result.value;
      })(),
      payeAlternative: (() => {
        const result = findMinimumIncomeForFITarget(snapshot, config, assumptionsNoWindfalls, true);
        return calculatePAYEEquivalent(result.value);
      })(),
      partner2WorkingHitsCap: findMinimumIncomeForFITarget(snapshot, config, assumptionsNoWindfalls, true).hitsCap,
      partner2BreakHitsCap: findMinimumIncomeForFITarget(snapshot, config, assumptionsNoWindfalls, false).hitsCap,
      payeAlternativeHitsCap: findMinimumIncomeForFITarget(snapshot, config, assumptionsNoWindfalls, true).hitsCap,

      // With windfalls
      partner2WorkingWithWindfalls: (() => {
        const result = findMinimumIncomeForFITarget(snapshot, config, assumptionsWithWindfalls, true);
        return result.value;
      })(),
      partner2BreakWithWindfalls: (() => {
        const result = findMinimumIncomeForFITarget(snapshot, config, assumptionsWithWindfalls, false);
        return result.value;
      })(),
      payeAlternativeWithWindfalls: (() => {
        const result = findMinimumIncomeForFITarget(snapshot, config, assumptionsWithWindfalls, true);
        return calculatePAYEEquivalent(result.value);
      })(),
      partner2WorkingWithWindfallsHitsCap: findMinimumIncomeForFITarget(snapshot, config, assumptionsWithWindfalls, true).hitsCap,
      partner2BreakWithWindfallsHitsCap: findMinimumIncomeForFITarget(snapshot, config, assumptionsWithWindfalls, false).hitsCap,
      payeAlternativeWithWindfallsHitsCap: findMinimumIncomeForFITarget(snapshot, config, assumptionsWithWindfalls, true).hitsCap,
    },
  ];
}

// ============================================================================
// SCENARIO RUNNER
// ============================================================================

export function runScenarioToExhaustion(
  snapshot: MonthlySnapshot,
  config: FortressConfig,
  scenario: ScenarioDefinition,
  assumptions: AssumptionSet
): ScenarioResult {
  const currentYear = snapshot.date.getFullYear();
  const partner1Age = currentYear - config.partner1BirthYear;
  const childrenBirthYears = getChildBirthYears(config);
  
  // Starting assets (liquid only - pensions accessed later)
  let liquidAssets = snapshot.isas + snapshot.taxableAccounts + 
                     snapshot.businessAssets + snapshot.investmentAssets +
                     snapshot.currentAccounts + snapshot.savingsAccounts;
  let pensionAssets = snapshot.pensions;
  let houseEquity = snapshot.houseEquity;
  
  const projections: YearlyProjection[] = [];
  let moneyLastsToAge = 100;
  let fiAchievedAge = 0;

  // Calculate FI target once at the start (not every year)
  const baseExpenses = calculateAnnualExpenses(snapshot, config);
  const fiTarget = config.fiTargetMode === 'amount' && config.fiTargetAmount != null
    ? config.fiTargetAmount
    : baseExpenses * config.fiTargetMultiple;

  for (let age = partner1Age; age <= 100; age++) {
    const year = config.partner1BirthYear + age;
    const partner2Age = age - (config.partner1BirthYear - config.partner2BirthYear);
    const childrenAges = childrenBirthYears.map(birthYear => year - birthYear);

    // Income (apply config overrides if set, otherwise use scenario defaults)
    const effectivePartner1WorksUntilAge = config.partner1WorksUntilAge ?? scenario.partner1WorksUntilAge;
    const effectivePartner2WorksUntilAge = config.partner2WorksUntilAge ?? scenario.partner2WorksUntilAge;

    const partner1Working = age < effectivePartner1WorksUntilAge;
    const partner2OnBreak = scenario.partner2BreakYears > 0 &&
                       year >= scenario.partner2BreakStartYear &&
                       year < scenario.partner2BreakStartYear + scenario.partner2BreakYears;
    const partner2Working = partner2Age < effectivePartner2WorksUntilAge && !partner2OnBreak;

    let grossIncome = 0;
    if (partner1Working) {
      grossIncome += scenario.partner1AnnualRevenue;
    }
    if (partner2Working) {
      grossIncome += config.partner2GrossAnnual;
    }
    
    // Tax calculation
    const taxes = calculateAnnualTax(grossIncome, partner1Working, partner2Working, config);
    const netIncome = grossIncome - taxes;
    
    // Expenses
    let expenses = calculateAnnualExpenses(snapshot, config);
    
    // School fees (only if enabled and has children)
    const schoolKids = childrenAges.filter(childAge => childAge >= 4 && childAge <= 18).length;
    const hasSchoolFees = config.schoolFeesEnabled && schoolKids > 0;
    if (hasSchoolFees) {
      const inflatedFee = config.annualSchoolFeePerChild *
                          Math.pow(1 + assumptions.schoolFeeInflation, age - partner1Age);
      expenses += schoolKids * inflatedFee;
    }
    
    // University (only if enabled in config AND scenario)
    if (config.universityEnabled && scenario.includeUniversity) {
      const uniKids = childrenAges.filter(childAge =>
        childAge >= 18 && childAge < 18 + config.universityYears
      ).length;
      expenses += uniKids * config.universityAnnualCost;
    }

    // House upgrade (only if enabled in config AND scenario)
    if (config.houseUpgradeEnabled && scenario.includeHouseUpgrade && year === scenario.houseUpgradeYear) {
      const upgradeCost = config.houseUpgradeBudget - config.currentHouseValue;
      const stampDuty = calculateStampDuty(config.houseUpgradeBudget);
      expenses += upgradeCost + stampDuty;
      houseEquity = config.houseUpgradeBudget * 0.7;  // Assume 70% equity initially
    }
    
    // Inheritance
    let inheritanceThisYear = false;
    if (assumptions.includeInheritance && age === config.inheritancePartner1Age) {
      liquidAssets += config.inheritanceAmount;
      inheritanceThisYear = true;
    }

    // Investment exit
    if (assumptions.includeInvestmentExit && age === config.investmentExitPartner1Age) {
      const investment = calculateInvestmentExitNet(config);
      // Add the additional value (net proceeds minus current cost basis)
      liquidAssets += investment.additionalValue;
    }

    // Net cashflow
    const netCashflow = netIncome - expenses;
    
    // Apply growth and cashflow
    // Pension grows tax-free, can access from 57
    pensionAssets *= (1 + assumptions.realReturnRate);
    
    // Liquid assets grow and receive/pay cashflow
    liquidAssets *= (1 + assumptions.realReturnRate);
    liquidAssets += netCashflow;
    
    // If retired and liquid runs out, tap pension (if over 57)
    if (liquidAssets < 0 && age >= 57) {
      const needed = -liquidAssets;
      if (pensionAssets >= needed) {
        pensionAssets -= needed;
        liquidAssets = 0;
      } else {
        liquidAssets += pensionAssets;
        pensionAssets = 0;
      }
    }
    
    // House equity grows with inflation only
    houseEquity *= (1 + assumptions.inflationRate);
    
    const totalNetWorth = liquidAssets + pensionAssets + houseEquity;
    
    // Track FI milestone (fiTarget calculated once at start)
    if (fiAchievedAge === 0 && totalNetWorth >= fiTarget) {
      fiAchievedAge = age;
    }
    
    projections.push({
      year,
      partner1Age: age,
      totalNetWorth,
      liquidAssets,
      pensions: pensionAssets,
      houseEquity,
      grossIncome,
      taxes,
      netIncome,
      expenses,
      netCashflow,
      isWorking: partner1Working || partner2Working,
      isSchoolFees: hasSchoolFees,
      isRetired: !partner1Working && !partner2Working,
      inheritanceReceived: inheritanceThisYear,
    });
    
    // Check if money ran out
    if (liquidAssets <= 0 && pensionAssets <= 0) {
      moneyLastsToAge = age;
      break;
    }
  }
  
  return {
    scenarioId: scenario.id,
    assumptionId: assumptions.id,
    moneyLastsToAge,
    timeToFI: fiAchievedAge > 0 ? fiAchievedAge - partner1Age : 99,
    earliestStopWorkAge: fiAchievedAge,
    projections,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function annualizeYTD(ytdAmount: number, date: Date): number {
  const month = date.getMonth() + 1;  // 1-12
  if (month === 0) return ytdAmount;
  return (ytdAmount / month) * 12;
}

function calculateCurrentSavingsRate(
  snapshot: MonthlySnapshot,
  config: FortressConfig
): number {
  const partner2Net = snapshot.partner2IncomeYTD
    ? annualizeYTD(snapshot.partner2IncomeYTD, snapshot.date)
    : config.partner2NetAnnual;

  const annualIncome = annualizeYTD(snapshot.businessRevenueYTD, snapshot.date) + partner2Net;
  const annualExpenses = annualizeYTD(snapshot.totalExpensesYTD, snapshot.date);
  
  // Rough tax estimate
  const businessIncome = annualizeYTD(snapshot.businessRevenueYTD, snapshot.date);
  const taxes = config.partner1IncomeMode === 'business'
    ? businessIncome * 0.30
    : calculatePAYETax(businessIncome);
  
  return annualIncome - taxes - annualExpenses;
}

function calculateYearsToTarget(
  currentAssets: number,
  targetAssets: number,
  annualSavings: number,
  returnRate: number
): number {
  if (currentAssets >= targetAssets) return 0;
  if (annualSavings <= 0 && returnRate <= 0) return 99;
  
  // Future Value formula: FV = PV(1+r)^n + PMT*((1+r)^n - 1)/r
  // Solve for n using binary search
  let low = 0;
  let high = 50;
  
  while (high - low > 0.1) {
    const mid = (low + high) / 2;
    const futureValue = currentAssets * Math.pow(1 + returnRate, mid) +
                        annualSavings * (Math.pow(1 + returnRate, mid) - 1) / returnRate;
    
    if (futureValue >= targetAssets) {
      high = mid;
    } else {
      low = mid;
    }
  }
  
  return Math.ceil(high);
}

function calculateRunway(
  assets: number,
  annualExpenses: number,
  returnRate: number
): number {
  if (annualExpenses <= 0) return 100;
  
  // How long until assets deplete, assuming growth continues
  let remaining = assets;
  let years = 0;
  
  while (remaining > 0 && years < 100) {
    remaining = remaining * (1 + returnRate) - annualExpenses;
    years++;
  }
  
  return years;
}

function calculateAnnualExpenses(
  _snapshot: MonthlySnapshot,
  config: FortressConfig
): number {
  // Use baseline monthly expenses from config (not YTD tracking)
  const baselinePersonal = (config.personalExpensesMonthly || 5000) * 12;
  const baselineBusiness = (config.businessExpensesMonthly || 1000) * 12;

  return baselinePersonal + baselineBusiness;
}

function calculateAnnualTax(
  grossIncome: number,
  partner1Working: boolean,
  partner2Working: boolean,
  config: FortressConfig
): number {
  let totalTax = 0;

  if (partner1Working && grossIncome > 0) {
    const businessPortion = partner1Working ?
      grossIncome - (partner2Working ? config.partner2GrossAnnual : 0) : 0;

    if (businessPortion > 0) {
      // Tax calculation depends on Partner 1's income mode
      if (config.partner1IncomeMode === 'business') {
        // Use optimal extraction for business income
        const extraction = calculateOptimalExtraction(businessPortion);
        totalTax += extraction.totalTax;
      } else {
        // Use PAYE calculation for employed income
        totalTax += calculatePAYETax(businessPortion);
      }
    }
  }

  if (partner2Working) {
    // PAYE tax on Partner 2's salary (always employed)
    totalTax += calculatePAYETax(config.partner2GrossAnnual);
  }

  return totalTax;
}

export function calculatePAYETax(gross: number): number {
  // Simplified UK tax calculation for employed income
  const personalAllowance = gross > 100000 
    ? Math.max(0, 12570 - (gross - 100000) / 2)
    : 12570;
  
  const taxable = Math.max(0, gross - personalAllowance);
  
  let tax = 0;
  // Basic rate: 20% up to £37,700
  // Higher rate: 40% £37,701 to £125,140
  // Additional rate: 45% over £125,140
  
  if (taxable <= 37700) {
    tax = taxable * 0.20;
  } else if (taxable <= 125140) {
    tax = 37700 * 0.20 + (taxable - 37700) * 0.40;
  } else {
    tax = 37700 * 0.20 + (125140 - 37700) * 0.40 + (taxable - 125140) * 0.45;
  }
  
  // NI (simplified: 12% on £12,570-£50,270, then 2%)
  const niLower = 12570;
  const niUpper = 50270;
  let ni = 0;
  
  if (gross > niLower) {
    if (gross <= niUpper) {
      ni = (gross - niLower) * 0.12;
    } else {
      ni = (niUpper - niLower) * 0.12 + (gross - niUpper) * 0.02;
    }
  }
  
  return tax + ni;
}

function calculateStampDuty(purchasePrice: number): number {
  // UK Stamp Duty Land Tax (residential, not first home)
  let duty = 0;
  
  if (purchasePrice > 250000) {
    duty += Math.min(purchasePrice - 250000, 675000) * 0.05;  // 5% on £250k-£925k
  }
  if (purchasePrice > 925000) {
    duty += Math.min(purchasePrice - 925000, 575000) * 0.10;  // 10% on £925k-£1.5m
  }
  if (purchasePrice > 1500000) {
    duty += (purchasePrice - 1500000) * 0.12;  // 12% over £1.5m
  }
  
  return duty;
}

function findMinimumIncome(
  snapshot: MonthlySnapshot,
  config: FortressConfig,
  assumptions: AssumptionSet,
  partner2Working: boolean,
  targetAge: number
): number {
  // Binary search for minimum income
  let low = 0;
  let high = 500000;
  const breakStartYear = new Date().getFullYear() + 1;
  
  while (high - low > 5000) {
    const mid = Math.floor((low + high) / 2);
    
    const scenario: ScenarioDefinition = {
      id: 'test',
      name: 'test',
      shortName: 'test',
      partner1WorksUntilAge: config.partner1WorksUntilAge ?? 60,
      partner2WorksUntilAge: partner2Working ? (config.partner2WorksUntilAge ?? 60) : 0,
      partner1AnnualRevenue: mid,
      partner2BreakYears: partner2Working ? 0 : 50,
      partner2BreakStartYear: breakStartYear,
      includeHouseUpgrade: false,
      houseUpgradeYear: 0,
      includeUniversity: false,
    };

    const result = runScenarioToExhaustion(snapshot, config, scenario, assumptions);

    if (result.moneyLastsToAge >= targetAge) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.ceil(high / 5000) * 5000;  // Round up to nearest £5k
}

function findMinimumIncomeForSurplus(
  snapshot: MonthlySnapshot,
  config: FortressConfig,
  assumptions: AssumptionSet,
  partner2Working: boolean,
  targetSurplus: number
): number {
  // Find income where net worth grows by targetSurplus per year
  let low = 0;
  let high = 500000;
  const breakStartYear = new Date().getFullYear() + 1;

  while (high - low > 5000) {
    const mid = Math.floor((low + high) / 2);

    const scenario: ScenarioDefinition = {
      id: 'test',
      name: 'test',
      shortName: 'test',
      partner1WorksUntilAge: config.partner1WorksUntilAge ?? 60,
      partner2WorksUntilAge: partner2Working ? (config.partner2WorksUntilAge ?? 60) : 0,
      partner1AnnualRevenue: mid,
      partner2BreakYears: partner2Working ? 0 : 50,
      partner2BreakStartYear: breakStartYear,
      includeHouseUpgrade: false,
      houseUpgradeYear: 0,
      includeUniversity: false,
    };
    
    const result = runScenarioToExhaustion(snapshot, config, scenario, assumptions);
    
    // Check year-over-year growth in early years
    if (result.projections.length >= 3) {
      const year1 = result.projections[0].totalNetWorth;
      const year3 = result.projections[2].totalNetWorth;
      const avgGrowth = (year3 - year1) / 2;
      
      if (avgGrowth >= targetSurplus) {
        high = mid;
      } else {
        low = mid;
      }
    } else {
      low = mid;
    }
  }
  
  return Math.ceil(high / 5000) * 5000;
}

function findMinimumIncomeForFITarget(
  snapshot: MonthlySnapshot,
  config: FortressConfig,
  assumptions: AssumptionSet,
  partner2Working: boolean
): { value: number; hitsCap: boolean } {
  const retirementAge = config.partner1WorksUntilAge ?? 60;
  const breakStartYear = new Date().getFullYear() + 1;

  // Check if FI already achieved with zero income
  const zeroIncomeScenario: ScenarioDefinition = {
    id: 'test-zero',
    name: 'test-zero',
    shortName: 'test',
    partner1WorksUntilAge: config.partner1WorksUntilAge ?? 60,
    partner2WorksUntilAge: partner2Working ? (config.partner2WorksUntilAge ?? 60) : 0,
    partner1AnnualRevenue: 0,
    partner2BreakYears: partner2Working ? 0 : 50,
    partner2BreakStartYear: breakStartYear,
    includeHouseUpgrade: false,
    houseUpgradeYear: 0,
    includeUniversity: false,
  };

  const zeroResult = runScenarioToExhaustion(snapshot, config, zeroIncomeScenario, assumptions);

  // If FI achieved with zero income, return 0
  if (zeroResult.earliestStopWorkAge > 0 && zeroResult.earliestStopWorkAge <= retirementAge) {
    return { value: 0, hitsCap: false };
  }

  // Binary search for minimum income where FI target is achieved before retirement
  let low = 0;
  const upperBound = 1000000;  // £1m cap for aggressive FI targets
  let high = upperBound;

  while (high - low > 5000) {
    const mid = Math.floor((low + high) / 2);

    const scenario: ScenarioDefinition = {
      id: 'test',
      name: 'test',
      shortName: 'test',
      partner1WorksUntilAge: config.partner1WorksUntilAge ?? 60,
      partner2WorksUntilAge: partner2Working ? (config.partner2WorksUntilAge ?? 60) : 0,
      partner1AnnualRevenue: mid,
      partner2BreakYears: partner2Working ? 0 : 50,
      partner2BreakStartYear: breakStartYear,
      includeHouseUpgrade: false,
      houseUpgradeYear: 0,
      includeUniversity: false,
    };

    const result = runScenarioToExhaustion(snapshot, config, scenario, assumptions);

    // Check if FI target achieved before or at retirement age
    if (result.earliestStopWorkAge > 0 && result.earliestStopWorkAge <= retirementAge) {
      high = mid;
    } else {
      low = mid;
    }
  }

  const value = Math.ceil(high / 5000) * 5000;
  const hitsCap = value >= upperBound;  // If we ended at the upper bound, we hit the cap

  return { value, hitsCap };
}

function calculatePAYEEquivalent(businessRevenue: number): number {
  // Convert Business revenue to equivalent PAYE salary
  // PAYE is less tax-efficient, so need higher gross
  // Rough estimate: PAYE gross = Business * 0.85 to get same net
  // Actually need to work backwards from net
  
  const extraction = calculateOptimalExtraction(businessRevenue);
  const targetNet = extraction.netIncome;
  
  // Binary search for PAYE salary that gives same net
  let low = 0;
  let high = businessRevenue * 1.5;
  
  while (high - low > 1000) {
    const mid = (low + high) / 2;
    const payeNet = mid - calculatePAYETax(mid);
    
    if (payeNet >= targetNet) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.ceil(high / 5000) * 5000;
}

/**
 * Calculate gross PAYE salary needed to achieve target net income
 * Uses binary search with UK PAYE tax calculations
 */
export function calculateGrossFromNet(targetNet: number): number {
  // Binary search for gross that gives target net
  let low = targetNet;
  let high = targetNet * 2;  // PAYE max effective rate ~47%, so 2x is safe upper bound

  while (high - low > 100) {
    const mid = (low + high) / 2;
    const tax = calculatePAYETax(mid);
    const net = mid - tax;

    if (net >= targetNet) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.ceil(high);
}

/**
 * Calculate net Investment exit proceeds after corporation tax
 * Note: Investment currently holds Investment at cost basis (£82k).
 * At exit, net proceeds replace the cost basis, so additional value
 * is net proceeds minus cost basis.
 */
export function calculateInvestmentExitNet(config: FortressConfig): {
  grossProceeds: number;
  gain: number;
  corporationTax: number;
  netProceeds: number;
  additionalValue: number;
} {
  const grossProceeds = config.investmentExitGross;        // 1,140,000
  const gain = grossProceeds - config.investmentCostBasis; // 1,058,000
  const corporationTax = gain * 0.25;                      // 264,500
  const netProceeds = grossProceeds - corporationTax;      // 875,500
  const additionalValue = netProceeds - config.investmentCostBasis; // 793,500

  return {
    grossProceeds,
    gain,
    corporationTax,
    netProceeds,
    additionalValue,
  };
}

function getChildBirthYears(config: FortressConfig): number[] {
  const count = Math.max(0, Math.min(config.personalization.numberOfChildren ?? 0, 4));
  const births = [
    config.child1BirthYear,
    config.child2BirthYear,
    config.child3BirthYear,
    config.child4BirthYear,
  ];

  return births
    .map((year, index) => ({ year, index }))
    .filter(item => item.index < count && typeof item.year === 'number')
    .map(item => item.year as number);
}
