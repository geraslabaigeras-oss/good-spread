export type CityId = "vilnius" | "milan"
export type Role = "model" | "photographer" | "hmu" | "stylist"
export type Slot = "model1" | "model2" | "photographer" | "hmu" | "stylist" | "location"

export interface Person {
  id: string
  name: string
  role: Role
  city: CityId
  photo?: string
  fee: number
  feeLabel: string
  agencyPct?: number
  prep?: number
  otPerHour: number
  note: string
  available: boolean
  custom?: boolean
}

export interface Place {
  id: string
  name: string
  city: CityId
  photo?: string
  hire: number
  hireLabel: string
  permit: number
  bookedUntil: number
  otPerHour: number
  note: string
}

export interface MissingItem {
  field: string
  question: string
  why: string
}

export type FieldKey = "budget" | "photos" | "date" | "look" | "product" | "where" | "talent"

export interface Brief {
  title: string
  client: string
  product: string | null
  photos: number | null
  budget: number | null
  shootDate: string | null
  days: number
  where: string | null
  nearCity: CityId | null
  look: string[]
  models: number
  wantsModel: string | null
  wantsPhotographer: string | null
  crew: Role[]
  usage: string | null
  missing: MissingItem[]
  spans: Partial<Record<FieldKey, string>>
  source: string
  sourceKind: "typed" | "voice" | "upload" | "sample"
  sourceLabel?: string
  extractedBy: string
}

export interface DnaItem {
  id: "photos" | "product" | "look" | "twoModels" | "location" | "model" | "photographer"
  text: string
  zone: "keep" | "change"
  draggable?: boolean
}

export interface FlightSegment {
  flightNo: string
  from: string
  fromCity?: string
  to: string
  toCity?: string
  date: string
  depart: string
  arrive: string
}

export interface FlightBooking {
  passenger: string
  bookingRef?: string
  outbound: FlightSegment
  inbound?: FlightSegment
  farePaid?: number
  parsedBy: string
  sourceName: string
}

export type FixId = "swap" | "push" | "replace"
export type LeverId = "studio" | "local" | "oneModel" | "noHmu" | "noPrep" | "retouchLocal" | "shortLoft"

export interface PlanInput {
  routeId: string
  picks: Partial<Record<Slot, string | null>>
  levers: LeverId[]
  flight: FlightBooking | null
  fix: FixId | null
}

export interface ProductionState {
  brief: Brief | null
  dna: DnaItem[]
  routeId: string | null
  picks: Partial<Record<Slot, string | null>>
  customPeople: Person[]
  levers: LeverId[]
  cutOption: string | null
  cap: number | null
  flight: FlightBooking | null
  fix: FixId | null
  approved: {
    picks: Partial<Record<Slot, string | null>>
    routeId: string
    levers: LeverId[]
    cap: number
  } | null
  log: { at: string; text: string }[]
}
