// Fortress v3 - Minimum Income Table
// Answers: "What income do you need to earn?"

import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import type { MinimumIncomeRow, PersonalizationConfig } from '../types';

interface Props {
  rows: MinimumIncomeRow[];
  personalization: PersonalizationConfig;
}

export function MinimumIncomeTable({ rows, personalization }: Props) {
  const [showExplanation, setShowExplanation] = useState(false);
  return (
    <div>
      {/* Explanation link */}
      <button
        onClick={() => setShowExplanation(!showExplanation)}
        className="mb-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors"
      >
        <Info className="w-4 h-4" />
        {showExplanation ? 'Hide' : 'Show'} threshold explanations
      </button>

      {/* Explanation panel */}
      {showExplanation && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Threshold Definitions</h3>
            <button
              onClick={() => setShowExplanation(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Breakeven</h4>
              <p className="text-gray-700">
                Work until age 50 earning this income. Your General Investment Account (GIA) will
                deplete by age 75, but pensions will sustain you after that.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-1">CoastFI</h4>
              <p className="text-gray-700">
                Work until age 50 earning this income. You'll accumulate enough wealth during these
                10 years to last until age 100 after you stop working (drawing down assets as needed).
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-1">Surplus</h4>
              <p className="text-gray-700">
                Work until age 50 earning this income. This ensures your net worth grows by £50,000
                per year in real terms while working, building a safety buffer.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th rowSpan={2} className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Threshold
            </th>
            <th colSpan={3} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              Without Windfalls
            </th>
            <th colSpan={3} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              With Windfalls (Both)
            </th>
          </tr>
          <tr className="border-b border-gray-200">
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              {personalization.partner2Name} Working
            </th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              {personalization.partner2Name} Break
            </th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              PAYE Equiv
            </th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              {personalization.partner2Name} Working
            </th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              {personalization.partner2Name} Break
            </th>
            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              PAYE Equiv
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.threshold} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-4">
                <div>
                  <span className="text-sm font-medium text-gray-900">{row.label}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{row.description}</p>
                </div>
              </td>
              {/* Without windfalls */}
              <td className="px-3 py-3 text-center">
                <IncomeCell value={row.partner2Working} threshold={row.threshold} hitsCap={row.partner2WorkingHitsCap} />
              </td>
              <td className="px-3 py-3 text-center">
                <IncomeCell value={row.partner2Break} threshold={row.threshold} hitsCap={row.partner2BreakHitsCap} />
              </td>
              <td className="px-3 py-3 text-center">
                <span className="text-sm text-gray-500 tabular-nums">
                  {row.payeAlternativeHitsCap ? '> £1m' : formatCurrency(row.payeAlternative)}
                </span>
              </td>
              {/* With windfalls */}
              <td className="px-3 py-3 text-center">
                <IncomeCell value={row.partner2WorkingWithWindfalls} threshold={row.threshold} hitsCap={row.partner2WorkingWithWindfallsHitsCap} />
              </td>
              <td className="px-3 py-3 text-center">
                <IncomeCell value={row.partner2BreakWithWindfalls} threshold={row.threshold} hitsCap={row.partner2BreakWithWindfallsHitsCap} />
              </td>
              <td className="px-3 py-3 text-center">
                <span className="text-sm text-gray-500 tabular-nums">
                  {row.payeAlternativeWithWindfallsHitsCap ? '> £1m' : formatCurrency(row.payeAlternativeWithWindfalls)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <p className="text-xs text-gray-400 mt-3">
        Values show business gross revenue required. PAYE equivalent is the employed salary needed for same net income.
      </p>
      </div>
    </div>
  );
}

interface IncomeCellProps {
  value: number;
  threshold: 'breakeven' | 'coastfi' | 'surplus';
  hitsCap?: boolean;
}

function IncomeCell({ value, threshold, hitsCap }: IncomeCellProps) {
  // Highlight current Fortress revenue (~£300k) against requirements
  const isBelowRequirement = value > 300000;
  const isComfortablyAbove = value < 250000;

  // Color coding: green if already achieved (value = 0), otherwise standard colors
  const colorClass = threshold === 'breakeven'
    ? value === 0 ? 'text-emerald-600' : 'text-gray-900'
    : threshold === 'coastfi'
    ? 'text-amber-600'
    : 'text-emerald-600';

  // Show warning when calculation hits the upper bound, or show £0 for already achieved
  const displayValue = hitsCap
    ? '> £1m'
    : value === 0
      ? '£0'
      : formatCurrency(value);

  return (
    <span className={`text-sm font-medium tabular-nums ${colorClass}`}>
      {displayValue}
    </span>
  );
}

// ============================================================================
// Compact variant showing key insight
// ============================================================================

export function MinimumIncomeSummary({ rows, personalization }: Props) {
  const coastfi = rows.find(r => r.threshold === 'coastfi');
  
  if (!coastfi) return null;
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
        CoastFI Income (Zero Net Change)
      </p>
      <div className="flex items-baseline gap-6">
        <div>
          <span className="text-2xl font-semibold text-gray-900 tabular-nums">
            {formatCurrency(coastfi.partner2Working)}
          </span>
          <span className="text-sm text-gray-500 ml-2">if {personalization.partner2Name} works</span>
        </div>
        <div>
          <span className="text-2xl font-semibold text-gray-900 tabular-nums">
            {formatCurrency(coastfi.partner2Break)}
          </span>
          <span className="text-sm text-gray-500 ml-2">if {personalization.partner2Name} on break</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Current business revenue: ~£300k → {coastfi.partner2Working <= 300000 ? 'Exceeds' : 'Below'} CoastFI
      </p>
    </div>
  );
}

// ============================================================================
// Visual comparison against current income
// ============================================================================

export function IncomeGauge({ rows, currentRevenue = 300000 }: Props & { currentRevenue?: number }) {
  const breakeven = rows.find(r => r.threshold === 'breakeven')!;
  const coastfi = rows.find(r => r.threshold === 'coastfi')!;
  const surplus = rows.find(r => r.threshold === 'surplus')!;
  
  // Assume Partner 2 working scenario
  const thresholds = [
    { label: 'Breakeven', value: breakeven.partner2Working, color: 'bg-red-400' },
    { label: 'CoastFI', value: coastfi.partner2Working, color: 'bg-amber-400' },
    { label: 'Surplus', value: surplus.partner2Working, color: 'bg-emerald-400' },
  ];
  
  const maxValue = Math.max(...thresholds.map(t => t.value), currentRevenue) * 1.1;
  
  return (
    <div className="space-y-3">
      <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
        {/* Threshold markers */}
        {thresholds.map((t) => (
          <div
            key={t.label}
            className="absolute top-0 bottom-0 w-0.5 bg-gray-300"
            style={{ left: `${(t.value / maxValue) * 100}%` }}
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
              {formatCurrency(t.value)}
            </div>
          </div>
        ))}
        
        {/* Current revenue bar */}
        <div 
          className="absolute top-0 bottom-0 bg-blue-500 opacity-80"
          style={{ width: `${(currentRevenue / maxValue) * 100}%` }}
        />
        
        {/* Current revenue marker */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-blue-700"
          style={{ left: `${(currentRevenue / maxValue) * 100}%` }}
        >
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-medium text-blue-700 whitespace-nowrap">
            Current: {formatCurrency(currentRevenue)}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-between text-xs">
        {thresholds.map((t) => (
          <div key={t.label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${t.color}`} />
            <span className="text-gray-500">{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Formatting Helpers
// ============================================================================

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `£${(value / 1_000_000).toFixed(2)}m`;
  }
  if (Math.abs(value) >= 1_000) {
    return `£${(value / 1_000).toFixed(0)}k`;
  }
  return `£${value.toFixed(0)}`;
}

export default MinimumIncomeTable;
