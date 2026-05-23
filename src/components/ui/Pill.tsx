import type { ReactNode } from 'react';

type PillTone = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'neutral';

const TONES: Record<PillTone, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-200',
  neutral: 'bg-stone-100 text-stone-700 border-stone-200',
};

export function Pill({ tone = 'neutral', children }: { tone?: PillTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${TONES[tone]}`}>
      {children}
    </span>
  );
}
