'use client';
import * as React from 'react';
import { CustomerSidebar } from '@/components/customer/CustomerSidebar';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Home, Calendar, ShoppingBag, User, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/auth/me')
      .then(() => {})
      .catch(() => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
        }
        router.push('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white text-xs uppercase tracking-widest">
        Carregando...
      </div>
    );
  }

  const bottomLinks = [
    { name: 'Início', href: '/', icon: Home, exact: true },
    { name: 'Agendar', href: '/agendamento', icon: Calendar, exact: false },
    { name: 'Loja', href: '/customer/store', icon: ShoppingBag, exact: false },
    { name: 'Academy', href: '/customer/academy', icon: GraduationCap, exact: false },
    { name: 'Perfil', href: '/customer/profile', icon: User, exact: false },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary-foreground selection:text-primary">
      {/* Desktop Sidebar via CustomerSidebar (handles its own mobile drawer + hamburger) */}
      <CustomerSidebar />

      <div className="flex-1 md:ml-0 flex flex-col pb-20 md:pb-0 min-w-0">
        <main className="flex-1 p-4 pt-16 md:pt-4 md:p-10 overflow-x-hidden">
          <div className="max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-card border-t border-border px-2 py-2 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.8)]">
          {bottomLinks.map((link) => {
            const isActive = link.exact ? pathname === link.href : pathname?.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  'flex flex-col items-center justify-center w-full p-2 gap-1 transition-all rounded-lg min-h-[56px]',
                  isActive
                    ? 'text-primary-foreground bg-primary/20 shadow-[0_0_10px_rgba(255,215,0,0.3)] scale-105'
                    : 'text-muted-foreground hover:text-white'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive ? 'text-primary-foreground' : 'opacity-80')} />
                <span className={cn('text-[9px] uppercase font-bold tracking-widest', isActive && 'text-primary-foreground')}>
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}