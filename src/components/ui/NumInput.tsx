interface NumInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  sub?: string;
  suffix?: string;
  step?: number;
}

export function NumInput({ label, value, onChange, sub, suffix, step }: NumInputProps) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-stone-500 font-medium block mb-1">{label}</label>
      <div className="flex items-center">
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        {suffix && <span className="ml-2 text-sm text-stone-500">{suffix}</span>}
      </div>
      {sub && <div className="text-[11px] text-stone-500 mt-1">{sub}</div>}
    </div>
  );
}
