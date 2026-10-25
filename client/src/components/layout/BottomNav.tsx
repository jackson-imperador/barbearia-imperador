'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarCheck, BookImage, Video, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  // Ocultar nav inferior em telas grandes (md:hidden)
  // E também ocultar no painel administrativo/barbeiro se desejarmos focar no mobile apenas para cliente.
  const isOwnerOrBarber = pathname?.startsWith('/owner') || pathname?.startsWith('/barber');
  if (isOwnerOrBarber) return null;

  const links = [
    { name: 'Início',        href: '/',                    icon: Home },
    { name: 'Agendar',       href: '/agendamento',         icon: CalendarCheck },
    { name: 'Cortes Modelo', href: '/customer/lookbook',   icon: BookImage },
    { name: 'Cursos',        href: '/customer/academy',    icon: Video },
    { name: 'Perfil',        href: '/customer/profile',    icon: User },
  ];

  return (
    <>
      {/* Spacer to prevent content from hiding behind the fixed bottom nav */}
      <div className="h-16 md:hidden"></div>
      
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-card border-t border-border px-4 py-2 md:hidden safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
          const Icon = link.icon;
          
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center w-full p-2 gap-1 transition-colors",
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] uppercase font-bold tracking-widest">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
