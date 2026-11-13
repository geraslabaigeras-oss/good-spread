import { Board } from '@/components/board/Board';

export const dynamic = 'force-dynamic';

export default async function BoardPage({ params }: PageProps<'/board/[slug]'>) {
  const { slug } = await params;
  return <Board slug={slug} />;
}
