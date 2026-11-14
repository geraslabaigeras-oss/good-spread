import { addPerson, listPeople } from '@/lib/server/db';
import { handle, ok, parseJson } from '@/lib/server/http';
import { RosterInput } from '@/lib/roster';
import { talentBookPeople } from '@/lib/server/talent-book';

export async function GET() {
  return handle(async () => ok({ people: [...(await listPeople()), ...talentBookPeople()] }));
}

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseJson(req, RosterInput);
    if ('error' in parsed) return parsed.error;
    return ok({ person: await addPerson(parsed.data) });
  });
}
