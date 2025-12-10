// Fortress v2 - Scenario Cost Table
// Shows the incremental cost of each scenario compared to baseline

import type { ScenarioCostTableRow } from '../types';

interface Props {
  rows: ScenarioCostTableRow[];
}

export function ScenarioCostTable({ rows }: Props) {
  const formatCurrency = (amount: number) => {
    if (amount === 0) return '£0';

    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Scenario
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Extra Cost vs Baseline
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr
              key={row.scenarioId}
              className={`hover:bg-gray-50 transition-colors ${row.isBaseline ? 'bg-gray-50' : ''}`}
            >
              <td className="py-3 pr-4">
                <span className="text-sm text-gray-900">
                  {row.scenarioName}
                  {row.isBaseline && (
                    <span className="ml-2 text-xs text-gray-500">(Baseline)</span>
                  )}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <span
                  className={`text-sm font-medium tabular-nums ${
                    row.isBaseline ? 'text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {row.isBaseline ? '—' : formatCurrency(row.extraCost)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ScenarioCostTable;
