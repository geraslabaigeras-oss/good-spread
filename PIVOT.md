# Pivot (decided 2026-11-14 ~02:15): "From reference to reality"

User chose to extend GOOD SPREAD to the full four-moment flow. Section 2 demo (board) is kept as Moment 4.

1. **Brief** `/new` — upload reference image + budget, deliverables (stills, motion), deadline, usage.
   Claude (vision, structured output) → CreativeBrief + suggested Production DNA. Cached by sha; demo brief fallback.
2. **Strategies** `/plan/[slug]` — Local / Destination / Hybrid, computed deterministically from catalog line items
   (budget, production days, travel, physical shoot). Pick one.
3. **Assemble** `/plan/[slug]/assemble` — choose models, photographer, location from the catalog (photos optional,
   `public/catalog/*`). Live budget + schedule + conflicts from the engine. "Create production" → board.
4. **Adapt** `/board/[slug]` — existing flow + Production DNA check on every fix, "client cuts budget" (BUDGET
   conflict → lever combinations that keep the DNA), photographer unavailable (shortlist swap), cost breakdown on cards.
   `/callsheet/[slug]` printable call sheet (document generator).

Rules kept: AI only reads (reference, documents). Code computes every number. All catalog people/places fictional
and labelled demo unless the team supplies permissioned material. No image generation.
