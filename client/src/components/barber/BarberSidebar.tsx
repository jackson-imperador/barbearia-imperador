"use client";
import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NotificationBell } from './NotificationBell';
import { 
  LayoutDashboard, 
  CalendarClock, 
  Users, 
  Video, 
  ShoppingBag, 
  Ticket, 
  Image as ImageIcon,
  Shield,
  Scissors,
  GraduationCap,
  DollarSign,
  MessageCircle,
  LogOut
} from 'lucide-react';

interface BarberSidebarProps {
  onClose?: () => void;
  isAdmin?: boolean;
}

export function BarberSidebar({ onClose, isAdmin = false }: BarberSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Painel Principal', href: '/barber/dashboard', icon: LayoutDashboard },
    { label: 'Agendamentos', href: '/barber/appointments', icon: CalendarClock },
    { label: 'Meu Perfil (Expediente)', href: '/barber/profile', icon: Users },
    { label: 'Clientes', href: '/barber/customers', icon: Users },
    { label: 'Serviços', href: '/barber/services', icon: Scissors },
    
    { label: 'Meus Cursos Academy', href: '/barber/courses', icon: GraduationCap },
    { label: 'Produtos & Pedidos', href: '/barber/products', icon: ShoppingBag },
    { label: 'Meus Cupons', href: '/barber/coupons', icon: Ticket },
    
    { label: 'Biblioteca de Mídia', href: '/barber/media', icon: ImageIcon },
    { label: 'Financeiro', href: '/barber/financial', icon: DollarSign },
    { label: 'WhatsApp', href: '/barber/whatsapp', icon: MessageCircle },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Área do Administrador', href: '/owner', icon: Shield });
  }

  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Chama endpoint de logout no backend para invalidar refresh token
      await import('@/lib/api').then(({ api }) => api.post('/auth/logout').catch(() => {}));
    } catch {}
    // Limpa localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    // Limpa o cookie accessToken que o middleware usa para autenticação
    document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    if (onClose) onClose();
    router.push('/login');
  };

  return (
    <aside className="w-64 h-full bg-[#0a0a0a] border-r border-white/5 flex flex-col overflow-y-auto hidden-scrollbar">
      <div className="p-6 border-b border-white/5 sticky top-0 bg-[#0a0a0a] z-10 flex items-center gap-4">
        <div className="w-10 h-10 bg-[#eab308] rounded-md flex items-center justify-center text-black font-black text-xl flex-shrink-0">
          B
        </div>
        <div className="flex flex-col">
          <span className="font-bold uppercase tracking-widest text-sm text-white">Área do Barbeiro</span>
          <span className="text-[11px] text-[#eab308] font-medium tracking-wide">Colaborador</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          const isSeparator = item.label === 'Meus Cursos Academy' || item.label === 'Biblioteca de Mídia';
          
          return (
            <React.Fragment key={item.label}>
              {isSeparator && idx > 0 && <div className="h-px w-full bg-white/5 my-4" />}
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors",
                  isActive 
                    ? "bg-[#eab308]/10 text-[#eab308]" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            </React.Fragment>
          );
        })}

        {/* Separador antes do Sair */}
        <div className="h-px w-full bg-white/5 my-4" />
        <NotificationBell />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors w-full text-left text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </nav>
    </aside>
  );
}
