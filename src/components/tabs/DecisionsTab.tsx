import { useMemo } from 'react';
import { Card } from '../ui/Card';
import { fmt, fmtK } from '../../lib/formatters';
import { findMinIncome } from '../../lib/simulation';
import { buildSimOptions } from '../../lib/buildSimOptions';
import { useFortressStore } from '../../store';
import type { Lifestyle } from '../../types';
import type { ScenarioState } from '../../lib/useScenarioState';

interface Props {
  state: ScenarioState;
}

const LIFESTYLES: { id: Lifestyle; label: string }[] = [
  { id: 'base',       label: 'Maintain' },
  { id: 'university', label: '+ University' },
  { id: 'house',      label: '+ House' },
  { id: 'combined',   label: '+ House + University' },
];

export function DecisionsTab({ state }: Props) {
  const cfg = useFortressStore((s) => s.config);
  const p = cfg.personalization;

  const baseTable = useMemo(() => {
    const out: Record<Lifestyle, number | null> = {} as never;
    for (const l of LIFESTYLES) {
      const opts = buildSimOptions(cfg, state, { lifestyle: l.id, windfall: 'none' });
      out[l.id] = findMinIncome(opts);
    }
    return out;
  }, [cfg, state]);

  // Current run rate from client roster
  const runRate = cfg.clients.reduce((s, c) => s + c.monthlyAmount, 0) * 12;

  const rows = LIFESTYLES.map((l) => {
    const threshold = baseTable[l.id];
    const isFI = threshold === 0;
    const margin = runRate - (threshold ?? 0);
    const ratio = threshold === 0 ? Infinity : runRate / (threshold ?? 1);
    return { ...l, threshold, isFI, margin, ratio };
  });

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-emerald-50/30 to-white border-emerald-100">
        <h3 className="text-base font-semibold text-stone-900 mb-3">Headline</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-stone-500 text-xs uppercase tracking-wider mb-2">Position</div>
            <ul className="space-y-1.5 text-stone-700">
              <li>• Current run rate <strong>{fmt(runRate)}/yr</strong> against the no-windfall thresholds shown below</li>
              <li>• Stop age slider currently set to <strong>age {state.stopAge}</strong></li>
              <li>• Growth assumption <strong>{(state.growth * 100).toFixed(1)}% real</strong></li>
            </ul>
          </div>
          <div>
            <div className="text-stone-500 text-xs uppercase tracking-wider mb-2">
              No-windfall thresholds ({(state.growth * 100).toFixed(1)}% real, {p.businessName})
            </div>
            <ul className="space-y-1.5 text-stone-700">
              {rows.map((r) => (
                <li key={r.id}>
                  • {r.label}: <strong className="tabular-nums">{fmtK(r.threshold)}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold text-stone-900 mb-3">Thresholds vs run rate</h3>
        <p className="text-sm text-stone-700 mb-4">
          Compare each lifestyle's no-windfall threshold to the current annualized client run rate.
        </p>
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id}>
              <div className="flex justify-between mb-1 text-sm">
                <span className="text-stone-700">{r.label}</span>
                <span className="tabular-nums text-stone-600">
                  {fmtK(r.threshold)} · margin{' '}
                  <strong className={r.margin > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {r.isFI
                      ? 'FI now (∞)'
                      : (r.margin >= 0 ? '+' : '') + fmtK(Math.abs(r.margin)) +
                        (Number.isFinite(r.ratio) ? ` (${r.ratio.toFixed(1)}×)` : '')}
                  </strong>
                </span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                  style={{ width: `${Math.min(100, ((r.threshold ?? 0) / 600_000) * 100)}%` }}
                />
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-stone-200">
            <div className="flex justify-between mb-1 text-sm">
              <span className="text-stone-700 font-medium">Current run rate</span>
              <span className="tabular-nums font-medium text-stone-900">{fmt(runRate)}/yr</span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-stone-800 rounded-full"
                style={{ width: `${Math.min(100, (runRate / 600_000) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-stone-500 mt-4 leading-relaxed">
          Thresholds are live — they update as you change sliders on the Min Income tab.
        </p>
      </Card>
    </div>
  );
}
