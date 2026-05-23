import { useMemo } from 'react';
import { Card } from '../ui/Card';
import { Pill } from '../ui/Pill';
import { Slider } from '../ui/Slider';
import { fmt, fmtK } from '../../lib/formatters';
import { findMinIncome, findFINumber, equityNetForPricePerShare } from '../../lib/simulation';
import { buildSimOptions } from '../../lib/buildSimOptions';
import { PRESETS } from '../../lib/presets';
import { useFortressStore } from '../../store';
import type { Lifestyle, WindfallScenario } from '../../types';
import type { ScenarioState } from '../../lib/useScenarioState';

interface Props {
  state: ScenarioState;
  updateField: <K extends keyof ScenarioState>(key: K, value: ScenarioState[K]) => void;
  updateFieldSilent: <K extends keyof ScenarioState>(key: K, value: ScenarioState[K]) => void;
  activePreset: string | null;
  applyPreset: (id: string) => void;
}

const LIFESTYLES: { id: Lifestyle; label: string; sub: (s: string, h: string, u: string) => string }[] = [
  { id: 'base',       label: 'Maintain lifestyle', sub: (_s, _h, _u) => 'Baseline household spend' },
  { id: 'house',      label: '+ House upgrade',     sub: (_s, _h, _u) => 'Lump sum + ongoing extra cost' },
  { id: 'university', label: '+ University',        sub: (_s, _h, u) => `${u} for all children` },
  { id: 'combined',   label: '+ House + University',sub: (_s, _h, _u) => 'Both upgrades stacked' },
];

const WINDFALLS: { id: WindfallScenario; label: string }[] = [
  { id: 'none',        label: 'No windfalls' },
  { id: 'equity',      label: 'Equity exit' },
  { id: 'inheritance', label: 'Inheritance' },
  { id: 'alternate',   label: 'Alternate' },
  { id: 'all',         label: 'All three' },
];

export function MinIncomeTab({ state, updateField, updateFieldSilent, activePreset, applyPreset }: Props) {
  const cfg = useFortressStore((s) => s.config);
  const p = cfg.personalization;
  const equityNet = useMemo(
    () => equityNetForPricePerShare(state.equityPricePerShare, cfg.equity.priceTable),
    [state.equityPricePerShare, cfg.equity.priceTable],
  );
  const equityAge = cfg.primaryPartnerAge + state.equityYearsOut;
  const altSalaryStartAge = cfg.primaryPartnerAge + state.alternateSalaryStartYears;
  const partner2StartAge = cfg.primaryPartnerAge + state.partner2StartYears;
  const partner2EndAge = partner2StartAge + state.partner2DurationYears;

  const table = useMemo(() => {
    const out: Record<Lifestyle, Record<WindfallScenario, number | null>> = {} as never;
    for (const l of LIFESTYLES) {
      out[l.id] = {} as Record<WindfallScenario, number | null>;
      for (const wf of WINDFALLS) {
        const opts = buildSimOptions(cfg, state, { lifestyle: l.id, windfall: wf.id });
        out[l.id][wf.id] = findMinIncome(opts);
      }
    }
    return out;
  }, [cfg, state]);

  const fiTable = useMemo(() => {
    const out: Record<Lifestyle, Record<WindfallScenario, number | null>> = {} as never;
    for (const l of LIFESTYLES) {
      out[l.id] = {} as Record<WindfallScenario, number | null>;
      for (const wf of WINDFALLS) {
        const opts = buildSimOptions(
          { ...cfg },
          { ...state, incomeType: 'business' },
          { lifestyle: l.id, windfall: wf.id },
        );
        out[l.id][wf.id] = findFINumber(opts);
      }
    }
    return out;
  }, [cfg, state]);

  const currentTotal = cfg.initialLiquid + cfg.initialPensions;

  const marginAnalysis = useMemo(() => {
    return LIFESTYLES.map((l) => {
      const threshold = table[l.id]?.none;
      const margin = state.expectedRev - (threshold ?? 0);
      return {
        ...l,
        threshold,
        margin,
        ratio: threshold === 0 ? Infinity : state.expectedRev / (threshold ?? 1),
      };
    });
  }, [table, state.expectedRev]);

  const fmtCell = (val: number | null | undefined) => {
    if (val === null || val === undefined) return <span className="text-stone-400">—</span>;
    if (val === 0) return <span className="text-emerald-700 font-medium">FI now</span>;
    return <span className="tabular-nums">{fmtK(val)}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Toggle row */}
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
        <div className="flex bg-stone-100 rounded-lg p-1">
          <button
            onClick={() => updateFieldSilent('incomeType', 'business')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              state.incomeType === 'business' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600'
            }`}
          >
            Min {p.businessName} revenue
          </button>
          <button
            onClick={() => updateFieldSilent('incomeType', 'employed')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              state.incomeType === 'employed' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-600'
            }`}
          >
            Min PAYE salary
          </button>
        </div>
        <div className="text-xs text-stone-500 ml-auto">
          {state.incomeType === 'business'
            ? `Both partners extract via ${p.businessName}`
            : `${p.partner1Name} PAYE + ${p.partner2Name} via ${p.businessName} shell`}
        </div>
      </div>

      {/* Sliders */}
      <Card className="p-5 bg-stone-50/40 border-stone-200">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-stone-900">Adjust scenario inputs · table updates live</h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-stone-500 mr-1">Quick presets:</span>
            {PRESETS.map((preset) => {
              const active = activePreset === preset.id;
              const baseClass = 'px-2.5 py-1 text-xs font-medium rounded border transition';
              const colors: Record<string, string> = {
                stress: active
                  ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                  : 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200',
                central: active
                  ? 'bg-stone-700 text-white border-stone-800 shadow-sm'
                  : 'bg-stone-200 text-stone-800 border-stone-300 hover:bg-stone-300',
                optimistic: active
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
              };
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`${baseClass} ${colors[preset.id] ?? colors.central}`}
                  title={preset.description}
                >
                  {preset.label}
                </button>
              );
            })}
            {activePreset === null && (
              <span className="text-[11px] text-stone-400 italic ml-1">Custom</span>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <SliderGroup label="Your decisions" accent="bg-stone-700">
            <Slider
              label="Stop-work age" value={state.stopAge}
              onChange={(v) => updateField('stopAge', v)}
              min={cfg.primaryPartnerAge} max={65} step={1}
              format={(v) => `age ${v}`}
              sub={`${state.stopAge - cfg.primaryPartnerAge} more years of work`}
            />
            <Slider
              label="House upgrade age" value={state.houseAge}
              onChange={(v) => updateField('houseAge', v)}
              min={cfg.primaryPartnerAge} max={65} step={1}
              format={(v) => `age ${v}`}
              sub="Applies to +House and Combined"
            />
            <Slider
              label={`Expected ${p.businessName} revenue`} value={state.expectedRev}
              onChange={(v) => updateFieldSilent('expectedRev', v)}
              min={0} max={800_000} step={10_000}
              format={(v) => fmt(v)}
              sub="Used in margin analysis"
            />
          </SliderGroup>

          <SliderGroup label="Family" accent="bg-amber-600">
            <Slider
              label="Secondary school fees" value={state.secondarySchoolPerKid}
              onChange={(v) => updateField('secondarySchoolPerKid', v)}
              min={0} max={50} step={1}
              format={(v) => `£${v}K/yr/child`}
              sub={`Each child age ${cfg.expenses.secondarySchoolAgeStart}-${cfg.expenses.secondarySchoolAgeEnd}`}
            />
            <Slider
              label={`${p.partner2Name} annual income (net)`} value={state.partner2IncomeK}
              onChange={(v) => updateField('partner2IncomeK', v)}
              min={0} max={150} step={5}
              format={(v) => (v === 0 ? 'Not working' : `£${v}K/yr`)}
              sub={state.partner2IncomeK === 0 ? 'Upside if they take work' : `For ${state.partner2DurationYears} yrs`}
            />
            <Slider
              label={`${p.partner2Name} starts in`} value={state.partner2StartYears}
              onChange={(v) => updateField('partner2StartYears', v)}
              min={0} max={10} step={1}
              format={(v) => (v === 0 ? 'now' : `${v} yr${v > 1 ? 's' : ''}`)}
              sub={`Age ${partner2StartAge}, runs ${state.partner2DurationYears} yrs`}
            />
            <Slider
              label={`${p.partner2Name} works for`} value={state.partner2DurationYears}
              onChange={(v) => updateField('partner2DurationYears', v)}
              min={0} max={25} step={1}
              format={(v) => `${v} yr${v !== 1 ? 's' : ''}`}
              sub={`Until age ${partner2EndAge}`}
            />
          </SliderGroup>

          <SliderGroup label={p.equityHoldingName} accent="bg-emerald-600">
            <Slider
              label="Exit price/share" value={state.equityPricePerShare}
              onChange={(v) => updateField('equityPricePerShare', v)}
              min={0} max={8} step={0.05}
              format={(v) => `$${v.toFixed(2)}`}
              sub={`Net: ${fmt(equityNet)} · current $${cfg.equity.currentPricePerShare.toFixed(2)}`}
            />
            <Slider
              label="Exit timing" value={state.equityYearsOut}
              onChange={(v) => updateField('equityYearsOut', v)}
              min={0} max={10} step={1}
              format={(v) => (v === 0 ? 'this year' : `${v} yr${v > 1 ? 's' : ''} out`)}
              sub={`Lands at age ${equityAge}`}
            />
          </SliderGroup>

          <SliderGroup label="Inheritance" accent="bg-violet-600">
            <Slider
              label="Amount" value={state.inheritanceK}
              onChange={(v) => updateField('inheritanceK', v)}
              min={0} max={3000} step={50}
              format={(v) => `£${v}K`}
              sub="Real, today's £"
            />
            <Slider
              label="Landing age" value={state.inheritanceAge}
              onChange={(v) => updateField('inheritanceAge', v)}
              min={50} max={75} step={1}
              format={(v) => `age ${v}`}
              sub={`${state.inheritanceAge - cfg.primaryPartnerAge} years from now`}
            />
          </SliderGroup>

          <SliderGroup label="Alternate exit" accent="bg-blue-600">
            <Slider
              label="Exit age" value={state.alternateExitAge}
              onChange={(v) => updateField('alternateExitAge', v)}
              min={cfg.primaryPartnerAge + 1} max={cfg.primaryPartnerAge + 20} step={1}
              format={(v) => `age ${v}`}
              sub={`${state.alternateExitAge - cfg.primaryPartnerAge} years from now`}
            />
            <Slider
              label="Exit lump" value={state.alternateExitK}
              onChange={(v) => updateField('alternateExitK', v)}
              min={0} max={2000} step={50}
              format={(v) => `£${v}K`}
              sub="Net at exit"
            />
            <Slider
              label="Annual dividend" value={state.alternateDividendK}
              onChange={(v) => updateField('alternateDividendK', v)}
              min={0} max={100} step={5}
              format={(v) => `£${v}K/yr`}
              sub="From dividend start age until exit"
            />
            <Slider
              label="Salary (gross)" value={state.alternateSalaryK}
              onChange={(v) => updateField('alternateSalaryK', v)}
              min={0} max={120} step={5}
              format={(v) => `£${v}K/yr`}
              sub={`~£${Math.round(state.alternateSalaryK * cfg.alternateExit.salaryNetRatio)}K/yr net`}
            />
            <Slider
              label="Salary starts" value={state.alternateSalaryStartYears}
              onChange={(v) => updateField('alternateSalaryStartYears', v)}
              min={0} max={5} step={1}
              format={(v) => (v === 0 ? 'this year' : `${v} yr${v > 1 ? 's' : ''} out`)}
              sub={`Age ${altSalaryStartAge} → age ${state.alternateExitAge}`}
            />
          </SliderGroup>
        </div>
      </Card>

      {/* Min income matrix */}
      <Card className="p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-stone-900">
              Minimum required {state.incomeType === 'business' ? `${p.businessName} revenue` : 'PAYE salary'} to age {cfg.terminalAge}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Stop work age {state.stopAge} · {(state.growth * 100).toFixed(1)}% real growth
            </p>
          </div>
          <Pill tone={state.incomeType === 'business' ? 'blue' : 'amber'}>
            {state.incomeType === 'business' ? p.businessName : 'PAYE'} mode
          </Pill>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-stone-500 border-b-2 border-stone-200">
                <th className="text-left py-3 pr-4 font-medium">Lifestyle</th>
                {WINDFALLS.map((w) => (
                  <th key={w.id} className="text-right py-3 px-3 font-medium">{w.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LIFESTYLES.map((l, idx) => (
                <tr key={l.id} className={`border-b border-stone-100 ${idx === LIFESTYLES.length - 1 ? 'bg-stone-50/50' : ''}`}>
                  <td className="py-3 pr-4">
                    <div className="font-medium text-stone-900">{l.label}</div>
                    <div className="text-xs text-stone-500">{l.sub(p.primarySchoolLabel, p.secondarySchoolLabel, p.universityLabel)}</div>
                  </td>
                  {WINDFALLS.map((w) => (
                    <td key={w.id} className="py-3 px-3 text-right">{fmtCell(table[l.id]?.[w.id])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* FI numbers */}
      <Card className="p-6 bg-gradient-to-br from-violet-50/20 to-white border-violet-100">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-base font-semibold text-stone-900">FI numbers · Total NW required to retire today</h3>
          <Pill tone="purple">Current: £{(currentTotal / 1_000_000).toFixed(2)}M</Pill>
        </div>
        <p className="text-xs text-stone-500 mb-4">
          Minimum total liquid + pensions (excluding house equity) needed today to sustain this lifestyle to age {cfg.terminalAge} with{' '}
          <strong>zero future earned income</strong>. Uses {(state.growth * 100).toFixed(1)}% real growth and current asset mix.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-stone-500 border-b-2 border-stone-200">
                <th className="text-left py-3 pr-4 font-medium">Lifestyle</th>
                {WINDFALLS.map((w) => (
                  <th key={w.id} className="text-right py-3 px-3 font-medium">{w.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LIFESTYLES.map((l, idx) => (
                <tr key={l.id} className={`border-b border-stone-100 ${idx === LIFESTYLES.length - 1 ? 'bg-stone-50/50' : ''}`}>
                  <td className="py-3 pr-4 font-medium text-stone-900">{l.label}</td>
                  {WINDFALLS.map((w) => {
                    const fi = fiTable[l.id]?.[w.id];
                    if (fi === 0) {
                      return (
                        <td key={w.id} className="py-3 px-3 text-right">
                          <span className="text-emerald-700 font-medium">FI now</span>
                        </td>
                      );
                    }
                    if (fi === null || fi === undefined) {
                      return <td key={w.id} className="py-3 px-3 text-right text-stone-400">—</td>;
                    }
                    const covered = fi <= currentTotal;
                    return (
                      <td key={w.id} className="py-3 px-3 text-right">
                        <span className={`tabular-nums ${covered ? 'text-emerald-700 font-medium' : 'text-stone-700'}`}>
                          {fmtK(fi)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-stone-500 mt-3">
          <span className="text-emerald-700 font-medium">Green</span> = current NW already covers this scenario · current total {fmt(currentTotal)}
        </p>
      </Card>

      {/* Margin analysis */}
      <Card className="p-6 bg-gradient-to-br from-emerald-50/20 to-white border-emerald-100">
        <h3 className="text-base font-semibold text-stone-900 mb-1">
          Margin analysis at expected revenue {fmt(state.expectedRev)}
        </h3>
        <p className="text-xs text-stone-500 mb-4">
          Cushion against each lifestyle threshold (no windfalls). Negative = need a windfall or to spend less.
        </p>
        <div className="space-y-3">
          {marginAnalysis.map((m) => {
            const isFI = m.threshold === 0;
            const isAbove = m.margin > 0 || isFI;
            return (
              <div key={m.id}>
                <div className="flex justify-between mb-1 text-sm">
                  <span className="text-stone-700">{m.label}</span>
                  <span className="tabular-nums text-stone-600">
                    Need <strong>{fmtK(m.threshold)}</strong> ·
                    <span className={`ml-2 ${isAbove ? 'text-emerald-700' : 'text-rose-700'} font-semibold`}>
                      {isFI
                        ? '∞ margin (FI)'
                        : (m.margin > 0 ? '+' : '') + fmtK(Math.abs(m.margin)) + ' margin'}
                    </span>
                    {!isFI && Number.isFinite(m.ratio) && (
                      <span className="text-stone-500 ml-1">({m.ratio.toFixed(2)}×)</span>
                    )}
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isAbove
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        : 'bg-gradient-to-r from-rose-400 to-rose-600'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(8, ((isFI ? state.expectedRev : (m.threshold ?? 0)) / 600_000) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
          <div className="pt-2 border-t border-emerald-100">
            <div className="flex justify-between mb-1 text-sm">
              <span className="text-stone-700 font-semibold">Expected revenue</span>
              <span className="tabular-nums font-semibold text-stone-900">{fmt(state.expectedRev)}</span>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-stone-800 rounded-full"
                style={{ width: `${Math.min(100, (state.expectedRev / 600_000) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SliderGroup({ label, accent, children }: { label: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="pt-3 border-t border-stone-200 first:border-t-0 first:pt-0">
      <div className="text-[11px] uppercase tracking-wider text-stone-600 font-semibold mb-3 flex items-center gap-2">
        <span className={`w-1 h-3 rounded-full ${accent}`}></span>
        {label}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">{children}</div>
    </div>
  );
}
