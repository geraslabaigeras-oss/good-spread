import { readBrief } from '@/lib/ai/brief';
import { fail, handle, ok } from '@/lib/server/http';

export const maxDuration = 60;

const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
const MAX = 4 * 1024 * 1024;

/** Reference image(s) + title/brand → creative brief. AI reads; nothing is decided here. */
export async function POST(req: Request) {
  return handle(async () => {
    const form = await req.formData().catch(() => null);
    if (!form) return fail(400, 'invalid_form');
    const title = String(form.get('title') ?? '').slice(0, 120) || 'Untitled campaign';
    const brand = String(form.get('brand') ?? '').slice(0, 120) || 'Brand (demo)';
    const notes = String(form.get('notes') ?? '').slice(0, 1000);
    const images: { bytes: Buffer; mediaType: (typeof TYPES)[number] }[] = [];
    for (const f of form.getAll('image').slice(0, 3)) {
      if (!(f instanceof File)) continue;
      if (f.size > MAX) return fail(413, 'image_too_large');
      if (!(TYPES as readonly string[]).includes(f.type)) return fail(415, 'unsupported_image', { type: f.type });
      images.push({ bytes: Buffer.from(await f.arrayBuffer()), mediaType: f.type as (typeof TYPES)[number] });
    }
    const r = await readBrief({ images, title, brand, notes });
    return ok(r);
  });
}
