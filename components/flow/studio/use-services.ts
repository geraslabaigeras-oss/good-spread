"use client"

import { useEffect, useState } from "react"

export interface Services {
  elevenlabs: boolean
  llm: string | null
  loaded: boolean
}

let cache: Services | null = null

export function useServices(): Services {
  const [s, setS] = useState<Services>(cache ?? { elevenlabs: false, llm: null, loaded: false })
  useEffect(() => {
    if (cache) return
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => {
        cache = { elevenlabs: !!d.elevenlabs, llm: d.llm ?? null, loaded: true }
        setS(cache)
      })
      .catch(() => setS({ elevenlabs: false, llm: null, loaded: true }))
  }, [])
  return s
}
