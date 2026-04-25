'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { href: '/', icon: Home, label: '홈' },
  { href: '/calendar', icon: Calendar, label: '캘린더' },
  { href: '/stats', icon: BarChart3, label: '통계' },
  { href: '/profile', icon: User, label: '내 정보' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-8 pointer-events-none">
      <div className="mx-auto max-w-lg flex justify-center px-4">
        {/* Main Navigation - Pill Style like SETLOG */}
        <nav className="bg-white rounded-full shadow-lg border border-border/30 pointer-events-auto">
          <ul className="flex items-center py-1.5 px-1.5">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              const isHome = pathname === '/' && item.href === '/';
              const active = isActive || isHome;
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1.5 py-2.5 px-4 rounded-full transition-all text-sm font-medium',
                      active
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
