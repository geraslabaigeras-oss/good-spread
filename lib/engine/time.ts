/** Minutes from 00:00 on the shoot date -> "HH:MM". */
export function fmt(min: number): string {
  if (!Number.isFinite(min) || min >= 99999) return '—';
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/** "10:45" -> 645. Returns null when not parseable. */
export function parseHHMM(s: string | null | undefined): number | null {
  if (!s) return null;
  const m = /^\s*(\d{1,2})[:.h](\d{2})\s*$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23 || mm > 59) return null;
  return h * 60 + mm;
}

/** Round minutes up to the next 15. */
export function ceil15(min: number): number {
  return Math.ceil(min / 15) * 15;
}

export function money(n: number): string {
  const r = Math.round(n * 100) / 100;
  const s = Number.isInteger(r)
    ? r.toLocaleString('en-US')
    : r.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${n < 0 && r !== 0 ? '−' : ''}€${s.replace('-', '')}`;
}

export const UNAVAILABLE_MIN = 99999;
