// Fortress v3 - Headline Metrics Cards
// Shows the 4 key numbers at a glance

import React from 'react';
import type { HeadlineMetrics, FortressConfig } from '../types';
import { calculateInvestmentExitNet } from '../lib/calculations';

interface Props {
  metrics: HeadlineMetrics;
  config?: FortressConfig;
}

export function HeadlineCards({ metrics, config }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          label="Net Worth"
          value={formatCurrency(metrics.netWorth)}
          subValue={formatChange(metrics.netWorthChange, metrics.netWorthChangePercent)}
          trend={metrics.netWorthChange >= 0 ? 'up' : 'down'}
        />

        <MetricCard
          label="FI Progress"
          value={formatPercent(metrics.fiProgress * 100)}
          subValue={`Target: ${formatCurrency(metrics.fiTarget)}`}
          progress={metrics.fiProgress}
        />

        <MetricCard
          label="Time to FI"
          value={metrics.timeToFI <= 0 ? 'Achieved!' : `~${metrics.timeToFI} years`}
          subValue="at current pace"
        />

        <MetricCard
          label="Runway"
          value={metrics.runway >= 100 ? '100+ years' : `${metrics.runway} years`}
          subValue="if you stop earning now"
          highlight={metrics.runway >= 100}
        />
      </div>

      {config && (config.investmentExitGross > 0 || config.inheritanceAmount > 0) && (
        <div className="text-sm text-gray-500 pt-3 border-t border-gray-100">
          <span className="font-medium text-gray-700">Pending windfalls: </span>
          {config.investmentExitGross > 0 && (
            <>
              <span>
                {config.personalization.investmentName} exit (~{formatCurrency(calculateInvestmentExitNet(config).additionalValue)} net @ age {config.investmentExitPartner1Age})
              </span>
              {config.inheritanceAmount > 0 && <span className="mx-2">•</span>}
            </>
          )}
          {config.inheritanceAmount > 0 && (
            <span>
              Inheritance ({formatCurrency(config.inheritanceAmount)} @ age {config.inheritancePartner1Age})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down';
  progress?: number;
  highlight?: boolean;
}

function MetricCard({ label, value, subValue, trend, progress, highlight }: MetricCardProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-2xl font-semibold tabular-nums tracking-tight ${
        highlight ? 'text-emerald-600' : 'text-gray-900'
      }`}>
        {value}
      </p>
      
      {progress !== undefined && (
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
          <div 
            className="bg-gray-900 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
      )}
      
      {subValue && (
        <p className={`text-xs ${
          trend === 'up' ? 'text-emerald-600' : 
          trend === 'down' ? 'text-red-500' : 
          'text-gray-400'
        }`}>
          {subValue}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Asset Breakdown (optional detail view)
// ============================================================================

export function AssetBreakdown({ metrics }: Props) {
  const total = metrics.liquidAssets + metrics.pensionAssets + 
                metrics.businessAssets + metrics.propertyEquity;
  
  const segments = [
    { label: 'Liquid', value: metrics.liquidAssets, color: 'bg-blue-500' },
    { label: 'Business', value: metrics.businessAssets, color: 'bg-emerald-500' },
    { label: 'Pensions', value: metrics.pensionAssets, color: 'bg-amber-500' },
    { label: 'Property', value: metrics.propertyEquity, color: 'bg-gray-300' },
  ];
  
  return (
    <div className="space-y-3">
      {/* Bar */}
      <div className="h-2 flex rounded-full overflow-hidden">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} transition-all duration-500`}
            style={{ width: `${(seg.value / total) * 100}%` }}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex gap-6">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${seg.color}`} />
            <span className="text-xs text-gray-500">{seg.label}</span>
            <span className="text-xs font-medium text-gray-700 tabular-nums">
              {formatCurrency(seg.value)}
            </span>
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

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatChange(absolute: number, percent: number): string {
  const sign = absolute >= 0 ? '+' : '';
  return `${sign}${formatCurrency(absolute)} (${sign}${percent.toFixed(1)}%)`;
}

export default HeadlineCards;
