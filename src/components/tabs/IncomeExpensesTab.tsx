import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { Card } from '../ui/Card';
import { Pill } from '../ui/Pill';
import { fmt, fmtK, fmtPct } from '../../lib/formatters';
import { useFortressStore } from '../../store';

export function IncomeExpensesTab() {
  const cfg = useFortressStore((s) => s.config);
  const fy = cfg.fiscalYearRevenue;
  const yoy = fy.priorTotal > 0 ? (fy.currentTotal - fy.priorTotal) / fy.priorTotal : 0;
  const avgRevenue = cfg.revenueHistory.length === 0
    ? 0
    : cfg.revenueHistory.reduce((s, r) => s + r.revenue, 0) / cfg.revenueHistory.length;

  const ytd = cfg.ytdExpenses;
  const months = Math.max(1, ytd.monthsElapsed);
  const annualisedTotal = (ytd.totalCurrent / months) * 12;
  const annualisedPersonal = (ytd.personalCurrent / months) * 12;
  const annualisedBusiness = (ytd.businessCurrent / months) * 12;
  const ytdYoy = ytd.totalPrior > 0 ? (ytd.totalCurrent - ytd.totalPrior) / ytd.totalPrior : 0;

  const clientBase = cfg.clients.reduce((s, c) => s + c.monthlyAmount, 0) * 12;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-blue-50/30 to-white border-blue-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-blue-700 font-medium mb-1">
              {cfg.personalization.businessName} · {fy.currentYearLabel}
            </div>
            <div className="text-3xl font-bold text-stone-900 tabular-nums">{fmt(fy.currentTotal)}</div>
            <div className="text-sm text-stone-600 mt-1">
              <span className={`font-semibold ${fy.currentTotal - fy.priorTotal >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {fy.currentTotal - fy.priorTotal >= 0 ? '+' : ''}{fmt(fy.currentTotal - fy.priorTotal)}
              </span>{' '}
              vs {fy.priorYearLabel} ({fmt(fy.priorTotal)}) ·{' '}
              <span className={`font-semibold ${yoy >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {yoy >= 0 ? '+' : ''}{fmtPct(yoy)} YoY
              </span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={cfg.revenueHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#78716c' }} />
            <YAxis tickFormatter={(v) => `£${v}K`} tick={{ fontSize: 10, fill: '#78716c' }} />
            <Tooltip formatter={(v: number) => `£${v}K`} contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }} />
            <ReferenceLine
              y={avgRevenue}
              stroke="#0891b2"
              strokeDasharray="4 4"
              label={{ value: `Avg £${avgRevenue.toFixed(1)}K`, fontSize: 10, fill: '#0891b2', position: 'right' }}
            />
            <Bar dataKey="revenue" fill="#0891b2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-stone-900">Expenses · year to date</h3>
            <p className="text-xs text-stone-500 mt-0.5">{months} months · annualised run rates shown</p>
          </div>
          <Pill tone={ytdYoy <= 0 ? 'green' : 'amber'}>
            YTD {ytdYoy >= 0 ? '+' : ''}{fmtPct(ytdYoy)} vs prior
          </Pill>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-medium">Total YTD</div>
            <div className="text-xl font-semibold tabular-nums text-stone-900">{fmt(ytd.totalCurrent)}</div>
            <div className="text-xs text-stone-500 tabular-nums">
              vs {fmt(ytd.totalPrior)} · run rate <span className="font-medium">{fmt(annualisedTotal)}</span>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-medium">Personal</div>
            <div className="text-xl font-semibold tabular-nums text-stone-900">{fmt(ytd.personalCurrent)}</div>
            <div className="text-xs text-stone-500 tabular-nums">
              vs {fmt(ytd.personalPrior)} · run rate <span className="font-medium">{fmt(annualisedPersonal)}</span>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-stone-500 font-medium">Business</div>
            <div className="text-xl font-semibold tabular-nums text-stone-900">{fmt(ytd.businessCurrent)}</div>
            <div className="text-xs text-stone-500 tabular-nums">
              vs {fmt(ytd.businessPrior)} · run rate <span className="font-medium">{fmt(annualisedBusiness)}</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={cfg.expensesByMonth} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#78716c' }} />
            <YAxis tickFormatter={(v) => `£${v}K`} tick={{ fontSize: 11, fill: '#78716c' }} />
            <Tooltip formatter={(v: number) => `£${v}K`} contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="priorYear" fill="#a8a29e" name="Prior year" radius={[4, 4, 0, 0]} />
            <Bar dataKey="currentYear" fill="#0891b2" name="Current year" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-stone-900">Client roster</h3>
            <p className="text-xs text-stone-500 mt-0.5">Forward-looking monthly retainers</p>
          </div>
          <Pill tone="blue">Annualised base {fmtK(clientBase)}</Pill>
        </div>
        <div className="space-y-2">
          {cfg.clients.map((c) => (
            <div key={c.name} className="flex items-center justify-between py-2.5 border-b border-stone-100 last:border-0">
              <div className="flex items-center gap-3 flex-1">
                <div className="font-medium text-sm text-stone-900 w-32">{c.name}</div>
                <Pill tone={c.status === 'anchor' ? 'green' : c.status === 'fragile' ? 'amber' : 'neutral'}>
                  {c.status}
                </Pill>
                <div className="text-xs text-stone-500 hidden md:block flex-1">{c.note}</div>
              </div>
              <div className="text-right tabular-nums">
                <div className="text-sm font-semibold text-stone-900">{fmt(c.monthlyAmount)}</div>
                <div className="text-xs text-stone-500">/month</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
