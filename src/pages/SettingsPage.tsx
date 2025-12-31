// Fortress Settings Page
// Comprehensive configuration page with all settings consolidated

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { X, Check, RefreshCw } from 'lucide-react';
import { useFortressStore } from '../store';
import { DataEntryModal } from '../components/DataEntryModal';
import type { FortressConfig } from '../types';
import { calculatePAYETax, calculateGrossFromNet, calculateInvestmentExitNet } from '../lib/calculations';

export function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = useFortressStore(state => state.config);
  const latestSnapshot = useFortressStore(state => state.latestSnapshot);
  const updateConfig = useFortressStore(state => state.updateConfig);
  const markOnboardingComplete = useFortressStore(state => state.markOnboardingComplete);

  const isNewUser = location.state?.isNewUser === true;

  // Modal state
  const [showDataEntry, setShowDataEntry] = useState(false);

  // Local form state - Family
  const [partner1BirthYear, setPartner1BirthYear] = useState(config.partner1BirthYear);
  const [partner2BirthYear, setPartner2BirthYear] = useState(config.partner2BirthYear);
  const [child1BirthYear, setChild1BirthYear] = useState(config.child1BirthYear);
  const [child2BirthYear, setChild2BirthYear] = useState(config.child2BirthYear);
  const [numberOfChildren, setNumberOfChildren] = useState(config.personalization.numberOfChildren.toString());

  const [partner1WorksUntilAge, setPartner1WorksUntilAge] = useState(
    config.partner1WorksUntilAge?.toString() ?? ''
  );
  const [partner2WorksUntilAge, setPartner2WorksUntilAge] = useState(
    config.partner2WorksUntilAge?.toString() ?? ''
  );

  // Local form state - Income
  const [partner1IncomeMode, setPartner1IncomeMode] = useState<'business' | 'employed'>(
    config.partner1IncomeMode
  );
  const [partner1BusinessRevenue, setPartner1BusinessRevenue] = useState(
    config.partner1BusinessRevenue.toString()
  );
  const [partner1EmployedSalary, setPartner1EmployedSalary] = useState(
    config.partner1EmployedSalary.toString()
  );
  const [partner1SalaryInputMode, setPartner1SalaryInputMode] = useState<'gross' | 'net'>('gross');
  const [partner1NetAnnual, setPartner1NetAnnual] = useState('');

  const [partner2SalaryInputMode, setPartner2SalaryInputMode] = useState<'gross' | 'net'>(
    config.partner2SalaryInputMode
  );
  const [partner2GrossAnnual] = useState(
    config.partner2GrossAnnual.toString()
  );
  const [partner2NetAnnual, setPartner2NetAnnual] = useState(
    config.partner2NetAnnual.toString()
  );

  // Windfalls
  const [inheritance, setInheritance] = useState({
    enabled: config.inheritanceAmount > 0,
    amount: config.inheritanceAmount > 0 ? config.inheritanceAmount.toString() : '',
    age: config.inheritancePartner1Age.toString()
  });

  const [investment, setInvestment] = useState({
    enabled: config.investmentExitGross > 0,
    name: config.personalization.investmentName || 'Investment',
    costBasis: config.investmentCostBasis > 0 ? config.investmentCostBasis.toString() : '',
    exitGross: config.investmentExitGross > 0 ? config.investmentExitGross.toString() : '',
    age: config.investmentExitPartner1Age.toString()
  });

  // Local form state - Outgoings
  const [annualSchoolFeePerChild, setAnnualSchoolFeePerChild] = useState(
    config.annualSchoolFeePerChild.toString()
  );
  const [houseUpgradeBudget, setHouseUpgradeBudget] = useState(
    config.houseUpgradeBudget.toString()
  );
  const [currentHouseValue, setCurrentHouseValue] = useState(
    config.currentHouseValue.toString()
  );
  const [mortgageRemaining, setMortgageRemaining] = useState(
    config.mortgageRemaining.toString()
  );
  const [universityAnnualCost, setUniversityAnnualCost] = useState(
    config.universityAnnualCost.toString()
  );
  const [universityYears, setUniversityYears] = useState(
    config.universityYears.toString()
  );

  // Partner 2 business mode (NEW)
  const [partner2IncomeMode, setPartner2IncomeMode] = useState<'business' | 'employed'>(
    config.partner2IncomeMode || 'employed'
  );
  const [partner2BusinessRevenue, setPartner2BusinessRevenue] = useState(
    (config.partner2BusinessRevenue || 120000).toString()
  );
  const [partner2EmployedSalary, setPartner2EmployedSalary] = useState(
    (config.partner2EmployedSalary || config.partner2GrossAnnual || 45000).toString()
  );

  // Baseline expenses (NEW)
  const [expenseInputMode, setExpenseInputMode] = useState<'monthly' | 'annual'>('monthly');
  const [personalExpensesMonthly, setPersonalExpensesMonthly] = useState(
    (config.personalExpensesMonthly || 5000).toString()
  );
  const [businessExpensesMonthly, setBusinessExpensesMonthly] = useState(
    (config.businessExpensesMonthly || 1000).toString()
  );
  const [personalExpensesAnnual, setPersonalExpensesAnnual] = useState(
    ((config.personalExpensesMonthly || 5000) * 12).toString()
  );
  const [businessExpensesAnnual, setBusinessExpensesAnnual] = useState(
    ((config.businessExpensesMonthly || 1000) * 12).toString()
  );

  // Extras toggles (NEW)
  const [schoolFeesEnabled, setSchoolFeesEnabled] = useState(
    config.schoolFeesEnabled ?? (config.annualSchoolFeePerChild > 0)
  );
  const [houseUpgradeEnabled, setHouseUpgradeEnabled] = useState(
    config.houseUpgradeEnabled ?? (config.houseUpgradeBudget > 0)
  );
  const [universityEnabled, setUniversityEnabled] = useState(
    config.universityEnabled ?? (config.universityAnnualCost > 0)
  );

  // Local form state - Goals
  const [fiTargetMode, setFiTargetMode] = useState<'multiplier' | 'amount'>(
    config.fiTargetMode
  );
  const [fiTargetMultiple, setFiTargetMultiple] = useState(
    config.fiTargetMultiple.toString()
  );
  const [fiTargetAmount, setFiTargetAmount] = useState(
    config.fiTargetAmount?.toString() ?? ''
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Validation
    const newErrors: Record<string, string> = {};
    const currentYear = new Date().getFullYear();
    const currentPartner1Age = currentYear - partner1BirthYear;

    // Birth year validation
    if (partner1BirthYear < 1950 || partner1BirthYear > currentYear) {
      newErrors.partner1BirthYear = 'Must be between 1950 and current year';
    }
    if (partner2BirthYear < 1950 || partner2BirthYear > currentYear) {
      newErrors.partner2BirthYear = 'Must be between 1950 and current year';
    }
    if (child1BirthYear < 2000 || child1BirthYear > currentYear) {
      newErrors.child1BirthYear = 'Must be between 2000 and current year';
    }
    if (child2BirthYear < 2000 || child2BirthYear > currentYear) {
      newErrors.child2BirthYear = 'Must be between 2000 and current year';
    }

    // Working age validation (if provided)
    if (partner1WorksUntilAge.trim() !== '') {
      const age = parseInt(partner1WorksUntilAge);
      if (isNaN(age) || age < 40 || age > 75) {
        newErrors.partner1WorksUntilAge = 'Must be between 40 and 75';
      } else {
        const currentAge = currentYear - partner1BirthYear;
        if (age < currentAge) {
          newErrors.partner1WorksUntilAge = `Must be >= current age (${currentAge})`;
        }
      }
    }

    if (partner2WorksUntilAge.trim() !== '') {
      const age = parseInt(partner2WorksUntilAge);
      if (isNaN(age) || age < 40 || age > 75) {
        newErrors.partner2WorksUntilAge = 'Must be between 40 and 75';
      } else {
        const currentAge = currentYear - partner2BirthYear;
        if (age < currentAge) {
          newErrors.partner2WorksUntilAge = `Must be >= current age (${currentAge})`;
        }
      }
    }

    // Income validation
    const partner1BizRev = parseFloat(partner1BusinessRevenue.replace(/[£,]/g, ''));
    if (isNaN(partner1BizRev) || partner1BizRev < 0 || partner1BizRev > 2000000) {
      newErrors.partner1BusinessRevenue = 'Must be between £0 and £2,000,000';
    }

    const partner1EmpSal = parseFloat(partner1EmployedSalary.replace(/[£,]/g, ''));
    if (isNaN(partner1EmpSal) || partner1EmpSal < 0 || partner1EmpSal > 1000000) {
      newErrors.partner1EmployedSalary = 'Must be between £0 and £1,000,000';
    }

    const partner1Net = parseFloat(partner1NetAnnual.replace(/[£,]/g, ''));
    if (partner1NetAnnual && (isNaN(partner1Net) || partner1Net < 0 || partner1Net > 1000000)) {
      newErrors.partner1NetAnnual = 'Must be between £0 and £1,000,000';
    }

    const partner2Gross = parseFloat(partner2GrossAnnual.replace(/[£,]/g, ''));
    if (isNaN(partner2Gross) || partner2Gross < 0 || partner2Gross > 500000) {
      newErrors.partner2GrossAnnual = 'Must be between £0 and £500,000';
    }

    const partner2Net = parseFloat(partner2NetAnnual.replace(/[£,]/g, ''));
    if (isNaN(partner2Net) || partner2Net < 0 || partner2Net > 500000) {
      newErrors.partner2NetAnnual = 'Must be between £0 and £500,000';
    }

    // Partner 2 business revenue validation (NEW)
    const partner2BizRev = parseFloat(partner2BusinessRevenue.replace(/[£,]/g, ''));
    if (isNaN(partner2BizRev) || partner2BizRev < 0 || partner2BizRev > 2000000) {
      newErrors.partner2BusinessRevenue = 'Must be between £0 and £2,000,000';
    }

    // Partner 2 employed salary validation (NEW)
    const partner2EmpSal = parseFloat(partner2EmployedSalary.replace(/[£,]/g, ''));
    if (isNaN(partner2EmpSal) || partner2EmpSal < 0 || partner2EmpSal > 500000) {
      newErrors.partner2EmployedSalary = 'Must be between £0 and £500,000';
    }

    // Baseline expenses validation (handle both monthly and annual)
    if (expenseInputMode === 'monthly') {
      const personalExp = parseFloat(personalExpensesMonthly.replace(/[£,]/g, ''));
      if (isNaN(personalExp) || personalExp < 0 || personalExp > 50000) {
        newErrors.personalExpensesMonthly = 'Must be between £0 and £50,000';
      }

      const businessExp = parseFloat(businessExpensesMonthly.replace(/[£,]/g, ''));
      if (isNaN(businessExp) || businessExp < 0 || businessExp > 20000) {
        newErrors.businessExpensesMonthly = 'Must be between £0 and £20,000';
      }
    } else {
      const personalExp = parseFloat(personalExpensesAnnual.replace(/[£,]/g, ''));
      if (isNaN(personalExp) || personalExp < 0 || personalExp > 600000) {
        newErrors.personalExpensesAnnual = 'Must be between £0 and £600,000';
      }

      const businessExp = parseFloat(businessExpensesAnnual.replace(/[£,]/g, ''));
      if (isNaN(businessExp) || businessExp < 0 || businessExp > 240000) {
        newErrors.businessExpensesAnnual = 'Must be between £0 and £240,000';
      }
    }

    // Extras validation (only if enabled) (NEW)
    if (schoolFeesEnabled) {
      const schoolFee = parseFloat(annualSchoolFeePerChild.replace(/[£,]/g, ''));
      if (isNaN(schoolFee) || schoolFee < 0 || schoolFee > 100000) {
        newErrors.annualSchoolFeePerChild = 'Must be between £0 and £100,000';
      }
    }

    if (houseUpgradeEnabled) {
      const houseCurrent = parseFloat(currentHouseValue.replace(/[£,]/g, ''));
      if (isNaN(houseCurrent) || houseCurrent < 0 || houseCurrent > 10000000) {
        newErrors.currentHouseValue = 'Must be between £0 and £10,000,000';
      }

      const houseBudget = parseFloat(houseUpgradeBudget.replace(/[£,]/g, ''));
      if (isNaN(houseBudget) || houseBudget < 0 || houseBudget > 10000000) {
        newErrors.houseUpgradeBudget = 'Must be between £0 and £10,000,000';
      }

      const mortgage = parseFloat(mortgageRemaining.replace(/[£,]/g, ''));
      if (isNaN(mortgage) || mortgage < 0 || mortgage > 5000000) {
        newErrors.mortgageRemaining = 'Must be between £0 and £5,000,000';
      }
    }

    if (universityEnabled) {
      const uniCost = parseFloat(universityAnnualCost.replace(/[£,]/g, ''));
      if (isNaN(uniCost) || uniCost < 0 || uniCost > 100000) {
        newErrors.universityAnnualCost = 'Must be between £0 and £100,000';
      }

      const uniYears = parseInt(universityYears);
      if (isNaN(uniYears) || uniYears < 1 || uniYears > 10) {
        newErrors.universityYears = 'Must be between 1 and 10';
      }
    }

    // Windfall validation (only if enabled)
    if (inheritance.enabled) {
      const amount = parseFloat(inheritance.amount.replace(/[£,]/g, ''));
      if (isNaN(amount) || amount <= 0 || amount > 10000000) {
        newErrors.inheritanceAmount = 'Must be between £1 and £10,000,000';
      }

      const age = parseInt(inheritance.age);
      if (isNaN(age) || age < currentPartner1Age || age > 75) {
        newErrors.inheritanceAge = `Must be between ${currentPartner1Age} and 75`;
      }
    }

    if (investment.enabled) {
      if (!investment.name || investment.name.trim().length === 0) {
        newErrors.investmentName = 'Investment name is required';
      } else if (investment.name.length > 50) {
        newErrors.investmentName = 'Maximum 50 characters';
      }

      const exitGross = parseFloat(investment.exitGross.replace(/[£,]/g, ''));
      if (isNaN(exitGross) || exitGross <= 0 || exitGross > 10000000) {
        newErrors.investmentExitGross = 'Must be between £1 and £10,000,000';
      }

      const costBasis = parseFloat(investment.costBasis.replace(/[£,]/g, ''));
      if (isNaN(costBasis) || costBasis < 0 || costBasis > 10000000) {
        newErrors.investmentCostBasis = 'Must be between £0 and £10,000,000';
      }

      if (!isNaN(exitGross) && !isNaN(costBasis) && costBasis > exitGross) {
        newErrors.investmentCostBasis = 'Cost basis exceeds exit gross (loss scenario)';
      }

      const age = parseInt(investment.age);
      if (isNaN(age) || age < currentPartner1Age || age > 75) {
        newErrors.investmentAge = `Must be between ${currentPartner1Age} and 75`;
      }
    }

    // Outgoings validation
    const schoolFee = parseFloat(annualSchoolFeePerChild.replace(/[£,]/g, ''));
    if (isNaN(schoolFee) || schoolFee < 0 || schoolFee > 100000) {
      newErrors.annualSchoolFeePerChild = 'Must be between £0 and £100,000';
    }

    const houseBudget = parseFloat(houseUpgradeBudget.replace(/[£,]/g, ''));
    if (isNaN(houseBudget) || houseBudget < 0 || houseBudget > 5000000) {
      newErrors.houseUpgradeBudget = 'Must be between £0 and £5,000,000';
    }

    const houseValue = parseFloat(currentHouseValue.replace(/[£,]/g, ''));
    if (isNaN(houseValue) || houseValue < 0 || houseValue > 5000000) {
      newErrors.currentHouseValue = 'Must be between £0 and £5,000,000';
    }

    const mortgage = parseFloat(mortgageRemaining.replace(/[£,]/g, ''));
    if (isNaN(mortgage) || mortgage < 0 || mortgage > 5000000) {
      newErrors.mortgageRemaining = 'Must be between £0 and £5,000,000';
    }

    const uniCost = parseFloat(universityAnnualCost.replace(/[£,]/g, ''));
    if (isNaN(uniCost) || uniCost < 0 || uniCost > 100000) {
      newErrors.universityAnnualCost = 'Must be between £0 and £100,000';
    }

    const uniYears = parseInt(universityYears);
    if (isNaN(uniYears) || uniYears < 0 || uniYears > 10) {
      newErrors.universityYears = 'Must be between 0 and 10';
    }

    // FI target validation
    if (fiTargetMode === 'multiplier') {
      const mult = parseFloat(fiTargetMultiple);
      if (isNaN(mult) || mult < 10 || mult > 50) {
        newErrors.fiTargetMultiple = 'Must be between 10 and 50';
      }
    } else {
      const amt = parseFloat(fiTargetAmount.replace(/[£,]/g, ''));
      if (isNaN(amt) || amt < 100000) {
        newErrors.fiTargetAmount = 'Must be at least £100,000';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build config update
    const configUpdate: Partial<FortressConfig> = {
      partner1BirthYear,
      partner2BirthYear,
      child1BirthYear,
      child2BirthYear,
      fiTargetMode,

      // Working ages (optional)
      partner1WorksUntilAge: partner1WorksUntilAge.trim() !== '' ? parseInt(partner1WorksUntilAge) : undefined,
      partner2WorksUntilAge: partner2WorksUntilAge.trim() !== '' ? parseInt(partner2WorksUntilAge) : undefined,

      // FI target
      fiTargetMultiple: fiTargetMode === 'multiplier' ? parseFloat(fiTargetMultiple) : config.fiTargetMultiple,
      fiTargetAmount: fiTargetMode === 'amount' ? parseFloat(fiTargetAmount.replace(/[£,]/g, '')) : config.fiTargetAmount,

      // Income
      partner1IncomeMode,
      partner1BusinessRevenue: parseFloat(partner1BusinessRevenue.replace(/[£,]/g, '')),
      partner1EmployedSalary: parseFloat(partner1EmployedSalary.replace(/[£,]/g, '')),
      partner2IncomeMode,
      partner2BusinessRevenue: parseFloat(partner2BusinessRevenue.replace(/[£,]/g, '')),
      partner2EmployedSalary: parseFloat(partner2EmployedSalary.replace(/[£,]/g, '')),
      partner2SalaryInputMode,

      // Windfalls
      inheritanceAmount: inheritance.enabled && inheritance.amount
        ? parseFloat(inheritance.amount.replace(/[£,]/g, ''))
        : 0,
      inheritancePartner1Age: parseInt(inheritance.age) || config.inheritancePartner1Age,
      investmentExitGross: investment.enabled && investment.exitGross
        ? parseFloat(investment.exitGross.replace(/[£,]/g, ''))
        : 0,
      investmentCostBasis: investment.costBasis
        ? parseFloat(investment.costBasis.replace(/[£,]/g, ''))
        : 0,
      investmentExitPartner1Age: parseInt(investment.age) || config.investmentExitPartner1Age,

      // Baseline expenses (always store as monthly)
      personalExpensesMonthly: expenseInputMode === 'monthly'
        ? parseFloat(personalExpensesMonthly.replace(/[£,]/g, ''))
        : parseFloat(personalExpensesAnnual.replace(/[£,]/g, '')) / 12,
      businessExpensesMonthly: expenseInputMode === 'monthly'
        ? parseFloat(businessExpensesMonthly.replace(/[£,]/g, ''))
        : parseFloat(businessExpensesAnnual.replace(/[£,]/g, '')) / 12,

      // Extras toggles (NEW)
      schoolFeesEnabled,
      houseUpgradeEnabled,
      universityEnabled,

      // Outgoings (set to 0 if disabled)
      annualSchoolFeePerChild: schoolFeesEnabled
        ? parseFloat(annualSchoolFeePerChild.replace(/[£,]/g, ''))
        : 0,
      houseUpgradeBudget: houseUpgradeEnabled
        ? parseFloat(houseUpgradeBudget.replace(/[£,]/g, ''))
        : 0,
      currentHouseValue: houseUpgradeEnabled
        ? parseFloat(currentHouseValue.replace(/[£,]/g, ''))
        : config.currentHouseValue,
      mortgageRemaining: houseUpgradeEnabled
        ? parseFloat(mortgageRemaining.replace(/[£,]/g, ''))
        : config.mortgageRemaining,
      universityAnnualCost: universityEnabled
        ? parseFloat(universityAnnualCost.replace(/[£,]/g, ''))
        : 0,
      universityYears: universityEnabled
        ? parseInt(universityYears)
        : config.universityYears,

      // Personalization
      personalization: {
        ...config.personalization,
        numberOfChildren: parseInt(numberOfChildren),
        investmentName: investment.name || 'Investment'
      },
    };

    // Calculate dependent field for Partner 1 (only for employed mode)
    if (partner1IncomeMode === 'employed' && partner1SalaryInputMode === 'net') {
      const net = parseFloat(partner1NetAnnual.replace(/[£,]/g, ''));
      const gross = calculateGrossFromNet(net);
      configUpdate.partner1EmployedSalary = gross;
    }

    // Calculate dependent field for Partner 2 (only for employed mode)
    if (partner2IncomeMode === 'employed') {
      if (partner2SalaryInputMode === 'gross') {
        const gross = parseFloat(partner2EmployedSalary.replace(/[£,]/g, ''));
        const tax = calculatePAYETax(gross);
        configUpdate.partner2GrossAnnual = gross;
        configUpdate.partner2NetAnnual = gross - tax;
      } else {
        const net = parseFloat(partner2NetAnnual.replace(/[£,]/g, ''));
        const gross = calculateGrossFromNet(net);
        configUpdate.partner2NetAnnual = net;
        configUpdate.partner2GrossAnnual = gross;
        configUpdate.partner2EmployedSalary = gross;
      }
    } else {
      // Business mode - keep existing values
      configUpdate.partner2GrossAnnual = config.partner2GrossAnnual;
      configUpdate.partner2NetAnnual = config.partner2NetAnnual;
    }

    // Update config (triggers recalculation)
    updateConfig(configUpdate);

    // Mark onboarding complete if new user
    if (isNewUser) {
      markOnboardingComplete();
    }

    // Show success and navigate
    setSaved(true);
    setTimeout(() => navigate('/'), 1500);
  };

  // Calculate net proceeds for display
  const calculateNetProceeds = () => {
    if (!investment.exitGross) return 0;

    const exitGross = parseFloat(investment.exitGross.replace(/[£,]/g, ''));
    const costBasis = parseFloat(investment.costBasis.replace(/[£,]/g, '')) || 0;

    if (isNaN(exitGross) || exitGross <= 0) return 0;

    const mockConfig = {
      ...config,
      investmentExitGross: exitGross,
      investmentCostBasis: costBasis
    };

    try {
      const result = calculateInvestmentExitNet(mockConfig);
      return result.additionalValue;
    } catch {
      return 0;
    }
  };

  if (saved) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-lg font-medium text-gray-900">Settings Saved!</p>
            <p className="text-sm text-gray-500 mt-1">
              {isNewUser ? 'Redirecting to dashboard...' : 'All projections updated.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <nav className="text-sm text-gray-500 mb-1">
              <Link to="/" className="hover:text-gray-900">Dashboard</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">Settings</span>
            </nav>
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          </div>

          <button
            onClick={() => navigate('/')}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome Banner (new users only) */}
        {isNewUser && (
          <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Welcome to Fortress!
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Let's set up your household and FI planning parameters.
              After configuring your settings, you'll add your first financial snapshot to see projections.
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>✓ Configure family details and working ages</li>
              <li>✓ Set income sources and windfalls</li>
              <li>✓ Define outgoings and FI target</li>
              <li>✓ Add your first snapshot to unlock projections</li>
            </ul>
          </div>
        )}

        {/* Section 1: Family Circumstances */}
        <section className="border-b border-gray-100 pb-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Family Circumstances</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Number of Children</label>
              <select
                value={numberOfChildren}
                onChange={(e) => setNumberOfChildren(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="0">0 children</option>
                <option value="1">1 child</option>
                <option value="2">2 children</option>
                <option value="3">3 children</option>
                <option value="4">4 children</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Partner 1 Birth Year</label>
                <input
                  type="number"
                  value={partner1BirthYear}
                  onChange={(e) => setPartner1BirthYear(parseInt(e.target.value) || 1985)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                {errors.partner1BirthYear && (
                  <p className="text-xs text-red-600 mt-1">{errors.partner1BirthYear}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Partner 2 Birth Year</label>
                <input
                  type="number"
                  value={partner2BirthYear}
                  onChange={(e) => setPartner2BirthYear(parseInt(e.target.value) || 1986)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                {errors.partner2BirthYear && (
                  <p className="text-xs text-red-600 mt-1">{errors.partner2BirthYear}</p>
                )}
              </div>

              {parseInt(numberOfChildren) >= 1 && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Child 1 Birth Year</label>
                  <input
                    type="number"
                    value={child1BirthYear}
                    onChange={(e) => setChild1BirthYear(parseInt(e.target.value) || 2018)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  {errors.child1BirthYear && (
                    <p className="text-xs text-red-600 mt-1">{errors.child1BirthYear}</p>
                  )}
                </div>
              )}

              {parseInt(numberOfChildren) >= 2 && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Child 2 Birth Year</label>
                  <input
                    type="number"
                    value={child2BirthYear}
                    onChange={(e) => setChild2BirthYear(parseInt(e.target.value) || 2022)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                  {errors.child2BirthYear && (
                    <p className="text-xs text-red-600 mt-1">{errors.child2BirthYear}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Working Ages (Optional)</h3>
            <p className="text-xs text-gray-500 mb-3">
              Overrides all scenario presets. Leave blank to use scenario defaults.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Partner 1 works until age</label>
                <input
                  type="text"
                  value={partner1WorksUntilAge}
                  onChange={(e) => setPartner1WorksUntilAge(e.target.value)}
                  placeholder="e.g., 50"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                {errors.partner1WorksUntilAge && (
                  <p className="text-xs text-red-600 mt-1">{errors.partner1WorksUntilAge}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Partner 2 works until age</label>
                <input
                  type="text"
                  value={partner2WorksUntilAge}
                  onChange={(e) => setPartner2WorksUntilAge(e.target.value)}
                  placeholder="e.g., 50"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                {errors.partner2WorksUntilAge && (
                  <p className="text-xs text-red-600 mt-1">{errors.partner2WorksUntilAge}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Incomings */}
        <section className="border-b border-gray-100 pb-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Incomings</h2>

          {/* Partner 1 Income Mode */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Partner 1's Income
            </label>
            <div className="space-y-3">
              {/* Business option */}
              <button
                type="button"
                onClick={() => setPartner1IncomeMode('business')}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  partner1IncomeMode === 'business'
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    partner1IncomeMode === 'business' ? 'border-gray-900' : 'border-gray-300'
                  }`}>
                    {partner1IncomeMode === 'business' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-2">
                      Contractor / Business (Ltd Company)
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Business revenue: £</span>
                      <input
                        type="text"
                        value={partner1BusinessRevenue}
                        onChange={(e) => setPartner1BusinessRevenue(e.target.value)}
                        disabled={partner1IncomeMode !== 'business'}
                        placeholder="300,000"
                        className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 disabled:bg-gray-50"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Optimal salary/dividend extraction via Ltd company
                    </p>
                    {errors.partner1BusinessRevenue && (
                      <p className="text-xs text-red-600 mt-1">{errors.partner1BusinessRevenue}</p>
                    )}
                  </div>
                </div>
              </button>

              {/* Employed option */}
              <button
                type="button"
                onClick={() => setPartner1IncomeMode('employed')}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  partner1IncomeMode === 'employed'
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    partner1IncomeMode === 'employed' ? 'border-gray-900' : 'border-gray-300'
                  }`}>
                    {partner1IncomeMode === 'employed' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-2">
                      Employed (PAYE)
                    </div>

                    {/* Gross/Net toggle within Employed mode */}
                    {partner1IncomeMode === 'employed' && (
                      <div className="space-y-2 mt-3">
                        {/* Gross input option */}
                        <div
                          onClick={(e) => { e.stopPropagation(); setPartner1SalaryInputMode('gross'); }}
                          className={`p-3 rounded border cursor-pointer ${
                            partner1SalaryInputMode === 'gross'
                              ? 'border-gray-900 bg-white'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center mb-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-2 ${
                              partner1SalaryInputMode === 'gross' ? 'border-gray-900' : 'border-gray-300'
                            }`}>
                              {partner1SalaryInputMode === 'gross' && (
                                <div className="w-2 h-2 rounded-full bg-gray-900" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900">Enter Gross Salary</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Gross: £</span>
                            <input
                              type="text"
                              value={partner1EmployedSalary}
                              onChange={(e) => { e.stopPropagation(); setPartner1EmployedSalary(e.target.value); }}
                              onClick={(e) => e.stopPropagation()}
                              disabled={partner1SalaryInputMode !== 'gross'}
                              placeholder="70,000"
                              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 disabled:bg-gray-50"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Net will be calculated automatically
                          </p>
                          {errors.partner1EmployedSalary && (
                            <p className="text-xs text-red-600 mt-1">{errors.partner1EmployedSalary}</p>
                          )}
                        </div>

                        {/* Net input option */}
                        <div
                          onClick={(e) => { e.stopPropagation(); setPartner1SalaryInputMode('net'); }}
                          className={`p-3 rounded border cursor-pointer ${
                            partner1SalaryInputMode === 'net'
                              ? 'border-gray-900 bg-white'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center mb-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-2 ${
                              partner1SalaryInputMode === 'net' ? 'border-gray-900' : 'border-gray-300'
                            }`}>
                              {partner1SalaryInputMode === 'net' && (
                                <div className="w-2 h-2 rounded-full bg-gray-900" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900">Enter Net Income</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Net: £</span>
                            <input
                              type="text"
                              value={partner1NetAnnual}
                              onChange={(e) => { e.stopPropagation(); setPartner1NetAnnual(e.target.value); }}
                              onClick={(e) => e.stopPropagation()}
                              disabled={partner1SalaryInputMode !== 'net'}
                              placeholder="50,000"
                              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 disabled:bg-gray-50"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Gross will be back-calculated using UK PAYE tax
                          </p>
                          {errors.partner1NetAnnual && (
                            <p className="text-xs text-red-600 mt-1">{errors.partner1NetAnnual}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {partner1IncomeMode !== 'employed' && (
                      <p className="text-xs text-gray-500 mt-2">
                        Standard PAYE tax (income tax + NI)
                      </p>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Partner 2 Income Mode */}
          <div className="border-t border-gray-100 pt-6 mb-6">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Partner 2's Income
            </label>
            <div className="space-y-3">
              {/* Business option */}
              <button
                type="button"
                onClick={() => setPartner2IncomeMode('business')}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  partner2IncomeMode === 'business'
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    partner2IncomeMode === 'business' ? 'border-gray-900' : 'border-gray-300'
                  }`}>
                    {partner2IncomeMode === 'business' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-2">
                      Contractor / Business (Ltd Company)
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Business revenue: £</span>
                      <input
                        type="text"
                        value={partner2BusinessRevenue}
                        onChange={(e) => setPartner2BusinessRevenue(e.target.value)}
                        disabled={partner2IncomeMode !== 'business'}
                        placeholder="120,000"
                        className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 disabled:bg-gray-50"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Optimal salary/dividend extraction via Ltd company
                    </p>
                    {errors.partner2BusinessRevenue && (
                      <p className="text-xs text-red-600 mt-1">{errors.partner2BusinessRevenue}</p>
                    )}
                  </div>
                </div>
              </button>

              {/* Employed option */}
              <button
                type="button"
                onClick={() => setPartner2IncomeMode('employed')}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  partner2IncomeMode === 'employed'
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    partner2IncomeMode === 'employed' ? 'border-gray-900' : 'border-gray-300'
                  }`}>
                    {partner2IncomeMode === 'employed' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-2">
                      Employed (PAYE)
                    </div>

                    {/* Gross/Net toggle within Employed mode */}
                    {partner2IncomeMode === 'employed' && (
                      <div className="space-y-2 mt-3">
                        {/* Gross input option */}
                        <div
                          onClick={(e) => { e.stopPropagation(); setPartner2SalaryInputMode('gross'); }}
                          className={`p-3 rounded border cursor-pointer ${
                            partner2SalaryInputMode === 'gross'
                              ? 'border-gray-900 bg-white'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center mb-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-2 ${
                              partner2SalaryInputMode === 'gross' ? 'border-gray-900' : 'border-gray-300'
                            }`}>
                              {partner2SalaryInputMode === 'gross' && (
                                <div className="w-2 h-2 rounded-full bg-gray-900" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900">Enter Gross Salary</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Gross: £</span>
                            <input
                              type="text"
                              value={partner2EmployedSalary}
                              onChange={(e) => { e.stopPropagation(); setPartner2EmployedSalary(e.target.value); }}
                              onClick={(e) => e.stopPropagation()}
                              disabled={partner2SalaryInputMode !== 'gross'}
                              placeholder="45,000"
                              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 disabled:bg-gray-50"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Net will be calculated automatically
                          </p>
                          {errors.partner2EmployedSalary && (
                            <p className="text-xs text-red-600 mt-1">{errors.partner2EmployedSalary}</p>
                          )}
                        </div>

                        {/* Net input option */}
                        <div
                          onClick={(e) => { e.stopPropagation(); setPartner2SalaryInputMode('net'); }}
                          className={`p-3 rounded border cursor-pointer ${
                            partner2SalaryInputMode === 'net'
                              ? 'border-gray-900 bg-white'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center mb-2">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-2 ${
                              partner2SalaryInputMode === 'net' ? 'border-gray-900' : 'border-gray-300'
                            }`}>
                              {partner2SalaryInputMode === 'net' && (
                                <div className="w-2 h-2 rounded-full bg-gray-900" />
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900">Enter Net Income</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Net: £</span>
                            <input
                              type="text"
                              value={partner2NetAnnual}
                              onChange={(e) => { e.stopPropagation(); setPartner2NetAnnual(e.target.value); }}
                              onClick={(e) => e.stopPropagation()}
                              disabled={partner2SalaryInputMode !== 'net'}
                              placeholder="35,000"
                              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 disabled:bg-gray-50"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Gross will be back-calculated using UK PAYE tax
                          </p>
                          {errors.partner2NetAnnual && (
                            <p className="text-xs text-red-600 mt-1">{errors.partner2NetAnnual}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {partner2IncomeMode !== 'employed' && (
                      <p className="text-xs text-gray-500 mt-2">
                        Standard PAYE tax (income tax + NI)
                      </p>
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Windfalls */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Windfalls (Optional)</h3>

            {/* Inheritance */}
            <div className="border border-gray-200 rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Inheritance</h4>
                  <p className="text-xs text-gray-500 mt-0.5">One-time inheritance or gift</p>
                </div>
                <button
                  onClick={() => setInheritance(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    inheritance.enabled ? 'bg-gray-900' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    inheritance.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {inheritance.enabled && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Amount</label>
                    <input
                      type="text"
                      value={inheritance.amount}
                      onChange={(e) => setInheritance(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="£200,000"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    {errors.inheritanceAmount && (
                      <p className="text-xs text-red-600 mt-1">{errors.inheritanceAmount}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Receive at Partner 1's Age</label>
                    <input
                      type="text"
                      value={inheritance.age}
                      onChange={(e) => setInheritance(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="50"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    {errors.inheritanceAge && (
                      <p className="text-xs text-red-600 mt-1">{errors.inheritanceAge}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Investment Exit */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Investment Exit / Liquidity Event</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Startup equity, options, or investment company</p>
                </div>
                <button
                  onClick={() => setInvestment(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    investment.enabled ? 'bg-gray-900' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    investment.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {investment.enabled && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Investment Name</label>
                    <input
                      type="text"
                      value={investment.name}
                      onChange={(e) => setInvestment(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Startup, Options, Investment"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    {errors.investmentName && (
                      <p className="text-xs text-red-600 mt-1">{errors.investmentName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Cost Basis</label>
                      <input
                        type="text"
                        value={investment.costBasis}
                        onChange={(e) => setInvestment(prev => ({ ...prev, costBasis: e.target.value }))}
                        placeholder="£50,000"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-400 mt-0.5">What you paid</p>
                      {errors.investmentCostBasis && (
                        <p className="text-xs text-red-600 mt-1">{errors.investmentCostBasis}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Exit Gross Proceeds</label>
                      <input
                        type="text"
                        value={investment.exitGross}
                        onChange={(e) => setInvestment(prev => ({ ...prev, exitGross: e.target.value }))}
                        placeholder="£1,000,000"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-400 mt-0.5">Sale proceeds</p>
                      {errors.investmentExitGross && (
                        <p className="text-xs text-red-600 mt-1">{errors.investmentExitGross}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Exit at Partner 1's Age</label>
                    <input
                      type="text"
                      value={investment.age}
                      onChange={(e) => setInvestment(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="45"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    {errors.investmentAge && (
                      <p className="text-xs text-red-600 mt-1">{errors.investmentAge}</p>
                    )}
                  </div>

                  {investment.exitGross && (
                    <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-xs font-medium text-emerald-800">
                        Net proceeds: ~{formatCurrency(calculateNetProceeds())}
                        <span className="text-emerald-600"> after 25% corporation tax</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 3: Outgoings */}
        <section className="border-b border-gray-100 pb-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Outgoings</h2>
          <p className="text-sm text-gray-600 mb-4">
            Set your baseline expenses (before any extras like school fees).
          </p>

          {/* Monthly/Annual Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setExpenseInputMode('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                expenseInputMode === 'monthly'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setExpenseInputMode('annual')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                expenseInputMode === 'annual'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Annual
            </button>
          </div>

          <div className="space-y-4">
            {expenseInputMode === 'monthly' ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Personal Expenses (Monthly)
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">£</span>
                    <input
                      type="text"
                      value={personalExpensesMonthly}
                      onChange={(e) => setPersonalExpensesMonthly(e.target.value)}
                      placeholder="5,000"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Household: rent/mortgage, groceries, utilities, transport
                  </p>
                  {errors.personalExpensesMonthly && (
                    <p className="text-xs text-red-600 mt-1">{errors.personalExpensesMonthly}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Business Expenses (Monthly)
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">£</span>
                    <input
                      type="text"
                      value={businessExpensesMonthly}
                      onChange={(e) => setBusinessExpensesMonthly(e.target.value)}
                      placeholder="1,000"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Only if self-employed: office, software, accountant, insurance
                  </p>
                  {errors.businessExpensesMonthly && (
                    <p className="text-xs text-red-600 mt-1">{errors.businessExpensesMonthly}</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Personal Expenses (Annual)
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">£</span>
                    <input
                      type="text"
                      value={personalExpensesAnnual}
                      onChange={(e) => setPersonalExpensesAnnual(e.target.value)}
                      placeholder="60,000"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Household: rent/mortgage, groceries, utilities, transport
                  </p>
                  {errors.personalExpensesAnnual && (
                    <p className="text-xs text-red-600 mt-1">{errors.personalExpensesAnnual}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Business Expenses (Annual)
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">£</span>
                    <input
                      type="text"
                      value={businessExpensesAnnual}
                      onChange={(e) => setBusinessExpensesAnnual(e.target.value)}
                      placeholder="12,000"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Only if self-employed: office, software, accountant, insurance
                  </p>
                  {errors.businessExpensesAnnual && (
                    <p className="text-xs text-red-600 mt-1">{errors.businessExpensesAnnual}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Extras Section */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Extras (Optional)</h3>
            <p className="text-xs text-gray-600 mb-4">
              Enable additional expenses for specific scenarios. These are layered on top of baseline expenses.
            </p>

            {/* School Fees Card */}
            <div className="border border-gray-200 rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">School Fees</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Private school for children ages 5-18</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSchoolFeesEnabled(!schoolFeesEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    schoolFeesEnabled ? 'bg-gray-900' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    schoolFeesEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {schoolFeesEnabled && (
                <div className="pt-3 border-t border-gray-100">
                  <label className="block text-xs text-gray-500 mb-1">Annual fee per child</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">£</span>
                    <input
                      type="text"
                      value={annualSchoolFeePerChild}
                      onChange={(e) => setAnnualSchoolFeePerChild(e.target.value)}
                      placeholder="18,000"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Ages 5-18, inflation-adjusted at 5% annually</p>
                  {errors.annualSchoolFeePerChild && (
                    <p className="text-xs text-red-600 mt-1">{errors.annualSchoolFeePerChild}</p>
                  )}
                </div>
              )}
            </div>

            {/* House Upgrade Card */}
            <div className="border border-gray-200 rounded-lg p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">House Upgrade</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Move to larger/better property</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHouseUpgradeEnabled(!houseUpgradeEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    houseUpgradeEnabled ? 'bg-gray-900' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    houseUpgradeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {houseUpgradeEnabled && (
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Current House Value</label>
                      <input
                        type="text"
                        value={currentHouseValue}
                        onChange={(e) => setCurrentHouseValue(e.target.value)}
                        placeholder="£400,000"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      {errors.currentHouseValue && (
                        <p className="text-xs text-red-600 mt-1">{errors.currentHouseValue}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Upgrade Budget</label>
                      <input
                        type="text"
                        value={houseUpgradeBudget}
                        onChange={(e) => setHouseUpgradeBudget(e.target.value)}
                        placeholder="£600,000"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      {errors.houseUpgradeBudget && (
                        <p className="text-xs text-red-600 mt-1">{errors.houseUpgradeBudget}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Mortgage Remaining</label>
                    <input
                      type="text"
                      value={mortgageRemaining}
                      onChange={(e) => setMortgageRemaining(e.target.value)}
                      placeholder="£200,000"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    {errors.mortgageRemaining && (
                      <p className="text-xs text-red-600 mt-1">{errors.mortgageRemaining}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* University Card */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">University Costs</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Support children through university</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUniversityEnabled(!universityEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    universityEnabled ? 'bg-gray-900' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    universityEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {universityEnabled && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Annual Cost per Child</label>
                      <input
                        type="text"
                        value={universityAnnualCost}
                        onChange={(e) => setUniversityAnnualCost(e.target.value)}
                        placeholder="£30,000"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      {errors.universityAnnualCost && (
                        <p className="text-xs text-red-600 mt-1">{errors.universityAnnualCost}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Years Supported</label>
                      <input
                        type="text"
                        value={universityYears}
                        onChange={(e) => setUniversityYears(e.target.value)}
                        placeholder="4"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      {errors.universityYears && (
                        <p className="text-xs text-red-600 mt-1">{errors.universityYears}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 4: Assets */}
        <section className="border-b border-gray-100 pb-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assets & Snapshots</h2>

          <p className="text-sm text-gray-600 mb-4">
            Your current balances are managed as monthly snapshots.
            Configure your settings here, then add snapshots to track progress.
          </p>

          {latestSnapshot ? (
            <>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">
                  Last updated: {new Date(latestSnapshot.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Accounts</span>
                    <span className="font-medium">{formatCurrency(latestSnapshot.currentAccounts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ISAs</span>
                    <span className="font-medium">{formatCurrency(latestSnapshot.isas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pensions</span>
                    <span className="font-medium">{formatCurrency(latestSnapshot.pensions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(latestSnapshot.total)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowDataEntry(true)}
                className="mt-3 flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Update Numbers
              </button>
            </>
          ) : (
            <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-3">No snapshot yet</p>
              <button
                onClick={() => setShowDataEntry(true)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Add First Snapshot
              </button>
            </div>
          )}

          {showDataEntry && <DataEntryModal onClose={() => setShowDataEntry(false)} />}
        </section>

        {/* Section 5: Financial Independence Target */}
        <section className="pb-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Independence Target</h2>

          <div className="space-y-3">
            {/* Multiplier option */}
            <button
              onClick={() => setFiTargetMode('multiplier')}
              className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                fiTargetMode === 'multiplier'
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  fiTargetMode === 'multiplier' ? 'border-gray-900' : 'border-gray-300'
                }`}>
                  {fiTargetMode === 'multiplier' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-2">Multiplier-based</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Target =</span>
                    <input
                      type="text"
                      value={fiTargetMultiple}
                      onChange={(e) => setFiTargetMultiple(e.target.value)}
                      disabled={fiTargetMode !== 'multiplier'}
                      className="w-20 px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 disabled:bg-gray-50"
                    />
                    <span className="text-sm text-gray-600">× annual expenses</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">25× = 4% safe withdrawal rate</p>
                  {errors.fiTargetMultiple && (
                    <p className="text-xs text-red-600 mt-1">{errors.fiTargetMultiple}</p>
                  )}
                </div>
              </div>
            </button>

            {/* Amount option */}
            <button
              onClick={() => setFiTargetMode('amount')}
              className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                fiTargetMode === 'amount'
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  fiTargetMode === 'amount' ? 'border-gray-900' : 'border-gray-300'
                }`}>
                  {fiTargetMode === 'amount' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-2">Fixed amount</div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Target = £</span>
                    <input
                      type="text"
                      value={fiTargetAmount}
                      onChange={(e) => setFiTargetAmount(e.target.value)}
                      disabled={fiTargetMode !== 'amount'}
                      placeholder="1,500,000"
                      className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 disabled:bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Fixed target regardless of expenses</p>
                  {errors.fiTargetAmount && (
                    <p className="text-xs text-red-600 mt-1">{errors.fiTargetAmount}</p>
                  )}
                </div>
              </div>
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white sticky bottom-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-end gap-3">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </footer>
    </div>
  );
}

// Helper function to format currency
function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `£${(value / 1_000_000).toFixed(2)}m`;
  }
  if (Math.abs(value) >= 1_000) {
    return `£${(value / 1_000).toFixed(0)}k`;
  }
  return `£${value.toFixed(0)}`;
}
