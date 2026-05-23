interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  sub?: string;
}

export function Slider({ label, value, onChange, min, max, step, format, sub }: SliderProps) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-xs uppercase tracking-wider text-stone-500 font-medium">{label}</label>
        <span className="text-sm font-semibold tabular-nums text-stone-900">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none bg-stone-200 cursor-pointer accent-cyan-600"
      />
      {sub && <div className="text-[11px] text-stone-500 mt-0.5">{sub}</div>}
    </div>
  );
}
