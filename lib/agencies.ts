/** Model agency offices with working public websites (checked 14 Nov 2026). Links only; nothing is copied from them. */
export type Office = { agency: string; city: string; country: string; cc: string; language: string; url: string };
export const OFFICES: Office[] = [
  { agency: 'Elite', city: 'Paris', country: 'France', cc: 'fr', language: 'French', url: 'https://www.elitemodels.com' },
  { agency: 'Women', city: 'Milan', country: 'Italy', cc: 'it', language: 'Italian', url: 'https://www.womenmanagement.com' },
  { agency: 'Select', city: 'Stockholm', country: 'Sweden', cc: 'se', language: 'Swedish', url: 'https://www.selectmodel.com' },
  { agency: 'Viva', city: 'Barcelona', country: 'Spain', cc: 'es', language: 'Spanish', url: 'https://www.vivamodels.com' },
  { agency: 'Elite', city: 'Copenhagen', country: 'Denmark', cc: 'dk', language: 'Danish', url: 'https://www.elitemodels.com' },
  { agency: 'NEXT', city: 'London', country: 'United Kingdom', cc: 'gb', language: 'English', url: 'https://nextmanagement.com' },
  { agency: 'Storm', city: 'London', country: 'United Kingdom', cc: 'gb', language: 'English', url: 'https://www.stormmanagement.com' },
  { agency: 'Premier', city: 'London', country: 'United Kingdom', cc: 'gb', language: 'English', url: 'https://www.premiermodelmanagement.com' },
  { agency: 'IMG Models', city: 'New York', country: 'United States', cc: 'us', language: 'English', url: 'https://imgmodels.com' },
  { agency: 'Ford Models', city: 'New York', country: 'United States', cc: 'us', language: 'English', url: 'https://fordmodels.com' },
  { agency: 'Wilhelmina', city: 'New York', country: 'United States', cc: 'us', language: 'English', url: 'https://www.wilhelmina.com' },
];
/** Kept for the simple directory row. */
export const AGENCIES = OFFICES.map((o) => ({ name: `${o.agency} ${o.city}`, url: o.url, cities: `${o.country} · ${o.language}`, cc: o.cc }));
export const flagUrl = (cc: string) => `https://flagcdn.com/w40/${cc}.png`;
/** Best guess of the office for a free-text agency name on a person. */
export const officeFor = (agency?: string | null) =>
  agency ? OFFICES.find((o) => agency.toLowerCase().includes(o.agency.toLowerCase()) && agency.toLowerCase().includes(o.city.toLowerCase())) ?? OFFICES.find((o) => agency.toLowerCase().includes(o.agency.toLowerCase())) ?? null : null;
