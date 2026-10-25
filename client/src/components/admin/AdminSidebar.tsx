'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { NotificationBell } from '../barber/NotificationBell';

const navItems = [
  { label: 'Dashboard Geral', href: '/owner' },
  { label: 'Meu Perfil (Operacional)', href: '/barbearia-operacional' },
  { label: 'Agendamentos', href: '/owner/appointments' },
  { label: 'Barbeiros', href: '/owner/barbers' },
  { label: 'Serviços', href: '/owner/services' },
  { label: 'Clientes', href: '/owner/customers' },
  { label: 'Produtos & Pedidos', href: '/owner/products' },
  { label: 'Meus Cursos', href: '/owner/courses' },
  { label: 'Biblioteca Mídia', href: '/owner/media' },
  { label: 'Site (CMS)', href: '/owner/cms' },
  { label: 'Financeiro', href: '/owner/financial' },
  { label: 'Cupons', href: '/owner/coupons' },
  { label: 'Depoimentos', href: '/owner/cms' },
  { label: 'WhatsApp', href: '/owner/whatsapp' },
  { label: 'Configurações', href: '/owner/settings' },
];

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const [unreadAppointments, setUnreadAppointments] = React.useState(0);

  React.useEffect(() => {
    // Fetch unread count for the indicator
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/appointments/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Extract count correctly depending on how the NestJS interceptor wraps it
          const count = data?.data?.count !== undefined ? data.data.count : data?.count || 0;
          setUnreadAppointments(count);
        }
      } catch (err) {
        console.error('Failed to fetch unread appointments', err);
      }
    };
    fetchUnread();
    
    // Optional: Refresh count every minute
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 h-full bg-card border-r border-border flex flex-col overflow-y-auto">
      <div className="p-6 border-b border-border sticky top-0 bg-card z-10 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-foreground rounded-md flex items-center justify-center text-primary font-bold">I</div>
        <span className="font-bold uppercase tracking-widest text-sm">Imperio Admin</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className="flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-input rounded-md transition-colors min-h-[48px]"
          >
            <span>{item.label}</span>
            {item.label === 'Agendamentos' && unreadAppointments > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-red-600 px-2 text-[10px] text-white font-bold">
                {unreadAppointments}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-2 border-t border-border mt-auto">
        <NotificationBell />
      </div>
      <div className="p-4 border-t border-border sticky bottom-0 bg-card">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-input overflow-hidden border border-border relative">
            <Image src="https://images.unsplash.com/photo-1590000000000?auto=format&fit=crop&w=100&q=80" alt="Admin" fill className="object-cover" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase">John Admin</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Super Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
