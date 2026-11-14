import type { Production } from '@/lib/types';
import { buildProduction } from '@/lib/engine/build';
import { DEMO_BRIEF, DEMO_CAP, DEMO_DELIVERABLES, DEMO_START } from './demo';

// The demo production = the Local strategy with its default picks. All fictional, labelled DEMO.
export function makeSeed(): Production {
  return buildProduction({
    slug: 'jacket-campaign',
    title: 'Jacket campaign (demo)',
    brand: 'Vėtra outerwear (demo brand)',
    strategy: 'local',
    brief: DEMO_BRIEF,
    deliverables: DEMO_DELIVERABLES,
    cap: DEMO_CAP,
    startISO: DEMO_START,
  });
}
