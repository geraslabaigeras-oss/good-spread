export { fmt } from '@/lib/engine/time';

export const fmtEur = (n: number) => {
  const abs = Math.round(Math.abs(n) * 100) / 100;
  const s = abs.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(abs) ? 0 : 2, maximumFractionDigits: 2 });
  return `${n < 0 && abs !== 0 ? '−' : ''}€${s}`;
};
export const fmtDelta = (n: number) => (n === 0 ? '€0' : n > 0 ? `+${fmtEur(n)}` : fmtEur(n));

export const clock = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vilnius', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));

/** "Sat 21 Nov 2026" */
export const fmtDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  const wd = d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
  const mo = d.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
  return `${wd} ${d.getUTCDate()} ${mo} ${d.getUTCFullYear()}`;
};

export const fmtMin = (m: number) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`);
