"use client"
import { useState } from "react"
import { useFlow } from "./state"
import { useRecorder } from "@/components/flow/studio/use-recorder"
import { useServices } from "@/components/flow/studio/use-services"
import { parseBriefText } from "@/lib/flow/brief"
import { SAMPLE_TRANSCRIPT } from "@/lib/flow/demo"
import { eur } from "@/lib/flow/scenario"

/** Voice / typed brief intake. ElevenLabs Scribe when the key is set, labelled sample otherwise. */
export default function Intake({ onClose, onApply }: { onClose: () => void; onApply: () => void }) {
  const { setCity, setHeroBudget } = useFlow()
  const services = useServices()
  const [text, setText] = useState("")
  const [source, setSource] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const rec = useRecorder(async (blob) => {
    setBusy(true); setNote(null)
    const fd = new FormData()
    fd.append("audio", new File([blob], `brief.${blob.type.includes("mp4") ? "m4a" : "webm"}`, { type: blob.type || "audio/webm" }))
    try {
      const res = await fetch("/api/voice/transcribe", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { setNote(data.error === "elevenlabs_not_configured" ? "Add ELEVENLABS_API_KEY to use voice." : "Transcription failed."); return }
      setText(data.text); setSource("Transcribed by ElevenLabs Scribe")
    } catch { setNote("Transcription failed. Type the brief or use the sample.") } finally { setBusy(false) }
  })

  const brief = text.trim() ? parseBriefText(text, "voice") : null
  const apply = () => {
    if (brief?.where) setCity(brief.where)
    if (brief?.budget) setHeroBudget(Math.min(20000, Math.max(1000, brief.budget)))
    onApply()
  }
  const recording = rec.state === "recording"

  return (
    <div className="f-sheet" onClick={onClose}>
      <div className="f-glass f-sheet-in" onClick={(e) => e.stopPropagation()}>
        <div className="f-split"><span className="f-label">Brief intake</span><button className="f-link" onClick={onClose}>Close</button></div>
        <h3 className="f-display" style={{ fontSize: 34, lineHeight: 1.1, margin: "18px 0 8px", fontWeight: 400 }}>Say the brief, or paste it.</h3>
        <p className="f-label" style={{ marginBottom: 20 }}>
          {services.loaded ? (services.elevenlabs ? "Voice is live: ElevenLabs Scribe transcribes, the engine reads the fields." : "Live voice is off on this deployment. The sample brief is labelled as a sample.") : "Checking voice…"}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <button className="f-btn" onClick={recording ? rec.stop : rec.start} disabled={busy || !services.elevenlabs}>
            {recording ? `Stop · ${Math.round(rec.seconds)}s` : busy ? "Transcribing…" : "Record voice brief"}
          </button>
          <button className="f-btn is-ghost" onClick={() => { setText(SAMPLE_TRANSCRIPT); setSource("Sample transcript (bundled), not a live transcription") }}>Use sample brief</button>
        </div>
        {note && <p className="f-label" style={{ marginBottom: 12 }}>{note}</p>}
        <textarea className="f-textarea" placeholder="Or type: 12 editorial photos in Vilnius on 21 Nov, budget €5,000…" value={text} onChange={(e) => { setText(e.target.value); setSource("Typed") }} />
        {source && <p className="f-label" style={{ marginTop: 8 }}>{source}</p>}
        {brief && (
          <div className="f-kv" style={{ marginTop: 20 }}>
            <span className="f-label">Where</span><span>{brief.where ?? "Not found"}</span>
            <span className="f-label">Budget</span><span className="f-num">{brief.budget ? eur(brief.budget) : "Not found"}</span>
            <span className="f-label">Date</span><span>{brief.shootDate ?? "Not found"}</span>
            <span className="f-label">Photos</span><span>{brief.photos ?? "Not found"}</span>
            <span className="f-label">Look</span><span>{brief.look.join(", ") || "Not found"}</span>
          </div>
        )}
        <button className="f-btn" style={{ marginTop: 24 }} onClick={apply} disabled={!brief}>Use this brief</button>
      </div>
    </div>
  )
}
