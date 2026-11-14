import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { CITIES, type City } from '@/data/catalog';
import type { RosterPerson } from '@/lib/roster';

/**
 * The agency talent book (private/talent) is an internal reference: "do not publish or deploy".
 * It is read only on a local machine, never on Vercel, and never committed (private/ is git-ignored).
 */
const DIR = path.join(process.cwd(), 'private', 'talent');
export const talentBookEnabled = () => !process.env.VERCEL && process.env.TALENT_BOOK !== 'off' && fs.existsSync(path.join(DIR, 'book.json'));

type Entry = {
  id: string; name: string; agency: string; city: string; gender: string | null; heightCm: number | null; stats: string | null;
  hair: string | null; eyes: string | null; instagram: string | null; profileUrl: string | null;
  images: { file: string; label: string }[];
  look?: { look: string; hair: string; features: string[]; vibe: string[]; fits: string[]; board: string };
};
type State = Record<string, { availability?: 'available' | 'hold' | 'unavailable' | null; availabilityNote?: string | null }>;

const statePath = path.join(DIR, 'state.json');
const readState = (): State => { try { return JSON.parse(fs.readFileSync(statePath, 'utf8')); } catch { return {}; } };

/** Day rates are not public: estimates by agency level, shown as estimates until the agent confirms. */
const TOP = /(next|elite|storm|select|viva model management|women|img|oui|why not|webber|streeters|art \+ commerce|art partner|camilla lowther|management artists|bryant|lalaland|ag agency)/i;
export const tierFor = (agency: string) => (TOP.test(agency) ? 'top' : 'mid') as 'top' | 'mid';
const RATES: Record<string, { top: number; mid: number }> = { model: { top: 1500, mid: 650 }, photographer: { top: 3000, mid: 1200 }, stylist: { top: 1200, mid: 550 }, mua: { top: 900, mid: 450 } };
const rateFor = (role: string, agency: string) => RATES[role][tierFor(agency)];
/** A real photo of their work, never a logo or icon. */
const isPhoto = (u: string) => /\.(jpe?g|webp)(\?|$|,)/i.test(u) && !/logo|icon|favicon|avatar-default|sprite/i.test(u);

export function talentBookPeople(): RosterPerson[] {
  if (!talentBookEnabled()) return [];
  const book = JSON.parse(fs.readFileSync(path.join(DIR, 'book.json'), 'utf8')) as Entry[];
  const state = readState();
  return book
    .filter((b) => (CITIES as readonly string[]).includes(b.city))
    .map((b) => ({
      id: b.id, createdAt: '2026-11-14T00:00:00Z', source: 'talent-book' as const,
      name: b.name, role: 'model' as const, city: b.city as City, dayRate: rateFor('model', b.agency), rateIsEstimate: true, tier: tierFor(b.agency),
      agency: `${b.agency} ${b.city}`, commissionPct: 20, profileUrl: b.profileUrl, instagram: b.instagram,
      heightCm: b.heightCm, statsText: b.stats, board: b.look?.board ?? b.gender,
      photo: b.images[0] ? `/api/talent/img/${b.images.find((i) => i.label.startsWith('Polaroid'))?.file ?? b.images[0].file}` : null,
      gallery: b.images.map((i) => `/api/talent/img/${i.file}`),
      notes: b.look?.look ?? null,
      look: b.look ? { look: b.look.look, hair: b.look.hair, features: b.look.features, vibe: b.look.vibe, bookShows: b.look.fits, fitNotes: '' } : null,
      availability: state[b.id]?.availability ?? null, availabilityNote: state[b.id]?.availabilityNote ?? null,
    }));
}

export function talentBookImages(id: string): { url: string; label: string }[] {
  if (!talentBookEnabled()) return [];
  const book = JSON.parse(fs.readFileSync(path.join(DIR, 'book.json'), 'utf8')) as Entry[];
  return (book.find((b) => b.id === id)?.images ?? []).map((i) => ({ url: `/api/talent/img/${i.file}`, label: i.label }));
}

export function setTalentAvailability(id: string, availability: 'available' | 'hold' | 'unavailable' | null, note?: string | null) {
  if (!talentBookEnabled()) return false;
  const s = readState();
  s[id] = { availability, availabilityNote: note ?? null };
  fs.writeFileSync(statePath, JSON.stringify(s, null, 1));
  return true;
}

export function talentImagePath(file: string): string | null {
  if (!talentBookEnabled() || !/^p-\d{3}-\d{3}\.jpg$/.test(file)) return null;
  const p = path.join(DIR, 'img', file);
  return fs.existsSync(p) ? p : null;
}

/* ---------- Europe crew (private/europe): photographers, stylists, make-up artists. Local only, like the book. ---------- */
type CrewEntry = { id: string; name: string; city: string; country: string; agency: string; credits?: string; style_keywords?: string; url: string; base_verified?: boolean };
const EU = path.join(process.cwd(), 'private', 'europe');
const COUNTRY_BASE: Record<string, City> = {
  Lithuania: 'Vilnius', Latvia: 'Riga', Estonia: 'Tallinn', 'United Kingdom': 'London', Germany: 'Berlin', Portugal: 'Lisbon', France: 'Paris',
  Italy: 'Milan', Denmark: 'Copenhagen', Sweden: 'Stockholm', Spain: 'Barcelona', Iceland: 'Reykjavik', Greece: 'Athens', Poland: 'Warsaw', Netherlands: 'Amsterdam',
};
export function europeCrew(): RosterPerson[] {
  if (!talentBookEnabled() || !fs.existsSync(EU)) return [];
  let imgs: Record<string, string[]> = {};
  try { imgs = JSON.parse(fs.readFileSync(path.join(EU, 'images.json'), 'utf8')); } catch {}
  const state = readState();
  const load = (file: string, role: 'photographer' | 'stylist' | 'mua') => {
    try { return (JSON.parse(fs.readFileSync(path.join(EU, `${file}.json`), 'utf8')) as CrewEntry[]).map((c) => ({ c, role })); } catch { return []; }
  };
  return [...load('photographers', 'photographer'), ...load('stylists', 'stylist'), ...load('mua', 'mua')].map(({ c, role }) => {
    const city = ((CITIES as readonly string[]).find((x) => c.city.toLowerCase().startsWith(x.toLowerCase())) as City | undefined) ?? COUNTRY_BASE[c.country] ?? 'London';
    const pics = (imgs[c.id] ?? []).filter(isPhoto);
    const words = [c.style_keywords, c.credits].filter(Boolean).join(', ');
    return {
      id: `eu-${c.id}`, createdAt: '2026-11-14T00:00:00Z', source: 'talent-book' as const,
      name: c.name, role, city, dayRate: rateFor(role, c.agency), rateIsEstimate: true, tier: tierFor(c.agency),
      agency: `${c.agency}${c.city ? ` ${c.city.split(' /')[0]}` : ''}`, commissionPct: 20, profileUrl: c.url, instagram: null,
      photo: pics[0] ?? null, gallery: pics, notes: words || null,
      look: words ? { look: c.style_keywords ? `Style: ${c.style_keywords}.` : `Credits: ${c.credits}.`, hair: c.credits ? `Credits: ${c.credits}` : '', features: [], vibe: (c.style_keywords ?? '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4), bookShows: [], fitNotes: '' } : null,
      availability: state[`eu-${c.id}`]?.availability ?? null, availabilityNote: state[`eu-${c.id}`]?.availabilityNote ?? null,
    };
  });
}
