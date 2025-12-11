// Fortress v3 - Windfall Editor
// Configure inheritance and investment exit scenarios

import { useState } from 'react';
import { X, TrendingUp, Check } from 'lucide-react';
import { useFortressStore } from '../store';
import type { FortressConfig } from '../types';
import { calculateInvestmentExitNet } from '../lib/calculations';

interface Props {
  onClose: () => void;
}

export function WindfallEditor({ onClose }: Props) {
  const config = useFortressStore(state => state.config);
  const updateConfig = useFortressStore(state => state.updateConfig);

  // Local form state
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Validation
    const newErrors: Record<string, string> = {};
    const currentYear = new Date().getFullYear();
    const currentPartner1Age = currentYear - config.partner1BirthYear;

    // Inheritance validation (only if enabled)
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

    // Investment exit validation (only if enabled)
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

      // Warning if cost basis > exit gross
      if (!isNaN(exitGross) && !isNaN(costBasis) && costBasis > exitGross) {
        newErrors.investmentCostBasis = 'Cost basis exceeds exit gross (loss scenario)';
      }

      const age = parseInt(investment.age);
      if (isNaN(age) || age < currentPartner1Age || age > 75) {
        newErrors.investmentAge = `Must be between ${currentPartner1Age} and 75`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build config update
    const configUpdate: Partial<FortressConfig> = {
      // Inheritance: If disabled, save as 0
      inheritanceAmount: inheritance.enabled && inheritance.amount
        ? parseFloat(inheritance.amount.replace(/[£,]/g, ''))
        : 0,
      inheritancePartner1Age: parseInt(inheritance.age) || config.inheritancePartner1Age,

      // Investment exit: If disabled, save as 0
      investmentExitGross: investment.enabled && investment.exitGross
        ? parseFloat(investment.exitGross.replace(/[£,]/g, ''))
        : 0,
      investmentCostBasis: investment.costBasis
        ? parseFloat(investment.costBasis.replace(/[£,]/g, ''))
        : 0,
      investmentExitPartner1Age: parseInt(investment.age) || config.investmentExitPartner1Age,

      // Personalization
      personalization: {
        ...config.personalization,
        investmentName: investment.name || 'Investment'
      }
    };

    // Update store (triggers recalculation)
    updateConfig(configUpdate);

    // Show success and close
    setSaved(true);
    setTimeout(() => onClose(), 1500);
  };

  // Calculate net proceeds for display
  const calculateNetProceeds = () => {
    if (!investment.exitGross) return 0;

    const exitGross = parseFloat(investment.exitGross.replace(/[£,]/g, ''));
    const costBasis = parseFloat(investment.costBasis.replace(/[£,]/g, '')) || 0;

    if (isNaN(exitGross) || exitGross <= 0) return 0;

    // Mock config for calculation
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
            <p className="text-lg font-medium text-gray-900">Windfalls Saved!</p>
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
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900">Windfall Scenarios</h2>
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
          {/* Inheritance Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Inheritance</h3>
                <p className="text-xs text-gray-500 mt-0.5">Model a one-time inheritance or gift</p>
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
                  <label className="block text-xs text-gray-500 mb-1">Inheritance Amount</label>
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

          {/* Investment Exit Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Investment Exit / Liquidity Event</h3>
                <p className="text-xs text-gray-500 mt-0.5">Model startup equity, options, or investment company exit</p>
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

                {/* Calculated Net Proceeds */}
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
            Save Windfalls
          </button>
        </div>
      </div>
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

export default WindfallEditor;
