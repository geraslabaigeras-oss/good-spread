import { z } from 'zod';
import { CITIES, IATA, type CatalogPerson, type City, type TravelTemplate } from '@/data/catalog';

/** A real person the producer added. Stored as-is; turned into a CatalogPerson for planning. */
export const RosterInput = z.object({
  name: z.string().trim().min(1).max(60),
  role: z.enum(['model', 'photographer', 'mua', 'stylist']),
  city: z.enum(CITIES),
  dayRate: z.number().int().min(0).max(100000),
  agency: z.string().trim().max(80).optional().nullable(),
  commissionPct: z.number().min(0).max(50).optional().nullable(),
  phone: z.string().trim().max(24).regex(/^\+?[0-9 ()-]*$/).optional().nullable(),
  email: z.string().trim().max(120).optional().nullable(),
  profileUrl: z.string().trim().max(300).url().optional().nullable().or(z.literal('')),
  notes: z.string().trim().max(300).optional().nullable(),
  photo: z.string().max(400_000).regex(/^data:image\/(jpeg|png|webp);base64,/).optional().nullable(),
  flightCost: z.number().int().min(0).max(5000).optional().nullable(),
});
export type RosterInput = z.infer<typeof RosterInput>;
export type RosterPerson = RosterInput & { id: string; createdAt: string };

export const ROLE_LABEL: Record<RosterInput['role'], string> = { model: 'Model', photographer: 'Photographer', mua: 'Hair & makeup', stylist: 'Stylist' };

/**
 * Travel when they work away from home: flight is the producer's estimate (default €220),
 * arrival the day before with one hotel night, so the shoot day never depends on a guessed flight time.
 */
function travelFor(r: RosterPerson): Partial<Record<City, TravelTemplate>> {
  const out: Partial<Record<City, TravelTemplate>> = {};
  for (const c of CITIES) {
    if (c === r.city) continue;
    out[c] = { number: 'TBC', from: IATA[r.city], to: IATA[c], departMin: 0, arriveMin: 0, transferMin: 30, flight: r.flightCost ?? 220, taxi: 30, dayBefore: true, hotel: 120 };
  }
  return out;
}

export function toCatalog(r: RosterPerson): CatalogPerson {
  return {
    id: r.id, name: r.name, role: r.role, city: r.city,
    dayRate: r.dayRate, otRatePerHour: Math.round((r.dayRate / 8) * 1.25),
    local: true,
    ...(r.agency ? { agency: r.agency, commissionPct: r.commissionPct ?? 20 } : {}),
    bio: r.notes ?? '', tags: [], photo: r.photo ?? undefined,
    motion: r.role === 'photographer' ? true : undefined,
    travelTo: travelFor(r),
  };
}

/** Google search restricted to models.com, for finding real models and their agencies. */
export const modelsComSearch = (city: string, extra = '') =>
  `https://www.google.com/search?q=${encodeURIComponent(`site:models.com ${city} ${extra}`.trim())}`;

/** Drafted availability request; the producer sends it from their own phone. */
export function availabilityText(name: string, role: string, dateLabel?: string) {
  return `Hi ${name}, I'm producing a shoot${dateLabel ? ` on ${dateLabel}` : ''} and would love to book you as ${role.toLowerCase()}. Are you available? Happy to share the brief and rate.`;
}
export const whatsappLink = (phone: string, text: string) => `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
export const imessageLink = (phone: string, text: string) => `sms:${phone.replace(/[^0-9+]/g, '')}&body=${encodeURIComponent(text)}`;
