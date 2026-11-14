"use client"
import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { SHOOT, SLIDERS } from "@/lib/flow/scenario"

interface FlowState {
  city: string
  heroBudget: number
  budget: number
  delay: number
  pulse: number
  setCity: (v: string) => void
  setHeroBudget: (v: number) => void
  setBudget: (v: number) => void
  setDelay: (v: number) => void
}

const Ctx = createContext<FlowState | null>(null)

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [city, setCity] = useState(SHOOT.city)
  const [heroBudget, setHeroBudget] = useState(SLIDERS.heroBudget.initial)
  const [budget, setB] = useState(SLIDERS.budget.initial)
  const [delay, setD] = useState(SLIDERS.delay.initial)
  const [pulse, setPulse] = useState(0)
  const setBudget = useCallback((v: number) => { setB(v); setPulse((p) => p + 1) }, [])
  const setDelay = useCallback((v: number) => { setD(v); setPulse((p) => p + 1) }, [])
  const value = useMemo(() => ({ city, heroBudget, budget, delay, pulse, setCity, setHeroBudget, setBudget, setDelay }), [city, heroBudget, budget, delay, pulse, setBudget, setDelay])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useFlow() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useFlow outside FlowProvider")
  return c
}
