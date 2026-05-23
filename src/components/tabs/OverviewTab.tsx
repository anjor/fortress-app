import {
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card } from '../ui/Card';
import { Stat } from '../ui/Stat';
import { Pill } from '../ui/Pill';
import { fmt, fmtPct } from '../../lib/formatters';
import { useFortressStore } from '../../store';

export function OverviewTab() {
  const cfg = useFortressStore((s) => s.config);
  const history = cfg.netWorthHistory;

  const totalNow = cfg.assetBreakdown.reduce((s, a) => s + a.value, 0);
  const totalPrior = cfg.assetBreakdown.reduce((s, a) => s + a.prior, 0);
  const momChange = totalNow - totalPrior;
  const momPct = totalPrior > 0 ? momChange / totalPrior : 0;

  const housePart = cfg.assetBreakdown.filter((a) => a.bucket === 'house').reduce((s, a) => s + a.value, 0);
  const pensionPart = cfg.assetBreakdown.filter((a) => a.bucket === 'pension').reduce((s, a) => s + a.value, 0);
  const investable = totalNow - housePart - pensionPart;

  const firstHist = history[0]?.value ?? 0;
  const lastHist = history[history.length - 1]?.value ?? 0;
  const histChange = lastHist - firstHist;
  const histPct = firstHist > 0 ? histChange / firstHist : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <Stat
            label="Net Worth"
            value={fmt(totalNow)}
            delta={fmt(Math.abs(momChange))}
            deltaPct={fmtPct(momPct)}
            deltaPositive={momChange >= 0}
            sub="vs prior month"
          />
        </Card>
        <Card className="p-5"><Stat label="Investable Now" value={fmt(investable)} sub="ex pensions & house" /></Card>
        <Card className="p-5"><Stat label="Liquid + Pensions" value={fmt(totalNow - housePart)} sub="ex house equity" /></Card>
        <Card className="p-5"><Stat label="Pension Pot" value={fmt(pensionPart)} sub={`locked until ${cfg.pensionUnlockAge}`} /></Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-stone-900">Net worth — recent trajectory</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              £{firstHist.toLocaleString()}K → £{lastHist.toLocaleString()}K · +£{histChange.toLocaleString()}K
              {' '}({fmtPct(histPct)})
            </p>
          </div>
          <Pill tone={momChange >= 0 ? 'green' : 'red'}>
            {momChange >= 0 ? '+' : ''}{fmtPct(momPct)} MoM
          </Pill>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={history}>
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0891b2" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#0891b2" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716c' }} />
            <YAxis
              tickFormatter={(v) => `£${v.toLocaleString()}K`}
              tick={{ fontSize: 11, fill: '#78716c' }}
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <Tooltip
              formatter={(v: number) => `£${v.toLocaleString()}K`}
              contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }}
            />
            <Area type="monotone" dataKey="value" stroke="#0891b2" strokeWidth={2.5} fill="url(#nwGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold text-stone-900 mb-4">Asset breakdown</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={cfg.assetBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {cfg.assetBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {cfg.assetBreakdown.map((b) => {
              const pct = totalNow === 0 ? 0 : b.value / totalNow;
              const change = b.value - b.prior;
              return (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />
                    <div>
                      <div className="text-sm font-medium text-stone-900">{b.name}</div>
                      <div className="text-xs text-stone-500">{b.note}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums text-stone-900">{fmt(b.value)}</div>
                    <div className="text-xs text-stone-500 tabular-nums">
                      {fmtPct(pct)}
                      <span className={`ml-2 ${change >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {change >= 0 ? '+' : ''}{fmt(change)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
