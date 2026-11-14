/** Plain-code match between "what we'll look for" and a person's analysed look. No AI here. */
const STOP = new Set(['and', 'the', 'with', 'for', 'look', 'style', 'light', 'shot', 'very', 'from', 'into', 'that']);
export function lookMatch(need: string | undefined, words: string[] | undefined): { score: number; hits: string[] } {
  if (!need || !words?.length) return { score: 0, hits: [] };
  const want = need.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
  const have = new Set(words);
  const hits = [...new Set(want.filter((w) => have.has(w) || [...have].some((h) => h.startsWith(w.slice(0, 5)) && w.length > 5)))];
  return { score: hits.length, hits };
}
