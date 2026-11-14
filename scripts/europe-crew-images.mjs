// Local only: for each crew member in private/europe, read their own agency/portfolio page (via our safe preview route) and keep the first images.
import fs from 'node:fs';
const files = ['photographers', 'mua', 'stylists'];
const out = {};
const all = files.flatMap((f) => JSON.parse(fs.readFileSync(`private/europe/${f}.json`, 'utf8')));
const queue = [...all];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const p = queue.shift();
    try {
      const r = await fetch('http://localhost:3000/api/people/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: p.url }), signal: AbortSignal.timeout(25000) });
      const j = await r.json();
      out[p.id] = r.ok ? [j.image, ...(j.images ?? [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).slice(0, 6) : [];
    } catch { out[p.id] = []; }
    process.stdout.write(out[p.id].length ? '+' : '.');
  }
}));
fs.writeFileSync('private/europe/images.json', JSON.stringify(out, null, 1));
console.log('\nwith images:', Object.values(out).filter((v) => v.length).length, 'of', all.length);
