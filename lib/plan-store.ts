'use client';

import { useEffect, useState } from 'react';
import type { CreativeBrief, Deliverables, Picks, StrategyId } from '@/lib/types';
import { DEMO_CAP, DEMO_DELIVERABLES } from '@/data/demo';

/** Pre-production draft, kept in the browser between /new → /plan → /plan/assemble. */
export type PlanDraft = {
  title: string;
  brand: string;
  cap: number;
  startISO: string;
  deliverables: Deliverables;
  brief: CreativeBrief | null;
  briefVia?: string;
  refImages: string[]; // small data URLs for display only
  dnaPreserve: Record<string, boolean>;
  strategy?: StrategyId;
  picks?: Picks;
};

const KEY = 'gs-plan-draft';

export function todayISO() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Vilnius' });
}

export const emptyDraft = (): PlanDraft => ({
  title: 'Jacket campaign (demo)',
  brand: 'Vėtra outerwear (demo brand)',
  cap: DEMO_CAP,
  startISO: todayISO(),
  deliverables: { ...DEMO_DELIVERABLES },
  brief: null,
  refImages: [],
  dnaPreserve: {},
});

export function loadDraft(): PlanDraft {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return { ...emptyDraft(), ...JSON.parse(raw) };
  } catch {}
  return emptyDraft();
}

export function saveDraft(d: PlanDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // images too big for storage: keep the draft without them
    try { sessionStorage.setItem(KEY, JSON.stringify({ ...d, refImages: [] })); } catch {}
  }
}

export function useDraft(): [PlanDraft | null, (d: PlanDraft) => void] {
  const [d, setD] = useState<PlanDraft | null>(null);
  useEffect(() => setD(loadDraft()), []);
  return [d, (next: PlanDraft) => { setD(next); saveDraft(next); }];
}

/** Shrink an image file to a small JPEG data URL for display. */
export async function thumb(file: File, max = 640): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}
