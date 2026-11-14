import type { CreativeBrief, Deliverables } from '@/lib/types';

/** Demo brief used when no reference is uploaded or AI is unavailable. Fictional, labelled demo. */
export const DEMO_BRIEF: CreativeBrief = {
  title: 'Jacket campaign (demo)',
  brand: 'Vėtra outerwear (demo brand)',
  garment: 'Field jacket',
  summary: 'Quiet, utilitarian outerwear shot like a documentary still: one garment, four colourways, real movement.',
  aesthetic: ['Editorial', 'Utilitarian', 'Documentary'],
  palette: ['Olive', 'Sand', 'Black', 'Navy', 'Concrete grey'],
  paletteHex: ['#5b5a3c', '#c9b99a', '#141414', '#1f2a3d', '#9a9893'],
  lighting: 'Soft directional key, hard rim; overcast feel',
  setting: 'studio',
  settingNote: 'Neutral backdrop or raw concrete; nothing that competes with the jacket',
  styling: 'Jacket over knit and wide trousers; boots; no logos',
  casting: 'Two models, editorial, natural movement',
  shotList: ['Full-length walking', 'Three-quarter, collar up', 'Detail: pockets and hardware', 'Back view, hood down', 'Motion: 6 s walk-through'],
  source: 'demo',
};

export const DEMO_DELIVERABLES: Deliverables = {
  stills: 12,
  motion: 2,
  usageMonths: 12,
  usage: 'web + social',
  deadlineISO: '2026-11-28',
};

export const DEMO_CAP = 5000;
export const DEMO_START = '2026-11-14';
