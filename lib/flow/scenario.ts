/**
 * Good Spread demo scenario + deterministic engine for the one-page flow.
 * All people, prices and flights are invented. Every number the UI shows is
 * derived here from the data below; the UI never hard-codes values.
 */
import type { PhotoKey } from "./photos"

/* ---------- data ---------- */

export const SHOOT = {
  client: "Vėtra",
  collection: "Vėtra FW26",
  look: "Editorial",
  photos: 12,
  dateISO: "2026-11-21",
  dateLabel: "Sat 21 Nov",
  dateShort: "21 Nov",
  city: "Vilnius",
  studio: "Studio 3",
  address: "Pilies g.",
  briefBudget: 5000,
  scoutedLocations: 14,
  referenceMatch: "Camel coat, Old Town stone, low sun",
  /** Scenario clock on shoot day (Vilnius local, minutes after midnight). */
  nowMin: 10 * 60 + 10,
}

export interface Airport { code: string; city: string; lat: number; lon: number; utcOffsetH: number }
export const MXP: Airport = { code: "MXP", city: "Milan", lat: 45.63, lon: 8.72, utcOffsetH: 1 }
export const VNO: Airport = { code: "VNO", city: "Vilnius", lat: 54.63, lon: 25.29, utcOffsetH: 2 }

export const FLIGHT = {
  no: "DA 641",
  from: MXP,
  to: VNO,
  departLocal: 4 * 60 + 30, // 04:30 Milan time
  durationMin: 130,
  fareReturn: 220,
}

/** Van from VNO arrivals, drive to the studio, settle-in before call. */
export const GROUND = { vanAfterLandingMin: 10, driveMin: 30, settleMin: 20 }

export type CrewId = "tomas" | "marta" | "ieva" | "jonas" | "aras"

export interface CrewMember {
  id: CrewId
  name: string
  first: string
  role: string
  photo: PhotoKey
  call: number // planned call, minutes
  fee: number
  height?: number
  agency?: string
  flies?: boolean
  /** live state on the scenario clock */
  arrivesAt?: number // when they reach set (Vilnius local)
  confirmed?: boolean
}

export const CREW: CrewMember[] = [
  { id: "tomas", name: "Tomas Vale", first: "Tomas", role: "Photographer", photo: "tomas", call: 600, fee: 1250, flies: true },
  { id: "marta", name: "Marta", first: "Marta", role: "Model", photo: "marta", call: 540, fee: 450, height: 177, agency: "Agency", arrivesAt: 9 * 60 + 50 },
  { id: "ieva", name: "Ieva", first: "Ieva", role: "Model", photo: "ieva", call: 540, fee: 450, height: 179, agency: "Agency", arrivesAt: 10 * 60 + 22 },
  { id: "jonas", name: "Jonas", first: "Jonas", role: "Stylist", photo: "jonas", call: 570, fee: 300, height: 188, agency: "Agency", confirmed: true },
  { id: "aras", name: "Aras", first: "Aras", role: "Make-up", photo: "aras", call: 510, fee: 180, height: 186, agency: "Agency", confirmed: true },
]

/** Holds on the talent strip (agency digitals). */
export const TALENT_HOLDS: CrewId[] = ["marta", "ieva", "jonas", "aras"]

export const ASSISTANT_FEE = 250
export const TOMAS_HOTEL = 80
export const TOMAS_VAN = 60

export interface Location {
  id: "pilies" | "uzupis" | "lukiskes"
  name: string
  why: string
  dayRate: number
  freeOn: string[]
  photo: string
  photoPos: string
  matchesLook: boolean
}

export const LOCATIONS: Location[] = [
  { id: "pilies", name: "Pilies courtyard", why: "White arches, soft north light, Old Town stone", dayRate: 650, freeOn: ["2026-11-21"], photo: "loc-court2.jpg", photoPos: "50% 60%", matchesLook: true },
  { id: "uzupis", name: "Užupis riverside yard", why: "River, trees and soft daylight, quiet on weekends", dayRate: 820, freeOn: ["2026-11-21"], photo: "loc-uzupis.jpg", photoPos: "50% 45%", matchesLook: true },
  { id: "lukiskes", name: "Lukiškės complex", why: "Brick, iron and long corridors, hard contrast", dayRate: 1100, freeOn: ["2026-11-21"], photo: "loc-prison.jpg", photoPos: "50% 0%", matchesLook: true },
]

/** Team options: book locally vs fly Tomas's Milan team in. */
export const TEAM = {
  local: { label: "Local crew", members: [{ who: "Marta", fee: 450 }, { who: "assistant", fee: ASSISTANT_FEE }, { who: "stylist", fee: 300 }, { who: "make-up", fee: 180 }] },
  fly: { label: "Fly own team", members: [{ who: "Marta", fee: 450 }, { who: "assistant", fee: 180 }, { who: "stylist", fee: 220 }, { who: "make-up", fee: 150 }], flights: 3 },
}

export const CALL_SHEET_ROWS: { label: string; min: number }[] = [
  { label: "Marta", min: 540 },
  { label: "Tomas", min: 600 },
  { label: "First frame", min: 615 },
  { label: "Wrap", min: 1155 },
]

export const SLIDERS = {
  budget: { min: 3000, max: 6000, step: 10, initial: 3500 },
  delay: { min: 0, max: 360, step: 5, initial: 185 },
  heroBudget: { min: 1000, max: 20000, step: 250, initial: SHOOT.briefBudget },
}

/* ---------- helpers ---------- */

export const hm = (m: number) => {
  const r = Math.round(m)
  const h = Math.floor(r / 60) % 24
  const mm = ((r % 60) + 60) % 60
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}
export const dur = (m: number) => `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, "0")}`
export const eur = (n: number) => "€" + Math.round(n).toLocaleString("en-US")
export const sum = (xs: { fee: number }[]) => xs.reduce((a, b) => a + b.fee, 0)
export const crew = (id: CrewId) => CREW.find((c) => c.id === id)!

/* ---------- derived: locations & team ---------- */

export function locationsView() {
  const matches = LOCATIONS.filter((l) => l.matchesLook)
  const cheapest = [...matches].sort((a, b) => a.dayRate - b.dayRate)[0]
  return {
    matchCount: matches.length,
    scouted: SHOOT.scoutedLocations,
    recommendedId: cheapest.id,
    items: matches.map((l) => ({ ...l, free: l.freeOn.includes(SHOOT.dateISO), price: l.dayRate })),
  }
}

export function teamView() {
  const local = sum(TEAM.local.members)
  const fly = sum(TEAM.fly.members) + TEAM.fly.flights * FLIGHT.fareReturn
  const who = TEAM.local.members.map((m) => m.who)
  return {
    local: { label: TEAM.local.label, cost: local, line: `${who.slice(0, -1).join(", ")} and ${who[who.length - 1]} · ${SHOOT.city}` },
    fly: { label: TEAM.fly.label, cost: fly, line: `${dur(FLIGHT.durationMin)} · ${MXP.code} → ${VNO.code}` },
    pick: local <= fly ? ("local" as const) : ("fly" as const),
    saving: Math.abs(fly - local),
  }
}

/* ---------- derived: plan picked by budget ---------- */

export const TOMAS_COST = crew("tomas").fee + FLIGHT.fareReturn + TOMAS_HOTEL + TOMAS_VAN

interface PlanDef { id: string; loc: Location["id"]; team: "local" | "fly"; addIeva: boolean; dropAssistant: boolean; note: string }
const PLAN_DEFS: PlanDef[] = [
  { id: "lean", loc: "pilies", team: "local", addIeva: false, dropAssistant: true, note: "drops the assistant, keeps Tomas" },
  { id: "core", loc: "pilies", team: "local", addIeva: false, dropAssistant: false, note: "keeps Tomas and the look" },
  { id: "two", loc: "pilies", team: "local", addIeva: true, dropAssistant: false, note: "adds Ieva as second model" },
  { id: "lukiskes", loc: "lukiskes", team: "local", addIeva: true, dropAssistant: false, note: "adds Ieva and Lukiškės" },
  { id: "own", loc: "lukiskes", team: "fly", addIeva: true, dropAssistant: false, note: "Tomas brings his Milan team" },
]

export interface Plan { id: string; cost: number; label: string; note: string; delta: number; over: boolean; lines: { label: string; cost: number }[] }

function costPlan(d: PlanDef) {
  const tv = teamView()
  const loc = LOCATIONS.find((l) => l.id === d.loc)!
  const team = d.team === "local" ? tv.local.cost - (d.dropAssistant ? ASSISTANT_FEE : 0) : tv.fly.cost
  const lines = [
    { label: loc.name, cost: loc.dayRate },
    { label: d.team === "local" ? "Local crew" : "Milan team, flown", cost: team },
    { label: "Tomas Vale, flight, hotel, van", cost: TOMAS_COST },
    ...(d.addIeva ? [{ label: "Ieva", cost: crew("ieva").fee }] : []),
  ]
  const models = d.addIeva ? "Marta + Ieva" : "Marta"
  const place = d.loc === "pilies" ? SHOOT.studio : loc.name.split(" ")[0]
  return { lines, cost: lines.reduce((a, b) => a + b.cost, 0), label: `${place} · ${models} · one day` }
}

export function pickPlan(budget: number): Plan {
  const all = PLAN_DEFS.map((d) => ({ d, ...costPlan(d) }))
  const fits = all.filter((p) => p.cost <= budget).sort((a, b) => b.cost - a.cost)
  const p = fits[0] ?? [...all].sort((a, b) => a.cost - b.cost)[0]
  const delta = budget - p.cost
  return { id: p.d.id, cost: p.cost, label: p.label, note: p.d.note, delta, over: delta < 0, lines: p.lines }
}

/* ---------- derived: flight delay -> landing, calls, crew ---------- */

export function flightView(delayMin: number) {
  const tz = (VNO.utcOffsetH - MXP.utcOffsetH) * 60
  const departMxp = FLIGHT.departLocal + delayMin // Milan local
  const departVno = departMxp + tz // same instant in Vilnius time
  const planned = FLIGHT.departLocal + tz + FLIGHT.durationMin
  const lands = planned + delayMin
  const now = SHOOT.nowMin
  const progress = Math.min(1, Math.max(0, (now - departVno) / FLIGHT.durationMin))
  const state: "scheduled" | "air" | "landed" = now < departVno ? "scheduled" : now < lands ? "air" : "landed"
  return { delayMin, departMxp, planned, lands, progress, state, landsInMin: Math.max(0, lands - now), departsInMin: Math.max(0, departVno - now) }
}

export function replan(delayMin: number) {
  const f = flightView(delayMin)
  const tomas = crew("tomas")
  const vanAt = f.lands + GROUND.vanAfterLandingMin
  const earliestCall = vanAt + GROUND.driveMin + GROUND.settleMin
  const shift = Math.max(0, earliestCall - tomas.call)
  const rows = CALL_SHEET_ROWS.map((r) => ({ label: r.label, old: r.min, now: r.min + shift }))
  return { flight: f, vanAt, shift, rows, tomasCall: { old: tomas.call, now: tomas.call + shift } }
}

export interface CrewRow { m: CrewMember; status: string; live: boolean; old: number; now: number }

export function crewView(delayMin: number): { rows: CrewRow[]; plan: ReturnType<typeof replan> } {
  const p = replan(delayMin)
  const f = p.flight
  const now = SHOOT.nowMin
  const rows = CREW.map((m) => {
    let status = "Confirmed"
    let live = false
    if (m.flies) {
      live = true
      status =
        f.state === "air" ? `In the air · ${FLIGHT.no} · lands in ${f.landsInMin} min`
        : f.state === "scheduled" ? `${FLIGHT.no} departs ${MXP.code} ${hm(f.departMxp)}`
        : `Landed ${hm(f.lands)} · van at ${hm(p.vanAt)}`
    } else if (m.arrivesAt != null) {
      live = true
      status = m.arrivesAt <= now ? "On set" : `En route · ${m.arrivesAt - now} min`
    }
    return { m, status, live, old: m.call, now: m.call + p.shift }
  })
  return { rows, plan: p }
}

export interface Draft { id: CrewId; to: string; photo: PhotoKey; parts: (string | { hl: string })[] }

/** Auto-drafted messages, one per person whose call moved. */
export function drafts(delayMin: number): Draft[] {
  const { rows, plan } = crewView(delayMin)
  if (plan.shift === 0) return []
  const L = hm(plan.flight.lands)
  const where = `${SHOOT.studio}, ${SHOOT.address}`
  return rows.map(({ m, old, now }) => {
    const n = hm(now)
    const o = hm(old)
    let parts: Draft["parts"]
    switch (m.id) {
      case "tomas": parts = [`Hi ${m.first}, a van waits at ${VNO.code} arrivals at ${hm(plan.vanAt)}. Your call is now `, { hl: n }, ` (was ${o}). ${SHOOT.studio}.`]; break
      case "marta": parts = [`Hi ${m.first}, Tomas lands ${L}. Your call moves to `, { hl: n }, ` (was ${o}). ${where}`]; break
      case "ieva": parts = [`Hi ${m.first}, no rush. Your call moves to `, { hl: n }, ` (was ${o}). Same studio.`]; break
      case "jonas": parts = [`Hi ${m.first}, styling starts `, { hl: n }, ` (was ${o}). Rails can come in from ${hm(now - 45)}.`]; break
      case "aras": parts = [`Hi ${m.first}, make-up moves to `, { hl: n }, ` (was ${o}). Marta is first in the chair.`]; break
    }
    return { id: m.id, to: m.name, photo: m.photo, parts }
  })
}

export function loadingFacts(city = SHOOT.city) {
  const t = crew("tomas")
  return [`${SHOOT.photos} photos`, SHOOT.look, SHOOT.dateLabel, city, `${t.first}, from ${MXP.city}`]
}
