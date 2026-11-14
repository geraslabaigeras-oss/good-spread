"use client"
import { useEffect, useMemo, useState } from "react"
import { useFlow } from "./state"
import { Change, Photo, Roll, Slider } from "./ui"
import { photo, locPhoto } from "@/lib/flow/photos"
import {
  CREW, FLIGHT, MXP, SHOOT, SLIDERS, TALENT_HOLDS, VNO, crew, crewView, drafts, dur, eur, hm, loadingFacts, locationsView, pickPlan, replan, teamView,
} from "@/lib/flow/scenario"

const delayLabel = (d: number) => (d === 0 ? "On time" : `+${dur(d)}`)

/* ---------- sliders bound to the engine ---------- */

export function DelaySlider() {
  const { delay, setDelay } = useFlow()
  const s = SLIDERS.delay
  return <Slider label="Flight delay" value={delay} display={delayLabel(delay)} min={s.min} max={s.max} step={s.step} ends={["0", `+${s.max / 60}h`]} onChange={setDelay} accent />
}

export function BudgetSlider() {
  const { budget, setBudget } = useFlow()
  const s = SLIDERS.budget
  return <Slider label="Budget" value={budget} display={eur(budget)} min={s.min} max={s.max} step={s.step} ends={[eur(s.min), eur(s.max)]} onChange={setBudget} />
}

/* ---------- landing time ---------- */

export function LandingTime({ big = true }: { big?: boolean }) {
  const { delay } = useFlow()
  const p = replan(delay)
  return (
    <div>
      <div className="f-label">{crew("tomas").first} · {FLIGHT.no} · lands {VNO.city}</div>
      <div className={big ? "f-bigtime-num" : "f-midtime-num"}>
        <span className={delay ? "f-new" : undefined}><Roll value={hm(p.flight.lands)} /></span>
      </div>
      <div className="f-num f-old" style={{ fontSize: big ? 30 : 20, visibility: delay ? "visible" : "hidden" }}>{hm(p.flight.planned)}</div>
    </div>
  )
}

/* ---------- plan, call sheet, pass, talent ---------- */

export function PlanCard() {
  const { budget } = useFlow()
  const plan = pickPlan(budget)
  return (
    <div className="f-panel">
      <div className="f-label f-split"><span>Plan</span><span>{plan.label}</span></div>
      <div className="f-display f-num-serif" style={{ fontSize: 46, lineHeight: 1.1, marginTop: 4 }}><Roll value={eur(plan.cost)} /></div>
      <div className="f-label">{eur(Math.abs(plan.delta))} {plan.over ? "over" : "under"} · {plan.note}</div>
    </div>
  )
}

export function CallSheet() {
  const { delay } = useFlow()
  const p = replan(delay)
  return (
    <div className="f-panel">
      <div className="f-label f-split"><span>Call sheet</span><span className={p.shift ? "f-new" : undefined}>{p.shift ? `Shifted +${dur(p.shift)}` : "On schedule"}</span></div>
      <div style={{ marginTop: 6 }}>
        {p.rows.map((r) => (
          <div key={r.label} className="f-cs">
            <span className="f-display">{r.label}</span>
            <span className="f-num f-old" style={{ fontSize: 13, visibility: r.old !== r.now ? "visible" : "hidden" }}>{hm(r.old)}</span>
            <span className={`f-num ${r.old !== r.now ? "f-new" : ""}`} style={{ textAlign: "right" }}><Roll value={hm(r.now)} /></span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PassCard() {
  const { delay } = useFlow()
  const p = replan(delay)
  const t = crew("tomas")
  return (
    <div className="f-panel f-pass">
      <Photo k={t.photo} pos="50% 25%" />
      <div style={{ padding: "16px 18px", flex: 1 }}>
        <div className="f-label">Pass</div>
        <div className="f-display" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 2 }}>{t.name}</div>
        <div className="f-label">{t.role} · {MXP.code} → {VNO.code}</div>
        <div style={{ borderTop: "1px dashed var(--f-hair)", margin: "14px 0 10px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><div className="f-label">Call</div><div className="f-num" style={{ fontSize: 20 }}><Change old={hm(p.tomasCall.old)} now={hm(p.tomasCall.now)} /></div></div>
          <div><div className="f-label">Studio</div><div className="f-num" style={{ fontSize: 20 }}>{SHOOT.studio.replace(/\D/g, "")}</div></div>
        </div>
      </div>
    </div>
  )
}

export function TalentStrip() {
  return (
    <div className="f-panel">
      <div className="f-label f-split" style={{ marginBottom: 10 }}><span>Talent</span><span>{TALENT_HOLDS.length} holds · {SHOOT.dateShort}</span></div>
      <div className="f-talent">
        {TALENT_HOLDS.map((id) => {
          const m = crew(id)
          return (
            <div key={id}>
              <Photo k={m.photo} pos="50% 20%" />
              <div className="f-display" style={{ fontSize: 15, marginTop: 6, lineHeight: 1.1 }}>{m.first}</div>
              <div className="f-label" style={{ fontSize: 11 }}>{m.height} · {m.agency}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- locations ---------- */

export function LocationCards({ compact = false }: { compact?: boolean }) {
  const v = locationsView()
  return (
    <div className="f-loc-grid">
      {v.items.map((l) => (
        <article key={l.id} className="f-panel f-loc" style={{ padding: 0 }}>
          <div className="f-photo f-loc-img" style={{ height: compact ? 150 : undefined }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={locPhoto(l.photo)} alt={l.name} style={{ objectPosition: l.photoPos }} />
            {l.id === v.recommendedId && <span className="f-pill">Recommended</span>}
          </div>
          <div style={{ padding: compact ? "12px 14px 14px" : "18px 22px 20px" }}>
            <div className="f-display" style={{ fontSize: compact ? 19 : 27, lineHeight: 1.1 }}>{l.name}</div>
            {!compact && <div className="f-label" style={{ marginTop: 6 }}>{l.why}</div>}
            <div className="f-loc-meta">
              <span><span className="f-num" style={{ fontSize: compact ? 15 : 20 }}>{eur(l.price)}</span> <span className="f-label">/ day</span></span>
              <span className="f-label">{l.free ? `Free ${SHOOT.dateShort}` : "Booked"}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export function TeamCompare() {
  const t = teamView()
  return (
    <div className="f-panel">
      <div className="f-label f-split" style={{ marginBottom: 14 }}><span>Team</span><span>{eur(t.saving)} saved by booking local</span></div>
      <div className="f-team">
        {(["local", "fly"] as const).map((k) => (
          <div key={k} className={t.pick === k ? "is-pick" : undefined}>
            <span><span className="f-display" style={{ fontSize: 24 }}>{t[k].label}</span><div className="f-label">{t[k].line}</div></span>
            <span className="f-num" style={{ fontSize: 26 }}>{eur(t[k].cost)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MatchCard() {
  return (
    <div className="f-panel" style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Photo k="hero" pos="45% 40%" style={{ width: 92, height: 116, flex: "none" }} />
      <div><div className="f-label">Matched to your reference</div><div className="f-display" style={{ fontSize: 22, lineHeight: 1.2, marginTop: 4 }}>{SHOOT.referenceMatch}</div></div>
    </div>
  )
}

/* ---------- crew tracker + drafts ---------- */

export function CrewTracker({ compact = false }: { compact?: boolean }) {
  const { delay } = useFlow()
  const { rows } = crewView(delay)
  return (
    <div className="f-panel" style={{ padding: compact ? "6px 16px" : "8px 24px" }}>
      {!compact && <div className="f-cr f-label" style={{ borderTop: 0, padding: "10px 0 6px" }}><span /><span>Person</span><span className="live">Live</span><span style={{ textAlign: "right" }}>Call</span></div>}
      {rows.map((r) => (
        <div key={r.m.id} className={`f-cr ${compact ? "is-compact" : ""}`}>
          <Photo k={r.m.photo} pos="50% 20%" />
          <div><div className="f-display" style={{ fontSize: compact ? 17 : 21, lineHeight: 1.1 }}>{r.m.name}</div><div className="f-label">{r.m.role}</div></div>
          <div className="live" style={{ fontSize: 12.5 }}><span className={`f-dot ${r.live ? "is-live" : ""}`} /><span className={r.live ? undefined : "f-mute"}>{r.status}</span></div>
          <div className="f-num" style={{ fontSize: compact ? 15 : 19, textAlign: "right" }}><Change old={hm(r.old)} now={hm(r.now)} /></div>
        </div>
      ))}
    </div>
  )
}

export function Drafts({ max }: { max?: number }) {
  const { delay } = useFlow()
  const list = useMemo(() => drafts(delay), [delay])
  const [sent, setSent] = useState(0) // how many ticked to sent
  const [sending, setSending] = useState(false)
  const [shown, setShown] = useState(0)
  useEffect(() => { setSent(0); setSending(false) }, [delay])
  useEffect(() => {
    setShown(0)
    const ids = list.map((_, i) => setTimeout(() => setShown(i + 1), 120 + i * 140))
    return () => ids.forEach(clearTimeout)
  }, [list.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const sendAll = () => {
    setSending(true)
    list.forEach((_, i) => setTimeout(() => { setSent(i + 1); if (i === list.length - 1) setSending(false) }, 300 + i * 180))
  }
  const view = max ? list.slice(0, max) : list
  const allSent = list.length > 0 && sent >= list.length
  return (
    <div>
      <div className="f-label f-split" style={{ marginBottom: 12 }}><span>{list.length ? `${list.length} messages drafted` : "No call times moved"}</span><span>via WhatsApp</span></div>
      {view.map((d, i) => (
        <div key={d.id} className={`f-msg ${i < shown ? "is-on" : ""}`}>
          <Photo k={d.photo} pos="50% 20%" />
          <div>
            <div className="f-split" style={{ fontSize: 12.5 }}><b style={{ fontWeight: 500 }}>{d.to}</b><span className={`f-state ${i < sent ? "is-sent" : ""}`}>{i < sent ? "Sent ✓" : "Draft"}</span></div>
            <div className="f-bub">{d.parts.map((p, j) => (typeof p === "string" ? <span key={j}>{p}</span> : <b key={j}>{p.hl}</b>))}</div>
          </div>
        </div>
      ))}
      <div className="f-split" style={{ alignItems: "center", marginTop: 10 }}>
        <span className="f-label">Edit any message before sending</span>
        <button className={`f-btn ${allSent ? "is-done" : ""}`} onClick={sendAll} disabled={!list.length || sending || allSent}>
          {allSent ? `Sent (${list.length})` : `Send all (${list.length})`}
        </button>
      </div>
    </div>
  )
}

/* ---------- brief + loading (inside the product frame) ---------- */

export function BriefView({ onBegin, onIntake }: { onBegin: () => void; onIntake: () => void }) {
  const { city, setCity, heroBudget, setHeroBudget } = useFlow()
  const s = SLIDERS.heroBudget
  const [i, setI] = useState(0)
  const set = [photo("hero"), photo("mood"), photo("ieva")]
  useEffect(() => {
    let n = 0
    let iv: ReturnType<typeof setInterval>
    const first = setTimeout(() => { n = 1; setI(1); iv = setInterval(() => { n = (n + 1) % set.length; setI(n) }, 3800) }, 1000)
    return () => { clearTimeout(first); clearInterval(iv) }
  }, [set.length])
  return (
    <div className="f-brief">
      <div className="f-brief-l">
        <div className="f-input">
          Shoot in <span className="f-auto f-field"><span aria-hidden>{city || " "}</span><input className="f-field" style={{ border: 0 }} value={city} onChange={(e) => setCity(e.target.value)} aria-label="City" /></span><br />
          <span className="f-mute">for</span> <span className="f-field f-num-serif">{eur(heroBudget)}</span>
        </div>
        <div style={{ marginTop: 36, maxWidth: 380 }}>
          <Slider label="Budget" value={heroBudget} display={eur(heroBudget)} min={s.min} max={s.max} step={s.step} ends={[eur(s.min), eur(s.max)]} onChange={setHeroBudget} />
        </div>
        <div style={{ marginTop: 32, display: "flex", gap: 26, alignItems: "center" }}>
          <button className="f-btn" onClick={onBegin}>Begin</button>
          <button className="f-link" style={{ fontSize: 13 }} onClick={onIntake}>or drop references →</button>
        </div>
      </div>
      <div className="f-brief-r">
        <div className="f-photo f-swapbox">
          {set.map((src, j) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src + j} src={src} alt="" className={`f-swap ${j === i ? "is-in" : j === (i + set.length - 1) % set.length ? "is-out" : ""}`} />
          ))}
        </div>
        <div className="f-display" style={{ fontSize: 20, marginTop: 12 }}>{SHOOT.collection}</div>
        <div className="f-label">Old Town, {SHOOT.city} · reference {i + 1}</div>
      </div>
    </div>
  )
}

export function LoadingView({ onDone }: { onDone: () => void }) {
  const { city } = useFlow()
  const facts = loadingFacts(city || SHOOT.city)
  const [n, setN] = useState(0)
  const [p, setP] = useState(0)
  useEffect(() => {
    const ids = facts.map((_, i) => setTimeout(() => setN(i + 1), 300 + i * 600))
    const t0 = performance.now()
    let raf = 0
    const tick = () => { const q = Math.min(1, (performance.now() - t0) / 4000); setP(q); if (q < 1) raf = requestAnimationFrame(tick); else onDone() }
    raf = requestAnimationFrame(tick)
    return () => { ids.forEach(clearTimeout); cancelAnimationFrame(raf) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="f-brief">
      <div className="f-brief-l">
        {facts.map((f, i) => <span key={f} className={`f-fact ${i < n ? "is-on" : ""}`}>{f}</span>)}
        <div className="f-progress"><i style={{ width: `${p * 100}%` }} /></div>
      </div>
      <div className="f-brief-r">
        <Photo k="hero" pos="45% 40%" className="f-swapbox" style={{ filter: `blur(${(20 * (1 - p)).toFixed(1)}px)` }} />
      </div>
    </div>
  )
}

export const CREW_COUNT = CREW.length
