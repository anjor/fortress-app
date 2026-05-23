// Number formatting helpers used across the report tabs.

export const fmt = (n: number | null | undefined): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return '£' + Math.round(n).toLocaleString('en-GB');
};

export const fmtK = (n: number | null | undefined): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  if (n === 0) return 'FI now';
  if (Math.abs(n) >= 1_000_000) return `£${(n / 1_000_000).toFixed(2)}M`;
  return `£${Math.round(n / 1000)}K`;
};

export const fmtPct = (n: number | null | undefined): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `${(n * 100).toFixed(1)}%`;
};

export const fmtSigned = (n: number): string => {
  const sign = n > 0 ? '+' : '';
  return `${sign}${fmt(n)}`;
};
