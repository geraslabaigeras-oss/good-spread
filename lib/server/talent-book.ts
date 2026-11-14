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

/** Day rate is not in the book: the plan uses an estimate until the agency confirms. */
const RATE_ESTIMATE = 450;

export function talentBookPeople(): RosterPerson[] {
  if (!talentBookEnabled()) return [];
  const book = JSON.parse(fs.readFileSync(path.join(DIR, 'book.json'), 'utf8')) as Entry[];
  const state = readState();
  return book
    .filter((b) => (CITIES as readonly string[]).includes(b.city))
    .map((b) => ({
      id: b.id, createdAt: '2026-11-14T00:00:00Z', source: 'talent-book' as const,
      name: b.name, role: 'model' as const, city: b.city as City, dayRate: RATE_ESTIMATE, rateIsEstimate: true,
      agency: `${b.agency} ${b.city}`, commissionPct: 20, profileUrl: b.profileUrl, instagram: b.instagram,
      heightCm: b.heightCm, statsText: b.stats, board: b.look?.board ?? b.gender,
      photo: b.images[0] ? `/api/talent/img/${b.images.find((i) => i.label.startsWith('Polaroid'))?.file ?? b.images[0].file}` : null,
      gallery: null,
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
