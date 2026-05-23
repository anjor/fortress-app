// Fortress — generalized types for the FI planning report.
//
// The structure mirrors the v18 interactive report artifact but with all
// personal labels and hardcoded numbers extracted into a Config object.

// ---------------------------------------------------------------------------
// Personalization (labels only — never affects calculations)
// ---------------------------------------------------------------------------

export interface Personalization {
  reportTitle: string;            // e.g. "Monthly Financial Report"
  household: string;              // e.g. "The Household"
  partner1Name: string;
  partner2Name: string;
  childNames: string[];           // length matches childAges
  businessName: string;           // for the operating company
  investmentVehicleName: string;  // long-term holding vehicle
  equityHoldingName: string;      // illiquid equity position (e.g. startup shares)
  primarySchoolLabel: string;
  secondarySchoolLabel: string;
  universityLabel: string;
}

// ---------------------------------------------------------------------------
// Tax parameters (UK 2024/25 by default; all values are overridable)
// ---------------------------------------------------------------------------

export interface TaxParams {
  personalAllowance: number;        // £12,570
  paTaperStart: number;             // £100,000 (PA tapers £1 per £2 above)
  basicRateTop: number;             // £50,270
  higherRateTop: number;            // £125,140
  basicRate: number;                // 0.20
  higherRate: number;               // 0.40
  additionalRate: number;           // 0.45

  niPrimaryThreshold: number;       // £12,570
  niUpperEarningsLimit: number;     // £50,270
  niMainRate: number;               // 0.08
  niAdditionalRate: number;         // 0.02

  corporationTaxRate: number;       // 0.25
  dividendAllowance: number;        // £500
  dividendBasicRate: number;        // 0.0875
  dividendHigherRate: number;       // 0.3375
}

// ---------------------------------------------------------------------------
// Partner income
// ---------------------------------------------------------------------------

export type IncomeMode = 'business' | 'employed' | 'none';

export interface PartnerIncome {
  mode: IncomeMode;
  // Business mode: gross company revenue this partner generates
  businessRevenue: number;
  // Employed mode: gross PAYE salary
  employedSalary: number;
  // Default per-partner extraction (business mode)
  salaryComponent: number;          // £12,570 default (tax-efficient)
  dividendTarget: number;           // £37,700 default (top of basic rate band)
  // Annual pension contribution (business mode)
  pensionContribAnnual: number;     // £30,000 default
  // Age this partner stops working (their income drops to zero)
  stopAge: number;
}

// ---------------------------------------------------------------------------
// Expenses & lifestyle
// ---------------------------------------------------------------------------

export interface ExpenseParams {
  personalAnnual: number;           // baseline household personal expenses
  mortgageAnnualPortion: number;    // included in personal until mortgageEndAge
  mortgageEndAge: number;           // primary partner's age when mortgage clears
  businessAnnual: number;           // running cost of operating business
  primarySchoolPerChild: number;    // annual private school fees, primary age
  secondarySchoolPerChild: number;  // annual secondary fees
  primarySchoolAgeStart: number;    // child age when primary starts
  primarySchoolAgeEnd: number;      // exclusive
  secondarySchoolAgeStart: number;
  secondarySchoolAgeEnd: number;    // exclusive
}

// ---------------------------------------------------------------------------
// Lifestyle modifiers
// ---------------------------------------------------------------------------

export interface HouseUpgrade {
  enabled: boolean;
  downPayment: number;              // lump at upgrade age
  annualExtraCost: number;          // ongoing for `years` years
  durationYears: number;            // e.g. 25
  defaultAge: number;               // primary partner age, sliderable
}

export interface UniversityFunding {
  enabled: boolean;
  annualPerChild: number;
  durationYears: number;
  startChildAge: number;            // child age at which uni begins (e.g. 18)
}

// ---------------------------------------------------------------------------
// Windfalls
// ---------------------------------------------------------------------------

export interface EquityPricePoint {
  pricePerShare: number;
  netAtExit: number;                // net proceeds to family at this PPS
}

export interface EquityWindfall {
  enabled: boolean;
  currentPricePerShare: number;
  priceTable: EquityPricePoint[];   // for slider interpolation
  defaultExitYearsOut: number;      // from "now"
}

export interface LumpSumWindfall {
  enabled: boolean;
  amount: number;                   // real, today's £
  receivingAge: number;             // primary partner's age
}

export interface AlternateExitWindfall {
  enabled: boolean;
  exitLump: number;                 // lump at exit age
  exitAge: number;
  annualDividend: number;           // annual flow until exit
  dividendStartAge: number;         // when dividend stream begins
  annualSalaryGross: number;        // PAYE-style salary until exit
  salaryNetRatio: number;           // approx net / gross (default 0.70)
  salaryStartAge: number;
}

// ---------------------------------------------------------------------------
// History & roster (for charts and tables on the Income tab)
// ---------------------------------------------------------------------------

export interface HistoryPoint {
  date: string;                     // e.g. "May-25"
  value: number;                    // in thousands (charts use £K)
}

export interface RevenueHistoryPoint {
  month: string;                    // e.g. "May-25"
  revenue: number;                  // in thousands
}

export interface ExpenseMonthPoint {
  month: string;                    // "Jan"
  priorYear: number;                // in thousands
  currentYear: number;              // in thousands
}

export type ClientStatus = 'anchor' | 'steady' | 'fragile';

export interface Client {
  name: string;
  monthlyAmount: number;
  status: ClientStatus;
  note: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  value: number;
  prior: number;
  color: string;                    // hex; used in pie chart
  note: string;                     // short description
  bucket: 'liquid' | 'pension' | 'house' | 'business';
}

// ---------------------------------------------------------------------------
// Top-level config
// ---------------------------------------------------------------------------

export interface FortressConfig {
  personalization: Personalization;
  tax: TaxParams;

  // Ages
  primaryPartnerAge: number;        // "today" age of partner 1
  secondaryPartnerAge: number;
  childAges: number[];              // ages today (one per child)
  pensionUnlockAge: number;         // primary partner's age when pensions unlock
  terminalAge: number;              // sim runs to this age

  // Income
  partner1: PartnerIncome;
  partner2: PartnerIncome;

  // Expenses
  expenses: ExpenseParams;

  // Lifestyle
  houseUpgrade: HouseUpgrade;
  university: UniversityFunding;

  // Wealth today
  initialLiquid: number;            // ex pensions & house
  initialPensions: number;
  initialHouseEquity: number;
  assetBreakdown: AssetCategory[];  // for Overview pie chart

  // Windfalls
  equity: EquityWindfall;
  inheritance: LumpSumWindfall;
  alternateExit: AlternateExitWindfall;

  // History / roster (for Income tab charts)
  netWorthHistory: HistoryPoint[];
  revenueHistory: RevenueHistoryPoint[];
  expensesByMonth: ExpenseMonthPoint[];
  clients: Client[];

  // Year-to-date expense snapshot
  ytdExpenses: {
    monthsElapsed: number;
    totalCurrent: number;
    personalCurrent: number;
    businessCurrent: number;
    totalPrior: number;
    personalPrior: number;
    businessPrior: number;
  };

  // Fiscal year revenue snapshot for headline cards
  fiscalYearRevenue: {
    currentYearLabel: string;       // "FY 2025-26"
    priorYearLabel: string;
    currentTotal: number;
    priorTotal: number;
  };
}

// ---------------------------------------------------------------------------
// Simulation runtime types (derived from config + sliders)
// ---------------------------------------------------------------------------

export type Lifestyle = 'base' | 'house' | 'university' | 'combined';
export type WindfallScenario = 'none' | 'equity' | 'inheritance' | 'alternate' | 'all';
export type IncomeSearchMode = 'business' | 'employed';

export interface SimOptions {
  config: FortressConfig;
  growth: number;                   // real annual return, e.g. 0.03
  mode: IncomeSearchMode;           // how partner 1 earns
  lifestyle: Lifestyle;
  revenue: number;                  // partner 1's gross (business) or salary (employed)
  stopAge: number;                  // override for partner 1's stop age
  houseAge: number;                 // override for HouseUpgrade.defaultAge

  // Per-windfall amounts (sliders override config defaults)
  equityNet: number;                // net at exit
  equityAge: number;
  inheritanceAmount: number;
  inheritanceAge: number;
  alternateExitLump: number;
  alternateExitAge: number;
  alternateDividend: number;
  alternateSalaryGross: number;
  alternateSalaryStartAge: number;

  // Toggles
  useEquity: boolean;
  useInheritance: boolean;
  useAlternate: boolean;

  // Lifestyle overrides
  secondarySchoolPerChild: number;  // override config default

  // Partner 2 external income (added on top, post their own stop age = 0)
  partner2ExternalNet: number;
  partner2ExternalStartAge: number;
  partner2ExternalEndAge: number;

  // Seed wealth (only for FI-number search)
  initLiquidOverride?: number;
  initPensionOverride?: number;
}

export interface TrajectoryPoint {
  age: number;
  liquid: number;
  pension: number;
  total: number;
  working: boolean;
}

// ---------------------------------------------------------------------------
// Preset scenarios
// ---------------------------------------------------------------------------

export interface PresetState {
  growth: number;
  equityPricePerShare: number;
  equityYearsOut: number;
  inheritanceK: number;
  inheritanceAge: number;
  alternateExitAge: number;
  alternateExitK: number;
  alternateDividendK: number;
  alternateSalaryK: number;
  alternateSalaryStartYears: number;
  houseAge: number;
  stopAge: number;
  secondarySchoolPerKid: number;
  partner2IncomeK: number;
  partner2StartYears: number;
  partner2DurationYears: number;
}

export interface Preset {
  id: string;
  label: string;
  description: string;
  tone: 'red' | 'amber' | 'neutral' | 'green' | 'blue';
  state: PresetState;
}
