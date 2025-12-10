// Fortress Type Definitions - Generalized FI Planning App

// Personalization configuration for labels and names
export interface PersonalizationConfig {
  partner1Name: string;          // "Partner 1"
  partner2Name: string;          // "Partner 2"
  child1Name?: string;           // "Child 1"
  child2Name?: string;           // "Child 2"
  child3Name?: string;
  child4Name?: string;
  businessName: string;          // "Business"
  investmentName: string;        // "Investment"
  schoolName: string;            // "Private School"
  numberOfChildren: number;      // 0-4
}

export interface MonthlySnapshot {
  id: string;
  date: Date;

  // Assets (from Net Worth Tracker)
  currentAccounts: number;
  savingsAccounts: number;
  isas: number;
  pensions: number;
  taxableAccounts: number;  // GIA
  houseEquity: number;
  businessAssets: number;
  investmentAssets: number;
  total: number;

  // Income tracking
  businessRevenueYTD: number;
  partner2IncomeYTD: number;

  // Expense tracking
  personalExpensesYTD: number;
  businessExpensesYTD: number;
  totalExpensesYTD: number;
}

export interface FortressConfig {
  // Personalization
  personalization: PersonalizationConfig;

  // Family ages (as of snapshot date)
  partner1BirthYear: number;
  partner2BirthYear: number;
  child1BirthYear: number;
  child2BirthYear: number;
  child3BirthYear?: number;
  child4BirthYear?: number;

  // Partner 1's income configuration
  partner1IncomeMode: 'business' | 'employed';  // Toggle between modes
  partner1BusinessRevenue: number;              // Business gross revenue
  partner1EmployedSalary: number;               // PAYE gross salary

  // Partner 2's income
  partner2SalaryInputMode: 'gross' | 'net';  // Which field is source of truth
  partner2GrossAnnual: number;
  partner2NetAnnual: number;

  // School fees (annual per child, current year)
  annualSchoolFeePerChild: number;

  // Goals
  fiTargetMultiple: number;   // 25x expenses = 4% SWR
  fiTargetMode: 'multiplier' | 'amount';  // Which FI target mode is active
  fiTargetAmount?: number;    // e.g., 1500000 (£1.5m) - for fixed amount mode

  // Working age overrides (global, apply to ALL scenarios)
  partner1WorksUntilAge?: number;
  partner2WorksUntilAge?: number;

  // Windfalls
  inheritanceAmount: number;
  inheritancePartner1Age: number;

  // Investment Exit
  investmentShares: number;
  investmentCostBasis: number;
  investmentCurrentMark: number;
  investmentExitGross: number;
  investmentExitPartner1Age: number;

  // House upgrade
  houseUpgradeBudget: number;
  currentHouseValue: number;
  mortgageRemaining: number;

  // University costs
  universityAnnualCost: number;
  universityYears: number;
}

export interface AssumptionSet {
  id: string;
  name: string;
  realReturnRate: number;      // 0.05 or 0.03
  inflationRate: number;       // 0.025
  schoolFeeInflation: number;  // 0.05
  includeInheritance: boolean;
  includeInvestmentExit: boolean;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  shortName: string;

  // Work parameters
  partner1WorksUntilAge: number;
  partner2WorksUntilAge: number;
  partner1AnnualRevenue: number;

  // Career break
  partner2BreakYears: number;
  partner2BreakStartYear: number;

  // Major expenses toggles
  includeHouseUpgrade: boolean;
  houseUpgradeYear: number;
  includeUniversity: boolean;
}

export interface ScenarioResult {
  scenarioId: string;
  assumptionId: string;

  // Key outputs
  moneyLastsToAge: number;      // 75, 88, 100+
  timeToFI: number;             // Years
  earliestStopWorkAge: number;  // When can completely stop

  // Yearly projections (for charts if needed)
  projections: YearlyProjection[];
}

export interface YearlyProjection {
  year: number;
  partner1Age: number;

  // Balances
  totalNetWorth: number;
  liquidAssets: number;
  pensions: number;
  houseEquity: number;

  // Flows
  grossIncome: number;
  taxes: number;
  netIncome: number;
  expenses: number;
  netCashflow: number;

  // Milestones
  isWorking: boolean;
  isSchoolFees: boolean;
  isRetired: boolean;
  inheritanceReceived: boolean;
}

// Dashboard display types
export interface HeadlineMetrics {
  netWorth: number;
  netWorthChange: number;       // vs last month
  netWorthChangePercent: number;

  fiTarget: number;
  fiProgress: number;           // 0-1

  timeToFI: number;             // Years at current pace
  runway: number;               // Years if stop earning now

  liquidAssets: number;
  pensionAssets: number;
  businessAssets: number;
  propertyEquity: number;
}

export interface CashflowTableRow {
  scenarioId: string;
  scenarioName: string;
  results: {
    [assumptionId: string]: number;  // Age money lasts to
  };
}

export interface ScenarioCostTableRow {
  scenarioId: string;
  scenarioName: string;
  extraCost: number;  // In pounds, relative to baseline
  isBaseline: boolean;  // True for "Current Path"
}

export interface MinimumIncomeRow {
  threshold: 'breakeven' | 'coastfi' | 'surplus';
  label: string;
  description: string;

  // Without windfalls
  partner2Working: number;    // Business revenue needed
  partner2Break: number;      // Business revenue needed
  payeAlternative: number;    // Equivalent PAYE salary
  partner2WorkingHitsCap?: boolean;
  partner2BreakHitsCap?: boolean;
  payeAlternativeHitsCap?: boolean;

  // With windfalls (both Investment + Inheritance)
  partner2WorkingWithWindfalls: number;
  partner2BreakWithWindfalls: number;
  payeAlternativeWithWindfalls: number;
  partner2WorkingWithWindfallsHitsCap?: boolean;
  partner2BreakWithWindfallsHitsCap?: boolean;
  payeAlternativeWithWindfallsHitsCap?: boolean;
}

// Data entry types
export interface DataEntryInput {
  // Pasted from Net Worth Tracker (tab-separated)
  netWorthRow: string;

  // Manual entry
  businessRevenueYTD: number;
  personalExpensesYTD: number;
  businessExpensesYTD: number;
}

// Store types
export interface FortressStore {
  // Current state
  latestSnapshot: MonthlySnapshot | null;
  snapshotHistory: MonthlySnapshot[];
  config: FortressConfig;
  hasCompletedOnboarding: boolean;

  // Computed (cached)
  headlineMetrics: HeadlineMetrics | null;
  cashflowTable: CashflowTableRow[];
  minimumIncomeTable: MinimumIncomeRow[];
  scenarioCostTable: ScenarioCostTableRow[];

  // Actions
  updateSnapshot: (input: DataEntryInput) => void;
  updateConfig: (config: Partial<FortressConfig>) => void;
  recalculate: () => void;
  markOnboardingComplete: () => void;
}

// Helper function to get dynamic scenario name with personalization
export function getScenarioDisplayName(
  scenario: ScenarioDefinition,
  personalization: PersonalizationConfig
): string {
  return scenario.name
    .replace('Partner 2', personalization.partner2Name)
    .replace('Partner 1', personalization.partner1Name);
}

// Default personalization for new users
export const DEFAULT_PERSONALIZATION: PersonalizationConfig = {
  partner1Name: "Partner 1",
  partner2Name: "Partner 2",
  child1Name: "Child 1",
  child2Name: "Child 2",
  businessName: "Business",
  investmentName: "Investment",
  schoolName: "Private School",
  numberOfChildren: 2,
};

// Default configuration for new users
export const DEFAULT_CONFIG: FortressConfig = {
  personalization: DEFAULT_PERSONALIZATION,

  // Generic ages (40 and 39 years old)
  partner1BirthYear: new Date().getFullYear() - 40,
  partner2BirthYear: new Date().getFullYear() - 39,
  child1BirthYear: new Date().getFullYear() - 7,
  child2BirthYear: new Date().getFullYear() - 3,

  // UK median professional salaries
  partner1IncomeMode: 'employed',
  partner1BusinessRevenue: 150000,
  partner1EmployedSalary: 60000,

  partner2SalaryInputMode: 'gross',
  partner2GrossAnnual: 50000,
  partner2NetAnnual: 39000,

  // UK private school average
  annualSchoolFeePerChild: 18000,

  fiTargetMultiple: 25,
  fiTargetMode: 'multiplier',
  fiTargetAmount: 4500000,

  partner1WorksUntilAge: undefined,
  partner2WorksUntilAge: undefined,

  // Conservative windfall defaults
  inheritanceAmount: 0,
  inheritancePartner1Age: 50,

  investmentShares: 0,
  investmentCostBasis: 0,
  investmentCurrentMark: 0,
  investmentExitGross: 0,
  investmentExitPartner1Age: 45,

  houseUpgradeBudget: 1500000,
  currentHouseValue: 950000,
  mortgageRemaining: 475000,

  universityAnnualCost: 65000,
  universityYears: 4,
};

export const DEFAULT_ASSUMPTIONS: AssumptionSet[] = [
  // 3% return scenarios
  { id: '3-none', name: '3% No Windfalls', realReturnRate: 0.03, inflationRate: 0.025, schoolFeeInflation: 0.05, includeInheritance: false, includeInvestmentExit: false },
  { id: '3-inh', name: '3% + Inheritance', realReturnRate: 0.03, inflationRate: 0.025, schoolFeeInflation: 0.05, includeInheritance: true, includeInvestmentExit: false },
  { id: '3-invest', name: '3% + Investment', realReturnRate: 0.03, inflationRate: 0.025, schoolFeeInflation: 0.05, includeInheritance: false, includeInvestmentExit: true },
  { id: '3-both', name: '3% + Both', realReturnRate: 0.03, inflationRate: 0.025, schoolFeeInflation: 0.05, includeInheritance: true, includeInvestmentExit: true },

  // 5% return scenarios
  { id: '5-none', name: '5% No Windfalls', realReturnRate: 0.05, inflationRate: 0.025, schoolFeeInflation: 0.05, includeInheritance: false, includeInvestmentExit: false },
  { id: '5-inh', name: '5% + Inheritance', realReturnRate: 0.05, inflationRate: 0.025, schoolFeeInflation: 0.05, includeInheritance: true, includeInvestmentExit: false },
  { id: '5-invest', name: '5% + Investment', realReturnRate: 0.05, inflationRate: 0.025, schoolFeeInflation: 0.05, includeInheritance: false, includeInvestmentExit: true },
  { id: '5-both', name: '5% + Both', realReturnRate: 0.05, inflationRate: 0.025, schoolFeeInflation: 0.05, includeInheritance: true, includeInvestmentExit: true },
];

export const DEFAULT_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'current',
    name: 'Current Path',
    shortName: 'Current',
    partner1WorksUntilAge: 50,
    partner2WorksUntilAge: 50,
    partner1AnnualRevenue: 300000,
    partner2BreakYears: 0,
    partner2BreakStartYear: 0,
    includeHouseUpgrade: false,
    houseUpgradeYear: 0,
    includeUniversity: false,
  },
  {
    id: 'partner2-1yr',
    name: '+ Partner 2 1-year break',
    shortName: '+1yr break',
    partner1WorksUntilAge: 50,
    partner2WorksUntilAge: 50,
    partner1AnnualRevenue: 300000,
    partner2BreakYears: 1,
    partner2BreakStartYear: 2025,
    includeHouseUpgrade: false,
    houseUpgradeYear: 0,
    includeUniversity: false,
  },
  {
    id: 'partner2-2yr',
    name: '+ Partner 2 2-year break',
    shortName: '+2yr break',
    partner1WorksUntilAge: 50,
    partner2WorksUntilAge: 50,
    partner1AnnualRevenue: 300000,
    partner2BreakYears: 2,
    partner2BreakStartYear: 2025,
    includeHouseUpgrade: false,
    houseUpgradeYear: 0,
    includeUniversity: false,
  },
  {
    id: 'partner2-3yr',
    name: '+ Partner 2 3-year break',
    shortName: '+3yr break',
    partner1WorksUntilAge: 50,
    partner2WorksUntilAge: 50,
    partner1AnnualRevenue: 300000,
    partner2BreakYears: 3,
    partner2BreakStartYear: 2025,
    includeHouseUpgrade: false,
    houseUpgradeYear: 0,
    includeUniversity: false,
  },
  {
    id: 'partner2-indefinite',
    name: '+ Partner 2 indefinite break',
    shortName: '+Indefinite',
    partner1WorksUntilAge: 50,
    partner2WorksUntilAge: 39,
    partner1AnnualRevenue: 300000,
    partner2BreakYears: 0,
    partner2BreakStartYear: 0,
    includeHouseUpgrade: false,
    houseUpgradeYear: 0,
    includeUniversity: false,
  },
  {
    id: 'house',
    name: '+ House upgrade (£1.5m)',
    shortName: '+House',
    partner1WorksUntilAge: 50,
    partner2WorksUntilAge: 50,
    partner1AnnualRevenue: 300000,
    partner2BreakYears: 0,
    partner2BreakStartYear: 0,
    includeHouseUpgrade: true,
    houseUpgradeYear: 2026,
    includeUniversity: false,
  },
  {
    id: 'university',
    name: '+ University (2 kids)',
    shortName: '+University',
    partner1WorksUntilAge: 50,
    partner2WorksUntilAge: 50,
    partner1AnnualRevenue: 300000,
    partner2BreakYears: 0,
    partner2BreakStartYear: 0,
    includeHouseUpgrade: false,
    houseUpgradeYear: 0,
    includeUniversity: true,
  },
  {
    id: 'all',
    name: 'All upgrades combined',
    shortName: 'Full',
    partner1WorksUntilAge: 50,
    partner2WorksUntilAge: 39,
    partner1AnnualRevenue: 300000,
    partner2BreakYears: 0,
    partner2BreakStartYear: 0,
    includeHouseUpgrade: true,
    houseUpgradeYear: 2026,
    includeUniversity: true,
  },
];
