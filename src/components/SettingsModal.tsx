// Fortress v2 - Settings Modal
// Configure family birthdates, working ages, and FI target

import { useState } from 'react';
import { X, Settings, Check } from 'lucide-react';
import { useFortressStore } from '../store';
import type { FortressConfig } from '../types';
import { calculatePAYETax, calculateGrossFromNet } from '../lib/calculations';

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const config = useFortressStore(state => state.config);
  const updateConfig = useFortressStore(state => state.updateConfig);

  // Local form state
  const [partner1BirthYear, setPartner1BirthYear] = useState(config.partner1BirthYear);
  const [partner2BirthYear, setPartner2BirthYear] = useState(config.partner2BirthYear);
  const [child1BirthYear, setChild1BirthYear] = useState(config.child1BirthYear);
  const [child2BirthYear, setChild2BirthYear] = useState(config.child2BirthYear);

  const [partner1WorksUntilAge, setPartner1WorksUntilAge] = useState(
    config.partner1WorksUntilAge?.toString() ?? ''
  );
  const [partner2WorksUntilAge, setPartner2WorksUntilAge] = useState(
    config.partner2WorksUntilAge?.toString() ?? ''
  );

  const [fiTargetMode, setFiTargetMode] = useState<'multiplier' | 'amount'>(
    config.fiTargetMode
  );
  const [fiTargetMultiple, setFiTargetMultiple] = useState(
    config.fiTargetMultiple.toString()
  );
  const [fiTargetAmount, setFiTargetAmount] = useState(
    config.fiTargetAmount?.toString() ?? ''
  );

  // Income configuration state
  const [partner1IncomeMode, setPartner1IncomeMode] = useState<'business' | 'employed'>(
    config.partner1IncomeMode
  );
  const [partner1BusinessRevenue, setPartner1BusinessRevenue] = useState(
    config.partner1BusinessRevenue.toString()
  );
  const [partner1EmployedSalary, setPartner1EmployedSalary] = useState(
    config.partner1EmployedSalary.toString()
  );

  const [partner2SalaryInputMode, setPartner2SalaryInputMode] = useState<'gross' | 'net'>(
    config.partner2SalaryInputMode
  );
  const [partner2GrossAnnual, setPartner2GrossAnnual] = useState(
    config.partner2GrossAnnual.toString()
  );
  const [partner2NetAnnual, setPartner2NetAnnual] = useState(
    config.partner2NetAnnual.toString()
  );

  const [annualSchoolFeePerChild, setAnnualSchoolFeePerChild] = useState(
    config.annualSchoolFeePerChild.toString()
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Validation
    const newErrors: Record<string, string> = {};
    const currentYear = new Date().getFullYear();

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

    // Income configuration validation
    const partner1BizRev = parseFloat(partner1BusinessRevenue.replace(/[£,]/g, ''));
    if (isNaN(partner1BizRev) || partner1BizRev < 0 || partner1BizRev > 2000000) {
      newErrors.partner1BusinessRevenue = 'Must be between £0 and £2,000,000';
    }

    const partner1EmpSal = parseFloat(partner1EmployedSalary.replace(/[£,]/g, ''));
    if (isNaN(partner1EmpSal) || partner1EmpSal < 0 || partner1EmpSal > 1000000) {
      newErrors.partner1EmployedSalary = 'Must be between £0 and £1,000,000';
    }

    const partner2Gross = parseFloat(partner2GrossAnnual.replace(/[£,]/g, ''));
    if (isNaN(partner2Gross) || partner2Gross < 0 || partner2Gross > 500000) {
      newErrors.partner2GrossAnnual = 'Must be between £0 and £500,000';
    }

    const partner2Net = parseFloat(partner2NetAnnual.replace(/[£,]/g, ''));
    if (isNaN(partner2Net) || partner2Net < 0 || partner2Net > 500000) {
      newErrors.partner2NetAnnual = 'Must be between £0 and £500,000';
    }

    const schoolFee = parseFloat(annualSchoolFeePerChild.replace(/[£,]/g, ''));
    if (isNaN(schoolFee) || schoolFee < 0 || schoolFee > 100000) {
      newErrors.annualSchoolFeePerChild = 'Must be between £0 and £100,000';
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
    };

    // Working ages (optional)
    if (partner1WorksUntilAge.trim() !== '') {
      configUpdate.partner1WorksUntilAge = parseInt(partner1WorksUntilAge);
    } else {
      configUpdate.partner1WorksUntilAge = undefined;
    }

    if (partner2WorksUntilAge.trim() !== '') {
      configUpdate.partner2WorksUntilAge = parseInt(partner2WorksUntilAge);
    } else {
      configUpdate.partner2WorksUntilAge = undefined;
    }

    // FI target
    if (fiTargetMode === 'multiplier') {
      configUpdate.fiTargetMultiple = parseFloat(fiTargetMultiple);
    } else {
      configUpdate.fiTargetAmount = parseFloat(fiTargetAmount.replace(/[£,]/g, ''));
    }

    // Income configuration
    configUpdate.partner1IncomeMode = partner1IncomeMode;
    configUpdate.partner1BusinessRevenue = parseFloat(partner1BusinessRevenue.replace(/[£,]/g, ''));
    configUpdate.partner1EmployedSalary = parseFloat(partner1EmployedSalary.replace(/[£,]/g, ''));
    configUpdate.partner2SalaryInputMode = partner2SalaryInputMode;

    // Calculate dependent field based on input mode
    if (partner2SalaryInputMode === 'gross') {
      // Gross is source of truth, calculate net
      const gross = parseFloat(partner2GrossAnnual.replace(/[£,]/g, ''));
      const tax = calculatePAYETax(gross);
      configUpdate.partner2GrossAnnual = gross;
      configUpdate.partner2NetAnnual = gross - tax;
    } else {
      // Net is source of truth, back-calculate gross
      const net = parseFloat(partner2NetAnnual.replace(/[£,]/g, ''));
      const gross = calculateGrossFromNet(net);
      configUpdate.partner2NetAnnual = net;
      configUpdate.partner2GrossAnnual = gross;
    }

    // School fees
    configUpdate.annualSchoolFeePerChild = parseFloat(annualSchoolFeePerChild.replace(/[£,]/g, ''));

    // Update config (triggers recalculation)
    updateConfig(configUpdate);

    // Show success and close
    setSaved(true);
    setTimeout(() => onClose(), 1500);
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
            <p className="text-sm text-gray-500 mt-1">All projections updated.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Section 1: Family Birth Years */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Family Birth Years</h3>
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
            </div>
          </div>

          {/* Section 2: Working Ages */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Working Ages</h3>
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

          {/* Section 3: FI Target */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Financial Independence Target</h3>
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
                    fiTargetMode === 'multiplier'
                      ? 'border-gray-900'
                      : 'border-gray-300'
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
                    <p className="text-xs text-gray-500 mt-2">25x = 4% safe withdrawal rate</p>
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
                    fiTargetMode === 'amount'
                      ? 'border-gray-900'
                      : 'border-gray-300'
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
          </div>

          {/* Section 4: Income Configuration */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Income Configuration</h3>

            {/* Partner 1's Income Mode */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Partner 1's Income
              </label>
              <div className="space-y-3">
                {/* Business/Contractor option */}
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
                      partner1IncomeMode === 'business'
                        ? 'border-gray-900'
                        : 'border-gray-300'
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
                      partner1IncomeMode === 'employed'
                        ? 'border-gray-900'
                        : 'border-gray-300'
                    }`}>
                      {partner1IncomeMode === 'employed' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-2">
                        Employed (PAYE)
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Gross salary: £</span>
                        <input
                          type="text"
                          value={partner1EmployedSalary}
                          onChange={(e) => setPartner1EmployedSalary(e.target.value)}
                          disabled={partner1IncomeMode !== 'employed'}
                          placeholder="120,000"
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 disabled:bg-gray-50"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Standard PAYE tax (income tax + NI)
                      </p>
                      {errors.partner1EmployedSalary && (
                        <p className="text-xs text-red-600 mt-1">{errors.partner1EmployedSalary}</p>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Partner 2's Salary */}
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Partner 2's Salary (PAYE)
              </label>
              <div className="space-y-3">
                {/* Gross input option */}
                <button
                  type="button"
                  onClick={() => setPartner2SalaryInputMode('gross')}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    partner2SalaryInputMode === 'gross'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      partner2SalaryInputMode === 'gross'
                        ? 'border-gray-900'
                        : 'border-gray-300'
                    }`}>
                      {partner2SalaryInputMode === 'gross' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-2">Enter Gross Salary</div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Gross: £</span>
                        <input
                          type="text"
                          value={partner2GrossAnnual}
                          onChange={(e) => setPartner2GrossAnnual(e.target.value)}
                          disabled={partner2SalaryInputMode !== 'gross'}
                          placeholder="100,000"
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 disabled:bg-gray-50"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Net will be calculated automatically
                      </p>
                      {errors.partner2GrossAnnual && (
                        <p className="text-xs text-red-600 mt-1">{errors.partner2GrossAnnual}</p>
                      )}
                    </div>
                  </div>
                </button>

                {/* Net input option */}
                <button
                  type="button"
                  onClick={() => setPartner2SalaryInputMode('net')}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    partner2SalaryInputMode === 'net'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      partner2SalaryInputMode === 'net'
                        ? 'border-gray-900'
                        : 'border-gray-300'
                    }`}>
                      {partner2SalaryInputMode === 'net' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-2">Enter Net Income</div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Net: £</span>
                        <input
                          type="text"
                          value={partner2NetAnnual}
                          onChange={(e) => setPartner2NetAnnual(e.target.value)}
                          disabled={partner2SalaryInputMode !== 'net'}
                          placeholder="75,600"
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm disabled:opacity-50 disabled:bg-gray-50"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Gross will be back-calculated using UK PAYE tax
                      </p>
                      {errors.partner2NetAnnual && (
                        <p className="text-xs text-red-600 mt-1">{errors.partner2NetAnnual}</p>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: School Fees */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-1">School Fees</h3>
            <p className="text-xs text-gray-500 mb-3">
              Annual fee per child (school)
            </p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Annual fee per child</label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">£</span>
                <input
                  type="text"
                  value={annualSchoolFeePerChild}
                  onChange={(e) => setAnnualSchoolFeePerChild(e.target.value)}
                  placeholder="21,246"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Default: £21,246 (£7,082/term × 3 terms)
              </p>
              {errors.annualSchoolFeePerChild && (
                <p className="text-xs text-red-600 mt-1">{errors.annualSchoolFeePerChild}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
          <button
            onClick={onClose}
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
      </div>
    </div>
  );
}
