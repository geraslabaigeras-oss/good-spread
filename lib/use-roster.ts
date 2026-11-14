'use client';

import useSWR from 'swr';
import { setRoster } from '@/data/catalog';
import { toCatalog, type RosterPerson } from '@/lib/roster';

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then((r) => r.json());
let loadedKey = '';

/** The producer's real people, loaded into the planning pool before anything is built. */
export function useRoster() {
  const { data, mutate, isLoading } = useSWR<{ people: RosterPerson[] }>('/api/people', fetcher);
  const people = data?.people ?? [];
  const key = people.map((p) => p.id + p.dayRate + p.city + p.role).join('|');
  if (data && key !== loadedKey) {
    setRoster(people.map(toCatalog));
    loadedKey = key;
  }
  return { people, ready: !!data, loading: isLoading, key, mutate };
}
