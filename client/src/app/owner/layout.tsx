'use client';
import * as React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Drawer } from '@/components/ui/Drawer';
import { Home, Calendar, Users, ShoppingBag, Menu as MenuIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = React.useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get('/auth/me');
        setLoading(false);
      } catch (err) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
        }
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground uppercase tracking-widest text-sm">
        Carregando...
      </div>
    );
  }

  const bottomLinks = [
    { name: 'Início', href: '/owner', icon: Home, exact: true },
    { name: 'Agenda', href: '/barbearia-operacional', icon: Calendar, exact: false },
    { name: 'Clientes', href: '/owner/customers', icon: Users, exact: false },
    { name: 'Loja', href: '/owner/products', icon: ShoppingBag, exact: false },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary-foreground selection:text-primary">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 h-screen sticky top-0 flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      <Drawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
        <AdminSidebar onClose={() => setIsMobileMenuOpen(false)} />
      </Drawer>

      <div className="flex-1 flex flex-col pb-24 md:pb-0 min-w-0">
        
        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 md:p-10 overflow-x-hidden">
          <div className="max-w-[1400px] mx-auto w-full">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-card border-t border-border px-1 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.8)]">
          {bottomLinks.map((link) => {
            const isActive = link.exact ? pathname === link.href : pathname?.startsWith(link.href);
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full py-2 px-1 gap-1 transition-all rounded-lg min-h-[56px]",
                  isActive 
                    ? "text-primary-foreground bg-primary/20 shadow-[0_0_10px_rgba(255,215,0,0.3)] scale-105" 
                    : "text-muted-foreground hover:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "opacity-80")} />
                <span className={cn("text-[9px] uppercase font-bold tracking-widest", isActive && "text-primary-foreground")}>{link.name}</span>
              </Link>
            );
          })}
          
          {/* Menu Drawer Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center w-full py-2 px-1 gap-1 transition-colors text-muted-foreground hover:text-white rounded-lg min-h-[56px]"
          >
            <MenuIcon className="w-5 h-5 opacity-80" />
            <span className="text-[9px] uppercase font-bold tracking-widest">Mais</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
