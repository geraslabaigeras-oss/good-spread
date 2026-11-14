import 'server-only';
import { setRoster } from '@/data/catalog';
import { toCatalog } from '@/lib/roster';
import { listPeople } from './db';

/** Load the producer's real people into the planning pool for this request. */
export async function loadRoster() {
  const people = await listPeople();
  setRoster(people.map(toCatalog));
  return people;
}
