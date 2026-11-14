import type { Brief, CityId, FieldKey, MissingItem, Role } from "./types"

const NUM_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
}
const ORDINALS: Record<string, number> = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9,
  tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15,
  sixteenth: 16, seventeenth: 17, eighteenth: 18, nineteenth: 19, twentieth: 20,
  "twenty-first": 21, "twenty first": 21, "twenty-second": 22, "twenty second": 22,
  "twenty-third": 23, "twenty third": 23, "twenty-fourth": 24, "twenty-fifth": 25,
  "twenty-sixth": 26, "twenty-seventh": 27, "twenty-eighth": 28, "twenty-ninth": 29,
  thirtieth: 30, "thirty-first": 31,
}
const MONTHS = [
  "january", "february", "march", "april", "may", "june", "july", "august",
  "september", "october", "november", "december",
]
const NUM_RE = `\\d+|${Object.keys(NUM_WORDS).join("|")}`

function wordNum(w: string | undefined): number | null {
  if (!w) return null
  const s = w.toLowerCase()
  if (/^\d+$/.test(s)) return Number(s)
  return NUM_WORDS[s] ?? null
}

export function parseBudget(text: string): { amount: number; span: string } | null {
  const t = text.replace(/\u00a0/g, " ")
  const m =
    t.match(/€\s?(\d{1,3}(?:[ ,.]\d{3})+|\d+(?:\.\d+)?)\s?(k|K)?/) ??
    t.match(/(\d{1,3}(?:[ ,.]\d{3})+|\d+(?:\.\d+)?)\s?(k|K)?\s?(?:eur|euro|euros)\b/i)
  if (m) {
    let n = Number(m[1].replace(/[ ,.](?=\d{3}\b)/g, ""))
    if (m[2]) n *= 1000
    if (n >= 100) return { amount: n, span: m[0].trim() }
  }
  const w = t.match(/\b([a-z]+(?:[- ][a-z]+)?)(?: and a half)? thousand(?: euros?| eur)?/i)
  if (w) {
    const n = w[1].toLowerCase().split(/[- ]/).reduce((a, p) => a + (NUM_WORDS[p] ?? 0), 0)
    const span = w[0].replace(/^(\w+)[- ](?=\w)/, (all, first: string) => (NUM_WORDS[first.toLowerCase()] ? all : ""))
    if (n) return { amount: (n + (/and a half/i.test(w[0]) ? 0.5 : 0)) * 1000, span }
  }
  return null
}

export function parseDate(text: string, today = new Date()): { iso: string; span: string } | null {
  const t = text.toLowerCase()
  const monthRe = MONTHS.join("|") + "|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec"
  const ordRe = Object.keys(ORDINALS).sort((a, b) => b.length - a.length).join("|")
  const dayName = "(?:(?:mon|tues|wednes|thurs|fri|satur|sun)day,? )?"
  const patterns: RegExp[] = [
    new RegExp(`\\b${dayName}(?:the )?(\\d{1,2})(?:st|nd|rd|th)?(?: of)? (${monthRe})\\b`),
    new RegExp(`\\b${dayName}(${monthRe}) (\\d{1,2})(?:st|nd|rd|th)?\\b`),
    new RegExp(`\\b${dayName}the (${ordRe})(?: of)? (${monthRe})\\b`),
  ]
  for (const re of patterns) {
    const m = t.match(re)
    if (!m) continue
    let day: number
    let mon: string
    if (/^\d/.test(m[1])) [day, mon] = [Number(m[1]), m[2]]
    else if (/^\d/.test(m[2])) [day, mon] = [Number(m[2]), m[1]]
    else [day, mon] = [ORDINALS[m[1]], m[2]]
    const mi = MONTHS.findIndex((x) => x.startsWith(mon.slice(0, 3)))
    if (mi < 0 || !day || day > 31) continue
    const yearM = text.match(/\b(20\d{2})\b/)
    let year = yearM ? Number(yearM[1]) : today.getUTCFullYear()
    if (!yearM && Date.UTC(year, mi, day) < Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) year++
    const start = m.index ?? 0
    return { iso: new Date(Date.UTC(year, mi, day)).toISOString().slice(0, 10), span: text.slice(start, start + m[0].length) }
  }
  return null
}

const LOOK_TERMS: [RegExp, string][] = [
  [/\beditorial\b/i, "Editorial"],
  [/not catalogue|not catalog/i, "Not catalogue"],
  [/grey light|gray light|overcast/i, "Grey light"],
  [/natural light|daylight|window light/i, "Natural light"],
  [/old town/i, "Old Town textures"],
  [/going somewhere|in motion/i, "In motion"],
  [/moody|muted/i, "Muted"],
  [/\bflash\b/i, "Flash"],
  [/quiet luxury/i, "Quiet luxury"],
]

const PLACES: { re: RegExp; label: string; city: CityId | null }[] = [
  { re: /vilnius/i, label: "Vilnius", city: "vilnius" },
  { re: /milan|milano/i, label: "Milan", city: "milan" },
  { re: /kaunas/i, label: "Kaunas", city: "vilnius" },
]

export function missingFor(b: Omit<Brief, "missing">): MissingItem[] {
  const out: MissingItem[] = []
  if (!b.budget) out.push({ field: "Budget", question: "What's the all-in budget?", why: "Every route is checked against it." })
  if (!b.shootDate) out.push({ field: "Date", question: "Which day, and how flexible is it?", why: "Flights and availability depend on it." })
  if (!b.photos) out.push({ field: "Photos", question: "How many finished photos?", why: "Sets the photographer fee and retouching." })
  if (!b.where) out.push({ field: "Where", question: "Which city — studio or street?", why: "Decides local vs travel." })
  if (!b.usage || !/month|year/i.test(b.usage))
    out.push({
      field: "Usage term",
      question: "Webshop and Instagram only, or paid ads too — for how long?",
      why: "Model fees here assume 12 months of organic use.",
    })
  out.push({ field: "Sample size", question: "What size is the jacket sample?", why: "Both models have to fit it." })
  out.push({ field: "Sign-off", question: "Who approves frames on the day?", why: "Twelve photos in one day needs one decision-maker." })
  if (/street|old town|outdoor|outside/i.test(b.source))
    out.push({ field: "Rain plan", question: "If it rains, is the loft interior enough?", why: "November in Vilnius." })
  return out
}

export function parseBriefText(source: string, sourceKind: Brief["sourceKind"], today = new Date()): Brief {
  const t = source.replace(/\s+/g, " ")
  const spans: Partial<Record<FieldKey, string>> = {}

  const budget = parseBudget(source)
  if (budget) spans.budget = budget.span
  const date = parseDate(source, today)
  if (date) spans.date = date.span

  const photosM = source.match(
    new RegExp(`\\b(${NUM_RE})\\s+(?:finished\\s+|final\\s+|retouched\\s+)?(?:photos|images|pictures|shots)\\b`, "i")
  )
  const photos = photosM ? wordNum(photosM[1]) : null
  if (photosM) spans.photos = photosM[0]

  const daysM = t.match(new RegExp(`\\b(${NUM_RE})[- ](?:shoot )?days?\\b`, "i"))
  const days = daysM ? Math.max(1, wordNum(daysM[1]) ?? 1) : 1

  let where: string | null = null
  let nearCity: CityId | null = null
  for (const p of PLACES) {
    const m = source.match(new RegExp(`(?:here )?in ${p.re.source}`, "i")) ?? source.match(p.re)
    if (m) {
      where = p.label
      nearCity = p.city
      spans.where = m[0]
      break
    }
  }

  const look = LOOK_TERMS.filter(([re]) => re.test(t)).map(([, label]) => label)
  const lookRe = LOOK_TERMS.find(([re]) => re.test(t))?.[0]
  if (lookRe) spans.look = source.match(lookRe)?.[0]

  const productM =
    source.match(/\b(?:of|for) (the (?:new )?[A-ZĀ-Ž][\p{L}]+ [\p{L} ]{0,30}?(?:jacket|coat|parka|collection|knit|dress|boots?|bag))\b/u) ??
    source.match(/\bnew ([\p{L} ]{0,30}?(?:jacket|coat|parka|collection|knitwear|dress|boots?|bag))\b/u)
  const product = productM ? productM[1].replace(/\bnew /, "") : null
  if (productM) spans.product = productM[1]

  const modelsM = t.match(new RegExp(`\\b(${NUM_RE}) models?\\b`, "i"))
  const models = modelsM ? wordNum(modelsM[1]) ?? 1 : /\bmodel\b/i.test(t) ? 1 : 0
  if (modelsM) spans.talent = source.match(new RegExp(modelsM[0], "i"))?.[0]

  const wantsModelM = source.match(/(?:love|want|book|like)\s+([A-ZĀ-Ž][\p{Ll}]+)\s*[,(]?\s*\(?the model/u)
  const wantsModel = wantsModelM ? wantsModelM[1] : null
  const wantsPhM = source.match(/([A-ZĀ-Ž][\p{Ll}]+)\s+(?:should|to|could)\s+shoot/u)
  const wantsPhotographer = wantsPhM ? wantsPhM[1] : null

  const crew: Role[] = []
  if (/photograph|shoot it|to shoot/i.test(t)) crew.push("photographer")
  if (/hair|make-?up|\bhmu\b/i.test(t)) crew.push("hmu")
  if (/stylist|styling/i.test(t)) crew.push("stylist")

  const usageBits: string[] = []
  if (/webshop|e-?com|website/i.test(t)) usageBits.push("Webshop")
  if (/instagram|social/i.test(t)) usageBits.push("Instagram")
  if (/paid|\bads\b/i.test(t)) usageBits.push("Paid ads")

  const clientM = source.match(/(?:for|[Ww]e['’]re|[Ww]e are)\s+([A-ZĀ-Ž][\p{L}&]+)(?:,| —| -|\s+the)/u)
  const client = clientM ? clientM[1] : "New client"
  const title = product ? product.replace(/^the /i, "").replace(/^./, (c) => c.toUpperCase()) : "New shoot"

  const base: Omit<Brief, "missing"> = {
    title,
    client,
    product,
    photos,
    budget: budget?.amount ?? null,
    shootDate: date?.iso ?? null,
    days,
    where,
    nearCity,
    look,
    models,
    wantsModel,
    wantsPhotographer,
    crew,
    usage: usageBits.length ? usageBits.join(" · ") : null,
    spans,
    source,
    sourceKind,
    extractedBy: "Built-in parser (deterministic)",
  }
  return { ...base, missing: missingFor(base) }
}
