# NOTES (ambiguities resolved in favour of a reliable demo)

- **Budget / contingency:** the brief requires SHIFT_FROM (+€535) to leave zero conflicts, but 4,290 + 10% + 535 = 5,254 > 5,000 cap.
  So contingency is treated as a reserve that overtime draws down first: `total = base + overtime + max(0, reserve − overtime)`.
  Seed = 4,290 + 429 = **4,719**. After SHIFT_FROM = 4,290 + 535 + 0 = 4,825 (under cap).
- **costDelta** = change in committed spend (items + agency fees + overtime), contingency excluded. SHIFT_FROM = 535, SWAP_TALENT is negative (cheaper) but ranked last because it changes the creative.
- **LATE vs ARRIVAL:** LATE when a reported late time is the binding constraint, otherwise ARRIVAL.
- **Late report** replaces any earlier late report from the same person.
- **SWAP_TALENT** relinks the usage line to the new person (amount unchanged); travel lines and agency fee drop.
- **Local store:** when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing (local dev only), `lib/server/db.ts` uses a JSON file at `.data/local-db.json`. On Vercel a missing Supabase config is a hard error.
- **AI extraction:** claude-sonnet-5-5 rejects forced `tool_choice`, so the `record_update` schema is enforced via structured outputs (`output_config.format`). Pasted text also has a plain-code regex fallback ("read by rule") if AI/cache fail.
- **Demo-doc buttons** under the inbox send the same PDFs through the same path as drag-and-drop (reliability backup).
