import { MyDay } from '@/components/talent/MyDay';

export const dynamic = 'force-dynamic';

export default async function MyDayPage({ params }: PageProps<'/p/[token]'>) {
  const { token } = await params;
  return <MyDay token={token} />;
}
