// Anonymized demo configuration used as defaults for a new installation.
//
// All numbers are illustrative for a UK household running an owner-managed
// limited company. Personalize via the Settings page.

import type { FortressConfig } from '../types';
import { DEFAULT_TAX } from '../lib/uk-tax';

export const DEMO_CONFIG: FortressConfig = {
  personalization: {
    reportTitle: 'Monthly Financial Report',
    household: 'The Household',
    partner1Name: 'Partner 1',
    partner2Name: 'Partner 2',
    childNames: ['Child 1', 'Child 2'],
    businessName: 'Company',
    investmentVehicleName: 'Investment Vehicle',
    equityHoldingName: 'Equity Holding',
    primarySchoolLabel: 'Primary',
    secondarySchoolLabel: 'Secondary',
    universityLabel: 'University',
  },
  tax: DEFAULT_TAX,

  primaryPartnerAge: 41,
  secondaryPartnerAge: 40,
  childAges: [8, 4],
  pensionUnlockAge: 57,
  terminalAge: 100,

  partner1: {
    mode: 'business',
    businessRevenue: 400_000,
    employedSalary: 200_000,
    salaryComponent: 12_570,
    dividendTarget: 37_700,
    pensionContribAnnual: 30_000,
    stopAge: 50,
  },
  partner2: {
    mode: 'business',
    businessRevenue: 0,
    employedSalary: 45_000,
    salaryComponent: 12_570,
    dividendTarget: 37_700,
    pensionContribAnnual: 0,
    stopAge: 100,
  },

  expenses: {
    personalAnnual: 130_000,
    mortgageAnnualPortion: 25_000,
    mortgageEndAge: 70,
    businessAnnual: 33_000,
    primarySchoolPerChild: 20_000,
    secondarySchoolPerChild: 30_000,
    primarySchoolAgeStart: 4,
    primarySchoolAgeEnd: 13,
    secondarySchoolAgeStart: 13,
    secondarySchoolAgeEnd: 18,
  },

  houseUpgrade: {
    enabled: true,
    downPayment: 350_000,
    annualExtraCost: 30_000,
    durationYears: 25,
    defaultAge: 46,
  },
  university: {
    enabled: true,
    annualPerChild: 75_000,
    durationYears: 4,
    startChildAge: 18,
  },

  initialLiquid: 2_650_000,
  initialPensions: 1_015_000,
  initialHouseEquity: 479_000,
  assetBreakdown: [
    { id: 'pensions', name: 'Pensions',       value: 1_014_860, prior: 930_680,   color: '#7c3aed', note: 'locked to 57',      bucket: 'pension' },
    { id: 'vehicle',  name: 'Holding vehicle',value: 1_264_469, prior: 1_195_494, color: '#ea580c', note: 'long-term capital', bucket: 'liquid' },
    { id: 'isas',     name: 'ISAs',           value: 690_774,   prior: 615_760,   color: '#0891b2', note: 'tax-free',          bucket: 'liquid' },
    { id: 'gia',      name: 'General invest', value: 531_351,   prior: 501_239,   color: '#65a30d', note: 'taxable',           bucket: 'liquid' },
    { id: 'house',    name: 'House equity',   value: 478_708,   prior: 477_897,   color: '#a16207', note: 'illiquid',          bucket: 'house' },
    { id: 'cash',     name: 'Cash + savings', value: 95_099,    prior: 106_427,   color: '#475569', note: 'working capital',   bucket: 'liquid' },
    { id: 'biz',      name: 'Company cash',   value: 67_430,    prior: 54_510,    color: '#0d9488', note: 'retained profit',   bucket: 'business' },
  ],

  equity: {
    enabled: true,
    currentPricePerShare: 1.56,
    priceTable: [
      { pricePerShare: 1.04, netAtExit: 580_000 },
      { pricePerShare: 1.56, netAtExit: 727_000 },
      { pricePerShare: 2.60, netAtExit: 1_500_000 },
      { pricePerShare: 3.90, netAtExit: 2_470_000 },
      { pricePerShare: 5.20, netAtExit: 3_430_000 },
    ],
    defaultExitYearsOut: 5,
  },
  inheritance: {
    enabled: true,
    amount: 1_000_000,
    receivingAge: 60,
  },
  alternateExit: {
    enabled: true,
    exitLump: 200_000,
    exitAge: 48,
    annualDividend: 20_000,
    dividendStartAge: 42,
    annualSalaryGross: 45_000,
    salaryNetRatio: 0.70,
    salaryStartAge: 42,
  },

  netWorthHistory: [
    { date: 'May-25', value: 2_904 },
    { date: 'Jun-25', value: 3_014 },
    { date: 'Jul-25', value: 3_152 },
    { date: 'Aug-25', value: 3_286 },
    { date: 'Sep-25', value: 3_370 },
    { date: 'Oct-25', value: 3_531 },
    { date: 'Nov-25', value: 3_682 },
    { date: 'Dec-25', value: 3_736 },
    { date: 'Jan-26', value: 3_761 },
    { date: 'Feb-26', value: 3_811 },
    { date: 'Mar-26', value: 3_969 },
    { date: 'Apr-26', value: 3_882 },
    { date: 'May-26', value: 4_143 },
  ],
  revenueHistory: [
    { month: 'May-25', revenue: 76 },
    { month: 'Jun-25', revenue: 70 },
    { month: 'Jul-25', revenue: 96 },
    { month: 'Aug-25', revenue: 87 },
    { month: 'Sep-25', revenue: 83 },
    { month: 'Oct-25', revenue: 38 },
    { month: 'Nov-25', revenue: 75 },
    { month: 'Dec-25', revenue: 41 },
    { month: 'Jan-26', revenue: 34 },
    { month: 'Feb-26', revenue: 68 },
    { month: 'Mar-26', revenue: 61 },
    { month: 'Apr-26', revenue: 58 },
  ],
  expensesByMonth: [
    { month: 'Jan', priorYear: 13.7, currentYear: 17.2 },
    { month: 'Feb', priorYear: 17.3, currentYear: 9.5 },
    { month: 'Mar', priorYear: 11.5, currentYear: 14.4 },
    { month: 'Apr', priorYear: 18.6, currentYear: 12.7 },
  ],
  clients: [
    { name: 'Client A', monthlyAmount: 17_500, status: 'anchor',  note: 'Anchor — highest hourly rate' },
    { name: 'Client B', monthlyAmount: 8_000,  status: 'anchor',  note: 'Second anchor; weekly engagement' },
    { name: 'Client C', monthlyAmount: 3_000,  status: 'steady',  note: 'Retainer with upside potential' },
    { name: 'Client D', monthlyAmount: 2_200,  status: 'steady',  note: 'Small, steady' },
    { name: 'Client E', monthlyAmount: 3_400,  status: 'fragile', note: 'Short expected lifetime' },
  ],

  ytdExpenses: {
    monthsElapsed: 4,
    totalCurrent: 53_856,
    personalCurrent: 39_409,
    businessCurrent: 15_047,
    totalPrior: 61_017,
    personalPrior: 42_905,
    businessPrior: 18_113,
  },
  fiscalYearRevenue: {
    currentYearLabel: 'FY 2025-26',
    priorYearLabel: 'FY 2024-25',
    currentTotal: 787_871,
    priorTotal: 571_655,
  },
};
