/** Plain-code match between "what we'll look for" and a person's analysed look. No AI here. */
const STOP = new Set(['and', 'the', 'with', 'for', 'look', 'style', 'light', 'shot', 'very', 'from', 'into', 'that', 'hair', 'model', 'models', 'face', 'skin', 'eyes']);
const MEN = ['male', 'man', 'men', 'masculine', 'menswear', 'boy'];
const WOMEN = ['female', 'woman', 'women', 'feminine', 'womenswear', 'girl'];
export function lookMatch(need: string | undefined, words: string[] | undefined): { score: number; hits: string[] } {
  if (!need || !words?.length) return { score: 0, hits: [] };
  const want = need.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
  const have = new Set(words);
  // a brief that asks for men (or women) rules the other board out; plain code, no guessing
  const wantsMen = want.some((w) => MEN.includes(w)), wantsWomen = want.some((w) => WOMEN.includes(w));
  if ((wantsMen && !wantsWomen && have.has('feminine')) || (wantsWomen && !wantsMen && have.has('masculine'))) return { score: -1, hits: [] };
  const hits = [...new Set(want.filter((w) => have.has(w) || [...have].some((h) => h.startsWith(w.slice(0, 4)) && w.length >= 5 && h.length >= 5)))];
  return { score: hits.length, hits };
}
