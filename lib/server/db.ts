import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Change, Production, Receipt } from '@/lib/types';
import { makeSeed } from '@/data/seed';
import { now, read, tx, uuid } from './local-store';

let client: SupabaseClient | null = null;

const url = () => process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

/** True when Supabase isn't configured: use the local JSON store (local dev only). */
export function isLocal(): boolean {
  if (url() && key()) return false;
  if (process.env.VERCEL) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
  return true;
}

/** Service-role client. Server only — never import from client components. */
export function db(): SupabaseClient {
  if (client) return client;
  if (!url() || !key()) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
  client = createClient(url()!, key()!, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

function must<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

export type ProdRow = { id: string; slug: string; data: Production; version: number };
export type EventRow = { id: number; type: string; payload: Record<string, unknown>; created_at: string };
export type RevisionRow = { id: number; version: number; fix_kind: string | null; changes: Change[]; receipt: (Receipt & { label?: string }) | null; created_at: string };
export type ViewerRow = { id: string; production_id: string; person_id: string; token: string; phone: string | null; created_at: string };

const prodCols = (r: Record<string, unknown>): ProdRow => ({ id: r.id as string, slug: r.slug as string, data: r.data as Production, version: r.version as number });

export async function getProduction(slug: string): Promise<ProdRow | null> {
  if (isLocal()) return read((t) => { const r = t.productions.find((x) => x.slug === slug); return r ? prodCols(r) : null; });
  return must(await db().from('productions').select('id, slug, data, version').eq('slug', slug).maybeSingle()) as ProdRow | null;
}

export async function getProductionById(id: string): Promise<ProdRow | null> {
  if (isLocal()) return read((t) => { const r = t.productions.find((x) => x.id === id); return r ? prodCols(r) : null; });
  return must(await db().from('productions').select('id, slug, data, version').eq('id', id).maybeSingle()) as ProdRow | null;
}

/** Fetch, seeding the demo production on first use. */
export async function getOrSeed(slug: string): Promise<ProdRow | null> {
  const row = await getProduction(slug);
  if (row || slug !== 'jacket-campaign') return row;
  await resetProduction(slug, true);
  return getProduction(slug);
}

export async function saveProduction(id: string, data: Production): Promise<void> {
  if (isLocal()) {
    tx((t) => { const r = t.productions.find((x) => x.id === id); if (r) Object.assign(r, { data, version: data.version, updated_at: now() }); });
    return;
  }
  must(await db().from('productions').update({ data, version: data.version, updated_at: now() }).eq('id', id));
}

export async function logEvent(productionId: string, type: string, payload: Record<string, unknown> = {}) {
  if (isLocal()) {
    tx((t) => { t.events.push({ id: t.seq++, production_id: productionId, type, payload, created_at: now() }); });
    return;
  }
  must(await db().from('events').insert({ production_id: productionId, type, payload }));
}

export async function recentEvents(productionId: string, limit = 20): Promise<EventRow[]> {
  if (isLocal()) {
    return read((t) => t.events.filter((e) => e.production_id === productionId).sort((a, b) => (b.id as number) - (a.id as number)).slice(0, limit) as unknown as EventRow[]);
  }
  return must(
    await db().from('events').select('id, type, payload, created_at').eq('production_id', productionId).order('id', { ascending: false }).limit(limit),
  ) as EventRow[];
}

export async function insertRevision(productionId: string, version: number, fixKind: string, changes: Change[], receipt: Receipt & { label?: string }) {
  if (isLocal()) {
    tx((t) => { t.revisions.push({ id: t.seq++, production_id: productionId, version, fix_kind: fixKind, changes, receipt, created_at: now() }); });
    return;
  }
  must(await db().from('revisions').insert({ production_id: productionId, version, fix_kind: fixKind, changes, receipt }));
}

export async function revisions(productionId: string, limit = 20): Promise<RevisionRow[]> {
  if (isLocal()) {
    return read((t) => t.revisions.filter((r) => r.production_id === productionId).sort((a, b) => (b.version as number) - (a.version as number)).slice(0, limit) as unknown as RevisionRow[]);
  }
  return must(
    await db().from('revisions').select('id, version, fix_kind, changes, receipt, created_at').eq('production_id', productionId).order('version', { ascending: false }).limit(limit),
  ) as RevisionRow[];
}

export async function createViewer(productionId: string, personId: string, token: string, phone: string | null): Promise<ViewerRow> {
  if (isLocal()) {
    return tx((t) => { const v = { id: uuid(), production_id: productionId, person_id: personId, token, phone, created_at: now() }; t.viewers.push(v); return v; });
  }
  return must(
    await db().from('viewers').insert({ production_id: productionId, person_id: personId, token, phone }).select('*').single(),
  ) as ViewerRow;
}

export async function viewerByToken(token: string): Promise<ViewerRow | null> {
  if (isLocal()) return read((t) => (t.viewers.find((v) => v.token === token) as ViewerRow | undefined) ?? null);
  return must(await db().from('viewers').select('*').eq('token', token).maybeSingle()) as ViewerRow | null;
}

export async function viewersFor(productionId: string): Promise<ViewerRow[]> {
  if (isLocal()) return read((t) => t.viewers.filter((v) => v.production_id === productionId) as unknown as ViewerRow[]);
  return must(await db().from('viewers').select('*').eq('production_id', productionId)) as ViewerRow[];
}

export async function ackedViewerIds(viewerIds: string[], version: number): Promise<Set<string>> {
  if (!viewerIds.length) return new Set();
  if (isLocal()) return new Set(read((t) => t.acks.filter((a) => a.version === version && viewerIds.includes(a.viewer_id as string)).map((a) => a.viewer_id as string)));
  const rows = must(await db().from('acks').select('viewer_id').eq('version', version).in('viewer_id', viewerIds)) as { viewer_id: string }[];
  return new Set(rows.map((r) => r.viewer_id));
}

export async function ack(viewerId: string, version: number) {
  if (isLocal()) {
    tx((t) => { if (!t.acks.some((a) => a.viewer_id === viewerId && a.version === version)) t.acks.push({ viewer_id: viewerId, version, acked_at: now() }); });
    return;
  }
  must(await db().from('acks').upsert({ viewer_id: viewerId, version }, { onConflict: 'viewer_id,version', ignoreDuplicates: true }));
}

export async function cachedExtraction(sha: string) {
  if (isLocal()) return read((t) => t.extractions.find((e) => e.sha256 === sha)?.result ?? null);
  const r = must(await db().from('extractions').select('result').eq('sha256', sha).maybeSingle()) as { result: unknown } | null;
  return r?.result ?? null;
}

export async function cacheExtraction(sha: string, result: unknown) {
  if (isLocal()) {
    tx((t) => { t.extractions = t.extractions.filter((e) => e.sha256 !== sha).concat({ sha256: sha, result, created_at: now() }); });
    return;
  }
  must(await db().from('extractions').upsert({ sha256: sha, result }));
}

/** Restore the seed; clear events/revisions/acks/pending. `full` also deletes viewers (and their phone numbers). */
export async function resetProduction(slug: string, full: boolean): Promise<string> {
  const seed = makeSeed();
  if (isLocal()) {
    const id = tx((t) => {
      let r = t.productions.find((x) => x.slug === slug);
      if (!r) { r = { id: uuid(), slug }; t.productions.push(r); }
      const id = r.id as string;
      seed.id = id;
      Object.assign(r, { data: seed, version: seed.version, updated_at: now() });
      t.events = t.events.filter((e) => e.production_id !== id);
      t.revisions = t.revisions.filter((e) => e.production_id !== id);
      const vids = new Set(t.viewers.filter((v) => v.production_id === id).map((v) => v.id));
      t.acks = t.acks.filter((a) => !vids.has(a.viewer_id));
      if (full) t.viewers = t.viewers.filter((v) => v.production_id !== id);
      return id;
    });
    await logEvent(id, 'reset', { full, text: full ? 'Full reset: seed restored, devices removed' : 'Reset: seed restored' });
    return id;
  }

  const existing = await getProduction(slug);
  let id: string;
  if (existing) {
    id = existing.id;
    seed.id = id;
    must(await db().from('productions').update({ data: seed, version: seed.version, updated_at: now() }).eq('id', id));
  } else {
    const row = must(await db().from('productions').insert({ slug, data: seed, version: seed.version }).select('id').single()) as { id: string };
    id = row.id;
    seed.id = id;
    must(await db().from('productions').update({ data: seed }).eq('id', id));
  }
  must(await db().from('events').delete().eq('production_id', id));
  must(await db().from('revisions').delete().eq('production_id', id));
  const vs = await viewersFor(id);
  if (vs.length) must(await db().from('acks').delete().in('viewer_id', vs.map((v) => v.id)));
  if (full) must(await db().from('viewers').delete().eq('production_id', id));
  await logEvent(id, 'reset', { full, text: full ? 'Full reset: seed restored, devices removed' : 'Reset: seed restored' });
  return id;
}
