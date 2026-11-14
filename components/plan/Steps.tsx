import Link from 'next/link';

const STEPS = [
  { n: 1, label: 'Brief', href: '/new' },
  { n: 2, label: 'Strategies', href: '/plan' },
  { n: 3, label: 'Assemble', href: '/plan/assemble' },
  { n: 4, label: 'Production', href: '/board/jacket-campaign' },
];

export function Steps({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline pb-3">
      <span className="font-mono text-[12px] font-medium uppercase tracking-[0.14em]">Good Spread</span>
      <nav className="flex gap-5 text-[13px]">
        {STEPS.map((s) => (
          <Link key={s.n} href={s.href} className={s.n === step ? 'font-medium text-ink' : 'text-grey-1 hover:text-ink'}>
            {s.n} · {s.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
