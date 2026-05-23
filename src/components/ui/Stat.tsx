interface StatProps {
  label: string;
  value: string;
  delta?: string;
  deltaPct?: string;
  deltaPositive?: boolean;
  sub?: string;
}

export function Stat({ label, value, delta, deltaPct, deltaPositive = true, sub }: StatProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs uppercase tracking-wider text-stone-500 font-medium">{label}</div>
      <div className="text-2xl font-semibold text-stone-900 tabular-nums">{value}</div>
      {(delta || sub) && (
        <div className="flex items-baseline gap-2 text-xs">
          {delta && (
            <span className={`tabular-nums font-medium ${deltaPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
              {deltaPositive ? '↑' : '↓'} {delta}
              {deltaPct && <span className="text-stone-500 font-normal ml-1">({deltaPct})</span>}
            </span>
          )}
          {sub && <span className="text-stone-500">{sub}</span>}
        </div>
      )}
    </div>
  );
}
