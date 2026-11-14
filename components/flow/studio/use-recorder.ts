"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const MAX_SECONDS = 90

export type RecorderState = "idle" | "requesting" | "recording" | "denied" | "unsupported"

export function useRecorder(onDone: (blob: Blob, seconds: number) => void) {
  const [state, setState] = useState<RecorderState>("idle")
  const [seconds, setSeconds] = useState(0)
  const [level, setLevel] = useState(0)
  const rec = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const stream = useRef<MediaStream | null>(null)
  const raf = useRef(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAt = useRef(0)
  const ctx = useRef<AudioContext | null>(null)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  const cleanup = useCallback(() => {
    cancelAnimationFrame(raf.current)
    if (timer.current) clearInterval(timer.current)
    stream.current?.getTracks().forEach((t) => t.stop())
    ctx.current?.close().catch(() => {})
    ctx.current = null
  }, [])

  useEffect(() => cleanup, [cleanup])

  const stop = useCallback(() => {
    if (rec.current && rec.current.state !== "inactive") rec.current.stop()
  }, [])

  const start = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("unsupported")
      return
    }
    setState("requesting")
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      stream.current = s
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m))
      const r = new MediaRecorder(s, mime ? { mimeType: mime } : undefined)
      chunks.current = []
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
      r.onstop = () => {
        const secs = (performance.now() - startedAt.current) / 1000
        cleanup()
        setState("idle")
        setLevel(0)
        doneRef.current(new Blob(chunks.current, { type: r.mimeType || "audio/webm" }), secs)
      }
      rec.current = r

      const audioCtx = new AudioContext()
      ctx.current = audioCtx
      const src = audioCtx.createMediaStreamSource(s)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      src.connect(analyser)
      const data = new Uint8Array(analyser.frequencyBinCount)
      const loop = () => {
        analyser.getByteTimeDomainData(data)
        let peak = 0
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128))
        setLevel(Math.min(1, peak / 60))
        raf.current = requestAnimationFrame(loop)
      }
      loop()

      startedAt.current = performance.now()
      setSeconds(0)
      timer.current = setInterval(() => {
        const secs = (performance.now() - startedAt.current) / 1000
        setSeconds(secs)
        if (secs >= MAX_SECONDS) stop()
      }, 200)
      r.start(250)
      setState("recording")
    } catch {
      cleanup()
      setState("denied")
    }
  }, [cleanup, stop])

  return { state, seconds, level, start, stop, maxSeconds: MAX_SECONDS }
}
