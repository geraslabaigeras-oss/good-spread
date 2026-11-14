"use client"
import { useEffect, useState } from "react"
import { useFlow } from "./state"
import { Logo } from "./ui"
import Intake from "./Intake"
import { BriefView, BudgetSlider, CallSheet, CrewTracker, DelaySlider, Drafts, LandingTime, LoadingView, LocationCards, PassCard, PlanCard, TalentStrip, TeamCompare } from "./views"

type Tab = "brief" | "loading" | "locations" | "plan" | "crew"
const TABS: { id: Tab; label: string }[] = [
  { id: "brief", label: "Brief" },
  { id: "locations", label: "Locations" },
  { id: "plan", label: "Plan" },
  { id: "crew", label: "Crew" },
]

/** The live product, inside a browser window. */
export default function AppFrame({ initial = "brief" }: { initial?: Tab }) {
  const { pulse } = useFlow()
  const [tab, setTab] = useState<Tab>(initial)
  const [intake, setIntake] = useState(false)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("tab") as Tab | null
    if (q && ["brief", "locations", "plan", "crew"].includes(q)) setTab(q)
  }, [])
  return (
    <div className="f-browser f-glass">
      <div className="f-browser-bar">
        <span className="f-lights"><i /><i /><i /></span>
        <span className="f-url">app.goodspread.studio / vetra-fw26</span>
        <span />
      </div>
      <div className="f-app">
        <aside className="f-app-side">
          <Logo pulse={pulse} size={19} />
          <nav>
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id || (tab === "loading" && t.id === "brief") ? "is-on" : undefined} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </nav>
          <div className="f-label" style={{ marginTop: "auto" }}>Vėtra FW26<br />Demo data</div>
        </aside>
        <main className="f-app-main">
          {tab === "brief" && <BriefView onBegin={() => setTab("loading")} onIntake={() => setIntake(true)} />}
          {tab === "loading" && <LoadingView onDone={() => setTab("locations")} />}
          {tab === "locations" && (
            <div className="f-app-stack">
              <div className="f-split" style={{ alignItems: "baseline" }}><span className="f-display" style={{ fontSize: 30 }}>Locations</span><button className="f-link" onClick={() => setTab("plan")}>Plan →</button></div>
              <LocationCards compact />
              <TeamCompare />
            </div>
          )}
          {tab === "plan" && (
            <div className="f-app-plan">
              <div className="f-app-stack">
                <LandingTime big={false} />
                <div className="f-panel" style={{ display: "grid", gap: 6 }}><BudgetSlider /><DelaySlider /></div>
                <PlanCard />
              </div>
              <div className="f-app-stack">
                <CallSheet />
                <PassCard />
              </div>
              <div className="f-app-stack f-app-talent"><TalentStrip /><button className="f-link" onClick={() => setTab("crew")}>Tell the crew →</button></div>
            </div>
          )}
          {tab === "crew" && (
            <div className="f-app-crew">
              <CrewTracker compact />
              <Drafts max={3} />
            </div>
          )}
        </main>
      </div>
      {intake && <Intake onClose={() => setIntake(false)} onApply={() => setIntake(false)} />}
    </div>
  )
}
