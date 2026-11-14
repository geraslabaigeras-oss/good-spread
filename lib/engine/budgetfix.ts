import type { Fix, Person, Production } from '@/lib/types';
import { catalogPerson, LOCATIONS, MODELS, PHOTOGRAPHERS } from '@/data/catalog';
import { computeBudget, spend } from './budget';
import { detectConflicts } from './conflicts';
import { diffPeople } from './diff';
import { dnaViolations, evaluateDna } from './dna';
import { swapTalent } from './fixes';
import { money } from './time';

/**
 * A lever is one concrete, deterministic change to the plan that saves money.
 * `slot` stops two levers that touch the same thing (e.g. two photographers) being combined.
 */
type Lever = { id: string; slot: string; short: string; name: string; apply: (p: Production) => Production | null };

const round2 = (n: number) => Math.round(n * 100) / 100;
const clone = <T,>(x: T): T => structuredClone(x);

function asPerson(id: string, city?: string): Person | null {
  const c = catalogPerson(id);
  if (!c) return null;
  const p: Person = { id: c.id, name: c.name, role: c.role, dayRate: c.dayRate, otRatePerHour: c.otRatePerHour, local: !city || c.city === city };
  if (c.agency) { p.agency = c.agency; p.commissionPct = c.commissionPct; }
  if (c.role === 'photographer') p.motion = c.motion !== false;
  return p;
}

/** All levers available for this plan, from the catalog. */
export function levers(p: Production): Lever[] {
  const out: Lever[] = [];
  const city = p.city ?? 'Vilnius';
  const taken = new Set(p.people.map((x) => x.id));

  // 1. Cheaper studio in the same city (studio-hire plans only)
  const studioItem = p.budget.items.find((i) => i.tag === 'studio');
  if (studioItem) {
    for (const loc of LOCATIONS.filter((l) => l.city === city && l.kind !== 'location' && l.hourlyRate < studioItem.rate && l.name !== p.studio.name)) {
      out.push({
        id: `studio-${loc.id}`, slot: 'studio', short: `Studio → ${loc.name.split(',')[0].replace(' (demo)', '')}`, name: loc.name.split(',')[0].replace(' (demo)', ''),
        apply: (x) => {
          const n = clone(x);
          n.studio = { ...n.studio, name: loc.name, address: loc.address, mapsUrl: loc.mapsUrl, hourlyRate: loc.hourlyRate, opensMin: loc.opensMin, closesMin: loc.closesMin };
          n.budget.items = n.budget.items.map((i) => (i.tag === 'studio' ? { ...i, rate: loc.hourlyRate, source: 'quote' as const } : i));
          if (n.picks) n.picks = { ...n.picks, location: loc.id };
          return n;
        },
      });
    }
  }

  // 2. Cheaper photographer in the same city
  const ph = p.people.find((x) => x.role === 'photographer');
  if (ph) {
    for (const c of PHOTOGRAPHERS.filter((c) => c.city === city && !taken.has(c.id) && c.dayRate < ph.dayRate)) {
      out.push({
        id: `photo-${c.id}`, slot: 'photographer', short: `Photographer ${ph.name} → ${c.name}`, name: c.name,
        apply: (x) => {
          const inc = asPerson(c.id, city);
          return inc ? replacePerson(x, ph.id, inc) : null;
        },
      });
    }
  }

  // 3. Replace a travelling (or agency) model with a local one
  for (const m of p.people.filter((x) => x.role === 'model')) {
    const travelling = p.budget.items.some((i) => i.category === 'travel' && i.personId === m.id);
    if (!travelling && !m.agency) continue;
    const local = MODELS.filter((c) => c.city === city && !taken.has(c.id) && !c.agency).sort((a, b) => a.dayRate - b.dayRate)[0];
    if (!local) continue;
    out.push({
      id: `cast-${m.id}-${local.id}`, slot: `model-${m.id}`, short: `Casting ${m.name} → ${local.name}`, name: `${local.name} for ${m.name}`,
      apply: (x) => {
        const inc = asPerson(local.id, city);
        return inc ? swapTalent(x, m.id, inc) : null;
      },
    });
  }

  // 4. One model wears all looks (drop the second model)
  const models = p.people.filter((x) => x.role === 'model');
  if (models.length >= 2) {
    for (const drop of models) {
      const keep = models.find((x) => x.id !== drop.id)!;
      out.push({
        id: `one-model-${drop.id}`, slot: `model-${drop.id}`, short: `${keep.name} wears all looks`, name: `One model`,
        apply: (x) => oneModel(x, keep.id, drop.id),
      });
    }
  }

  // 5. Shorter usage term (12 → 6 months)
  if (p.budget.items.some((i) => i.tag === 'usage' && (i.months ?? 12) > 6)) {
    out.push({
      id: 'usage-6', slot: 'usage', short: 'Usage 12 → 6 months', name: '6-month usage',
      apply: (x) => {
        const n = clone(x);
        n.budget.items = n.budget.items.map((i) =>
          i.tag === 'usage' ? { ...i, rate: Math.round(i.rate / 2), months: 6, label: i.label.replace(/\d+ mo/, '6 mo') } : i,
        );
        return n;
      },
    });
  }

  // 6. Fewer retouched stills (12 → 8)
  const retouch = p.budget.items.find((i) => i.tag === 'retouch');
  if (retouch && retouch.qty > 8) {
    out.push({
      id: 'stills-8', slot: 'stills', short: `Retouch ${retouch.qty} → 8 stills`, name: '8 stills',
      apply: (x) => {
        const n = clone(x);
        n.budget.items = n.budget.items.map((i) => (i.tag === 'retouch' || i.tag === 'composite' ? { ...i, qty: 8, label: i.label.replace(/\d+ stills/, '8 stills') } : i));
        return n;
      },
    });
  }
  return out;
}

/** Replace one person with another everywhere (blocks, lines). Shortlist keeps the outgoing person. */
export function replacePerson(p: Production, outId: string, inc: Person): Production {
  const n = clone(p);
  const out = n.people.find((x) => x.id === outId);
  if (!out) return n;
  n.people = n.people.map((x) => (x.id === outId ? inc : x));
  n.shortlist = n.shortlist.filter((x) => x.id !== inc.id).concat(out);
  n.blocks.forEach((b) => (b.personIds = b.personIds.map((id) => (id === outId ? inc.id : id))));
  n.travel = n.travel.filter((t) => t.personId !== outId);
  n.late = n.late.filter((l) => l.personId !== outId);
  n.budget.items = n.budget.items
    .filter((i) => !(i.personId === outId && i.category === 'travel'))
    .map((i) => (i.personId === outId ? { ...i, id: i.id.replace(outId, inc.id), personId: inc.id, rate: i.category === 'crew' || i.category === 'talent' ? inc.dayRate : i.rate, label: i.label.replace(out.name, inc.name) } : i));
  if (n.picks && out.role === 'photographer') n.picks = { ...n.picks, photographer: inc.id };
  return n;
}

/** Consolidate: `keep` shoots every look; `drop` leaves the shoot. */
function oneModel(p: Production, keep: string, drop: string): Production {
  const n = clone(p);
  const dropped = n.people.find((x) => x.id === drop);
  n.people = n.people.filter((x) => x.id !== drop);
  if (dropped) n.shortlist = n.shortlist.concat(dropped);
  // hmu blocks only for the dropped model disappear; her shoot blocks go to `keep`
  n.blocks = n.blocks
    .filter((b) => !(b.kind === 'hmu' && b.personIds.includes(drop)))
    .map((b) => ({ ...b, personIds: Array.from(new Set(b.personIds.map((id) => (id === drop ? keep : id)))) }));
  n.travel = n.travel.filter((t) => t.personId !== drop);
  n.late = n.late.filter((l) => l.personId !== drop);
  n.budget.items = n.budget.items.filter((i) => i.personId !== drop);
  if (n.picks) n.picks = { ...n.picks, models: n.picks.models.filter((m) => m !== drop) };
  return n;
}

/**
 * Find up to three plans that bring the total under the cap, without leaving any timing conflict.
 * Each is checked against the Production DNA; plans that break a must-keep item are flagged as creative changes.
 */
export function proposeBudgetFixes(p: Production): Fix[] {
  const cap = p.budget.cap;
  const all = levers(p);
  const before = spend(p);
  type Cand = { set: Lever[]; plan: Production; total: number; violations: number };
  const cands: Cand[] = [];

  const combos: Lever[][] = [];
  const n = all.length;
  for (let a = 0; a < n; a++) {
    combos.push([all[a]]);
    for (let b = a + 1; b < n; b++) {
      combos.push([all[a], all[b]]);
      for (let c = b + 1; c < n; c++) combos.push([all[a], all[b], all[c]]);
    }
  }

  for (const set of combos) {
    if (new Set(set.map((l) => l.slot)).size !== set.length) continue;
    // "one model" and "recast the other model" are incompatible
    const castSlots = set.filter((l) => l.slot.startsWith('model-')).length;
    if (castSlots > 1 && set.some((l) => l.id.startsWith('one-model'))) continue;
    let plan: Production | null = clone(p);
    plan.pending = null;
    for (const l of set) {
      plan = plan ? l.apply(plan) : null;
      if (!plan) break;
    }
    if (!plan) continue;
    const total = computeBudget(plan).total;
    if (total > cap) continue;
    if (detectConflicts(plan).length) continue;
    const violations = dnaViolations(evaluateDna(p, plan)).length;
    cands.push({ set, plan, total, violations });
  }

  // Keep the creative first, then the smallest sacrifice (closest to the cap), then the fewest changes.
  cands.sort((a, b) => a.violations - b.violations || b.total - a.total || a.set.length - b.set.length);

  const picked: Cand[] = [];
  for (const c of cands) {
    if (picked.length >= 3) break;
    const ids = new Set(c.set.map((l) => l.id));
    // diversity: skip supersets of an already picked plan
    if (picked.some((q) => q.set.every((l) => ids.has(l.id)))) continue;
    picked.push(c);
  }

  return picked.map((c, i) => {
    // itemise: apply levers one by one and record each saving (incl. contingency effect)
    const items: { label: string; amount: number }[] = [];
    let cur: Production = clone(p);
    for (const l of c.set) {
      const next = l.apply(cur)!;
      items.push({ label: l.short, amount: round2(spend(next) - spend(cur)) });
      cur = next;
    }
    const dna = evaluateDna(p, c.plan);
    const broken = dnaViolations(dna);
    const changes = diffPeople(p, c.plan);
    return {
      id: `budget_${i + 1}`,
      kind: 'BUDGET_PLAN' as const,
      label: c.set.length === 1 ? c.set[0].short : c.set.map((l) => l.name).join(' + '),
      detail: broken.length
        ? `Breaks: ${broken.map((b) => b.label).join(', ')}`
        : `Total ${money(c.total)} · all must-keep items kept`,
      plan: c.plan,
      costDelta: round2(spend(c.plan) - before),
      changesCreative: broken.length > 0,
      peopleAffected: changes.map((x) => x.personId),
      changes,
      levers: items,
      dna,
    };
  });
}
