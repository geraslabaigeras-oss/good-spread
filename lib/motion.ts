import { useEffect, useState } from "react";
import { animate, useReducedMotion, type Transition, type Variants } from "motion/react";

type Bezier = [number, number, number, number];

export const EASE = {
  standard: [0.4, 0, 0.2, 1] as Bezier, // Cosmos reveal curve
  out: [0.2, 0.8, 0.2, 1] as Bezier,    // entrances
  in: [0.4, 0, 1, 1] as Bezier,         // exits
};

export const MS = {
  reveal: 900,
  stagger: 180,
  fast: 160,
  highlightHold: 300,
  highlightFade: 1200, // hold + fade = 1.5 s
  typeChar: 18,
  typeFieldGap: 120,
  readingFake: 2500,
};

/* ---------- transitions ---------- */
export const tReveal: Transition = { duration: 0.9, ease: EASE.standard };
export const tFast: Transition = { duration: 0.16, ease: EASE.standard };
export const tPress: Transition = { type: "spring", stiffness: 700, damping: 40, mass: 1 };
export const tLayout: Transition = { type: "spring", stiffness: 260, damping: 32, mass: 1 };
export const tSheet: Transition = { type: "spring", stiffness: 420, damping: 40, mass: 1 };
export const tDot: Transition = { type: "spring", stiffness: 500, damping: 30, mass: 1 };
export const tHighlight: Transition = { duration: 1.5, times: [0, 0.2, 1], ease: "linear" };

/** Approve hero sequence offsets (ms from successful approve) */
export const APPROVE = {
  ripple: 700,
  rippleHold: 400,
  othersFade: 240,
  slotSwap: 250,
  stripStart: 400,
  stripStagger: 90,
  receiptStart: 600,
  metricStagger: 120,
  countUp: 900,
} as const;

/* ---------- variants ---------- */
export const revealParent: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: MS.stagger / 1000, delayChildren: 0.05 } },
};
export const revealItem: Variants = {
  hidden: { opacity: 0, filter: "blur(15px)" },
  shown: { opacity: 1, filter: "blur(0px)", transition: tReveal },
};
// Reduced-motion versions
export const revealParentReduced: Variants = { hidden: {}, shown: {} };
export const revealItemReduced: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.12 } },
};
export function useReveal() {
  const reduce = useReducedMotion();
  return reduce
    ? { parent: revealParentReduced, item: revealItemReduced }
    : { parent: revealParent, item: revealItem };
}

export const extractionCard: Variants = {
  hidden: { opacity: 0, y: 8 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE.out } },
};

export const conflictLine: Variants = {
  hidden: { opacity: 0, x: -8 },
  shown: { opacity: 1, x: 0, transition: { duration: 0.32, ease: EASE.out } },
};
export const conflictBar: Variants = {
  hidden: { scaleY: 0, originY: 0 },
  shown: { scaleY: 1, originY: 0, transition: { duration: 0.24, ease: EASE.out, delay: 0.08 } },
};

export const fixList: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: MS.stagger / 1000, delayChildren: 0.2 } },
};
export const fixCard: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.52, ease: EASE.standard } },
  dismissed: { opacity: 0, transition: { duration: APPROVE.othersFade / 1000, ease: EASE.in } },
};

/** Ripple disc inside the chosen fix card. Render with diameter = 2 * card diagonal, centred on pointer. */
export const ripple: Variants = {
  idle: { scale: 0, opacity: 0 },
  go: {
    scale: 1,
    opacity: [0.16, 0.16, 0],
    transition: {
      scale: { duration: APPROVE.ripple / 1000, ease: EASE.out },
      opacity: { duration: APPROVE.ripple / 1000, times: [0, APPROVE.rippleHold / APPROVE.ripple, 1], ease: "linear" },
    },
  },
};

/** Highlight overlay (fill or ring). Mount it keyed by version so it plays once per change. */
export const highlight: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: [1, 1, 0], transition: tHighlight },
};
export const highlightReduced: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: [1, 1, 0], transition: { duration: 1.7, times: [0, 0.88, 1], ease: "linear" } },
};

export const chipFlip: Variants = {
  initial: { rotateX: -90, opacity: 0 },
  animate: { rotateX: 0, opacity: 1, transition: { duration: 0.18, ease: EASE.out } },
  exit: { rotateX: 90, opacity: 0, transition: { duration: 0.14, ease: EASE.in } },
};
export const chipFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

/* My-day call-time change */
export const strikeLine: Variants = {
  initial: { scaleX: 0, originX: 0 },
  animate: { scaleX: 1, originX: 0, transition: { duration: 0.36, ease: EASE.out } },
};
export const timeOut: Variants = {
  exit: { y: "-30%", opacity: 0, transition: { duration: 0.24, ease: EASE.in } },
};
export const timeIn: Variants = {
  initial: { y: "40%", opacity: 0, filter: "blur(8px)" },
  animate: { y: 0, opacity: 1, filter: "blur(0px)", transition: { duration: 0.52, ease: EASE.out } },
};
export const oldTimeSmall: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: EASE.standard } },
};
export const CALL_CHANGE = { strikeMs: 360, vibrateMs: 200 } as const;

export const badgePop: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: EASE.out } },
  exit: { opacity: 0, transition: { duration: 0.16 } },
};

export const sheet: Variants = {
  initial: { y: "100%" },
  animate: { y: 0, transition: tSheet },
  exit: { y: "100%", transition: { duration: 0.22, ease: EASE.in } },
};
export const scrim: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: "linear" } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: "linear" } },
};

export const qrPanel: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.24, ease: EASE.standard } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: EASE.in } },
};

export const logRow: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 28, opacity: 1, transition: { duration: 0.24, ease: EASE.out } },
};

export const toast: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE.out } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.16, ease: EASE.in } },
};

export const press = { whileTap: { scale: 0.97 }, transition: tPress } as const;

/* ---------- hooks ---------- */

/** Count from 0 (or `from`) to `value` when `value` or `key` changes. Returns the live number. */
export function useCountUp(value: number, { delayMs = 0, from = 0, key }: { delayMs?: number; from?: number; key?: unknown } = {}) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : from);
  useEffect(() => {
    if (reduce) { setN(value); return; }
    setN(from);
    const c = animate(from, value, { duration: APPROVE.countUp / 1000, ease: EASE.out, delay: delayMs / 1000, onUpdate: setN });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, key, reduce]);
  return n;
}

/** Type a string in at MS.typeChar per character after `delayMs`. Returns [visibleText, done]. */
export function useTypeIn(text: string, delayMs = 0): [string, boolean] {
  const reduce = useReducedMotion();
  const [i, setI] = useState(reduce ? text.length : 0);
  useEffect(() => {
    if (reduce) { setI(text.length); return; }
    setI(0);
    let t: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      t = setInterval(() => setI((x) => (x >= text.length ? (clearInterval(t), x) : x + 1)), MS.typeChar);
    }, delayMs);
    return () => { clearTimeout(start); if (t) clearInterval(t); };
  }, [text, delayMs, reduce]);
  return [text.slice(0, i), i >= text.length];
}
