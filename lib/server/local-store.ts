import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * Local-dev fallback used ONLY when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing.
 * Same tables as supabase/schema.sql, kept in one JSON file so it survives dev reloads.
 * Not for Vercel (each instance would have its own copy).
 */
type Row = Record<string, unknown>;
type Tables = { productions: Row[]; events: Row[]; revisions: Row[]; viewers: Row[]; acks: Row[]; extractions: Row[]; seq: number };

const FILE = path.join(process.cwd(), '.data', 'local-db.json');

function load(): Tables {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8')) as Tables;
  } catch {
    return { productions: [], events: [], revisions: [], viewers: [], acks: [], extractions: [], seq: 1 };
  }
}

function save(t: Tables) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(t));
  fs.renameSync(tmp, FILE);
}

/** Read-modify-write the whole store synchronously (single dev process, so no interleaving). */
export function tx<T>(fn: (t: Tables) => T): T {
  const t = load();
  const out = fn(t);
  save(t);
  return structuredClone(out);
}

export function read<T>(fn: (t: Tables) => T): T {
  return structuredClone(fn(load()));
}

export const now = () => new Date().toISOString();
export const uuid = () => randomUUID();
