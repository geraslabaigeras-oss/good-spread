import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const DEMO_SLUG = 'jacket-campaign';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { ...init, headers: { 'Cache-Control': 'no-store', ...(init?.headers ?? {}) } });
}

export function fail(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function parseJson<T extends z.ZodType>(req: Request, schema: T): Promise<{ data: z.infer<T> } | { error: Response }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: fail(400, 'invalid_json') };
  }
  const r = schema.safeParse(body);
  if (!r.success) return { error: fail(400, 'invalid_input', { issues: r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) }) };
  return { data: r.data };
}

export function handle(fn: () => Promise<Response>): Promise<Response> {
  return fn().catch((e: unknown) => {
    console.error(e);
    return fail(500, e instanceof Error ? e.message : 'server_error');
  });
}

export const slugSchema = z.string().regex(/^[a-z0-9-]{1,64}$/);
export const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{6,64}$/);
