import { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { Card } from '../ui/Card';
import { Pill } from '../ui/Pill';
import { fmt } from '../../lib/formatters';
import { findStopAge, simulateTrajectory } from '../../lib/simulation';
import { buildSimOptions } from '../../lib/buildSimOptions';
import { useFortressStore } from '../../store';
import type { Lifestyle, WindfallScenario } from '../../types';
import type { ScenarioState } from '../../lib/useScenarioState';

interface Props {
  state: ScenarioState;
  updateFieldSilent: <K extends keyof ScenarioState>(key: K, value: ScenarioState[K]) => void;
}

const LIFESTYLES: { id: Lifestyle; label: string }[] = [
  { id: 'base',       label: 'Maintain' },
  { id: 'university', label: '+ University' },
  { id: 'house',      label: '+ House' },
  { id: 'combined',   label: 'Combined' },
];

const WINDFALLS: { id: WindfallScenario; label: string; dot: string }[] = [
  { id: 'none',        label: 'No windfalls', dot: 'bg-stone-400' },
  { id: 'equity',      label: 'Equity exit',  dot: 'bg-emerald-500' },
  { id: 'inheritance', label: 'Inheritance',  dot: 'bg-violet-500' },
  { id: 'alternate',   label: 'Alternate',    dot: 'bg-blue-500' },
  { id: 'all',         label: 'All three',    dot: 'bg-amber-500' },
];

const REVENUE_LEVELS = [200_000, 250_000, 300_000, 350_000, 400_000, 450_000, 500_000, 600_000, 700_000];

export function StopAgeTab({ state, updateFieldSilent }: Props) {
  const cfg = useFortressStore((s) => s.config);

  const [chartRevenue, setChartRevenue] = useState(300_000);
  const [chartLifestyle, setChartLifestyle] = useState<Lifestyle>('combined');
  const [chartWindfall, setChartWindfall] = useState<WindfallScenario>('none');
  const [chartStopAge, setChartStopAge] = useState(50);

  const stopTable = useMemo(() => {
    const out: Record<number, Record<Lifestyle, Record<WindfallScenario, number | null>>> = {};
    for (const r of REVENUE_LEVELS) {
      out[r] = {} as never;
      for (const l of LIFESTYLES) {
        out[r][l.id] = {} as Record<WindfallScenario, number | null>;
        for (const wf of WINDFALLS) {
          const opts = buildSimOptions(cfg, state, { lifestyle: l.id, windfall: wf.id, revenue: r });
          out[r][l.id][wf.id] = findStopAge(opts);
        }
      }
    }
    return out;
  }, [cfg, state]);

  const trajectory = useMemo(() => {
    const opts = buildSimOptions(cfg, state, {
      lifestyle: chartLifestyle,
      windfall: chartWindfall,
      revenue: chartRevenue,
      stopAgeOverride: chartStopAge,
    });
    return simulateTrajectory(opts);
  }, [cfg, state, chartLifestyle, chartWindfall, chartRevenue, chartStopAge]);

  const fmtStopAge = (sa: number | null) => {
    if (sa === null) return <span className="text-rose-500">never</span>;
    if (sa <= cfg.primaryPartnerAge) return <span className="text-emerald-700 font-medium">now</span>;
    const yrs = sa - cfg.primaryPartnerAge;
    return (
      <div className="flex flex-col items-end leading-tight">
        <span className="tabular-nums">age {sa}</span>
        <span className="text-[10px] text-stone-400">{yrs}yr work</span>
      </div>
    );
  };

  const headlineRevs = [300_000, 400_000, 500_000];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-emerald-50/30 to-white border-emerald-100">
        <h3 className="text-base font-semibold text-stone-900 mb-2">When can the primary partner stop working?</h3>
        <p className="text-sm text-stone-600 mb-4">
          Given a sustained {cfg.personalization.businessName} revenue level, what's the earliest age the primary partner can stop and still
          sustain the chosen lifestyle to age {cfg.terminalAge}?
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {headlineRevs.map((r) => {
            const combined = stopTable[r]?.combined?.none;
            const base = stopTable[r]?.base?.none;
            return (
              <div key={r} className="bg-white rounded-lg p-3 border border-emerald-100">
                <div className="text-xs text-stone-500 uppercase tracking-wider mb-1">At {fmt(r)}</div>
                <div className="text-base font-semibold tabular-nums">
                  {combined !== null && combined !== undefined ? `Combined: age ${combined}` : '—'}
                </div>
                <div className="text-xs text-stone-500">
                  {base !== null && base !== undefined ? `Maintain: age ${base}` : '—'}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Growth slider */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-1.5">
          <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold pl-1">Growth</span>
          <input
            type="range" min={0} max={6} step={0.5} value={state.growth * 100}
            onChange={(e) => updateFieldSilent('growth', Number(e.target.value) / 100)}
            className="w-32 h-1.5 rounded-lg appearance-none bg-stone-300 cursor-pointer accent-cyan-600"
          />
          <span className="text-xs font-semibold tabular-nums text-stone-900 min-w-[3rem]">
            {(state.growth * 100).toFixed(1)}% real
          </span>
        </div>
        <div className="text-xs text-stone-500">Linked across tabs · changes when you click a preset</div>
      </div>

      {/* Matrix */}
      <Card className="p-6">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-base font-semibold text-stone-900">Stop-age matrix</h3>
          <Pill tone="blue">{(state.growth * 100).toFixed(1)}% real · {cfg.personalization.businessName} mode</Pill>
        </div>
        <p className="text-xs text-stone-500 mb-4">
          Rows = sustained revenue. Columns grouped by windfall scenario.
        </p>

        <div className="space-y-6">
          {WINDFALLS.map((wf) => (
            <div key={wf.id}>
              <div className="text-xs uppercase tracking-wider font-semibold mb-2 text-stone-700 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${wf.dot}`}></span>
                {wf.label}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-stone-500 border-b border-stone-200">
                      <th className="text-left py-2 pr-3 font-medium">Revenue</th>
                      {LIFESTYLES.map((l) => (
                        <th key={l.id} className="text-right py-2 px-3 font-medium">{l.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {REVENUE_LEVELS.map((r) => (
                      <tr key={r} className="border-b border-stone-50 last:border-0">
                        <td className="py-2 pr-3 tabular-nums text-stone-700 font-medium">£{r / 1000}K</td>
                        {LIFESTYLES.map((l) => (
                          <td key={l.id} className="py-2 px-3 text-right">
                            {fmtStopAge(stopTable[r]?.[l.id]?.[wf.id] ?? null)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Chart */}
      <Card className="p-6">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-stone-900">Year-by-year wealth trajectory</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Real terms · pension unlocks at {cfg.pensionUnlockAge} (merges into liquid)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4 p-4 bg-stone-50/50 rounded-lg">
          <div>
            <label className="text-xs uppercase tracking-wider text-stone-500 font-medium block mb-1">
              Revenue (until stop age)
            </label>
            <input
              type="range" min={0} max={800_000} step={10_000} value={chartRevenue}
              onChange={(e) => setChartRevenue(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none bg-stone-200 cursor-pointer accent-cyan-600"
            />
            <div className="text-sm font-semibold tabular-nums">{fmt(chartRevenue)}</div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-stone-500 font-medium block mb-1">Stop age</label>
            <input
              type="range" min={cfg.primaryPartnerAge} max={65} step={1} value={chartStopAge}
              onChange={(e) => setChartStopAge(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none bg-stone-200 cursor-pointer accent-cyan-600"
            />
            <div className="text-sm font-semibold tabular-nums">age {chartStopAge}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs uppercase tracking-wider text-stone-500 font-medium block mb-1">Lifestyle</label>
              <select
                value={chartLifestyle}
                onChange={(e) => setChartLifestyle(e.target.value as Lifestyle)}
                className="w-full text-sm border border-stone-300 rounded-md py-1 px-2"
              >
                {LIFESTYLES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-stone-500 font-medium block mb-1">Windfalls</label>
              <select
                value={chartWindfall}
                onChange={(e) => setChartWindfall(e.target.value as WindfallScenario)}
                className="w-full text-sm border border-stone-300 rounded-md py-1 px-2"
              >
                {WINDFALLS.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={trajectory}>
            <defs>
              <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0891b2" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#0891b2" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="pensionGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="age" tick={{ fontSize: 11, fill: '#78716c' }}
              label={{ value: 'Age', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#78716c' }}
            />
            <YAxis
              tickFormatter={(v) => `£${(v / 1_000_000).toFixed(1)}M`}
              tick={{ fontSize: 11, fill: '#78716c' }}
            />
            <Tooltip
              formatter={(v: number) => fmt(v)}
              labelFormatter={(age) => `Age ${age}`}
              contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine
              x={chartStopAge} stroke="#dc2626" strokeDasharray="4 4"
              label={{ value: `Stop work (${chartStopAge})`, fontSize: 10, fill: '#dc2626', position: 'top' }}
            />
            <ReferenceLine
              x={cfg.pensionUnlockAge} stroke="#7c3aed" strokeDasharray="2 2"
              label={{ value: 'Pension unlock', fontSize: 10, fill: '#7c3aed', position: 'top' }}
            />
            <ReferenceLine y={0} stroke="#0f0f0f" strokeWidth={1} />
            <Area type="monotone" dataKey="pension" stackId="1" stroke="#7c3aed" strokeWidth={2} fill="url(#pensionGrad)" name="Pension (locked)" />
            <Area type="monotone" dataKey="liquid" stackId="1" stroke="#0891b2" strokeWidth={2} fill="url(#liquidGrad)" name="Liquid wealth" />
          </AreaChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-stone-100 text-sm">
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-wider">At stop age ({chartStopAge})</div>
            <div className="font-semibold tabular-nums">
              {fmt(trajectory.find((t) => t.age === chartStopAge)?.total ?? 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-wider">Peak wealth</div>
            <div className="font-semibold tabular-nums">
              {fmt(trajectory.length === 0 ? 0 : Math.max(...trajectory.map((t) => t.total)))}
            </div>
            <div className="text-xs text-stone-500">
              age {trajectory.length === 0 ? '—' : trajectory.reduce((acc, t) => (t.total > acc.total ? t : acc), trajectory[0]).age}
            </div>
          </div>
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-wider">At age 75</div>
            <div className="font-semibold tabular-nums">
              {fmt(trajectory.find((t) => t.age === 75)?.total ?? 0)}
            </div>
          </div>
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-wider">Terminal (age {cfg.terminalAge})</div>
            <div className={`font-semibold tabular-nums ${
              (trajectory.find((t) => t.age === cfg.terminalAge)?.total ?? 0) > 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {fmt(trajectory.find((t) => t.age === cfg.terminalAge)?.total ?? 0)}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
