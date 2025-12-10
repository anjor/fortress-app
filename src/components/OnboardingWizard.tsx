// Fortress - Onboarding Wizard
// Collects required inputs to answer "to what age will my money last?" and "how much do I need to earn?"

import React, { useMemo, useState } from 'react';
import { useFortressStore } from '../store';
import { calculatePAYETax } from '../lib/calculations';

type Step = 'household' | 'balances' | 'income' | 'expenses' | 'goals' | 'review';

interface Props {
  onClose: () => void;
}

const currencyPlaceholder = '£0';

export function OnboardingWizard({ onClose }: Props) {
  const store = useFortressStore();
  const config = store.config;

  const currentYear = new Date().getFullYear();

  const [step, setStep] = useState<Step>('household');
  const [errors, setErrors] = useState<string | null>(null);

  const [household, setHousehold] = useState({
    partner1BirthYear: config.partner1BirthYear || currentYear - 40,
    partner2BirthYear: config.partner2BirthYear || currentYear - 39,
    children: Math.max(0, Math.min(config.personalization.numberOfChildren ?? 0, 4)),
    child1BirthYear: config.child1BirthYear || currentYear - 7,
    child2BirthYear: config.child2BirthYear || currentYear - 3,
    child3BirthYear: config.child3BirthYear || currentYear - 1,
    child4BirthYear: config.child4BirthYear || currentYear - 1,
  });

  const [balances, setBalances] = useState({
    date: new Date().toISOString().split('T')[0],
    currentAccounts: '',
    savingsAccounts: '',
    isas: '',
    pensions: '',
    taxableAccounts: '',
    houseEquity: '',
    businessAssets: '',
    investmentAssets: '',
  });

  const [income, setIncome] = useState({
    partner1IncomeMode: config.partner1IncomeMode,
    partner1BusinessRevenue: formatInput(config.partner1BusinessRevenue),
    partner1EmployedSalary: formatInput(config.partner1EmployedSalary),
    partner2GrossAnnual: formatInput(config.partner2GrossAnnual),
  });

  const [expenses, setExpenses] = useState({
    personalExpensesYTD: '',
    businessExpensesYTD: '',
    annualSchoolFeePerChild: formatInput(config.annualSchoolFeePerChild),
  });

  const [goals, setGoals] = useState({
    fiTargetMode: config.fiTargetMode,
    fiTargetMultiple: config.fiTargetMultiple.toString(),
    fiTargetAmount: formatInput(config.fiTargetAmount ?? 0),
    inheritanceAmount: formatInput(config.inheritanceAmount ?? 0),
    inheritancePartner1Age: (config.inheritancePartner1Age || 50).toString(),
    investmentExitGross: formatInput(config.investmentExitGross ?? 0),
    investmentCostBasis: formatInput(config.investmentCostBasis ?? 0),
    investmentExitPartner1Age: (config.investmentExitPartner1Age || 45).toString(),
    universityAnnualCost: formatInput(config.universityAnnualCost ?? 0),
    universityYears: (config.universityYears || 4).toString(),
  });

  const totalBalance = useMemo(() => {
    return [
      balances.currentAccounts,
      balances.savingsAccounts,
      balances.isas,
      balances.pensions,
      balances.taxableAccounts,
      balances.houseEquity,
      balances.businessAssets,
      balances.investmentAssets,
    ]
      .map(parseAmount)
      .reduce((a, b) => a + b, 0);
  }, [balances]);

  const steps: { id: Step; label: string }[] = [
    { id: 'household', label: 'Household' },
    { id: 'balances', label: 'Balances' },
    { id: 'income', label: 'Income' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'goals', label: 'Goals' },
    { id: 'review', label: 'Review' },
  ];

  const goNext = () => {
    setErrors(null);
    const idx = steps.findIndex(s => s.id === step);
    if (idx < steps.length - 1) {
      setStep(steps[idx + 1].id);
    }
  };

  const goBack = () => {
    setErrors(null);
    const idx = steps.findIndex(s => s.id === step);
    if (idx > 0) {
      setStep(steps[idx - 1].id);
    }
  };

  const validateStep = (): boolean => {
    if (step === 'balances' && totalBalance <= 0) {
      setErrors('Please enter at least one balance.');
      return false;
    }
    if (step === 'goals' && goals.fiTargetMode === 'amount' && parseAmount(goals.fiTargetAmount) <= 0) {
      setErrors('Enter your FI target amount.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    goNext();
  };

  const handleComplete = () => {
    setErrors(null);

    const partner2Gross = parseAmount(income.partner2GrossAnnual);
    const partner2Net = partner2Gross > 0 ? partner2Gross - calculatePAYETax(partner2Gross) : 0;
    const partner1Revenue =
      income.partner1IncomeMode === 'business'
        ? parseAmount(income.partner1BusinessRevenue)
        : parseAmount(income.partner1EmployedSalary);

    const configUpdate = {
      partner1BirthYear: household.partner1BirthYear,
      partner2BirthYear: household.partner2BirthYear,
      child1BirthYear: household.child1BirthYear,
      child2BirthYear: household.child2BirthYear,
      child3BirthYear: household.child3BirthYear,
      child4BirthYear: household.child4BirthYear,
      partner1IncomeMode: income.partner1IncomeMode as 'business' | 'employed',
      partner1BusinessRevenue: parseAmount(income.partner1BusinessRevenue),
      partner1EmployedSalary: parseAmount(income.partner1EmployedSalary),
      partner2SalaryInputMode: 'gross' as const,
      partner2GrossAnnual: partner2Gross,
      partner2NetAnnual: partner2Net,
      annualSchoolFeePerChild: parseAmount(expenses.annualSchoolFeePerChild),
      fiTargetMode: goals.fiTargetMode as 'multiplier' | 'amount',
      fiTargetMultiple: parseFloat(goals.fiTargetMultiple) || 25,
      fiTargetAmount: parseAmount(goals.fiTargetAmount),
      inheritanceAmount: parseAmount(goals.inheritanceAmount),
      inheritancePartner1Age: parseInt(goals.inheritancePartner1Age, 10) || 50,
      investmentExitGross: parseAmount(goals.investmentExitGross),
      investmentCostBasis: parseAmount(goals.investmentCostBasis),
      investmentExitPartner1Age: parseInt(goals.investmentExitPartner1Age, 10) || 45,
      universityAnnualCost: parseAmount(goals.universityAnnualCost),
      universityYears: parseInt(goals.universityYears, 10) || 4,
      personalization: {
        ...config.personalization,
        numberOfChildren: household.children,
      },
    };

    const snapshot = {
      id: crypto.randomUUID(),
      date: new Date(balances.date),
      currentAccounts: parseAmount(balances.currentAccounts),
      savingsAccounts: parseAmount(balances.savingsAccounts),
      isas: parseAmount(balances.isas),
      pensions: parseAmount(balances.pensions),
      taxableAccounts: parseAmount(balances.taxableAccounts),
      houseEquity: parseAmount(balances.houseEquity),
      businessAssets: parseAmount(balances.businessAssets),
      investmentAssets: parseAmount(balances.investmentAssets),
      total: totalBalance,
      businessRevenueYTD: partner1Revenue,
      partner2IncomeYTD: partner2Net,
      personalExpensesYTD: parseAmount(expenses.personalExpensesYTD),
      businessExpensesYTD: parseAmount(expenses.businessExpensesYTD),
      totalExpensesYTD: parseAmount(expenses.personalExpensesYTD) + parseAmount(expenses.businessExpensesYTD),
    };

    store.updateConfig(configUpdate);
    store.updateSnapshot(snapshot);
    store.markOnboardingComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <p className="text-xs uppercase text-gray-400 font-semibold tracking-wider">Onboarding</p>
            <h2 className="text-xl font-semibold text-gray-900">Answer the two questions</h2>
            <p className="text-sm text-gray-600">We’ll calculate how long your money lasts and the income you need.</p>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2 text-xs text-gray-500">
          {steps.map((s, idx) => {
            const isActive = s.id === step;
            const isDone = steps.findIndex(st => st.id === step) > idx;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                    isActive ? 'border-gray-900 text-gray-900' : isDone ? 'border-gray-400 text-gray-600' : 'border-gray-200 text-gray-400'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className={`whitespace-nowrap ${isActive ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {s.label}
                </span>
                {idx < steps.length - 1 && <div className="w-8 border-t border-dashed border-gray-200" />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {step === 'household' && (
            <div className="space-y-6">
              <Section title="Who’s in the plan?">
                <div className="grid grid-cols-2 gap-4">
                  <NumberInput
                    label="Your birth year"
                    value={household.partner1BirthYear.toString()}
                    onChange={(v) => setHousehold(h => ({ ...h, partner1BirthYear: toInt(v, h.partner1BirthYear) }))}
                  />
                  <NumberInput
                    label="Partner birth year (optional)"
                    value={household.partner2BirthYear.toString()}
                    onChange={(v) => setHousehold(h => ({ ...h, partner2BirthYear: toInt(v, h.partner2BirthYear) }))}
                  />
                  <NumberInput
                    label="Children"
                    value={household.children.toString()}
                    onChange={(v) => setHousehold(h => ({ ...h, children: clamp(toInt(v, h.children), 0, 4) }))}
                  />
                </div>
                {household.children > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].slice(0, household.children).map((idx) => (
                      <NumberInput
                        key={idx}
                        label={`Child ${idx} birth year`}
                        value={(household as any)[`child${idx}BirthYear`]?.toString() ?? ''}
                        onChange={(v) =>
                          setHousehold(h => ({ ...h, [`child${idx}BirthYear`]: toInt(v, currentYear - 5) } as any))
                        }
                      />
                    ))}
                  </div>
                )}
              </Section>
            </div>
          )}

          {step === 'balances' && (
            <div className="space-y-6">
              <Section title="Balances today">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Snapshot date"
                    type="date"
                    value={balances.date}
                    onChange={(v) => setBalances(b => ({ ...b, date: v }))}
                  />
                  <div className="flex items-end justify-end text-sm text-gray-600">
                    <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                      Total: <span className="font-semibold text-gray-900">{formatCurrency(totalBalance)}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'currentAccounts', label: 'Current accounts' },
                    { key: 'savingsAccounts', label: 'Savings' },
                    { key: 'isas', label: 'ISAs' },
                    { key: 'pensions', label: 'Pensions' },
                    { key: 'taxableAccounts', label: 'Taxable (GIA)' },
                    { key: 'houseEquity', label: 'Property equity' },
                    { key: 'businessAssets', label: 'Business cash/assets' },
                    { key: 'investmentAssets', label: 'Investment company assets' },
                  ].map((field) => (
                    <Input
                      key={field.key}
                      label={field.label}
                      placeholder={currencyPlaceholder}
                      value={(balances as any)[field.key]}
                      onChange={(v) => setBalances(b => ({ ...b, [field.key]: v }))}
                    />
                  ))}
                </div>
              </Section>
            </div>
          )}

          {step === 'income' && (
            <div className="space-y-6">
              <Section title="Income">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Your income type"
                    value={income.partner1IncomeMode}
                    options={[
                      { label: 'Ltd/contractor (salary + dividends)', value: 'business' },
                      { label: 'PAYE employment', value: 'employed' },
                    ]}
                    onChange={(v) => setIncome(i => ({ ...i, partner1IncomeMode: v as 'business' | 'employed' }))}
                  />
                  {income.partner1IncomeMode === 'business' ? (
                    <Input
                      label="Business revenue (annual)"
                      placeholder="£120,000"
                      value={income.partner1BusinessRevenue}
                      onChange={(v) => setIncome(i => ({ ...i, partner1BusinessRevenue: v }))}
                    />
                  ) : (
                    <Input
                      label="Gross salary (annual)"
                      placeholder="£70,000"
                      value={income.partner1EmployedSalary}
                      onChange={(v) => setIncome(i => ({ ...i, partner1EmployedSalary: v }))}
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Partner gross (annual, optional)"
                    placeholder="£45,000"
                    value={income.partner2GrossAnnual}
                    onChange={(v) => setIncome(i => ({ ...i, partner2GrossAnnual: v }))}
                  />
                </div>
              </Section>
            </div>
          )}

          {step === 'expenses' && (
            <div className="space-y-6">
              <Section title="Expenses (YTD)">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Personal expenses YTD"
                    placeholder="£40,000"
                    value={expenses.personalExpensesYTD}
                    onChange={(v) => setExpenses(e => ({ ...e, personalExpensesYTD: v }))}
                  />
                  <Input
                    label="Business expenses YTD"
                    placeholder="£15,000"
                    value={expenses.businessExpensesYTD}
                    onChange={(v) => setExpenses(e => ({ ...e, businessExpensesYTD: v }))}
                  />
                  <Input
                    label="School fees (per child, annual)"
                    placeholder="£18,000"
                    value={expenses.annualSchoolFeePerChild}
                    onChange={(v) => setExpenses(e => ({ ...e, annualSchoolFeePerChild: v }))}
                  />
                </div>
              </Section>
            </div>
          )}

          {step === 'goals' && (
            <div className="space-y-6">
              <Section title="Goals & assumptions">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="FI target mode"
                    value={goals.fiTargetMode}
                    options={[
                      { label: 'Multiplier of expenses', value: 'multiplier' },
                      { label: 'Fixed amount', value: 'amount' },
                    ]}
                    onChange={(v) => setGoals(g => ({ ...g, fiTargetMode: v as 'multiplier' | 'amount' }))}
                  />
                  {goals.fiTargetMode === 'multiplier' ? (
                    <Input
                      label="Multiplier (e.g., 25×)"
                      placeholder="25"
                      value={goals.fiTargetMultiple}
                      onChange={(v) => setGoals(g => ({ ...g, fiTargetMultiple: v }))}
                    />
                  ) : (
                    <Input
                      label="FI target amount"
                      placeholder="£1,500,000"
                      value={goals.fiTargetAmount}
                      onChange={(v) => setGoals(g => ({ ...g, fiTargetAmount: v }))}
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Inheritance (amount)"
                    placeholder="£0"
                    value={goals.inheritanceAmount}
                    onChange={(v) => setGoals(g => ({ ...g, inheritanceAmount: v }))}
                  />
                  <Input
                    label="Inheritance received at your age"
                    placeholder="50"
                    value={goals.inheritancePartner1Age}
                    onChange={(v) => setGoals(g => ({ ...g, inheritancePartner1Age: v }))}
                  />
                  <Input
                    label="Liquidity event gross"
                    placeholder="£0"
                    value={goals.investmentExitGross}
                    onChange={(v) => setGoals(g => ({ ...g, investmentExitGross: v }))}
                  />
                  <Input
                    label="Liquidity cost basis"
                    placeholder="£0"
                    value={goals.investmentCostBasis}
                    onChange={(v) => setGoals(g => ({ ...g, investmentCostBasis: v }))}
                  />
                  <Input
                    label="Liquidity event at your age"
                    placeholder="45"
                    value={goals.investmentExitPartner1Age}
                    onChange={(v) => setGoals(g => ({ ...g, investmentExitPartner1Age: v }))}
                  />
                  <Input
                    label="University cost per year (per child)"
                    placeholder="£30,000"
                    value={goals.universityAnnualCost}
                    onChange={(v) => setGoals(g => ({ ...g, universityAnnualCost: v }))}
                  />
                  <Input
                    label="University years supported"
                    placeholder="4"
                    value={goals.universityYears}
                    onChange={(v) => setGoals(g => ({ ...g, universityYears: v }))}
                  />
                </div>
              </Section>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <Section title="Quick review">
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>Balances total: {formatCurrency(totalBalance)}</li>
                  <li>
                    Income: {income.partner1IncomeMode === 'business' ? 'Business' : 'PAYE'} — {formatCurrency(parseAmount(income.partner1IncomeMode === 'business' ? income.partner1BusinessRevenue : income.partner1EmployedSalary))}
                    {parseAmount(income.partner2GrossAnnual) > 0 && ` + Partner ${formatCurrency(parseAmount(income.partner2GrossAnnual))} gross`}
                  </li>
                  <li>Expenses YTD: {formatCurrency(parseAmount(expenses.personalExpensesYTD) + parseAmount(expenses.businessExpensesYTD))}</li>
                  <li>
                    FI target: {goals.fiTargetMode === 'multiplier'
                      ? `${goals.fiTargetMultiple}× expenses`
                      : formatCurrency(parseAmount(goals.fiTargetAmount))}
                  </li>
                </ul>
              </Section>
              <p className="text-sm text-gray-600">
                We’ll create your first snapshot, run scenarios, and show “money lasts to age” and “income needed” tables.
              </p>
            </div>
          )}

          {errors && <p className="text-sm text-red-600">{errors}</p>}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">You can tweak settings later.</div>
          <div className="flex gap-3">
            {step !== 'household' && (
              <button
                onClick={goBack}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
            )}
            {step !== 'review' ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                See results
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'date';
  placeholder?: string;
}) {
  return (
    <label className="block text-sm text-gray-700 space-y-1">
      <span className="text-xs text-gray-500">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
      />
    </label>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Input
      label={label}
      value={value}
      onChange={onChange}
      type="text"
    />
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="block text-sm text-gray-700 space-y-1">
      <span className="text-xs text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

function parseAmount(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = value.replace(/[£,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatInput(value: number): string {
  if (!value) return '';
  return value.toString();
}

function toInt(val: string, fallback: number): number {
  const num = parseInt(val, 10);
  return isNaN(num) ? fallback : num;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export default OnboardingWizard;
