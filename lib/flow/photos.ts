/**
 * Single photo-set switch. Every image in the flow resolves through photo(key).
 * NEXT_PUBLIC_PHOTO_SET=real -> /photos/real/* (internal preview only, never in prod),
 * anything else -> /photos/demo/* (invented people, safe for public deploys).
 */
export type PhotoSet = "demo" | "real"
export const PHOTO_SET: PhotoSet = process.env.NEXT_PUBLIC_PHOTO_SET === "real" ? "real" : "demo"

export type PhotoKey = "hero" | "mood" | "tomas" | "marta" | "ieva" | "jonas" | "aras"

const FILES: Record<PhotoSet, Record<PhotoKey, string>> = {
  demo: { hero: "campaign.jpg", mood: "tomas.jpg", tomas: "tomas.jpg", marta: "digi1.jpg", ieva: "digi2.jpg", jonas: "digi3.jpg", aras: "digi4.jpg" },
  real: { hero: "campaign1.jpg", mood: "campaign2.jpg", tomas: "tomas.jpg", marta: "digi1.jpg", ieva: "digi2.jpg", jonas: "digi3.jpg", aras: "digi4.jpg" },
}

export function photo(key: PhotoKey): string {
  return `/photos/${PHOTO_SET}/${FILES[PHOTO_SET][key]}`
}

/** Location photos are Wikimedia Commons and identical in both sets. */
export function locPhoto(file: string): string {
  return `/photos/loc/${file}`
}
