export type Role = 'producer' | 'model' | 'photographer' | 'mua' | 'stylist';

export type Person = {
  id: string; name: string; role: Role;
  agency?: string; commissionPct?: number;   // agency fee charged to client
  dayRate: number; otRatePerHour: number;     // € ; producer has 0
  local: boolean;                             // false = travels in
  motion?: boolean;                           // photographer can shoot the motion deliverables
  photo?: string; city?: string;              // from the roster, for faces on the board
};

export type Travel = {
  personId: string; mode: 'flight' | 'train';
  number: string; from: string; to: string;
  departMin: number; arriveMin: number; transferMin: number;
  source: string;                             // e.g. "seed" or file name
  scheduledArriveMin?: number;                // first planned arrival, kept when a change comes in
};

export type Late = { personId: string; readyMin: number; reportedAt: string };

export type BlockKind = 'setup' | 'hmu' | 'shoot' | 'lunch' | 'wrap';

export type Block = {
  id: string; kind: BlockKind;
  startMin: number; endMin: number; personIds: string[]; lookIds?: string[];
};

export type Look = { id: string; name: string; garment: string };

export type Category = 'talent' | 'crew' | 'studio' | 'travel' | 'post' | 'usage';

export type LineItem = {
  id: string;
  category: Category;
  label: string; qty: number; unit: 'day' | 'hour' | 'item' | 'flat'; rate: number;
  personId?: string;                          // links talent/crew/travel/usage to a person
  source: 'rate_card' | 'quote' | 'estimate'; note?: string;
  tag?: 'retouch' | 'usage' | 'studio' | 'location' | 'composite' | 'plates' | 'hotel' | 'fixer';
  months?: number;                            // usage term
};

// ---- pre-production (pivot: reference → strategies → assemble) ----

export type Deliverables = { stills: number; motion: number; usageMonths: number; usage: string; deadlineISO: string };

export type CreativeBrief = {
  title: string; brand: string; garment: string;
  summary: string;
  aesthetic: string[]; palette: string[]; paletteHex?: string[]; lighting: string;
  setting: 'studio' | 'outdoor' | 'urban' | 'interior' | 'mixed'; settingNote: string;
  styling: string; casting: string; shotList: string[];
  /** what to look for, read from the moodboard */
  needs?: { model: string; photographer: string; location: string };
  /** what each reference image was read as */
  references?: { index: number; usedFor: string; note: string }[];
  source: 'ai' | 'demo' | 'cache';
};

export type DnaCheck =
  | { type: 'looks'; lookIds: string[] }
  | { type: 'stills'; min: number }
  | { type: 'motion'; min: number }
  | { type: 'usage'; months: number }
  | { type: 'talent'; personIds: string[] }
  | { type: 'role'; role: Role }
  | { type: 'studio' }
  | { type: 'schedule' }
  | { type: 'note' };
export type DnaItem = { id: string; label: string; preserve: boolean; check: DnaCheck };
export type DnaResult = { id: string; label: string; preserve: boolean; ok: boolean; note?: string };

export type StrategyId = 'local' | 'destination' | 'hybrid';
export type Picks = { models: string[]; photographer: string; location: string };

export type Studio = {
  name: string; address: string; mapsUrl: string;
  opensMin: number; closesMin: number; bookedUntilMin: number; hourlyRate: number;
};

export type Production = {
  id: string; slug: string; title: string; brand: string;
  dateISO: string; version: number;
  studio: Studio;
  people: Person[]; shortlist: Person[];
  travel: Travel[]; late: Late[];
  blocks: Block[]; looks: Look[];
  budget: { cap: number; contingencyPct: number; items: LineItem[] };
  pending?: Pending | null;
  // pivot additions (optional so the original seed and tests keep working)
  city?: string;
  strategy?: StrategyId;
  picks?: Picks;
  shootDays?: number;
  deliverables?: Deliverables;
  brief?: CreativeBrief | null;
  dna?: DnaItem[];
};

export type ConflictCode = 'ARRIVAL' | 'LATE' | 'OVERLAP' | 'STUDIO_HOURS' | 'BUDGET' | 'UNAVAILABLE' | 'DEADLINE';
export type Conflict = { code: ConflictCode; personId?: string; blockId?: string; deltaMin: number; message: string };

export type FixKind = 'SWAP_ORDER' | 'SHIFT_FROM' | 'SWAP_TALENT' | 'BUDGET_PLAN';
export type Change = { personId: string; kind: 'call_time' | 'schedule' | 'replaced'; before?: string; after?: string; text: string };
export type Fix = {
  id: string; kind: FixKind; label: string; plan: Production;
  costDelta: number; changesCreative: boolean;
  peopleAffected: string[]; changes: Change[];
  detail?: string;
  levers?: { label: string; amount: number }[];   // itemised reasoning, e.g. "Studio → Loft studio: −€105"
  dna?: DnaResult[];
};

export type Pending = {
  inboxId: string; createdAt: string; source: string;
  conflicts: Conflict[]; fixes: Fix[]; recommendedFixId: string;
};

// ---- computed (never stored) ----

export type OvertimeLine = { label: string; personId?: string; minutes: number; amount: number };

export type BudgetLine = {
  id: string; category: Category; label: string; amount: number;
  source: LineItem['source'] | 'computed'; personId?: string; overtime?: boolean;
};

export type BudgetSummary = {
  lines: BudgetLine[];
  base: number;               // stored items + agency fees
  overtime: number;
  subtotal: number;           // base + overtime (committed spend)
  contingencyReserve: number; // contingencyPct of base
  contingency: number;        // reserve left after overtime draws it down
  total: number;              // subtotal + contingency left
  cap: number;
  remaining: number;          // cap - total
  byCategory: Record<Category, number>;
};

export type Receipt = {
  peopleUpdated: number; messagesTyped: 0; overtimeAvoided: number; fixedInSeconds: number;
  saved?: number; // budget plans: how much the approved plan took off the spend
};
