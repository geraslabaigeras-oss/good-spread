# GOOD SPREAD: DESIGN.md (replaces section 11 "Design direction" of the build brief)

Read this before you touch any UI. It is a spec, not a mood board. Where it gives a number, use that number. Where it says nothing, use the closest token below and add a one-line note to `NOTES.md`. **Do not add features.** Everything here styles screens that already exist in section 9.

The feel is a **fashion production binder**: a printed call sheet on warm paper, set in a newspaper serif, with mono for anything you'd read off a clipboard (times, money, flight numbers). Calm like cosmos.so, built from plain blocks like Are.na. Colour appears only when it means something.

Time budget is about 75 min of implementation. Build in this order: **P0** §1–§4 (tokens, fonts, layout, components) → **P1** §5.6–§5.10 (approve sequence and my-day change) → **P2** the rest of §5. If 14:00 is close, ship P0 and P1 only.

---

## 0. Install

```bash
npm i motion            # Framer Motion. Import from "motion/react" only
# qrcode.react already in the brief. Do not add any other UI or animation library.
```

Wrap the root layout body in `<MotionConfig reducedMotion="user">` (from `motion/react`).

---

## 1. Tokens

### 1.1 Colours (all hex; the only colours allowed in the app)

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#f7f5f3` | page background everywhere |
| `--surface` | `#ffffff` | only for raised things: QR panel block, mobile sheet, extraction card |
| `--ink` | `#0d0d0d` | text, shoot bars, toasts, primary rules |
| `--grey-1` | `#6e6a69` | secondary text (roles, meta, labels, axis) |
| `--grey-2` | `#9a9796` | tertiary: disabled, placeholders, decorative dots. **Never for text that must be read** |
| `--grey-3` | `#e9e7e5` | neutral fill (ink 6% on paper): source chip "rate card", budget track, hover rows |
| `--hairline` | `rgb(13 13 13 / 0.12)` (≈ `#dbd9d7`) | every border and divider |
| `--hairline-strong` | `rgb(13 13 13 / 0.24)` (≈ `#bfbdbc`) | input borders, dashed outlines, hover border |
| `--ink-10` | `#e0dedc` | setup/wrap bars, hour gridline strong |
| `--ink-24` | `#bfbdbc` | hmu bars |
| `--after-hours` | `#efedeb` | timeline background right of the 15:00 line |
| `--action` | `#1747c8` | **the one accent**: primary buttons, recommended badge, focus ring, "Updated" badge, drag-over, change highlight |
| `--action-hover` | `#123ba8` | primary hover |
| `--action-tint` | `#e5e7f0` | change highlight fill, drag-over fill |
| `--conflict` | `#b02e1b` | conflicts only |
| `--conflict-tint` | `#f1e5e2` | conflict line background |
| `--seen` | `#1a6b3e` | "Seen" and "Fix applied" only |
| `--seen-tint` | `#e3e9e3` | Seen chip, applied banner, Got it confirmed |
| `--overtime` | `#8a5000` | overtime only (budget lines, timeline overtime segment, wrap column) |
| `--overtime-tint` | `#ece4db` | overtime chip background |

**Why `#1747c8`:** call-sheet blue, the producer's pen on a printed schedule. It is the only hue that can't be confused with the red, green and amber status colours, and it isn't purple.

### 1.2 Measured contrast (WCAG 2.x, computed)

| Pair | Ratio | Verdict |
|---|---|---|
| ink on paper | 17.87 | AAA |
| grey-1 on paper / on white | 4.92 / 5.35 | AA body text |
| grey-1 on grey-3 | 4.33 | **fails**: never put grey-1 text on grey-3 fill |
| grey-2 on paper | 2.67 | **fails**: decorative or disabled only |
| white on action | 7.58 | AAA (primary buttons) |
| action on paper / on action-tint | 6.97 / 6.14 | AA (badge text, links) |
| conflict on paper / on conflict-tint / white on conflict | 5.94 / 5.24 / 6.46 | AA |
| seen on paper / on seen-tint | 6.00 / 5.29 | AA |
| overtime on paper / on overtime-tint | 5.98 / 5.17 | AA |
| ink on ink-24 (hmu bar label) | 10.38 | AAA |
| paper on ink (shoot bar, toast) | 17.87 | AAA |
| hairline-strong vs paper (input border) | 1.72 | below 3:1 non-text. Accepted for calm. The focus ring (6.97) carries the state |

### 1.3 Radius, borders, elevation

- Radius scale, and nothing else: `4px` (source chips, timeline bars, budget bar), `10px` (inputs, toasts, conflict line, applied banner), `20px` (blocks: fix cards, extraction card, receipt metrics, QR block, join role cards, mobile sheet top corners), `9999px` (buttons, status chips, badges).
- Borders are always `1px solid var(--hairline)`. Selected or emphasised blocks use `1.5px solid var(--ink)`.
- **Elevation is zero.** No `box-shadow` anywhere. Layering is done with `--surface` white on `--paper` plus a hairline.

### 1.4 Spacing scale (px)

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56 · 80`. These are the Tailwind steps `1 2 3 4 5 6 8 10 14 20`. No other gaps or paddings.

---

## 2. Fonts

Load all three with `next/font/google` in `app/layout.tsx`, with subsets `['latin', 'latin-ext']`. latin-ext is required for ą č ę ė į š ų ū ž, as in Austėja and Vėtra. All three fonts were checked and contain these glyphs.

| Role | Font | Why |
|---|---|---|
| Display serif: headings and big numbers | **Newsreader** (variable, `opsz` axis) | Editorial newspaper serif with an optical display cut. **Its digits are tabular by default** (all 0–9 are 1100 units wide), so call times and count-ups don't jitter. Instrument Serif was rejected: its digits are proportional (249–460 units), it has no `tnum` feature, and it has no → glyph. |
| UI | **Schibsted Grotesk** | A grotesk from a news publisher, so it pairs with Newsreader. Has `tnum`, `zero` and →. Less generic than Inter or Geist (Geist is the create-next-app default, which reads as "template"). |
| Mono: times, €, flight numbers, labels | **IBM Plex Mono** 400 and 500 | Typewriter call-sheet feel. Fixed-width digits. Has →. |

```tsx
// app/layout.tsx
import { Newsreader, Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { MotionConfig } from "motion/react";

const serif = Newsreader({ subsets: ["latin", "latin-ext"], axes: ["opsz"], variable: "--font-newsreader", display: "swap" });
const sans  = Schibsted_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-schibsted", display: "swap" });
const mono  = IBM_Plex_Mono({ subsets: ["latin", "latin-ext"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </body>
    </html>
  );
}
```
(`MotionConfig` needs a client boundary. If the layout is a server component, put it in `components/providers.tsx` with `"use client"`.)

### Number rules

- Every number that can change (times, €, counts, seconds) uses class `num`, which sets `font-variant-numeric: tabular-nums lining-nums`. It applies in all three fonts.
- Newsreader never renders `→`, because it has no glyph for it. Arrows always go inside a mono span.
- Animated numbers (count-up, time roll) must sit in a box with a fixed `min-width` in `ch`, so the layout doesn't shift.

### 2.1 Type scale (exact)

| Role | Font | Size / line-height | Tracking | Weight | Notes |
|---|---|---|---|---|---|
| Board title | serif | 28 / 32 | -0.01em | 400 | "Jacket campaign (demo)" |
| Page title (join, wrap) | serif | 44 / 48 | -0.02em | 400 | mobile join: 36 / 40 |
| QR heading | serif | 64 / 64 | -0.025em | 400 | 1280 wide: 56 / 56 |
| Section label | mono | 11 / 16 | +0.08em | 500 | UPPERCASE, grey-1. Every section starts with one |
| Wordmark | mono | 12 / 16 | +0.14em | 500 | "GOOD SPREAD", ink |
| Call time huge (my day) | serif | `clamp(56px, 24vw, 104px)` / 0.9 | -0.03em | 400 | 94px at 390 wide. `num` |
| Old call time (struck) | serif | 28 / 32 | -0.01em | 400 | grey-1, 2px ink strike |
| Fix € delta | serif | 44 / 44 | -0.02em | 400 | `num`. 1280 wide: 40 / 40 |
| Fix title | serif | 24 / 28 | -0.01em | 400 | "Swap order" |
| Receipt metric | serif | 48 / 48 | -0.02em | 400 | `num`. 1280 wide: 44 / 44 |
| Budget total | serif | 32 / 36 | -0.015em | 400 | "€4,719" + mono " / €5,000" grey-1 |
| Person name (strip) | sans | 15 / 20 | -0.005em | 500 | |
| Person name (my day) | serif | 32 / 36 | -0.01em | 400 | |
| Body (board) | sans | 14 / 20 | 0 | 400 | |
| Body (mobile) | sans | 16 / 24 | 0 | 400 | |
| Small / meta | sans | 13 / 18 | 0 | 400 | grey-1 |
| Mono inline (times, €, flight no.) | mono | 13 / 20 | 0 | 400 | 500 when emphasised |
| Mono on mobile | mono | 15 / 22 | 0 | 400 | "You land 10:45" |
| Timeline bar label / axis | mono | 11 / 14 | +0.02em | 400 | |
| Chips and badges | sans | 12 / 16 | 0 | 500 | |
| Source chips | mono | 10 / 12 | +0.06em | 500 | UPPERCASE |
| Buttons (board) | sans | 14 / 20 | 0 | 500 | |
| Buttons (mobile) | sans | 16 / 24 | 0 | 500 | |

---

## 3. Layout

Pages never scroll on the board. Sections are **not boxed**: each one is a top hairline, then a 28px label row (section label on the left, an optional mono meta on the right), then content. Are.na style. Only the "blocks" listed in §1.3 get a border and a radius.

### 3.1 Producer board: 1440×900 (demo in browser fullscreen, ⌃⌘F / F11)

Root element: `h-dvh overflow-hidden grid`, padding `16px 24px`.

```
grid-template-columns: minmax(0,1fr) 376px;   column gap 24
grid-template-rows:    56px 72px minmax(0,1fr); row gap 16
areas:
  "header header"
  "people people"
  "main   side"
```

| Area | Size at 1440×900 | Contents |
|---|---|---|
| header | 1392 × 56, bottom hairline | Left: wordmark `GOOD SPREAD` · `/` grey-2 · board title · version badge `v2` (mono 12, pill, 1px hairline-strong, h22 px8). Under the title, mono 12 grey-1: `SAT 21 NOV 2026 · DEMO STUDIO, VILNIUS · CAP €5,000`. Right: `Show join QR` (secondary md, QrCode icon) · `Wrap` (ghost md, ArrowUpRight) · `Reset` (ghost sm, grey-1, RotateCcw). |
| people | 1392 × 72, top and bottom hairline | 5 equal cells (non-producer people, in seed order) split by 1px vertical hairlines, padding 12/16. Row 1: name (left) and call time in mono 13/500 (right). Row 2: role section label (left) and status chip (right). |
| main | 992 × 708 | Grid rows `300px 16px minmax(0,1fr)`: **timeline** (300), then the **decision slot** (392). |
| side | 376 × 708 | Grid rows `248px 16px 252px 16px minmax(0,1fr)`: **inbox** (248), **budget** (252), **activity log** (176). |

**Timeline (992 × 300).** Label row 28. Axis row 20: hour labels 07–18 in mono 11 grey-1, left-aligned to each tick. Then 6 person rows × 40 = 240 (producer, ieva, marta, tomas, greta, lukas), with 12 to spare. Left label column is 120px (name sans 13/500 + role mono 10 grey-1). The track takes the rest (872px, 79.3px per hour). Position every bar with percentages: `left = (start − 420) / 660`, `width = (end − start) / 660`. Hourly gridlines are 1px hairline. Bars are 28 tall, inset 6px top and bottom, with a 2px gap between neighbouring bars.

**Decision slot (992 × 392).** It shows exactly one of three states:
- **Empty:** section label `DECISIONS`, plus one line of body grey-1: "Nothing to fix. Drop a document in the inbox."
- **Pending:** conflict line (h48), gap 12, then 3 fix cards in a grid `repeat(3, 1fr)` with gap 12. Each card is ≈322 × 236.
- **Applied:** applied banner (h44), gap 12, then 4 receipt metric blocks `repeat(4, 1fr)`, gap 12, each ≈239 × 140.

A new pending replaces the receipt.

**Side.**
- Inbox: label row 28, then a drop zone or extraction card, 220 tall.
- Budget: label row 28, a total line (h36), gap 12, the bar (h8), gap 12, then a scrollable list (`overflow-y-auto`, thin scrollbar) of line items, 24px rows. Only this list and the log scroll, never the page.
- Activity log: label row 28, 28px rows, internal scroll.

### 3.2 Producer board: 1280×800

Same structure. The changes:
- Padding 12/16.
- Columns `minmax(0,1fr) 336px`, column gap 16.
- Rows `52px 64px 1fr`, row gap 12.
- Main is 896 × 636: timeline 252 (person rows 32, bars 22, label column 104), gap 12, decision slot 372 (fix cards ≈290 × 220, metric blocks ≈215 × 128).
- Side is 336 × 636: inbox 236, budget 228, log 148, gaps 12.
- Type steps down as noted in §2.1.

Use a single breakpoint: `@media (max-width: 1360px), (max-height: 860px)` → the 1280 values.

### 3.3 My-day page `/p/[token]` at 390×844

- Column with padding `20px` sides, `16px` top. Content bottom padding 168px, to clear the fixed action bar.
- **Top bar** (h40): wordmark + `· DEMO` on the left; "Updated 10:52" badge on the right, shown only when the rule in the brief is true.
- 24px gap, then name (serif 32), then role section label.
- 32px gap, then section label `CALL TIME`, then the **call-time block**: struck old time (only after a change), then the huge time. The block has a highlight overlay layer (§5.9).
- 24px gap, then the travel or local line in mono 15: `You land 10:45 · car to studio 30 min`, or `Leave by 08:30`.
- Hairline sections, each with a section label: `WHERE` (address body 16, then "Open map" link with ArrowUpRight), `YOUR LOOKS` (one row each, 44 tall, "L1 · Field jacket" with the look id in mono), `ON SET` (names in body 16 joined with " · ").
- **Fixed action bar:** bottom 0, paper background, top hairline, padding 12 20 `max(20px, env(safe-area-inset-bottom))`.
  - Row 1: `Got it`, primary lg, full width.
  - Row 2, 8px below: `Running late` (secondary md, flex 1) and `Can't make it` (ghost md, width 132).
- No rates, fees or € anywhere on this page.

### 3.4 Join page `/join/[slug]` at 390×844

- Padding 20. Wordmark row. 40px gap. Title "Who are you on this shoot?" (serif 36/40). Then body grey-1: "Pick one. You'll get your own day plan."
- Then 5 role cards, gap 8. Each is 72 tall, radius 20, 1px hairline, padding 0 20. Name in serif 24 on the left; role section label on the right. Tap → border `1.5px ink` for 120ms, then step 2.
- **Step 2** (same page, the cards fade out):
  - Phone input, h56, radius 10, 1px hairline-strong, mono 17. Placeholder "+370 6…" in grey-2.
  - Checkbox row, 44 tall: "Text me updates", unchecked by default. Box 20×20, radius 4, 1.5px ink. Checked: ink fill with a paper Check icon.
  - Then `Open my day` (primary lg, full width), then `Skip` (ghost md, full width).
  - Footnote, 13 grey-1: "Demo. Your number is deleted when the demo resets."
- On desktop the column is max 420 wide, centred.

### 3.5 Wrap page `/wrap/[slug]`

- Max width 1120, centred, padding 40 24.
- Wordmark row, then page title "Wrap", then meta mono 12 grey-1 (date · version).
- 32px gap, then the table:
  - Columns: `Person 1.4fr · Role 1fr · Hours 1fr · Day rate 1fr · Overtime 1fr · Agency fee 1fr · Total 1fr`.
  - Header row 40 tall in section-label style, bottom 1px ink.
  - Body rows 56 tall, 1px hairline bottom. Name in sans 15/500; numbers in mono 14, right-aligned, `num`. Hours as `08:00–15:00 · 7 h`.
  - Overtime cell: `--overtime` text when > 0, `—` grey-2 when 0.
  - Footer row 64 tall, top 1px ink. "Total" in serif 24, total in serif 32 `num`.
- Under it, 24px gap, then a badge pill h32 px14, 1px hairline-strong, sans 13/500 grey-1: "Pay crew in 48 h — coming soon". Not clickable.

### 3.6 QR panel (overlay on the board)

- Full viewport, **opaque `--paper`**. No scrim blur, no transparency. Esc or `Close` (ghost md, X icon, top right 24/24) closes it.
- Centred row with gap 80:
  - Left: white block, radius 20, 1px hairline, padding 40, holding `QRCodeSVG` 440×440 (`fgColor #0d0d0d`, `bgColor #ffffff`, `level "M"`). At 1280×800, QR 400 and padding 32.
  - Right, max width 440: section label `JOIN THE SHOOT`, then the QR heading "Scan to get your day.", then 24px gap, then the URL in mono 20 ink, then body 16 grey-1: "Pick a role. Phone number optional."

---

## 4. Components (override shadcn)

### 4.1 shadcn defaults you must change

Edit the generated files in `components/ui/*` directly:

- **All:** remove every `shadow`, `shadow-xs`, `shadow-sm`, `shadow-md` and `shadow-lg` class. `globals.css` also deletes the shadow utilities (§9.1), so leftovers do nothing.
- **Focus:** replace `focus-visible:ring-[3px] ring-ring/50`, `ring-offset-*` and `focus-visible:border-ring` with `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--action)]`. Remove the `aria-invalid:ring-*` styles. Invalid state is shown by a conflict-colour border.
- **Radius:** Button `rounded-md` → `rounded-full`. Card `rounded-xl` → `rounded-[20px]`. Input/Textarea `rounded-md` → `rounded-[10px]`. Badge `rounded-md` → `rounded-full`. Dialog `rounded-lg` → `rounded-[20px]`.
- **Card:** `py-6 gap-6 shadow-sm` → `p-5 gap-0 border border-[var(--hairline)] bg-paper`. Only use Card for the blocks in §1.3.
- **Muted:** `bg-muted` and `text-muted-foreground` are remapped by tokens (grey-3 / grey-1). Never use `bg-muted` behind grey-1 text (it fails 4.5:1).
- **Dialog overlay:** `bg-black/50` → `bg-[rgb(13_13_13/0.24)]`, with no `backdrop-blur`. The content gets `bg-surface border-hairline`.
- **Table:** remove `hover:bg-muted/50` row hover.
- **Toaster (sonner):** `richColors={false}`, `closeButton={false}`, `position="bottom-right"` (board) / `"bottom-center"` with `offset={176}` (my day), and `toastOptions.unstyled` with the classes from §4.12.
- **Button variants:** delete `destructive`, `link` and `outline`. Keep only the three below.

### 4.2 Buttons

| Variant | Rest | Hover | Pressed | Disabled |
|---|---|---|---|---|
| primary | bg action, text white | bg action-hover (120ms) | scale 0.97 (`tPress`) | bg grey-3, text grey-2 |
| secondary | bg transparent, text ink, border 1px hairline-strong | border ink | scale 0.97 | text grey-2 |
| ghost | bg transparent, text ink | bg grey-3 | scale 0.97 | text grey-2 |

| Size | Height | Padding x | Font | Icon |
|---|---|---|---|---|
| sm | 32 | 12 | sans 13/500 | 14, gap 6 |
| md | 44 (board default), 48 (mobile) | 18 | sans 14/500 (mobile 16) | 16, gap 8 |
| lg | 56 | 24 | sans 16/500 | 18, gap 8 |

All buttons are pills. A loading button keeps its width and changes its label to a gerund ("Applying…", "Reading…"), with no spinner. If a call goes past 3 s, show a toast "Still working…".

### 4.3 Status chips (people strip)

All are pills, h22, padding 0 8, sans 12/500, with a 6×6 dot 6px before the label.

| Chip | Background | Border | Text | Dot |
|---|---|---|---|---|
| **Seen** | seen-tint | none | seen | seen, filled |
| **Not seen yet** | paper | 1px hairline-strong | ink | ink, hollow (1.5px ring) |
| **No device** | transparent | 1px dashed hairline-strong | grey-1 | none |

### 4.4 Other chips and badges

- **Source chips** (budget lines): h18, padding 0 6, radius 4, mono 10/500, uppercase, +0.06em.
  - `RATE CARD`: grey-3 background, ink text.
  - `QUOTE`: 1px solid hairline-strong, ink text.
  - `ESTIMATE`: 1px dashed hairline-strong, grey-1 text.
- **Recommended badge:** pill h22 px8, action background, white text, sans 12/500, label "Recommended". Only on the first-ranked fix.
- **"Changes the creative" warning:** pill h22 px8, 1px ink border, ink text, sans 12/500, TriangleAlert icon 12px before it. It's neutral on purpose: red means a conflict, and this isn't one.
- **Overtime chip** (budget and fix card when cost > 0 from overtime): pill h22 px8, overtime-tint background, overtime text, label "Overtime".
- **"Updated HH:MM" badge** (my day): pill h24 px10, action background, white text, mono 12/500: `Updated 10:52`.
- **Version badge:** see header (§3.1).

### 4.5 Timeline bars (ink tints only, never a rainbow)

Every bar has radius 4, a label in mono 11 inset 8px left (`HMU`, `SHOOT L1–L2`, `SETUP`, `LUNCH`, `WRAP`), and truncates with no ellipsis by clipping.

| Kind | Fill | Border | Label colour |
|---|---|---|---|
| shoot | ink | none | paper |
| hmu | ink-24 `#bfbdbc` | none | ink |
| setup, wrap | ink-10 `#e0dedc` | none | ink |
| lunch (break) | transparent | 1px dashed hairline-strong | grey-1 |
| travel (derived from Travel, not a Block) | none. 2px ink line from `max(departMin, 420)` to `arriveMin`, then a hollow bar `arriveMin → arriveMin + transferMin` with 1px ink border | | label above the line, mono 10 grey-1: `DA 645 · LANDS 10:45` |

- **Overtime segment:** for any bar crossing `bookedUntilMin`, overlay the part right of 15:00 with a 3px bar on its bottom edge in `--overtime`.
- **Conflict:** the conflicting bar (or the travel arrival end) gets `outline: 1.5px solid var(--conflict); outline-offset: 2px`, and the arrival line turns `--conflict`.
- **Booked-until line:**
  - 1px solid ink at x(900), running from the top of the axis row to the bottom of the last row.
  - Label at the top, 4px right of the line, mono 10/500 uppercase +0.06em ink: `BOOKED UNTIL 15:00`.
  - The track area right of the line has background `--after-hours`.

### 4.6 Inbox drop zone (220 tall, radius 20)

Use a `data-state` attribute. Every property transitions over 160ms `cubic-bezier(.4,0,.2,1)`.

| State | Border | Background | Content (centred) |
|---|---|---|---|
| idle | 1px dashed hairline-strong | paper | Upload icon 16 grey-1. "Drop a flight PDF, screenshot or email" (body 14 ink). "or paste text" (13 grey-1, a ghost sm button that opens a textarea in place) |
| drag-over | 1.5px solid action | action-tint | "Drop to read" (body 14/500 action) |
| reading | 1px solid hairline | paper | filename mono 13 · "Reading…" body 13 grey-1, then a 1px action progress line (see §5.3) 24px wide-inset below it |
| read | replaced by the **extraction card** | | |

**Extraction card:** surface white, radius 20, 1px hairline, padding 16.
- Header row: section label `READ FROM` + filename (mono 12 ink, truncated) on the left; `96%` (mono 12 grey-1) on the right.
- Field grid `88px 1fr`, rows 24: label in sans 13 grey-1 / value in mono 13/500 ink. The rows are: Person `Ieva` · Flight `DA 645` · Route `MXP → VNO` · Lands `10:45`.
- Footer at 12px gap: `Apply` (primary md) + `Edit` (ghost md).
- `type: unknown` → the same card, with the fields replaced by the brief's manual form (person select + time input h44).

### 4.7 Conflict line

- h48, radius 10, background conflict-tint, a 3px conflict left bar (inside, full height), padding 0 16.
- TriangleAlert icon 16 in conflict, gap 10, then the message in sans 15/500 conflict: "Ieva can't make 09:00 hair and makeup". Then, right-aligned, mono 13 conflict: `LANDS 10:45 · +135 MIN`.

### 4.8 Fix cards

- Paper background, radius 20, 1px hairline, padding 20, flex column.
- Hover: border hairline-strong (160ms). No lift, no scale.
- Top row: mono 11 label `OPTION 1` / `2` / `3` on the left, Recommended badge on the right.
- 12px gap. Title in serif 24. The changes-creative chip goes under the title, 8px gap.
- 6px gap. One line of 13 grey-1: the first `change.text`, clamped to 2 lines.
- `mt-auto`. € delta in serif 44 `num` ("€0", "+€535"). Under it, 13 grey-1: "5 people affected", plus the overtime chip if cost comes from overtime.
- 16px gap. `Approve`, md, full width: **primary** on the recommended card, **secondary** on the others.

### 4.9 Applied banner and receipt metrics

- **Banner:** h44, radius 10, seen-tint background, padding 0 16. Check icon 16 seen, then sans 14/500 seen: "Fix applied: Swap order". On the right, mono 12 seen: `V2 · 10:52`.
- **Metric block:** paper background, radius 20, 1px hairline, padding 20.
  - Section label: `PEOPLE UPDATED` / `MESSAGES TYPED` / `OVERTIME AVOIDED` / `FIXED IN`.
  - `mt-auto`, then the number in serif 48 `num`: `5` / `0` / `€535` / `14 s`. The " s" is in sans 20 grey-1.
  - No icons, no colour. The numbers are the design.

### 4.10 Budget

- **Total line:** serif 32 `€4,719`, then mono 13 grey-1 ` / €5,000 cap`. Right-aligned: mono 13 grey-1 `€281 left`, or `€120 over` in conflict.
- **Bar:** h8, radius 4.
  - Track grey-3. Fill ink up to `min(total, cap)/cap`.
  - Overtime portion: a separate segment in `--overtime` at the end of the fill.
  - Over cap: fill turns `--conflict`.
  - Cap marker: a 1px ink tick 14 tall at 100%.
- **Line rows:** 24 tall. Label in sans 13 ink (truncate), then the source chip, then the amount in mono 13 right-aligned `num`. Computed overtime rows use `--overtime` text and an Overtime chip instead of a source chip.

### 4.11 Activity log rows

- 28 tall, grid `48px 1fr`.
- Time in mono 12 grey-1 (`10:52`). Text in sans 13 ink, one line, truncated.
- No icons, no avatars, no dividers. Newest first.
- Event wording: "Read flight_DA645_change.pdf", "Conflict: Ieva lands 10:45", "Approved: Swap order", "Text sent to 3 people", "Marta saw v2", "Ieva running late +30", "Reset".

### 4.12 Toasts

- Ink background, paper text, radius 10, h44, padding 0 16, sans 14/500.
- Optional Check icon 16 (paper) for confirmations only. Max width 360.
- Duration 3000ms.
- Copy examples: "Sent to producer: running 30 min late", "Board reset".

### 4.13 Mobile "Running late" sheet

- Scrim `rgb(13 13 13 / 0.24)`. Sheet: surface white, top radius 20, padding 20 20 `max(20px, safe-area)`.
- Grabber 36×4 grey-3, radius 2, centred, 8px from top.
- Title in serif 24: "How late?"
- Then a row of three secondary lg buttons, gap 8, flex 1 each, mono 18/500: `+15` `+30` `+60`.
- 12px gap, then ghost md full-width `Cancel`.

### 4.14 Allowed icons (lucide-react, 16px default, `strokeWidth={1.5}`)

These are the only ones allowed: `Check`, `X`, `TriangleAlert`, `QrCode`, `RotateCcw`, `ArrowUpRight`, `Upload`. Anywhere else, use words.

---

## 5. Motion (exact). Library: `motion/react`, values in `lib/motion.ts` (§9.3)

Rules:
- Animate only on **meaningful state changes**: mount, `version` change, `pending.inboxId` change, ack status change, or drag state.
- **Never** re-run a reveal because a 2 s poll re-rendered.
- Use `AnimatePresence initial={false}` for lists that already exist.
- Animate only `opacity`, `transform`, `filter` and layout.

There is **one hero moment**: the approve ripple (§5.6). Everything else is quieter than it.

| # | Demo beat | What moves | Exact values |
|---|---|---|---|
| 5.1 | Board / my day / join / wrap first load | top-level regions, in order: header, people, timeline, decision, inbox, budget, log | `revealItem`: opacity 0→1, filter blur(15px)→blur(0), 900ms `cubic-bezier(.4,0,.2,1)`, stagger **180ms**, delayChildren 50ms. Once per mount. |
| 5.2 | Drop zone drag-over | border colour, border width, background | CSS transition 160ms `(.4,0,.2,1)`. The label crossfades with opacity 0→1 over 120ms. No scale. |
| 5.3 | Reading | 1px action progress line | width 0%→90% over 2500ms `(.2,.8,.2,1)`. On response: →100% over 200ms, then the card swaps in. No spinner, no shimmer. |
| 5.4 | Read: extraction card | card, then each field value | Card: opacity 0→1 + y 8→0, 320ms `(.2,.8,.2,1)`. Fields: values **type in** at 18ms per character, starting 120ms after each other (Person → Flight → Route → Lands). The label is visible at once, and the value has a 1ch-wide ink caret that blinks at 530ms and disappears when the value is done. The Apply button enables when the last field is done (about 700ms). |
| 5.5 | Conflict appears | conflict line, then the timeline outline | Line: opacity 0→1, x −8→0, 320ms `(.2,.8,.2,1)`. The left bar scaleY 0→1 (origin top), 240ms, 80ms delay. The timeline conflict outline fades in (opacity 0→1, 240ms) at the same moment. |
| 5.5b | Three fix cards | each card | `fixCard`: opacity 0→1, y 12→0, blur 6px→0, 520ms `(.4,0,.2,1)`, stagger 180ms, starting 200ms after the conflict line. Hover: border colour 160ms only. |
| 5.6 | **Approve: the ripple (hero)** | button, ripple disc, other cards | Press: scale 1→0.97→1, spring `{stiffness 700, damping 40, mass 1}`. On success (t=0): an action-colour disc grows from the pointer inside the chosen card: scale 0→1 (diameter = 2 × card diagonal), opacity 0.16 held to 400ms then →0 by 700ms, ease `(.2,.8,.2,1)`. The other two cards: opacity →0 over 240ms. At t=250ms the decision slot crossfades to the applied banner and receipt. The sequence below runs off the same t=0. |
| 5.7 | Timeline blocks move | bars | `layout` with `layoutId = \`${personId}-${kind}-${nth}\``, where `nth` is that person's nth block of that kind (so Ieva's first hmu slides 09:00 → 11:30). Transition `tLayout` = spring `{stiffness 260, damping 32, mass 1}` (settles in about 600ms). Changed bars get a highlight ring: `inset -3px`, border 2px action, radius 7, opacity 1, held 300ms, →0 over 1200ms (**1.5s total**), linear. |
| 5.8 | People strip after approve | call time, chip | Starts at t=400ms, staggered 90ms left→right, only for people with a change. The call time shows `09:00 → 11:30` for 1.5s (old in grey-1 with a 1px strike), then just the new time. The chip flips to "Not seen yet" with `chipFlip`. The cell gets the highlight fill (action-tint overlay, opacity 1→0, 300ms hold + 1200ms). |
| 5.8b | Not seen → **Seen** (live, from a poll) | chip | `chipFlip`: exit rotateX 0→90°, opacity →0, 140ms `(.4,0,1,1)`. Enter rotateX −90°→0, opacity →1, 180ms `(.2,.8,.2,1)`. `perspective: 400px` on the parent. The dot fills with scale 0.4→1, spring `{stiffness 500, damping 30}`. Then the activity row "Marta saw v2" enters. |
| 5.9 | Receipt metrics | numbers | Starts at t=600ms. Count up from 0 over 900ms `(.2,.8,.2,1)`, staggered 120ms. € rounds to whole euros while counting; the final value uses `fmtEur`. "Messages typed 0" does not count (it just reveals). The banner reveals with `revealItem` at a 320ms duration. |
| 5.10 | **My day: call time changes** | old time, strike, new time, flash, vibrate | On version change with a call-time change: t=0: `navigator.vibrate?.(200)`. The highlight fill on the call-time block (action-tint overlay, opacity 1, held 300ms, →0 over 1200ms). t=0–360ms: a 3px ink strike line draws across the **big old time**: scaleX 0→1, origin left, 360ms `(.2,.8,.2,1)`. t=360ms: the big old time exits with y 0→−30%, opacity →0, 240ms `(.4,0,1,1)`. The small struck old time (28px, grey-1, 2px strike already drawn) fades in above it over 200ms. The new big time **rolls in**: y 40%→0, opacity 0→1, blur 8px→0, 520ms `(.2,.8,.2,1)`. The "Updated" badge: scale 0.9→1, opacity 0→1, 200ms. For a schedule-only change, skip the strike and roll: flash + vibrate + badge only. |
| 5.11 | Running late sheet | scrim, sheet | Scrim opacity 0→1, 200ms linear. Sheet y 100%→0, spring `{stiffness 420, damping 40, mass 1}`. Exit: y →100%, 220ms `(.4,0,1,1)`. Picking an option closes the sheet, then the toast. |
| 5.12 | Got it confirmation | button | Press scale 0.97 (`tPress`). On success the button background goes action → seen-tint and the text white → seen, over 200ms `(.4,0,.2,1)`. The label becomes "Seen · 10:53" with a Check icon, which pops in with scale 0.6→1, spring `{stiffness 700, damping 40}`. The button stays disabled until the next version. The badge exits with opacity →0, 160ms. |
| 5.13 | QR panel open | panel, QR block | Panel opacity 0→1, 240ms `(.4,0,.2,1)`. The QR block and text use `revealItem` (blur 15→0, 900ms) with stagger 180ms. Close: opacity →0, 160ms. |
| 5.14 | Activity row added | row | Height 0→28, opacity 0→1, 240ms `(.2,.8,.2,1)`, plus the highlight fill (1.5s). |
| 5.15 | Toast | toast | y 16→0, opacity 0→1, 220ms `(.2,.8,.2,1)`. Exit: y →8, opacity →0, 160ms `(.4,0,1,1)`. |

### Reduced motion (`prefers-reduced-motion: reduce`)

- `MotionConfig reducedMotion="user"` disables transform and layout animations automatically.
- In addition, `useReducedMotion()` switches the following:
  - Reveals become opacity-only, 120ms, with no blur and no stagger.
  - The type-in shows the full values at once.
  - Count-ups show the final value.
  - The call-time change shows its final state (small struck old time + new time), with no draw or roll.
  - The ripple is off.
  - The chip changes without a flip (opacity 120ms).
  - Highlights stay: a static tint for 1.5s, then opacity →0 over 200ms. That's information, not decoration.
  - `vibrate` is kept.
- The CSS in §9.1 sets every CSS transition to 1ms.

---

## 6. Copy and voice

- **Sentence case everywhere.** "Show join QR", not "Show Join QR". The only uppercase is mono section labels, source chips and mono meta lines.
- **Times:** 24 h, always two-digit hours: `09:00`, `10:45`. Ranges use an en dash with no spaces: `09:00–10:00`. Changes: `09:00 → 11:30`, always inside mono.
- **Money: `€1,250`.** Symbol first, no space, comma thousands, which matches the brief, tests and pitch. Whole euros show no decimals (`€535`); non-integers show 2 (`€202.50`). Deltas: `+€535`, `−€120` (U+2212 minus), and zero is `€0` with no sign.
- **Durations:** `30 min`, `2 h 30 min`, `14 s`, `+30` (on the late buttons).
- **Dates:** `Sat 21 Nov 2026`.
- All digits use the `num` class, in mono or Newsreader.
- **Voice:** plain, short, second person on talent pages ("Your call moved 09:00 → 11:30."). Producer pages are terse and factual.
- No exclamation marks. No "Oops", "Awesome", "Let's", "Magic", "AI-powered", "Seamless". No emoji.
- Use typographic characters: `’` for apostrophes, `…` (one character), `·` as the separator.
- Everything fictional carries `(demo)` or a `DEMO` label, as the brief requires.

```ts
// lib/format.ts: use everywhere, never format inline
export const fmtEur = (n: number) => {
  const abs = Math.abs(n);
  const s = abs.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(abs) ? 0 : 2, maximumFractionDigits: 2 });
  return `${n < 0 ? "−" : ""}€${s}`;
};
export const fmtDelta = (n: number) => (n === 0 ? "€0" : n > 0 ? `+${fmtEur(n)}` : fmtEur(n));
// fmt(min) -> "09:00" is already in the brief (section 4)
```

---

## 7. Banned (AI-slop and template tells). If you catch one, delete it

1. Gradients of any kind: backgrounds, text, borders, buttons, "glow". No exceptions.
2. Glassmorphism: `backdrop-blur`, translucent white panels, frosted overlays.
3. Shadows: `shadow-*`, `drop-shadow`, "elevated" cards, hover lift (`-translate-y` on hover).
4. The same big radius on everything (`rounded-2xl` / `rounded-xl` across the board). Use only the radius scale in §1.3.
5. Emoji, anywhere, including toasts, SMS and empty states.
6. Feature rows with an icon in a circle or tinted square. Icons with no label next to them, except Close (X).
7. Purple, violet, indigo or any Tailwind palette colour (`slate-*`, `zinc-*`, `blue-500` and so on). Only the §1 tokens. The palette is deleted in `globals.css`.
8. lucide icons beyond the seven in §4.14. Decorative icons in headings, metric cards or the activity log.
9. A generic dashboard shell: left sidebar nav, top search bar, avatar dropdown, breadcrumb, "Welcome back".
10. Skeleton shimmer, pulsing placeholders, spinners, loading dots, progress rings. The only progress indicator is the 1px line in §5.3.
11. Boxed sections everywhere: card inside card, bordered panel around every region. Sections are a hairline plus a label (§3).
12. Coloured status beyond the four meanings (action, conflict, seen, overtime). No coloured category tags, no rainbow timeline.
13. Bouncy or overshooting springs (damping below 25), parallax, scroll-jacking, confetti, number tickers on anything but receipt metrics.
14. Inter, Geist, Poppins, Montserrat or system-ui as a visible font. Instrument Serif for numbers.
15. Title Case Buttons, ALL CAPS sentences, "Get started", "Learn more", "AI-powered", sparkles.
16. Hover effects on non-interactive things. Cursor-follow effects.
17. Dark mode. Don't build it.
18. Placeholder stock photos, avatars or illustrations. There are no images in this app except the QR code.

---

## 8. Design acceptance checklist: run at the 14:00 freeze (all 10 must pass)

1. **No scroll:** at 1440×900 and 1280×800 (DevTools device toolbar, fullscreen), the whole demo path from §2 steps 1–6 fits with `document.scrollingElement.scrollHeight === innerHeight`.
2. **Token purity:** `rg -n "shadow|gradient|backdrop-blur|rounded-(xl|2xl|3xl)|purple|violet|indigo|slate-|zinc-|gray-" app components -g "!globals.css"` returns nothing in `app/` or `components/` (including `components/ui` after the §4.1 edits; use `rounded-block` / `rounded-[20px]` for 20px blocks).
3. **Colour meaning:** red appears only on conflict UI, green only on Seen and applied, amber only on overtime, blue only on actions and change highlights. Check by eye on all four screens.
4. **Fonts:** DevTools → Rendered Fonts shows Newsreader, Schibsted Grotesk and IBM Plex Mono only. "Austėja" and "Vėtra" render with no fallback glyphs.
5. **Numbers don't jitter:** the receipt count-up and the call-time roll cause no horizontal shift in neighbouring text (`num` class plus fixed `min-width`).
6. **Hero sequence:** approving Swap order shows ripple → bars slide (Ieva hmu 09:00 → 11:30) → 1.5s highlight → strip chips flip in order → metrics count up. The whole thing takes ≤ 2 s and nothing replays on the next 2 s poll.
7. **My day at 390×844 (iPhone and Android):** the call time is ≥ 56px. A change shows strike → roll → flash. The Android phone vibrates. The action bar clears the home indicator. No € visible.
8. **Live Seen:** tapping Got it on a phone flips that person's chip to green Seen on the board within 2 s, with the flip and no full-strip re-render.
9. **Reduced motion:** with "Emulate prefers-reduced-motion: reduce" on, the full demo runs with final states shown, no blur, no movement, and the highlights still visible.
10. **Slop sweep:** no emoji, no spinners or shimmer, only the seven icons, sentence case on every button, `€1,250` format everywhere (board, wrap, SMS), and times as `09:00`. The QR panel is opaque paper, and a phone camera scans it from 2 m.

---

## 9. Paste-ready code

### 9.1 `app/globals.css` (replace the whole file)

Assumes Tailwind v4, the shadcn default. For v3, see §9.2.

```css
@import "tailwindcss";
@import "tw-animate-css"; /* keep only if shadcn installed it */

/* 1. Delete Tailwind's default palette and shadows so slop can't compile. */
@theme {
  --color-*: initial;
  --shadow-*: initial;
  --inset-shadow-*: initial;
  --drop-shadow-*: initial;
}

:root {
  --paper: #f7f5f3;
  --surface: #ffffff;
  --ink: #0d0d0d;
  --grey-1: #6e6a69;
  --grey-2: #9a9796;
  --grey-3: #e9e7e5;
  --hairline: rgb(13 13 13 / 0.12);
  --hairline-strong: rgb(13 13 13 / 0.24);
  --ink-10: #e0dedc;
  --ink-24: #bfbdbc;
  --after-hours: #efedeb;
  --action: #1747c8;
  --action-hover: #123ba8;
  --action-tint: #e5e7f0;
  --conflict: #b02e1b;
  --conflict-tint: #f1e5e2;
  --seen: #1a6b3e;
  --seen-tint: #e3e9e3;
  --overtime: #8a5000;
  --overtime-tint: #ece4db;

  /* shadcn semantic mapping (shadcn's --accent = hover surface, NOT our action) */
  --background: var(--paper);
  --foreground: var(--ink);
  --card: var(--paper);
  --card-foreground: var(--ink);
  --popover: var(--surface);
  --popover-foreground: var(--ink);
  --primary: var(--action);
  --primary-foreground: #ffffff;
  --secondary: transparent;
  --secondary-foreground: var(--ink);
  --muted: var(--grey-3);
  --muted-foreground: var(--grey-1);
  --accent: var(--grey-3);
  --accent-foreground: var(--ink);
  --destructive: var(--conflict);
  --border: var(--hairline);
  --input: var(--hairline-strong);
  --ring: var(--action);
  --radius: 10px;
}

/* 2. Utilities: bg-paper, text-ink, border-hairline, bg-action, text-conflict, font-serif ... */
@theme inline {
  --color-white: #ffffff;
  --color-black: #0d0d0d;
  --color-paper: var(--paper);
  --color-surface: var(--surface);
  --color-ink: var(--ink);
  --color-grey-1: var(--grey-1);
  --color-grey-2: var(--grey-2);
  --color-grey-3: var(--grey-3);
  --color-hairline: var(--hairline);
  --color-hairline-strong: var(--hairline-strong);
  --color-ink-10: var(--ink-10);
  --color-ink-24: var(--ink-24);
  --color-after-hours: var(--after-hours);
  --color-action: var(--action);
  --color-action-hover: var(--action-hover);
  --color-action-tint: var(--action-tint);
  --color-conflict: var(--conflict);
  --color-conflict-tint: var(--conflict-tint);
  --color-seen: var(--seen);
  --color-seen-tint: var(--seen-tint);
  --color-overtime: var(--overtime);
  --color-overtime-tint: var(--overtime-tint);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --radius-sm: 4px;
  --radius-md: 10px;
  --radius-lg: 10px;
  --radius-xl: 20px;
  --radius-block: 20px;

  --font-serif: var(--font-newsreader), Georgia, serif;
  --font-sans: var(--font-schibsted), ui-sans-serif, sans-serif;
  --font-mono: var(--font-plex-mono), ui-monospace, monospace;
}

@layer base {
  * { border-color: var(--hairline); }
  html, body { background: var(--paper); color: var(--ink); }
  body { font-family: var(--font-sans); font-size: 14px; line-height: 20px; -webkit-font-smoothing: antialiased; }
  ::selection { background: var(--action-tint); color: var(--ink); }
  :focus-visible { outline: 2px solid var(--action); outline-offset: 2px; }
}

@layer utilities {
  .num { font-variant-numeric: tabular-nums lining-nums; }
  .label { font-family: var(--font-mono); font-size: 11px; line-height: 16px; letter-spacing: 0.08em; font-weight: 500; text-transform: uppercase; color: var(--grey-1); }
  .section { border-top: 1px solid var(--hairline); }
  .section-head { height: 28px; display: flex; align-items: center; justify-content: space-between; }
  .scroll-thin { scrollbar-width: thin; scrollbar-color: var(--hairline-strong) transparent; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 1ms !important; animation-duration: 1ms !important; animation-iteration-count: 1 !important; }
}
```

If the build fails after `--color-*: initial` (a shadcn class referencing a deleted colour), add that one colour back in `@theme inline`. Don't remove the reset.

### 9.2 Tailwind v3 fallback (`tailwind.config.ts` → `theme.extend`). Only if the project is on v3

```ts
theme: {
  colors: { transparent: "transparent", current: "currentColor", white: "#ffffff", black: "#0d0d0d",
    paper: "var(--paper)", surface: "var(--surface)", ink: "var(--ink)",
    "grey-1": "var(--grey-1)", "grey-2": "var(--grey-2)", "grey-3": "var(--grey-3)",
    hairline: "var(--hairline)", "hairline-strong": "var(--hairline-strong)",
    "ink-10": "var(--ink-10)", "ink-24": "var(--ink-24)", "after-hours": "var(--after-hours)",
    action: { DEFAULT: "var(--action)", hover: "var(--action-hover)", tint: "var(--action-tint)" },
    conflict: { DEFAULT: "var(--conflict)", tint: "var(--conflict-tint)" },
    seen: { DEFAULT: "var(--seen)", tint: "var(--seen-tint)" },
    overtime: { DEFAULT: "var(--overtime)", tint: "var(--overtime-tint)" },
    background: "var(--background)", foreground: "var(--foreground)", border: "var(--border)",
    input: "var(--input)", ring: "var(--ring)",
    primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
    muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
    accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
    popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
    card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
    destructive: "var(--destructive)" },          // replaces the palette (not extend)
  boxShadow: { none: "none" },                     // replaces all shadows
  borderRadius: { none: "0", sm: "4px", md: "10px", lg: "10px", xl: "20px", block: "20px", full: "9999px" },
  extend: {
    fontFamily: {
      serif: ["var(--font-newsreader)", "Georgia", "serif"],
      sans: ["var(--font-schibsted)", "ui-sans-serif", "sans-serif"],
      mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
    },
  },
},
```

### 9.3 `lib/motion.ts`

```ts
import { useEffect, useState } from "react";
import { animate, useReducedMotion, type Transition, type Variants } from "motion/react";

type Bezier = [number, number, number, number];

export const EASE = {
  standard: [0.4, 0, 0.2, 1] as Bezier, // Cosmos reveal curve
  out: [0.2, 0.8, 0.2, 1] as Bezier,    // entrances
  in: [0.4, 0, 1, 1] as Bezier,         // exits
};

export const MS = {
  reveal: 900,
  stagger: 180,
  fast: 160,
  highlightHold: 300,
  highlightFade: 1200, // hold + fade = 1.5 s
  typeChar: 18,
  typeFieldGap: 120,
  readingFake: 2500,
};

/* ---------- transitions ---------- */
export const tReveal: Transition = { duration: 0.9, ease: EASE.standard };
export const tFast: Transition = { duration: 0.16, ease: EASE.standard };
export const tPress: Transition = { type: "spring", stiffness: 700, damping: 40, mass: 1 };
export const tLayout: Transition = { type: "spring", stiffness: 260, damping: 32, mass: 1 };
export const tSheet: Transition = { type: "spring", stiffness: 420, damping: 40, mass: 1 };
export const tDot: Transition = { type: "spring", stiffness: 500, damping: 30, mass: 1 };
export const tHighlight: Transition = { duration: 1.5, times: [0, 0.2, 1], ease: "linear" };

/** Approve hero sequence offsets (ms from successful approve) */
export const APPROVE = {
  ripple: 700,
  rippleHold: 400,
  othersFade: 240,
  slotSwap: 250,
  stripStart: 400,
  stripStagger: 90,
  receiptStart: 600,
  metricStagger: 120,
  countUp: 900,
} as const;

/* ---------- variants ---------- */
export const revealParent: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: MS.stagger / 1000, delayChildren: 0.05 } },
};
export const revealItem: Variants = {
  hidden: { opacity: 0, filter: "blur(15px)" },
  shown: { opacity: 1, filter: "blur(0px)", transition: tReveal },
};
// Reduced-motion versions
export const revealParentReduced: Variants = { hidden: {}, shown: {} };
export const revealItemReduced: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.12 } },
};
export function useReveal() {
  const reduce = useReducedMotion();
  return reduce
    ? { parent: revealParentReduced, item: revealItemReduced }
    : { parent: revealParent, item: revealItem };
}

export const extractionCard: Variants = {
  hidden: { opacity: 0, y: 8 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE.out } },
};

export const conflictLine: Variants = {
  hidden: { opacity: 0, x: -8 },
  shown: { opacity: 1, x: 0, transition: { duration: 0.32, ease: EASE.out } },
};
export const conflictBar: Variants = {
  hidden: { scaleY: 0, originY: 0 },
  shown: { scaleY: 1, originY: 0, transition: { duration: 0.24, ease: EASE.out, delay: 0.08 } },
};

export const fixList: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: MS.stagger / 1000, delayChildren: 0.2 } },
};
export const fixCard: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.52, ease: EASE.standard } },
  dismissed: { opacity: 0, transition: { duration: APPROVE.othersFade / 1000, ease: EASE.in } },
};

/** Ripple disc inside the chosen fix card. Render with diameter = 2 * card diagonal, centred on pointer. */
export const ripple: Variants = {
  idle: { scale: 0, opacity: 0 },
  go: {
    scale: 1,
    opacity: [0.16, 0.16, 0],
    transition: {
      scale: { duration: APPROVE.ripple / 1000, ease: EASE.out },
      opacity: { duration: APPROVE.ripple / 1000, times: [0, APPROVE.rippleHold / APPROVE.ripple, 1], ease: "linear" },
    },
  },
};

/** Highlight overlay (fill or ring). Mount it keyed by version so it plays once per change. */
export const highlight: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: [1, 1, 0], transition: tHighlight },
};
export const highlightReduced: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: [1, 1, 0], transition: { duration: 1.7, times: [0, 0.88, 1], ease: "linear" } },
};

export const chipFlip: Variants = {
  initial: { rotateX: -90, opacity: 0 },
  animate: { rotateX: 0, opacity: 1, transition: { duration: 0.18, ease: EASE.out } },
  exit: { rotateX: 90, opacity: 0, transition: { duration: 0.14, ease: EASE.in } },
};
export const chipFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

/* My-day call-time change */
export const strikeLine: Variants = {
  initial: { scaleX: 0, originX: 0 },
  animate: { scaleX: 1, originX: 0, transition: { duration: 0.36, ease: EASE.out } },
};
export const timeOut: Variants = {
  exit: { y: "-30%", opacity: 0, transition: { duration: 0.24, ease: EASE.in } },
};
export const timeIn: Variants = {
  initial: { y: "40%", opacity: 0, filter: "blur(8px)" },
  animate: { y: 0, opacity: 1, filter: "blur(0px)", transition: { duration: 0.52, ease: EASE.out } },
};
export const oldTimeSmall: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: EASE.standard } },
};
export const CALL_CHANGE = { strikeMs: 360, vibrateMs: 200 } as const;

export const badgePop: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: EASE.out } },
  exit: { opacity: 0, transition: { duration: 0.16 } },
};

export const sheet: Variants = {
  initial: { y: "100%" },
  animate: { y: 0, transition: tSheet },
  exit: { y: "100%", transition: { duration: 0.22, ease: EASE.in } },
};
export const scrim: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: "linear" } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: "linear" } },
};

export const qrPanel: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.24, ease: EASE.standard } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: EASE.in } },
};

export const logRow: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 28, opacity: 1, transition: { duration: 0.24, ease: EASE.out } },
};

export const toast: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE.out } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.16, ease: EASE.in } },
};

export const press = { whileTap: { scale: 0.97 }, transition: tPress } as const;

/* ---------- hooks ---------- */

/** Count from 0 (or `from`) to `value` when `value` or `key` changes. Returns the live number. */
export function useCountUp(value: number, { delayMs = 0, from = 0, key }: { delayMs?: number; from?: number; key?: unknown } = {}) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : from);
  useEffect(() => {
    if (reduce) { setN(value); return; }
    setN(from);
    const c = animate(from, value, { duration: APPROVE.countUp / 1000, ease: EASE.out, delay: delayMs / 1000, onUpdate: setN });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, key, reduce]);
  return n;
}

/** Type a string in at MS.typeChar per character after `delayMs`. Returns [visibleText, done]. */
export function useTypeIn(text: string, delayMs = 0): [string, boolean] {
  const reduce = useReducedMotion();
  const [i, setI] = useState(reduce ? text.length : 0);
  useEffect(() => {
    if (reduce) { setI(text.length); return; }
    setI(0);
    let t: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      t = setInterval(() => setI((x) => (x >= text.length ? (clearInterval(t), x) : x + 1)), MS.typeChar);
    }, delayMs);
    return () => { clearTimeout(start); if (t) clearInterval(t); };
  }, [text, delayMs, reduce]);
  return [text.slice(0, i), i >= text.length];
}
```

**Usage notes**
- Highlights: render `<motion.div key={\`hl-${version}\`} variants={reduce ? highlightReduced : highlight} initial="initial" animate="animate" className="pointer-events-none absolute inset-0 rounded-[inherit] bg-action-tint" />` behind the content (`-z-10`, parent `relative isolate`). For dark shoot bars, use the ring form: `absolute -inset-[3px] rounded-[7px] border-2 border-action`, with no fill.
- Timeline bars: `<motion.div layout layoutId={...} transition={tLayout} style={{ left: \`${l}%\`, width: \`${w}%\` }} />`, inside a `<LayoutGroup>` around the timeline.
- Stagger offsets for the approve sequence are applied with `transition={{ delay: (APPROVE.stripStart + i * APPROVE.stripStagger) / 1000 }}`, gated on a `justApprovedVersion` state that is set by the approve response, **not** by polling.
- Call-time change: keep `prevCallMin` in a ref. When `me.version` increases and the call changes, set `phase = "striking"`, then after `CALL_CHANGE.strikeMs` set `phase = "settled"`. Render the big old time (+ `strikeLine`) in `striking`, and the small old time (`oldTimeSmall`) + big new time (`timeIn`) in `settled`, with `AnimatePresence mode="popLayout"` around the big time.
