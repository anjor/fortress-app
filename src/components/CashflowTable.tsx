// Fortress v2 - Cashflow Conclusion Table
// Answers: "To what age will your money last?"

import type { AssumptionSet, CashflowTableRow } from '../types';

interface Props {
  rows: CashflowTableRow[];
  assumptions: AssumptionSet[];
}

export function CashflowTable({ rows, assumptions }: Props) {
  const assumptionHeaders = assumptions;
  const hasAnyWindfalls = assumptions.some(a => a.includeInheritance || a.includeInvestmentExit);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Scenario
            </th>
            {assumptionHeaders.map((assumption, index) => (
              <th
                key={assumption.id}
                className={`px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                  index > 0 && assumption.realReturnRate !== assumptionHeaders[index - 1].realReturnRate
                    ? 'border-l-2 border-gray-300'
                    : ''
                }`}
              >
                <div>{assumption.realReturnRate * 100}%</div>
                {hasAnyWindfalls && (
                  <div className="font-normal normal-case text-[10px]">
                    {!assumption.includeInheritance && !assumption.includeInvestmentExit && 'No Windfalls'}
                    {assumption.includeInheritance && !assumption.includeInvestmentExit && '+ Inheritance'}
                    {!assumption.includeInheritance && assumption.includeInvestmentExit && '+ Liquidity event'}
                    {assumption.includeInheritance && assumption.includeInvestmentExit && '+ Both'}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.scenarioId} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-4">
                <span className="text-sm text-gray-900">{row.scenarioName}</span>
              </td>
              {assumptionHeaders.map((assumption, index) => {
                const age = row.results[assumption.id] ?? 0;
                return (
                  <td
                    key={assumption.id}
                    className={`px-4 py-3 text-center ${
                      index > 0 && assumption.realReturnRate !== assumptionHeaders[index - 1].realReturnRate
                        ? 'border-l-2 border-gray-300'
                        : ''
                    }`}
                  >
                    <AgeCell age={age} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface AgeCellProps {
  age: number;
}

function AgeCell({ age }: AgeCellProps) {
  // Color coding
  // Green: 100+ (safe)
  // Yellow: 85-99 (warning)
  // Red: <85 (risk)
  
  const isExcellent = age >= 100;
  const isGood = age >= 85 && age < 100;
  
  const colorClass = isExcellent 
    ? 'text-emerald-600' 
    : isGood 
    ? 'text-amber-600' 
    : 'text-red-600';
  
  const bgClass = isExcellent
    ? 'bg-emerald-50'
    : isGood
    ? 'bg-amber-50'
    : 'bg-red-50';
  
  return (
    <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded text-sm font-medium tabular-nums ${colorClass} ${bgClass}`}>
      {age >= 100 ? '100+' : age}
    </span>
  );
}

function pickPrimaryAndFallback(assumptions: AssumptionSet[]): { primary?: AssumptionSet; fallback?: AssumptionSet } {
  if (assumptions.length === 0) return {};

  const sorted = [...assumptions].sort((a, b) => {
    if (a.realReturnRate !== b.realReturnRate) return b.realReturnRate - a.realReturnRate;

    const aWindfalls = Number(a.includeInheritance) + Number(a.includeInvestmentExit);
    const bWindfalls = Number(b.includeInheritance) + Number(b.includeInvestmentExit);
    return bWindfalls - aWindfalls;
  });

  return { primary: sorted[0], fallback: sorted[sorted.length - 1] };
}

// ============================================================================
// Compact variant for smaller screens
// ============================================================================

export function CashflowTableCompact({ rows, assumptions }: Props) {
  const { primary, fallback } = pickPrimaryAndFallback(assumptions);
  if (!primary || !fallback) return null;
  
  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const primaryAge = row.results[primary.id] ?? 0;
        const fallbackAge = row.results[fallback.id] ?? 0;
        
        return (
          <div 
            key={row.scenarioId}
            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <span className="text-sm text-gray-700">{row.scenarioName}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                {fallbackAge >= 100 ? '100+' : fallbackAge}
              </span>
              <AgeCell age={primaryAge} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Summary variant (single best/worst)
// ============================================================================

export function CashflowSummary({ rows, assumptions }: Props) {
  const { primary, fallback } = pickPrimaryAndFallback(assumptions);
  
  const currentPath = rows.find(r => r.scenarioId === 'current');
  const fullUpgrade = rows.find(r => r.scenarioId === 'all');
  
  if (!currentPath || !fullUpgrade || !primary || !fallback) return null;
  
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="p-4 bg-emerald-50 rounded-lg">
        <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-1">
          Current Path (Best Case)
        </p>
        <p className="text-3xl font-semibold text-emerald-700 tabular-nums">
          {currentPath.results[primary.id] >= 100 ? '100+' : currentPath.results[primary.id]} years
        </p>
      </div>
      
      <div className="p-4 bg-amber-50 rounded-lg">
        <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-1">
          Full Upgrade (Conservative)
        </p>
        <p className="text-3xl font-semibold text-amber-700 tabular-nums">
          {fullUpgrade.results[fallback.id] >= 100 ? '100+' : fullUpgrade.results[fallback.id]} years
        </p>
      </div>
    </div>
  );
}

export default CashflowTable;
