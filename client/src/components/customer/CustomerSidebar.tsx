'use client';
import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home, Calendar, ShoppingBag, GraduationCap, User,
  BookOpen, Gift, Heart, MessageSquare, LogOut, X, Menu
} from 'lucide-react';

const navItems = [
  { label: 'Início', href: '/', icon: Home },
  { label: 'Novo Agendamento', href: '/agendamento', icon: Calendar },
  { label: 'Meus Agendamentos', href: '/customer/appointments', icon: Calendar },
  { label: 'Cortes Modelos', href: '/customer/lookbook', icon: BookOpen },
  { label: 'Seja VIP - Corte Sem Limites', href: '/customer/clube', icon: Gift },
  { label: 'Produtos na Promoção', href: '/customer/store', icon: ShoppingBag },
  { label: 'Cursos (Academy)', href: '/customer/academy', icon: GraduationCap },
  { label: 'Deixe seu Depoimento', href: '/customer/testimonials', icon: MessageSquare },
  { label: 'Perfil', href: '/customer/profile', icon: User },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await import('@/lib/api').then(({ api }) => api.post('/auth/logout').catch(() => {}));
    } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    if (onClose) onClose();
    router.push('/login');
  };

  return (
    <aside className="w-full h-full bg-[#0a0a0a] border-r border-white/5 flex flex-col overflow-y-auto">
      <div className="p-5 border-b border-white/5 sticky top-0 bg-[#0a0a0a] z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-foreground rounded-md flex items-center justify-center text-primary font-black text-base flex-shrink-0">
            I
          </div>
          <span className="font-bold uppercase tracking-widest text-sm text-white">Portal do Cliente</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors min-h-[48px]',
                isActive
                  ? 'bg-primary-foreground/10 text-primary-foreground'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/5">
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

export function CustomerSidebar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 h-screen sticky top-0 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center text-white shadow-lg"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] flex justify-start md:hidden">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 h-full bg-[#0a0a0a] shadow-2xl overflow-y-auto animate-in slide-in-from-left">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
