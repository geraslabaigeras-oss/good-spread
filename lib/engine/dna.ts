import type { CreativeBrief, Deliverables, DnaItem, DnaResult, Look, Production } from '@/lib/types';

/** Production DNA: what must survive any change, and what may move. */
export function defaultDna(d: Deliverables, brief: CreativeBrief | null | undefined, looks: Look[], modelIds: string[]): DnaItem[] {
  const garment = brief?.garment ?? looks[0]?.garment.split(',')[0] ?? 'Garment';
  const aesthetic = brief?.aesthetic?.slice(0, 2).join(', ') || 'editorial';
  return [
    { id: 'looks', label: `${garment}, ${looks.length} looks`, preserve: true, check: { type: 'looks', lookIds: looks.map((l) => l.id) } },
    { id: 'aesthetic', label: `Aesthetic: ${aesthetic}`, preserve: true, check: { type: 'note' } },
    { id: 'stills', label: `${d.stills} retouched stills`, preserve: true, check: { type: 'stills', min: d.stills } },
    { id: 'motion', label: `${d.motion} motion assets`, preserve: true, check: { type: 'motion', min: d.motion } },
    { id: 'usage', label: `Usage ${d.usage}, ${d.usageMonths} months`, preserve: true, check: { type: 'usage', months: d.usageMonths } },
    { id: 'casting', label: 'Casting', preserve: false, check: { type: 'talent', personIds: modelIds } },
    { id: 'photographer', label: 'Photographer', preserve: false, check: { type: 'role', role: 'photographer' } },
    { id: 'studio', label: 'Studio or location', preserve: false, check: { type: 'studio' } },
    { id: 'schedule', label: 'Schedule', preserve: false, check: { type: 'schedule' } },
  ];
}

const ids = (p: Production, role: string) => p.people.filter((x) => x.role === role).map((x) => x.id).sort().join(',');

/** Check each DNA item on `plan`, relative to the current plan `base`. */
export function evaluateDna(base: Production, plan: Production): DnaResult[] {
  const dna = base.dna ?? [];
  return dna.map((item) => {
    const c = item.check;
    let ok = true;
    let note: string | undefined;
    switch (c.type) {
      case 'looks': {
        const shot = new Set(plan.blocks.filter((b) => b.kind === 'shoot' && b.personIds.some((id) => plan.people.find((x) => x.id === id)?.role === 'model')).flatMap((b) => b.lookIds ?? []));
        const missing = c.lookIds.filter((l) => !shot.has(l));
        ok = missing.length === 0;
        if (!ok) note = `${missing.join(', ')} not shot`;
        break;
      }
      case 'stills': {
        const n = plan.budget.items.filter((i) => i.tag === 'retouch').reduce((s, i) => s + i.qty, 0);
        ok = n >= c.min;
        if (!ok) note = `${n} of ${c.min}`;
        break;
      }
      case 'motion': {
        const ph = plan.people.find((x) => x.role === 'photographer');
        ok = c.min === 0 || (!!ph && ph.motion !== false);
        if (!ok) note = `${ph?.name ?? 'Photographer'} shoots stills only`;
        break;
      }
      case 'usage': {
        const short = plan.budget.items.filter((i) => i.tag === 'usage' && (i.months ?? 12) < c.months);
        ok = short.length === 0;
        if (!ok) note = `${short[0].months} months`;
        break;
      }
      case 'talent':
        ok = ids(base, 'model') === ids(plan, 'model');
        break;
      case 'role':
        ok = ids(base, c.role) === ids(plan, c.role);
        break;
      case 'studio':
        ok = base.studio.name === plan.studio.name;
        break;
      case 'schedule': {
        const sig = (p: Production) => p.blocks.map((b) => `${b.id}:${b.startMin}-${b.endMin}`).sort().join('|');
        ok = sig(base) === sig(plan);
        break;
      }
      case 'note':
        ok = true;
        break;
    }
    return { id: item.id, label: item.label, preserve: item.preserve, ok, note };
  });
}

export const dnaViolations = (r: DnaResult[]) => r.filter((x) => x.preserve && !x.ok);
