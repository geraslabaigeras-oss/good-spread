"use client"
import { useEffect, useRef, useState } from "react"
import "./flow-theme.css"
import { FlowProvider, useFlow } from "./state"
import { Logo, Photo, Roll, useInView } from "./ui"
import AppFrame from "./AppFrame"
import Globe from "./Globe"
import Intake from "./Intake"
import { CallSheet, CrewTracker, LandingTime, DelaySlider, Drafts, LocationCards, MatchCard, PassCard, TeamCompare } from "./views"
import { photo, PHOTO_SET } from "@/lib/flow/photos"
import { FLIGHT, MXP, SHOOT, VNO, dur, eur, hm, locationsView, pickPlan, drafts, replan, crew } from "@/lib/flow/scenario"

function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.15)
  return <div ref={ref} className={`f-reveal ${seen ? "is-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>
}

function Liquid() {
  return (
    <div className="f-liquid" aria-hidden>
      <div className="f-blob sand" style={{ width: "48vw", height: "48vw", left: "-12vw", top: "-10vw" }} />
      <div className="f-blob sand" style={{ width: "40vw", height: "40vw", right: "-14vw", top: "30vh", animationDelay: "-9s" }} />
      <div className="f-blob photo" style={{ width: "34vw", height: "34vw", right: "8vw", top: "-8vw", backgroundImage: `url(${photo("hero")})`, animationDelay: "-4s" }} />
      <div className="f-blob photo" style={{ width: "30vw", height: "30vw", left: "18vw", bottom: "-12vw", backgroundImage: `url(${photo("mood")})`, animationDelay: "-14s" }} />
    </div>
  )
}

function Nav() {
  const { pulse } = useFlow()
  return (
    <header className="f-nav f-glass">
      <a href="#top"><Logo pulse={pulse} /></a>
      <nav className="f-nav-links">
        <a href="#product">Product</a>
        <a href="#how">How it works</a>
        <a href="#agencies">For agencies</a>
      </nav>
      <a className="f-btn is-small" href="#cta">Book a demo</a>
    </header>
  )
}

function Hero() {
  const par = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const on = () => { if (par.current) par.current.style.transform = `translate3d(0, ${Math.min(120, window.scrollY * 0.08)}px, 0)` }
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])
  return (
    <section className="f-hero" id="top">
      <div className="f-hero-fog" aria-hidden><div className="core" /><div className="f-ghost">good spread</div><div className="f-grain" /></div>
      <div className="f-wrap">
        <div className="f-hero-head">
          <Reveal>
            <span className="f-eyebrow">AI producer for fashion shoots</span>
            <h1 className="f-h1">Produce the shoot,<br />not the chaos.</h1>
            <p className="f-lede" style={{ marginTop: 32 }}>One reference in. A costed plan out, re-planned the minute reality moves.</p>
            <div className="f-hero-cta">
              <a className="f-btn" href="#cta">Book a demo</a>
              <a className="f-link" href="#product" style={{ fontSize: 13 }}>or try the live product ↓</a>
            </div>
          </Reveal>
          <div ref={par} className="f-hero-photos" aria-hidden>
            <Photo k="mood" pos="50% 30%" className="f-hero-ph2" />
            <Photo k="hero" pos="45% 30%" className="f-hero-ph1 is-framed" />
          </div>
        </div>
        <div className="f-hero-frame" id="product">
          <Reveal delay={120}><AppFrame /></Reveal>
          <p className="f-label" style={{ textAlign: "center", marginTop: 16 }}>Live product, not a recording. Drag the sliders, open Crew, press Send all.</p>
        </div>
      </div>
    </section>
  )
}

function Replan() {
  const { delay } = useFlow()
  const p = replan(delay)
  const t = crew("tomas")
  return (
    <section className="f-section" id="replan" style={{ paddingTop: 40 }}>
      <div className="f-wrap f-band f-fog-dark f-dark">
        <div className="f-grain" />
        <Reveal className="f-section-head">
          <div><span className="f-eyebrow">Re-plan · live</span><h2 className="f-h2">A flight slips.<br />The day moves with it.</h2></div>
          <p className="f-lede">Drag the delay. The landing, the call times and {t.first}&rsquo;s pass all follow.</p>
        </Reveal>
        <div className="f-globe-grid">
          <Reveal className="f-globe-stage">
            <Globe from={MXP} to={VNO} progress={p.flight.progress} fromLabel={`${MXP.code} ${hm(p.flight.departMxp)}`} toLabel={`${VNO.code} ${hm(p.flight.lands)}`} />
            <div className="f-globe-time"><LandingTime /></div>
            <div className="f-panel is-glass f-globe-slider"><DelaySlider /></div>
          </Reveal>
          <div className="f-globe-side">
            <Reveal delay={80}><CallSheet /></Reveal>
            <Reveal delay={160}><PassCard /></Reveal>
            <Reveal delay={240}>
              <p className="f-body" style={{ padding: "4px 4px 0" }}>
                {FLIGHT.no} {MXP.code} → {VNO.code}, {dur(FLIGHT.durationMin)} in the air. A van meets {t.first} at arrivals, so every call moves by exactly the time he loses{p.shift ? `: +${dur(p.shift)}.` : ", which right now is nothing."}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

function How() {
  const { heroBudget, budget, delay } = useFlow()
  const v = locationsView()
  const plan = pickPlan(budget)
  const n = drafts(delay).length
  const steps = [
    { k: "Brief", t: "Say it, paste it or drop a reference. The engine reads budget, date, city and look.", big: eur(heroBudget), href: "#product" },
    { k: "Locations", t: "Scouted against the reference, priced per day and checked for your date.", big: `${v.matchCount} of ${v.scouted}`, href: "#locations" },
    { k: "Plan", t: "Talent, crew, flights and studio costed into one plan that fits the budget.", big: eur(plan.cost), href: "#replan" },
    { k: "Crew", t: "When the day moves, everyone gets a drafted message with their new call.", big: `${n} ${n === 1 ? "draft" : "drafts"}`, href: "#crew" },
  ]
  return (
    <section className="f-section" id="how" style={{ paddingTop: 40 }}>
      <div className="f-wrap f-band f-fog-light">
        <div className="f-grain" />
        <Reveal>
          <span className="f-eyebrow">How it works</span>
          <h2 className="f-h2">From one reference<br />to a call sheet.</h2>
        </Reveal>
        <div className="f-timeline">
          {steps.map((st, i) => (
            <Reveal key={st.k} className="f-step" delay={i * 90}>
              <a href={st.href}>
                <span className="f-eyebrow">Step {i + 1}</span>
                <span className="node" />
                <h3>{st.k}</h3>
                <p>{st.t}</p>
                <div className="big"><Roll value={st.big} /></div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Locations() {
  const v = locationsView()
  return (
    <section className="f-section" id="locations" style={{ paddingTop: 40 }}>
      <div className="f-wrap">
        <Reveal className="f-section-head">
          <div><span className="f-eyebrow">Scout</span><h2 className="f-h2">Scouted to<br />the reference.</h2></div>
          <p className="f-lede">{v.matchCount} of {v.scouted} {SHOOT.city} locations match the look, each free on {SHOOT.dateShort}.</p>
        </Reveal>
        <Reveal><LocationCards /></Reveal>
        <Reveal className="f-row2" delay={100}><TeamCompare /><MatchCard /></Reveal>
      </div>
    </section>
  )
}

function Coordinate() {
  return (
    <section className="f-section" id="crew" style={{ paddingTop: 40 }}>
      <div className="f-wrap">
        <Reveal className="f-section-head">
          <div><span className="f-eyebrow">Coordinate</span><h2 className="f-h2">Everyone hears it<br />once, from you.</h2></div>
          <p className="f-lede">Live status for the whole crew, and a drafted message for everyone whose call moved.</p>
        </Reveal>
        <div className="f-coord">
          <Reveal><CrewTracker /></Reveal>
          <Reveal delay={120}><Drafts /></Reveal>
        </div>
      </div>
    </section>
  )
}

const USES = [
  { who: "Production companies", what: "Quote a shoot from the client’s reference, with every fee, flight and day rate visible before you commit." },
  { who: "Creative agencies", what: "Show a client what their budget buys, then move one slider instead of rebuilding the deck." },
  { who: "In-house brand teams", what: "Keep talent, locations and call times in one plan that re-plans itself on the day." },
]

function Agencies() {
  return (
    <section className="f-section" id="agencies" style={{ paddingTop: 40 }}>
      <div className="f-wrap f-uses">
        <Reveal className="f-photo f-uses-photo is-framed"><img src={photo("mood")} alt="" style={{ objectPosition: "50% 25%" }} /></Reveal>
        <Reveal delay={100}>
          <span className="f-eyebrow">For productions and agencies</span>
          <h2 className="f-h2" style={{ marginBottom: 48 }}>Built for the people<br />who make the day happen.</h2>
          {USES.map((u) => (
            <div key={u.who} className="f-use">
              <span className="f-display" style={{ fontSize: 22, lineHeight: 1.15 }}>{u.who}</span>
              <p className="f-body">{u.what}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

function Cta({ onIntake }: { onIntake: () => void }) {
  return (
    <section className="f-section" id="cta" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="f-wrap">
        <Reveal className="f-cta">
          <div className="f-ghost" aria-hidden>good spread</div>
          <div className="f-grain" />
          <span className="f-eyebrow">Book a demo</span>
          <h2 className="f-h2">Bring your next brief.</h2>
          <p className="f-lede" style={{ margin: "22px auto 34px" }}>Say it, paste it or drop a reference. We plan it with you, live.</p>
          <div style={{ display: "flex", gap: 22, justifyContent: "center", alignItems: "center" }}>
            <button className="f-btn" onClick={onIntake}>Start with your brief</button>
            <a className="f-link" href="#product" style={{ fontSize: 13 }}>or open the product ↑</a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="f-wrap f-footer">
      <div><Logo /><p style={{ marginTop: 10 }}>Built at Unfair Weekend Vilnius, 2026.</p></div>
      <div>
        <p>Location photos: Wikimedia Commons (Pilies courtyard, Užupis riverside, Lukiškės complex), used under their Commons licences.</p>
        {PHOTO_SET === "real"
          ? <p>Talent and campaign photos: Ford Models and NEXT Management boards. Internal mockup only, not for publication.</p>
          : <p>Talent and campaign photos are placeholders.</p>}
        <p>Demo: people, prices and flights are invented.</p>
      </div>
    </footer>
  )
}

function Inner() {
  const [intake, setIntake] = useState(false)
  useEffect(() => {
    const on = (e: PointerEvent) => {
      const b = (e.target as HTMLElement)?.closest?.(".f-btn") as HTMLElement | null
      if (!b) return
      const r = b.getBoundingClientRect()
      b.style.setProperty("--mx", `${e.clientX - r.left}px`); b.style.setProperty("--my", `${e.clientY - r.top}px`)
    }
    window.addEventListener("pointermove", on)
    return () => window.removeEventListener("pointermove", on)
  }, [])
  return (
    <div className="flow">
      <Liquid />
      <Nav />
      <Hero />
      <How />
      <Replan />
      <Locations />
      <Coordinate />
      <Agencies />
      <Cta onIntake={() => setIntake(true)} />
      <Footer />
      {intake && <Intake onClose={() => setIntake(false)} onApply={() => { setIntake(false); document.getElementById("product")?.scrollIntoView({ behavior: "smooth" }) }} />}
    </div>
  )
}

export default function Site() {
  return <FlowProvider><Inner /></FlowProvider>
}
