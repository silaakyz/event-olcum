'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/survey-builder', label: 'Survey Builder' },
  { href: '/surveys', label: 'Surveys' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-5">
      <div className="mb-8 flex items-center gap-2 px-3">
        <span className="grid size-7 place-items-center rounded-md bg-foreground text-xs font-bold text-background">EA</span>
        <span className="text-sm font-semibold tracking-tight">Event Analytics</span>
      </div>
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
      <nav className="space-y-1">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return <Link key={link.href} href={link.href} className={`block rounded-md px-3 py-2 text-sm transition-colors ${active ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'}`}>{link.label}</Link>;
        })}
      </nav>
      <div className="mt-auto border-t border-border px-3 pt-4 text-xs text-muted-foreground">Local workspace</div>
    </aside>
  );
}
