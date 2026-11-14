"use client"
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react"
import { photo, type PhotoKey } from "@/lib/flow/photos"

/** Flighty-style digit roll: every digit is a vertical strip that slides to its value. */
export function Roll({ value, className }: { value: string; className?: string }) {
  return (
    <span className={`f-roll ${className ?? ""}`} aria-label={value}>
      {value.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} className="d" aria-hidden>
            <span className="s" style={{ transform: `translateY(-${Number(ch) * 10}%)` }}>
              {"0123456789".split("").map((d) => <span key={d}>{d}</span>)}
            </span>
          </span>
        ) : (
          <span key={i} className="c" aria-hidden>{ch}</span>
        )
      )}
    </span>
  )
}

/** Old value struck, new value in the brand colour. Collapses to one value when unchanged. */
export function Change({ old, now, roll = true }: { old: string; now: string; roll?: boolean }) {
  const changed = old !== now
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      {changed && <span className="f-old" style={{ fontSize: "0.78em", marginRight: "0.45em" }}>{old}</span>}
      <span className={changed ? "f-new" : undefined}>{roll ? <Roll value={now} /> : now}</span>
    </span>
  )
}

export function Photo({ k, src, pos = "50% 25%", className, style, alt = "" }: { k?: PhotoKey; src?: string; pos?: string; className?: string; style?: React.CSSProperties; alt?: string }) {
  return (
    <div className={`f-photo ${className ?? ""}`} style={style}>
      <img src={src ?? photo(k!)} alt={alt} style={{ objectPosition: pos }} />
    </div>
  )
}

/** "good spread" wordmark (v7: Schibsted 500 15px). "spread" re-spreads on every re-plan. */
export function Logo({ pulse = 0, size = 15 }: { pulse?: number; size?: number }) {
  return (
    <span className="f-logo" style={{ fontSize: size }} aria-label="good spread">
      <span>good</span>
      <span key={pulse} className="sp">spread</span>
    </span>
  )
}

export function Slider({ label, value, display, min, max, step, ends, onChange, accent }: {
  label: string; value: number; display: React.ReactNode; min: number; max: number; step: number; ends: [string, string]; onChange: (v: number) => void; accent?: boolean
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="f-slider-wrap">
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
        <span className="f-mute">{label}</span>
        <span className={`f-num ${accent ? "f-accent" : ""}`}>{display}</span>
      </div>
      <div className="f-slider">
        <div className="tr" /><div className="ticks" />
        <div className="fill" style={{ width: `${pct}%` }} />
        <div className="th" style={{ left: `${pct}%` }} />
        <div className="ends"><span>{ends[0]}</span><span>{ends[1]}</span></div>
        <input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </div>
    </div>
  )
}

/** True once the element has scrolled into view. */
export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, seen] as const
}
