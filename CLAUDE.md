# GOOD SPREAD — build brief for Claude Code

You are the technical lead's pair-programmer at **Unfair Weekend**, a vibecoding hackathon in Vilnius.
Hard deadline: **submit Saturday 14 Nov, 19:30 Vilnius time** (organizers may allow later; plan for this).
Feature freeze: **Saturday 14:00**. Work in the phases below, in order. Do not add features that are not in this file without asking.

---

## 1. The idea in one paragraph

GOOD SPREAD is a **living production plan for fashion photoshoots**. The producer feeds it the messy inbox (a flight PDF, a WhatsApp screenshot, an agency email). AI reads it into structured data, a deterministic engine finds what breaks (a model lands after her call time), proposes three fixes with exact cost, and after the producer approves one, **every person on the shoot gets their own live "my day" page and an SMS** with what changed for them. They tap "Got it", and the producer sees who has seen the change. Talent can also push changes back ("Running late +30"), which re-runs the loop.

**Pitch line:** Producers plan it. Talent lives it. One change updates everyone.

**Positioning:** Mediaslide runs the model agency. Creative Force runs the in-house e-commerce studio. Nobody runs the shoot *between* companies (brand + agencies + freelancers + rented studio). We do. Business: planning is the wedge; we earn on crew payments later (the Wrap screen shows invoices; "paid in 48h" is coming soon, not built).

**Core rule (architecture and pitch):** AI only reads messy input. Plain TypeScript code does every calculation and decision. That is why it is reliable.

---

## 2. The 3-minute demo this build must support

Every screen exists to make this run flawlessly. If something doesn't serve it, cut it.

1. Producer board shows the seeded production: jacket campaign, 1 day, Vilnius studio, €5,000 cap, team of 6, timeline, budget.
2. Big QR on screen. Judges scan, pick a role (Ieva, Marta, Photographer, MUA, Stylist), optionally enter a phone number, land on their personal "my day" page.
3. Producer drops a **flight PDF**: Ieva's flight now lands 10:45. Extraction card shows what was read. Red conflict: "Ieva can't make 09:00 hair and makeup". Three fixes, each with € cost and people affected.
4. Producer approves **Swap order** (Marta goes first, Ieva after lunch, €0). Judges' phones buzz (SMS) and their pages flash the change. "Got it" names turn green on the board, live.
5. A judge holding Ieva's page taps **Running late +30**. Board flags it, recommends **Shift from 11:30** (small overtime cost). Approve. All phones update again.
6. Board shows the receipt: people updated, messages typed 0, overtime avoided €X, fixed in N seconds — all computed.
7. Wrap screen: each person's statement (hours, rate, overtime, agency fee, total). "Pay crew in 48h — coming soon" badge.

Each step must land in under ~10 seconds. No login screens. No spinner longer than 3 s. No chat box.

---

## 3. Stack

- **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui**, deployed on **Vercel**. Deploy an empty app first.
- **Supabase** Postgres (and Storage for uploaded files if needed). All DB access server-side via API routes using the service role key. **Never expose the service role key to the client.** Enable RLS on all tables with no policies (service role bypasses).
- **Anthropic SDK** (`@anthropic-ai/sdk`), model `claude-sonnet-5-5`, for extraction (and an optional one-sentence explanation).
- **Twilio** for SMS (optional at runtime: if env vars are missing, skip sending and log).
- **Vitest** for the engine.
- `qrcode.react` for the QR code. `pdf-lib` for generating demo PDFs.
- Clients poll every **2 s** (SWR `refreshInterval: 2000` or a simple interval). No websockets.

Env vars:
```
NEXT_PUBLIC_APP_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
TWILIO_ACCOUNT_SID=        # optional
TWILIO_AUTH_TOKEN=         # optional
TWILIO_FROM=               # optional
```

---

## 4. Time model

All times are **minutes from 00:00 on the shoot date** (Europe/Vilnius). 09:00 = 540. This keeps the engine trivial and testable. Format for display with a helper `fmt(min) -> "09:00"`. Round all schedule shifts **up to 15 minutes**.

---

## 5. Data model (`lib/types.ts`)

```ts
export type Role = 'producer' | 'model' | 'photographer' | 'mua' | 'stylist';

export type Person = {
  id: string; name: string; role: Role;
  agency?: string; commissionPct?: number;   // agency fee charged to client
  dayRate: number; otRatePerHour: number;     // € ; producer has 0
  local: boolean;                             // false = travels in
};

export type Travel = {
  personId: string; mode: 'flight' | 'train';
  number: string; from: string; to: string;
  departMin: number; arriveMin: number; transferMin: number;
  source: string;                             // e.g. "seed" or file name
};

export type Late = { personId: string; readyMin: number; reportedAt: string };

export type Block = {
  id: string; kind: 'setup' | 'hmu' | 'shoot' | 'lunch' | 'wrap';
  startMin: number; endMin: number; personIds: string[]; lookIds?: string[];
};

export type Look = { id: string; name: string; garment: string };

export type LineItem = {
  id: string;
  category: 'talent' | 'crew' | 'studio' | 'travel' | 'post' | 'usage';
  label: string; qty: number; unit: 'day' | 'hour' | 'item' | 'flat'; rate: number;
  personId?: string;                          // links talent/crew/travel/usage to a person
  source: 'rate_card' | 'quote' | 'estimate'; note?: string;
};

export type Production = {
  id: string; slug: string; title: string; brand: string;
  dateISO: string; version: number;
  studio: { name: string; address: string; mapsUrl: string;
            opensMin: number; closesMin: number; bookedUntilMin: number; hourlyRate: number };
  people: Person[]; shortlist: Person[];
  travel: Travel[]; late: Late[];
  blocks: Block[]; looks: Look[];
  budget: { cap: number; contingencyPct: number; items: LineItem[] };
  pending?: Pending | null;
};

export type ConflictCode = 'ARRIVAL' | 'LATE' | 'OVERLAP' | 'STUDIO_HOURS' | 'BUDGET' | 'UNAVAILABLE';
export type Conflict = { code: ConflictCode; personId?: string; blockId?: string; deltaMin: number; message: string };

export type FixKind = 'SWAP_ORDER' | 'SHIFT_FROM' | 'SWAP_TALENT';
export type Change = { personId: string; kind: 'call_time' | 'schedule' | 'replaced'; before?: string; after?: string; text: string };
export type Fix = {
  id: string; kind: FixKind; label: string; plan: Production;
  costDelta: number; changesCreative: boolean;
  peopleAffected: string[]; changes: Change[];
};

export type Pending = {
  inboxId: string; createdAt: string; source: string;
  conflicts: Conflict[]; fixes: Fix[]; recommendedFixId: string;
};
```

### Supabase schema (`supabase/schema.sql`)

```sql
create table productions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  data jsonb not null,
  version int not null default 1,
  updated_at timestamptz not null default now()
);
create table events (            -- activity log
  id bigserial primary key,
  production_id uuid references productions(id) on delete cascade,
  type text not null,            -- inbox_read | conflict | approved | sms_sent | ack | late | reset
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table revisions (
  id bigserial primary key,
  production_id uuid references productions(id) on delete cascade,
  version int not null,
  fix_kind text, changes jsonb not null, receipt jsonb,
  created_at timestamptz not null default now()
);
create table viewers (           -- a judge/crew device that joined via QR
  id uuid primary key default gen_random_uuid(),
  production_id uuid references productions(id) on delete cascade,
  person_id text not null,
  token text unique not null,
  phone text,                    -- optional, opt-in, deleted on full reset
  created_at timestamptz not null default now()
);
create table acks (
  viewer_id uuid references viewers(id) on delete cascade,
  version int not null,
  acked_at timestamptz not null default now(),
  primary key (viewer_id, version)
);
create table extractions (       -- cache keyed by sha256 of input
  sha256 text primary key,
  result jsonb not null,
  created_at timestamptz not null default now()
);
alter table productions enable row level security;
alter table events enable row level security;
alter table revisions enable row level security;
alter table viewers enable row level security;
alter table acks enable row level security;
alter table extractions enable row level security;
```

---

## 6. Seed scenario (`data/seed.ts`) — all fictional, labelled DEMO

- Production: slug `jacket-campaign`, title "Jacket campaign (demo)", brand "Vėtra outerwear (demo brand)", date `2026-11-21`.
- Studio: "Demo studio, Vilnius", address "Demo address, Vilnius", opens 07:00 (420), closes 18:00 (1080), crew/studio **booked until 15:00 (900)**, studio €60/h.
- People:

| id | name | role | agency | commission | dayRate | OT €/h | local |
|---|---|---|---|---|---|---|---|
| producer | Producer (you) | producer | — | — | 0 | 0 | yes |
| ieva | Ieva | model | Milan agency (demo) | 20% | 600 | 75 | **no** |
| marta | Marta | model | — (freelance) | — | 450 | 55 | yes |
| tomas | Tomas | photographer | — | — | 900 | 90 | yes |
| greta | Greta | mua | — | — | 350 | 40 | yes |
| lukas | Lukas | stylist | — | — | 400 | 45 | yes |

- Shortlist (not booked): `austeja`, Austėja, model, local, dayRate 500, OT 60.
- Travel: Ieva, flight **DA 641** (fictional "Demo Air"), MXP → VNO, depart 04:55 (295), **arrive 07:40 (460)**, transfer 30 min.
- Looks: L1–L4 (L1, L2 = Ieva's; L3, L4 = Marta's), garment "Field jacket" variants.
- Blocks:

| id | kind | time | people | looks |
|---|---|---|---|---|
| b-setup | setup | 08:00–09:00 | producer, tomas, lukas | |
| b-hmu-a | hmu | 09:00–10:00 | ieva, greta | |
| b-shoot-a | shoot | 10:00–12:00 | ieva, tomas, lukas | L1, L2 |
| b-hmu-b | hmu | 11:30–12:30 | marta, greta | |
| b-lunch | lunch | 12:00–12:30 | producer, tomas, lukas | |
| b-shoot-b | shoot | 12:30–14:30 | marta, tomas, lukas | L3, L4 |
| b-wrap | wrap | 14:30–15:00 | producer, tomas, lukas | |

- Budget (cap €5,000, contingency 10%):
  - Talent: Ieva 1 day × 600 (rate_card), Marta 1 day × 450 (rate_card)
  - Agency fee: computed automatically = dayRate × commissionPct for people with an agency (Ieva: €120). Label "Agency fee 20% (estimate)".
  - Crew: Tomas 900, Greta 350, Lukas 400 (rate_card)
  - Studio: 7 h × 60 (08:00–15:00) (quote)
  - Travel: flight MXP–VNO €180 (quote, personId ieva), taxi airport→studio €30 (estimate, personId ieva)
  - Post: retouching 6 images × 40 (estimate)
  - Usage: web + social 12 months, Ieva €300, Marta €300 (estimate, personIds)
  - Subtotal 4,290 + contingency 429 = **€4,719** (under cap). Overtime lines are computed, never stored.

The seed has **zero conflicts**. Write a test for that.

---

## 7. Engine (`lib/engine/*.ts`) — pure functions, no AI, no I/O

- `callTime(p, personId)` → start of that person's earliest block.
- `readyAt(p, personId)` → max(arrival + transfer if travelling, late.readyMin if reported, 0).
- `computeOvertime(p)` → per person: minutes their last block ends past `bookedUntilMin`, rounded up to 15, × OT rate; plus studio minutes past `bookedUntilMin` × studio rate. Returns line items `{label, personId?, amount}`.
- `computeBudget(p)` → items + agency fees + overtime, subtotal, contingency, total, remaining vs cap, totals by category.
- `detectConflicts(p)` → ARRIVAL/LATE (readyAt > callTime, deltaMin = difference), OVERLAP (same person in overlapping blocks; lunch overlaps are fine only if the person isn't in both), STUDIO_HOURS (block outside opens/closes), BUDGET (total > cap), UNAVAILABLE (late.readyMin = 99999).
- `proposeFixes(p, conflict)` → up to three, each a full new plan, each re-checked with `detectConflicts(plan)` (drop any that leave conflicts):
  1. **SWAP_ORDER** — for a late model: find another model whose first block starts at or after the late model's readyAt and whose own readyAt ≤ the late model's current call time. Swap the two people in all their hmu/shoot blocks and swap their look ids. Usually €0.
  2. **SHIFT_FROM** — shift every block with `startMin >= callTime(late person)` by `ceil15(deltaMin)`. Cost = overtime + studio extra from `computeOvertime`.
  3. **SWAP_TALENT** — replace the person with the first local shortlist person of the same role. Move their personId in blocks; replace their talent, travel and agency-fee lines with the new person's day rate (usage line stays). `changesCreative: true`.
- `rankFixes(fixes)` → `changesCreative: false` first, then lowest `costDelta`, then fewest `peopleAffected`. First = recommended.
- `diffPeople(before, after)` → for every non-producer person: call time change (`"09:00" → "11:30"`), or schedule change (any of their blocks moved, **or the other people in any of their blocks changed**, e.g. the MUA now does Marta first), or replaced. Produces human text per person, e.g. "Your call moved 09:00 → 11:30." / "Order changed: you now do Marta at 09:00 and Ieva at 11:30."
- `receipt(pending, chosenFix, approvedAt)` → `{ peopleUpdated, messagesTyped: 0, overtimeAvoided, fixedInSeconds }` where `overtimeAvoided = max(0, cheapest other non-creative fix cost − chosen cost)`.

### Required tests (`lib/engine/engine.test.ts`) — write these first

```ts
test('seed has no conflicts and budget is 4719', ...)
test('flight lands 10:45 -> ARRIVAL conflict of 135 min for ieva', ...)
test('SWAP_ORDER fixes it at €0: ieva call 11:30, marta call 09:00, zero conflicts', ...)
test('SHIFT_FROM costs 535 (tomas 202.5 + lukas 101.25 + marta 96.25 + studio 135), zero conflicts', ...)
test('SWAP_TALENT replaces ieva with austeja, changesCreative true, ranked last', ...)
test('recommended fix is SWAP_ORDER; receipt overtimeAvoided = 535', ...)
test('after swap, ieva late +30 -> LATE conflict 30 min; SHIFT_FROM recommended; zero conflicts after', ...)
test('diffPeople after swap updates ieva, marta, tomas, greta, lukas (5)', ...)
```

(If your overtime numbers differ slightly because of rounding, fix the code or the test so they agree with the rules above, then keep them green.)

---

## 8. AI extraction (`lib/ai/extract.ts`)

- Input: PDF (send as a `document` block, base64), image (`image` block, e.g. WhatsApp screenshot), or plain text.
- Force a single tool call `record_update` (`tool_choice: { type: 'tool', name: 'record_update' }`) with this input schema:

```json
{
  "type": "object",
  "properties": {
    "type": { "enum": ["flight", "delay", "booking", "quote", "unknown"] },
    "personName": { "type": ["string", "null"] },
    "flight": { "type": "object", "properties": {
      "number": {"type": "string"}, "from": {"type": "string"}, "to": {"type": "string"},
      "departTime": {"type": "string", "description": "HH:MM local"},
      "arriveTime": {"type": "string", "description": "HH:MM local"},
      "date": {"type": "string", "description": "YYYY-MM-DD"} } },
    "delay": { "type": "object", "properties": {
      "newEtaTime": {"type": "string", "description": "HH:MM local"},
      "reason": {"type": "string"} } },
    "summary": { "type": "string", "description": "one short line of what was read" },
    "confidence": { "type": "number" }
  },
  "required": ["type", "summary", "confidence"]
}
```

- System prompt: "Extract only facts present in the input. If a value is not present, return null. Never guess times."
- **Code, not AI,** fuzzy-matches `personName` to a Person (case-insensitive, first-name match is enough) and converts to an update:
  - `flight` → replace that person's Travel (arriveMin from arriveTime).
  - `delay` for a travelling person → set their Travel.arriveMin to newEta; otherwise add a Late with readyMin.
  - `booking` / `quote` → log only (stretch: add a budget line).
- **Cache** by sha256 of the bytes/text in `extractions`. Timeout 8 s. On error/timeout: use cache; if no cache, return `type: unknown` and the UI opens a small manual form (person + new arrival time).
- Show the producer an **extraction card** before applying: "Read from flight_DA645.pdf: Ieva, DA 645, lands 10:45" with an Edit link and an Apply button.
- Optional `explain(conflict, fixes)`: one or two sentences on why the recommended fix wins, using only the numbers given. Fallback to a template string. Lowest priority.

---

## 9. Pages and API

| Route | Who | What |
|---|---|---|
| `/` | — | redirect to `/board/jacket-campaign` |
| `/board/[slug]` | producer (laptop) | the main screen (below) |
| `/join/[slug]` | judges | 5 big role cards → optional phone input (with "Text me updates" opt-in) → creates viewer → redirect `/p/[token]` |
| `/p/[token]` | talent / judges | "My day" page (below) |
| `/wrap/[slug]` | producer | per-person statements |
| `POST /api/inbox` | producer | multipart file or `{text}` → extraction → returns card data (does not apply yet) |
| `POST /api/inbox/apply` | producer | apply the update → detect conflicts → propose & rank fixes → save `pending` → log events |
| `POST /api/fixes/approve` | producer | apply fix plan, version+1, insert revision with changes + receipt, clear pending, send SMS to opted-in viewers of affected people, log events |
| `POST /api/ack` | talent | `{token}` → ack current version |
| `POST /api/late` | talent | `{token, minutes}` (15/30/60, or `unavailable`) → Late with readyMin = callTime + minutes → conflicts + fixes → pending (producer approves on board) |
| `GET /api/state/[slug]` | both | production, budget, conflicts, pending, viewers, ack status per person, last 20 events, last revision |
| `GET /api/me/[token]` | talent | that person's view model incl. last change for them and whether they acked the current version |
| `POST /api/reset` | producer | `{full?: boolean}` → restore seed, clear events/revisions/acks/pending; `full` also deletes viewers and phone numbers |

### Producer board layout (desktop, one screen, no scrolling needed for the demo path)
- Header: title, date, version badge, buttons "Show join QR" (opens a large QR panel) and "Reset" (small, top right; full reset behind a confirm).
- **People strip:** each person: name, role, call time, status chip — "Seen" (green, any of their viewers acked current version), "Not seen yet", or "No device".
- **Timeline:** rows per person, blocks as bars between 07:00 and 18:00, a line at 15:00 labelled "booked until". Changed blocks flash after approve.
- **Inbox drop zone:** drag a PDF/image or paste text. Shows the extraction card, then Apply.
- **Conflict + fixes panel:** red conflict line; three fix cards side by side: label, € delta (big), people affected, "changes the creative" warning if true, recommended badge, Approve button.
- **Receipt** after approve: four metric cards — People updated · Messages typed (0) · Overtime avoided (€) · Fixed in (s). Plus a green "Fix applied: …" banner.
- **Budget:** total vs cap bar; by-category list; every line shows its source chip (rate card / quote / estimate); computed overtime lines in amber.
- **Activity log:** time + one line per event, newest first.

### "My day" page (mobile-first)
- Name + role, "Updated HH:MM" badge if the current version changed anything for them and they haven't acked.
- **Call time huge** (≥ 56px), with the old time struck through after a change.
- Travelling: "You land 10:45 · car to studio 30 min". Local: "Leave by" = call − 30 min.
- Address + "Open map" link, their looks, who else is on set.
- Buttons: **Got it** (primary), **Running late** → +15 / +30 / +60, **Can't make it** (secondary, smaller).
- Never show rates, fees or other people's money on this page.
- On version change: short highlight flash and `navigator.vibrate?.(200)` (Android only; fine if it does nothing on iOS).

### Wrap page
- Table per person: scheduled hours (first block start → last block end), day rate, overtime (from engine), agency fee where relevant, total. A footer badge: "Pay crew in 48 h — coming soon". No real payment code.

### SMS (`lib/sms.ts`)
- Only after producer approval, only to viewers who entered a number **and** whose person has a change.
- Text (≤ 160 chars): `GOOD SPREAD (demo): {name}, {change text}. Confirm: {APP_URL}/p/{token}`
- If Twilio env is missing or a send fails: log an event `sms_skipped`, never block the approve flow.

---

## 10. Demo documents (`scripts/make-demo-docs.ts`, run once, output to `public/demo-docs/`)

Generate with `pdf-lib`, each with a visible **"DEMO — fictional document"** watermark. Use the fictional airline "Demo Air"; no real airline names or logos.
1. `flight_DA645_change.pdf` — booking change for passenger IEVA (surname "DEMO"), flight DA 645 MXP → VNO, 21 Nov 2026, departs 07:55, **arrives 10:45**.
2. `agency_confirmation_ieva.pdf` — booking confirmation from "Milan agency (demo)": Ieva, 21 Nov 2026, day rate €600, usage web + social 12 months.
3. `studio_quote.pdf` — "Demo studio, Vilnius": 7 hours 08:00–15:00 at €60/h, overtime €60/h.

The team will add a WhatsApp screenshot ("flight delayed, landing 11:40") taken on a real phone.

---

## 11. Design direction

Event theme is "taste wins". Make it look like a fashion production tool, not a SaaS template.
- Off-white background (`#FAFAF7`), near-black text, one accent for actions, red only for conflicts, green only for "seen/applied", amber for overtime.
- Display serif for headings and big numbers (e.g. Instrument Serif via `next/font/google`), Inter for UI.
- Generous whitespace, thin hairline borders, no gradients, no shadows, no emoji.
- Motion only where it carries meaning: a 1.5 s highlight fade on anything that just changed.

---

## 12. Build phases (do them in order; commit after each; keep tests green)

**Phase 0 — 30 min.** Scaffold Next.js + Tailwind + shadcn, deploy to Vercel, connect Supabase, run `schema.sql`, add `/api/reset` that writes the seed. Done when: the live URL shows the seed title from the database.

**Phase 1 — engine, ~2.5 h.** Types, seed, all engine functions, all tests in section 7. Done when: `vitest` is green.

**Phase 2 — extraction, ~1.5 h.** `make-demo-docs`, `/api/inbox`, `/api/inbox/apply`, cache, fallback. Done when: the three demo PDFs (and a pasted text "Ieva's flight now lands 10:45") produce the right update, and the second run comes from cache.

**Phase 3 — producer board, ~3 h.** Everything in the board layout; approve flow; receipt; activity log; reset. Done when: drop PDF → conflict → 3 fixes → approve → version 2, timeline and people strip update.

**Phase 4 — talent side, ~2 h.** `/join`, `/p/[token]`, acks, Running late, SMS, polling. Done when: 5 real phones join through the QR, see their day, update within 2 s of approve, "Got it" turns their name green on the board, and "Running late +30" on Ieva's phone produces a new conflict with SHIFT_FROM recommended.

**Phase 5 — proofing, ~1 h.** Wrap page, full reset, preloaded extraction cache, mobile Safari + Android Chrome check, hotspot test. **Freeze at 14:00.**

**Stretch, only if Phase 5 is done before 13:00:** "Can't make it" flow (UNAVAILABLE → SWAP_TALENT), explanation sentence, budget line from a quote PDF, route comparison card.

---

## 13. Guardrails

- No login, no payments, no live booking, no image generation, no marketplace.
- No outbound message without producer approval; SMS only to numbers that opted in on the join page; phone numbers deleted on full reset.
- All demo data fictional and labelled "demo". Rate-card numbers labelled as estimates where they are estimates.
- Secrets server-side only. Validate inputs on every API route.
- If something is ambiguous, choose the option that makes the section 2 demo more reliable, and leave a one-line note in `NOTES.md`.
