import type { CityId, LeverId, Person, Place, Role, Slot } from "./types"

/** Demo data — all people, brands, flights and prices are fictional. */

export const CITY = {
  vilnius: {
    label: "Vilnius",
    airport: "VNO",
    hotelNight: 80,
    productionDay: 420,
    productionOtPerHour: 30,
    retouchPerPhoto: 20,
    carFromAirportMin: 30,
  },
  milan: {
    label: "Milan",
    airport: "MXP",
    hotelNight: 140,
    productionDay: 650,
    productionOtPerHour: 45,
    retouchPerPhoto: 25,
    carFromAirportMin: 50,
  },
} as const

export const FARE_RETURN: Record<string, number> = {
  "milan-vilnius": 220,
  "vilnius-milan": 220,
}

export const RETOUCH_LOCAL_RATE = 12
export const OT_ROUND_MIN = 15
export const CUT_AMOUNT = 1500

export const PEOPLE: Person[] = [
  { id: "ieva", name: "Ieva", role: "model", city: "milan", photo: "/img/ieva.jpg", fee: 600, feeLabel: "Fee, 1 day", agencyPct: 0.2, otPerHour: 0, note: "The face from the reference. Milan agency.", available: true },
  { id: "marta", name: "Marta", role: "model", city: "vilnius", photo: "/img/marta.jpg", fee: 450, feeLabel: "Fee, 1 day", agencyPct: 0.2, otPerHour: 0, note: "Lives in Vilnius. Fits the sample size.", available: true },
  { id: "austeja", name: "Austėja", role: "model", city: "vilnius", photo: "/img/ref-4.jpg", fee: 450, feeLabel: "Fee, 1 day", agencyPct: 0.2, otPerHour: 0, note: "Local, free on Saturday.", available: true },
  { id: "tomas", name: "Tomas", role: "photographer", city: "vilnius", photo: "/img/tomas.jpg", fee: 850, feeLabel: "Flat fee, 12 photos", otPerHour: 60, note: "Editorial outerwear. Shoots tethered.", available: true },
  { id: "giorgio", name: "Giorgio", role: "photographer", city: "milan", fee: 1400, feeLabel: "Flat fee, 12 photos", otPerHour: 90, note: "Milan campaigns.", available: true },
  { id: "greta", name: "Greta", role: "hmu", city: "vilnius", fee: 350, feeLabel: "Day rate", otPerHour: 35, note: "Skin-first, editorial hair.", available: true },
  { id: "sofia", name: "Sofia", role: "hmu", city: "milan", fee: 550, feeLabel: "Day rate", otPerHour: 50, note: "Milan campaigns.", available: true },
  { id: "lukas", name: "Lukas", role: "stylist", city: "vilnius", fee: 300, feeLabel: "Day rate", prep: 150, otPerHour: 35, note: "Steams, pins and pulls accessories.", available: true },
  { id: "chiara", name: "Chiara", role: "stylist", city: "milan", fee: 500, feeLabel: "Day rate", prep: 250, otPerHour: 50, note: "Milan outerwear stylist.", available: true },
]

export const PLACES: Place[] = [
  { id: "loft", name: "Old Town loft", city: "vilnius", photo: "/img/location.jpg", hire: 550, hireLabel: "Hire, 08:00–15:00", permit: 150, bookedUntil: 15 * 60, otPerHour: 80, note: "Brick, iron doors, grey north light." },
  { id: "studio3", name: "Studio 3", city: "vilnius", photo: "/img/studio.jpg", hire: 300, hireLabel: "Day package", permit: 0, bookedUntil: 17 * 60, otPerHour: 50, note: "Daylight studio, white walls." },
  { id: "navigli", name: "Navigli courtyard", city: "milan", photo: "/img/ref-8.jpg", hire: 900, hireLabel: "Hire, 08:00–15:00", permit: 0, bookedUntil: 15 * 60, otPerHour: 120, note: "Courtyard and stairwell, Milan." },
]

export interface RouteDef {
  id: "hybrid" | "local" | "destination"
  name: string
  kicker: string
  shootCity: CityId
  picks: Record<Slot, string>
  producerTravels: boolean
}

export const ROUTES: RouteDef[] = [
  { id: "hybrid", name: "Fly Ieva in", kicker: "Hybrid · Vilnius crew, one flight", shootCity: "vilnius", picks: { model1: "ieva", model2: "marta", photographer: "tomas", hmu: "greta", stylist: "lukas", location: "loft" }, producerTravels: false },
  { id: "local", name: "All Vilnius", kicker: "Local · nobody travels", shootCity: "vilnius", picks: { model1: "austeja", model2: "marta", photographer: "tomas", hmu: "greta", stylist: "lukas", location: "loft" }, producerTravels: false },
  { id: "destination", name: "Shoot in Milan", kicker: "Destination · Milan crew", shootCity: "milan", picks: { model1: "ieva", model2: "marta", photographer: "giorgio", hmu: "sofia", stylist: "chiara", location: "navigli" }, producerTravels: true },
]

export const PLANNED_FLIGHTS: Record<string, { flightNo: string; from: string; to: string; depart: string; arrive: string }> = {
  ieva: { flightNo: "DA 641", from: "MXP", to: "VNO", depart: "04:55", arrive: "07:40" },
}

export interface Lever {
  id: LeverId
  text: string
  dna?: "location" | "model" | "twoModels" | "look"
  breaks?: string
}

export const LEVERS: Record<LeverId, Lever> = {
  studio: { id: "studio", text: "Studio 3 instead of the loft", dna: "location" },
  local: { id: "local", text: "Local model instead of flying Ieva in", dna: "model" },
  oneModel: { id: "oneModel", text: "One model, not two", dna: "twoModels" },
  shortLoft: { id: "shortLoft", text: "Indoors only, no street permit" },
  noPrep: { id: "noPrep", text: "Stylist without a prep day" },
  retouchLocal: { id: "retouchLocal", text: "Retouching in Vilnius, 12 × €12" },
  noHmu: { id: "noHmu", text: "No hair & makeup", dna: "look", breaks: "Breaks the DNA: drops the editorial look" },
}

export const CUT_OPTIONS: { id: string; title: string; levers: LeverId[] }[] = [
  { id: "o1", title: "Change the setting, keep the look", levers: ["studio", "local", "noPrep", "retouchLocal"] },
  { id: "o2", title: "Keep Ieva and the loft", levers: ["oneModel", "shortLoft", "noPrep", "retouchLocal"] },
  { id: "o3", title: "Shoot plain, on white", levers: ["studio", "local", "oneModel", "noHmu"] },
]

export const SAMPLE_TRANSCRIPT =
  "Hi, it's for Vėtra, the outerwear label. We need twelve photos of the new Vėtra field jacket, editorial, not catalogue. Think the reference: grey light, Old Town textures, a girl who looks like she's going somewhere. Two models. We'd love Ieva, the model from the reference, she's with an agency in Milan. Tomas should shoot it if he's free, and we need hair and makeup and a stylist. Budget is five thousand euros, all in. We want to shoot on Saturday the twenty-first of November, one day, here in Vilnius. The photos are for the webshop and Instagram."

export const SAMPLE_EMAIL = `Hi!

We're Vėtra — outerwear from Vilnius. We need 12 photos of the new Vėtra field jacket: editorial, not catalogue. See the reference: grey light, Old Town textures, someone who looks like she's going somewhere.

Two models please. We'd love Ieva (the model in the reference, Milan agency). Tomas to shoot if he's free; we need hair & makeup and a stylist.

Budget: €5,000 all in. Shoot date: Saturday 21 November, one day, in Vilnius.
Usage: webshop + Instagram.

Thanks, Vėtra team`

export const SAMPLE_FLIGHT_TEXT = `DEMO AIR — SCHEDULE CHANGE
Booking reference: K4VT2R
Passenger: MS IEVA

Your flight has been retimed.

Flight DA 645   Sat 21 Nov 2026
Depart  Milan Malpensa (MXP)   07:55
Arrive  Vilnius (VNO)          10:45

Previously: Flight DA 641, arriving 07:40.

Return
Flight DA 646   Sun 22 Nov 2026
Depart  Vilnius (VNO)          11:30
Arrive  Milan Malpensa (MXP)   12:20

Total paid: EUR 220.00 (no change fee for schedule changes)`

export const SLOTS: { slot: Slot; label: string; role: Role | "place" }[] = [
  { slot: "model1", label: "Model", role: "model" },
  { slot: "model2", label: "Second model", role: "model" },
  { slot: "photographer", label: "Photographer", role: "photographer" },
  { slot: "hmu", label: "Hair & makeup", role: "hmu" },
  { slot: "stylist", label: "Stylist", role: "stylist" },
  { slot: "location", label: "Location", role: "place" },
]
