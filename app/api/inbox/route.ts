import { extract, type InboxInput } from '@/lib/ai/extract';
import { getOrSeed, logEvent } from '@/lib/server/db';
import { DEMO_SLUG, fail, handle, ok, slugSchema } from '@/lib/server/http';
import { describeUpdate } from '@/lib/server/actions';
import { firstName, toUpdate } from '@/lib/engine';

export const maxDuration = 30;

const MAX_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;

/** Read the messy input. Returns the extraction card; does NOT apply anything. */
export async function POST(req: Request) {
  return handle(async () => {
    let input: InboxInput;
    let slug = DEMO_SLUG;
    const ct = req.headers.get('content-type') ?? '';
    if (ct.includes('multipart/form-data')) {
      const form = await req.formData();
      const s = form.get('slug');
      if (typeof s === 'string' && slugSchema.safeParse(s).success) slug = s;
      const file = form.get('file');
      const text = form.get('text');
      if (file instanceof File) {
        if (file.size > MAX_BYTES) return fail(413, 'file_too_large');
        const bytes = Buffer.from(await file.arrayBuffer());
        const type = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : '');
        if (type === 'application/pdf') input = { kind: 'pdf', name: file.name, bytes };
        else if ((IMAGE_TYPES as readonly string[]).includes(type)) input = { kind: 'image', name: file.name, bytes, mediaType: type as (typeof IMAGE_TYPES)[number] };
        else return fail(415, 'unsupported_file', { type });
      } else if (typeof text === 'string' && text.trim()) {
        input = { kind: 'text', name: 'pasted text', text: text.slice(0, 5000) };
      } else return fail(400, 'no_input');
    } else {
      const body = (await req.json().catch(() => null)) as { text?: unknown; slug?: unknown } | null;
      if (!body || typeof body.text !== 'string' || !body.text.trim()) return fail(400, 'no_input');
      if (typeof body.slug === 'string' && slugSchema.safeParse(body.slug).success) slug = body.slug;
      input = { kind: 'text', name: 'pasted text', text: body.text.slice(0, 5000) };
    }

    const row = await getOrSeed(slug);
    if (!row) return fail(404, 'not_found');
    const p = row.data;
    const names = p.people.filter((x) => x.role !== 'producer').map((x) => firstName(x.name));
    const started = Date.now();
    const r = await extract(input, names);
    const update = toUpdate(p, r.extraction, input.name);
    const description = update ? describeUpdate(p, update) : null;

    await logEvent(row.id, 'inbox_read', {
      text: `Read ${input.name}${r.via === 'cache' ? ' (cached)' : ''}`,
      via: r.via,
      ms: Date.now() - started,
      ...(r.error ? { error: r.error } : {}),
    });

    return ok({
      inboxId: r.sha256,
      source: input.name,
      via: r.via,
      ms: Date.now() - started,
      extraction: r.extraction,
      update,
      description,
      needsManual: !update,
      people: p.people.filter((x) => x.role !== 'producer').map((x) => ({ id: x.id, name: x.name })),
    });
  });
}
