import { z } from 'zod';
import { deletePerson, updatePerson } from '@/lib/server/db';
import { fail, handle, ok, parseJson } from '@/lib/server/http';
import { RosterInput } from '@/lib/roster';
import { setTalentAvailability } from '@/lib/server/talent-book';

const Id = z.string().regex(/^p-[a-z0-9]{8}$/);

export async function PUT(req: Request, ctx: RouteContext<'/api/people/[id]'>) {
  return handle(async () => {
    const { id } = await ctx.params;
    if (/^(tb|eu|sample)-[a-z0-9-]{3,80}$/.test(id)) {
      const body = await parseJson(req, RosterInput.pick({ availability: true, availabilityNote: true }));
      if ('error' in body) return body.error;
      return setTalentAvailability(id, body.data.availability ?? null, body.data.availabilityNote) ? ok({ person: { id } }) : fail(404, 'not_found');
    }
    if (!Id.safeParse(id).success) return fail(400, 'invalid_id');
    const parsed = await parseJson(req, RosterInput);
    if ('error' in parsed) return parsed.error;
    const person = await updatePerson(id, parsed.data);
    return person ? ok({ person }) : fail(404, 'not_found');
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<'/api/people/[id]'>) {
  return handle(async () => {
    const { id } = await ctx.params;
    if (!Id.safeParse(id).success) return fail(400, 'invalid_id');
    await deletePerson(id);
    return ok({ ok: true });
  });
}
