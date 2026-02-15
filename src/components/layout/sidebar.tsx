'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Tags,
  Wallet,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Transactions', href: '/transactions', icon: Receipt },
  { label: 'Categories', href: '/categories', icon: Tags },
  { label: 'Budgets', href: '/budgets', icon: Wallet },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <aside className="relative hidden w-60 shrink-0 border-r border-border/50 bg-sidebar lg:block">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/" className="font-display text-2xl tracking-[-0.03em] text-foreground">
          Aura
        </Link>
      </div>

      {/* Nav */}
      <nav className="mt-4 space-y-0.5 px-3">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Aurora edge — signature gradient border on right side */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-px opacity-30"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, hsl(165 100% 42%) 30%, hsl(195 100% 50%) 70%, transparent 100%)',
        }}
      />
    </aside>
  );
}
