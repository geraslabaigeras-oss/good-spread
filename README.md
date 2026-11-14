# good spread

**Stay creative. Production's handled.**

good spread plans fashion shoots from a few reference images and keeps the plan current on the day. Drop your references and it does the following:

- writes the brief;
- finds models, photographers, stylists, make-up artists and real locations that fit;
- has an AI voice assistant call their agents about availability and rates;
- builds the day's schedule and budget.

When something breaks (a flight lands late, rain at 14:00, someone runs late), it finds what that breaks, proposes fixes with their exact cost, and tells each person about their own new time.

Built at **Unfair Weekend**, Vilnius, November 2026.

Live: https://good-spread-eight.vercel.app

## How it works

AI reads the mess; plain code makes every decision.

| Step | What happens | Built with |
|---|---|---|
| References | Each image is read for what it is for (model look, setting, styling, light), then one brief is written for one shoot | Claude (`claude-sonnet-5-5`), structured output |
| Casting and crew | People are ranked by how close their analysed look or style is to the brief, with price tiers | Plain TypeScript matching, Claude look analysis |
| Locations | 40 checked European shoot locations, each with permit notes, best light and a rain-backup studio. AI scouting for more, verified on Wikipedia | `data/europe`, Claude + Wikipedia |
| Agency calls | A voice assistant asks about the date, rate and usage, in the agency's language | ElevenLabs Agents (Eleven v4 Turbo) |
| Plan and budget | Schedule, call times, overtime, agency fees, contingency | `lib/engine` (pure functions, Vitest) |
| Shoot day | Flight delay or late talent produces a conflict, then three fixes with their exact cost, then a one-tap approve, then per-person messages | `lib/engine`, Supabase |
| Travel | Route on a 3D globe with a 3D plane, live aircraft near the arrival airport, boarding pass per traveller | react-globe.gl / three.js, adsb.lol |
| Weather | Real forecast for the shoot day and place, with a storm sky when rain hits shoot hours | Open-Meteo |

## Run it locally

```bash
pnpm install
cp .env.example .env.local   # then fill in your own keys
pnpm dev                     # http://localhost:3000
pnpm test                    # engine tests
```

Environment variables (names only; never commit values):

```
ANTHROPIC_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=
NEXT_PUBLIC_APP_URL=
TWILIO_ACCOUNT_SID=   # optional
TWILIO_AUTH_TOKEN=    # optional
TWILIO_FROM=          # optional
```

Without Supabase the app falls back to local JSON. Without Twilio, messages are not sent and a log entry is written instead.

## Data and privacy

- **Not in this repository:** the agency talent book and the crew list (photographers, stylists, make-up artists) used in the demo. They are internal references, not for publishing, so they live in a git-ignored `private/` folder and only load on a local machine.
- **Locations and studios** (`data/europe`) are public, link-checked data. Location photos come from Wikimedia Commons and are shown with their author and licence.
- **Sample photography** on the landing page is from Unsplash, credited in the footer.
- **Demo labels:** in the demo, the agency call answers and message delivery ticks are simulated and labelled as such on screen. Real calls need a phone number connected to the ElevenLabs agent.
- **Your approval comes first:** no message goes out without the producer approving it.

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Magic UI, Aceternity UI, React Bits, Motion, react-globe.gl / three.js, MapLibre, Supabase, Anthropic SDK, ElevenLabs, Vercel.
