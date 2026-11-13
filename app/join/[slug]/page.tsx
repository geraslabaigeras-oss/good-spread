import { notFound } from 'next/navigation';
import { getOrSeed } from '@/lib/server/db';
import { JoinFlow } from '@/components/talent/JoinFlow';

export const dynamic = 'force-dynamic';

const ROLE: Record<string, string> = { model: 'Model', photographer: 'Photographer', mua: 'Hair & makeup', stylist: 'Stylist' };

export default async function JoinPage({ params }: PageProps<'/join/[slug]'>) {
  const { slug } = await params;
  const row = await getOrSeed(slug);
  if (!row) notFound();
  const p = row.data;
  const people = p.people
    .filter((x) => x.role !== 'producer')
    .map((x) => ({ id: x.id, name: x.name, role: ROLE[x.role] ?? x.role, isModel: x.role === 'model' }));
  return <JoinFlow slug={slug} title={p.title} dateISO={p.dateISO} people={people} />;
}
