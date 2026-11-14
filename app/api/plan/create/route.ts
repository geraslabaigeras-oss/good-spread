import { z } from 'zod';
import { buildProduction } from '@/lib/engine';
import { logEvent, resetProduction } from '@/lib/server/db';
import { DEMO_SLUG, handle, ok, parseJson } from '@/lib/server/http';
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
  dnaPreserve: z.record(z.string(), z.boolean()).optional(),
});

/** Moment 3 → 4: build the production from the chosen strategy and picks, and open it on the board. */
export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseJson(req, Body);
    if ('error' in parsed) return parsed.error;
    const b = parsed.data;
    const okModels = new Set(candidates(b.strategy, 'model').map((c) => c.id));
    const okPhotos = new Set(candidates(b.strategy, 'photographer').map((c) => c.id));
    const okLocs = new Set(locationCandidates(b.strategy).map((l) => l.id));
    if (!b.picks.models.every((m) => okModels.has(m)) || !okPhotos.has(b.picks.photographer) || !okLocs.has(b.picks.location) || !catalogLocation(b.picks.location)) {
      return ok({ error: 'invalid_picks' }, { status: 400 });
    }
    const p = buildProduction({
      slug: DEMO_SLUG, title: b.brief.title, brand: b.brief.brand, strategy: b.strategy, picks: b.picks,
      brief: b.brief, deliverables: b.deliverables, cap: b.cap, startISO: b.startISO,
    });
    if (b.dnaPreserve && p.dna) p.dna = p.dna.map((d) => (d.id in b.dnaPreserve! ? { ...d, preserve: b.dnaPreserve![d.id] } : d));
    const id = await resetProduction(DEMO_SLUG, false, p);
    await logEvent(id, 'created', { text: `Production created: ${b.strategy} plan` });
    return ok({ slug: DEMO_SLUG });
  });
}
