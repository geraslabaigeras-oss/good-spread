import type { Fix, Pending, Receipt } from '@/lib/types';

export function receipt(pending: Pending, chosen: Fix, approvedAt: string | Date): Receipt {
  const others = pending.fixes.filter((f) => f.id !== chosen.id && !f.changesCreative);
  const cheapest = others.length ? Math.min(...others.map((f) => f.costDelta)) : chosen.costDelta;
  const ms = new Date(approvedAt).getTime() - new Date(pending.createdAt).getTime();
  return {
    peopleUpdated: chosen.changes.length,
    messagesTyped: 0,
    overtimeAvoided: Math.round(Math.max(0, cheapest - chosen.costDelta) * 100) / 100,
    fixedInSeconds: Math.max(0, Math.round(ms / 1000)),
  };
}
