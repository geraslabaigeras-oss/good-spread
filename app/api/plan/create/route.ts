import { z } from 'zod';
import { loadRoster } from '@/lib/server/roster';
import { buildProduction } from '@/lib/engine';
import { logEvent, resetProduction } from '@/lib/server/db';
import { handle, ok, parseJson } from '@/lib/server/http';
import { getProduction } from '@/lib/server/db';
import { randomBytes } from 'node:crypto';

/** A readable, unique address per production: "spring-jacket-k3f9". */
async function newSlug(title: string): Promise<string> {
  const base = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'shoot';
  for (;;) {
    const slug = `${base}-${randomBytes(2).toString('hex')}`;
    if (!(await getProduction(slug))) return slug;
  }
}
import { candidates, catalogLocation, locationCandidates } from '@/data/catalog';

const Brief = z.object({
  title: z.string().max(120), brand: z.string().max(120), garment: z.string().max(80), summary: z.string().max(600),
  aesthetic: z.array(z.string().max(40)).max(8), palette: z.array(z.string().max(40)).max(8), paletteHex: z.array(z.string().max(9)).max(8).optional(),
  lighting: z.string().max(200), setting: z.enum(['studio', 'outdoor', 'urban', 'interior', 'mixed']), settingNote: z.string().max(300),
  styling: z.string().max(300), casting: z.string().max(200), shotList: z.array(z.string().max(120)).max(10), source: z.enum(['ai', 'demo', 'cache']),
});

const Body = z.object({
  strategy: z.enum(['local', 'destination', 'hybrid']),
  picks: z.object({ models: z.array(z.string().max(40)).min(1).max(3), photographer: z.string().max(40), location: z.string().max(40) }),
  brief: Brief,
  deliverables: z.object({ stills: z.number().int().min(1).max(200), motion: z.number().int().min(0).max(50), usageMonths: z.number().int().min(1).max(60), usage: z.string().max(60), deadlineISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
  cap: z.number().int().min(500).max(1000000),
  startISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shootISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  dnaPreserve: z.record(z.string(), z.boolean()).optional(),
  place: z.object({ name: z.string().max(120), lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), description: z.string().max(200).nullable().optional() }).nullable().optional(),
});

/** Moment 3 → 4: build the production from the chosen strategy and picks, and open it on the board. */
export async function POST(req: Request) {
  return handle(async () => {
    await loadRoster();
    const parsed = await parseJson(req, Body);
    if ('error' in parsed) return parsed.error;
    const b = parsed.data;
    const okModels = new Set(candidates(b.strategy, 'model').map((c) => c.id));
    const okPhotos = new Set(candidates(b.strategy, 'photographer').map((c) => c.id));
    const okLocs = new Set(locationCandidates(b.strategy).map((l) => l.id));
    if (!b.picks.models.every((m) => okModels.has(m)) || !okPhotos.has(b.picks.photographer) || !okLocs.has(b.picks.location) || !catalogLocation(b.picks.location)) {
      return ok({ error: 'invalid_picks' }, { status: 400 });
    }
    const slug = await newSlug(b.brief.title);
    const p = buildProduction({
      slug, title: b.brief.title, brand: b.brief.brand, strategy: b.strategy, picks: b.picks,
      brief: b.brief, deliverables: b.deliverables, cap: b.cap, startISO: b.startISO, shootISO: b.shootISO ?? undefined,
    });
    // AI-scouted real location chosen on the Brief page
    if (b.place) p.studio = { ...p.studio, name: b.place.name, address: b.place.description ?? b.place.name, mapsUrl: `https://maps.google.com/?q=${b.place.lat},${b.place.lng}` };
    if (b.dnaPreserve && p.dna) p.dna = p.dna.map((d) => (d.id in b.dnaPreserve! ? { ...d, preserve: b.dnaPreserve![d.id] } : d));
    const id = await resetProduction(slug, false, p);
    await logEvent(id, 'created', { text: `Production created: ${b.strategy} plan` });
    return ok({ slug });
  });
}
