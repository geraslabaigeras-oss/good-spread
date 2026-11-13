import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Change, Production, Receipt } from '@/lib/types';
import { makeSeed } from '@/data/seed';

let client: SupabaseClient | null = null;

/** Service-role client. Server only — never import from client components. */
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

function must<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

export type ProdRow = { id: string; slug: string; data: Production; version: number };

export async function getProduction(slug: string): Promise<ProdRow | null> {
  const r = await db().from('productions').select('id, slug, data, version').eq('slug', slug).maybeSingle();
  return must(r) as ProdRow | null;
}

export async function getProductionById(id: string): Promise<ProdRow | null> {
  const r = await db().from('productions').select('id, slug, data, version').eq('id', id).maybeSingle();
  return must(r) as ProdRow | null;
}

/** Fetch, seeding the demo production on first use. */
export async function getOrSeed(slug: string): Promise<ProdRow | null> {
  const row = await getProduction(slug);
  if (row || slug !== 'jacket-campaign') return row;
  await resetProduction(slug, true);
  return getProduction(slug);
}

export async function saveProduction(id: string, data: Production): Promise<void> {
  must(await db().from('productions').update({ data, version: data.version, updated_at: new Date().toISOString() }).eq('id', id));
}

export async function logEvent(productionId: string, type: string, payload: Record<string, unknown> = {}) {
  must(await db().from('events').insert({ production_id: productionId, type, payload }));
}

export async function recentEvents(productionId: string, limit = 20) {
  return must(
    await db().from('events').select('id, type, payload, created_at').eq('production_id', productionId).order('id', { ascending: false }).limit(limit),
  ) as { id: number; type: string; payload: Record<string, unknown>; created_at: string }[];
}

export type RevisionRow = { id: number; version: number; fix_kind: string | null; changes: Change[]; receipt: (Receipt & { label?: string }) | null; created_at: string };

export async function insertRevision(productionId: string, version: number, fixKind: string, changes: Change[], receipt: Receipt & { label?: string }) {
  must(await db().from('revisions').insert({ production_id: productionId, version, fix_kind: fixKind, changes, receipt }));
}

export async function revisions(productionId: string, limit = 20): Promise<RevisionRow[]> {
  return must(
    await db().from('revisions').select('id, version, fix_kind, changes, receipt, created_at').eq('production_id', productionId).order('version', { ascending: false }).limit(limit),
  ) as RevisionRow[];
}

export type ViewerRow = { id: string; production_id: string; person_id: string; token: string; phone: string | null; created_at: string };

export async function createViewer(productionId: string, personId: string, token: string, phone: string | null): Promise<ViewerRow> {
  return must(
    await db().from('viewers').insert({ production_id: productionId, person_id: personId, token, phone }).select('*').single(),
  ) as ViewerRow;
}

export async function viewerByToken(token: string): Promise<ViewerRow | null> {
  return must(await db().from('viewers').select('*').eq('token', token).maybeSingle()) as ViewerRow | null;
}

export async function viewersFor(productionId: string): Promise<ViewerRow[]> {
  return must(await db().from('viewers').select('*').eq('production_id', productionId)) as ViewerRow[];
}

export async function ackedViewerIds(viewerIds: string[], version: number): Promise<Set<string>> {
  if (!viewerIds.length) return new Set();
  const rows = must(await db().from('acks').select('viewer_id').eq('version', version).in('viewer_id', viewerIds)) as { viewer_id: string }[];
  return new Set(rows.map((r) => r.viewer_id));
}

export async function ack(viewerId: string, version: number) {
  must(await db().from('acks').upsert({ viewer_id: viewerId, version }, { onConflict: 'viewer_id,version', ignoreDuplicates: true }));
}

export async function cachedExtraction(sha: string) {
  const r = must(await db().from('extractions').select('result').eq('sha256', sha).maybeSingle()) as { result: unknown } | null;
  return r?.result ?? null;
}

export async function cacheExtraction(sha: string, result: unknown) {
  must(await db().from('extractions').upsert({ sha256: sha, result }));
}

/** Restore the seed; clear events/revisions/acks/pending. `full` also deletes viewers (and their phone numbers). */
export async function resetProduction(slug: string, full: boolean): Promise<string> {
  const seed = makeSeed();
  const existing = await getProduction(slug);
  let id: string;
  if (existing) {
    id = existing.id;
    seed.id = id;
    must(await db().from('productions').update({ data: seed, version: seed.version, updated_at: new Date().toISOString() }).eq('id', id));
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
  await logEvent(id, 'reset', { full });
  return id;
}
