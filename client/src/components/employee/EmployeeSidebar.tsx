'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LogOut, X } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/employee' },
  { label: 'Agendamentos', href: '/employee/appointments' },
  { label: 'Clientes', href: '/employee/customers' },
  { label: 'Calendário', href: '/employee/calendar' },
  { label: 'Recepção', href: '/employee/reception' },
  { label: 'Perfil', href: '/employee/profile' },
  { label: 'Configurações', href: '/employee/settings' },
];

export function EmployeeSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await import('@/lib/api').then(({ api }) => api.post('/auth/logout').catch(() => {}));
    } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
    if (onClose) onClose();
    router.push('/login');
  };

  return (
    <aside className="w-full h-full bg-card border-r border-border flex flex-col overflow-y-auto">
      <div className="p-5 border-b border-border sticky top-0 bg-card z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-foreground rounded-md flex items-center justify-center text-primary font-bold flex-shrink-0">I</div>
          <span className="font-bold uppercase tracking-widest text-sm">Área do Colaborador</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === '/employee' ? pathname === '/employee' : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors min-h-[48px]',
                isActive
                  ? 'bg-primary-foreground/10 text-primary-foreground'
                  : 'text-gray-400 hover:text-white hover:bg-input'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors w-full text-left text-zinc-400 hover:text-red-400 hover:bg-red-500/10 min-h-[48px]"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  );
}
