'use client';
import * as React from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data?: string;
}

export function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const eventSourceRef = React.useRef<EventSource | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const playSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq4I2DiJMn9/rwIgyBBw7dLPm1bByCCc7jdXpzMCNNhQfOHWy5dOwcQomOozV6MzAlDcVIDt2subUs24kJjuK1unMwpA5FiE6d7fm1LFvJiY7i9fpzMGROBcjO3i45tSybyclO4vX6czCkzkYJDt5uebUs28oJDyM1+nMwpI6GSQ8ernn1LNwKCQ9jdfpzMKTPBolPXu66NW0cSklPY3X6szDlD0bJj18uunWtHIqJT6O2OrMw5U+HCc+fbvq1bVyKiY+j9jqzMOWPh0oP369q9a2cysoPpDZ6s3El0AfKUB/vqzXt3QsKT+R2uvNxZhAICpAgL+t2Lh1LS1AkdrrzMWZQSErQIG/rdi5di0tQZLa68zGmkIiLEKCwK7ZuXcuLkKT2+vNxptDIy1Dg8Gv2rp4Ly9DlNvrzsecRCQuRITCsNu7eS8wRJXb7M+enUUlLkWFwrHcvHowMEWW3O3QnkYmL0aGwrLdvXsxMUaX3e3Qn0cnMEeHw7PevnwyMkeY3u7Rn0koMUiIxLS/v30zM0iZ3+7RoEkpMkmJxbXAwH40M0ma4O/SoUoqM0qKxra/wIA1NDqa4e/Sok0rNEuLx7fCgT42NTuc4vDTok4sNkyMyLjDgj83Njyc4/DUo08tN02Nybn/////');
        audioRef.current.volume = 0.5;
      }
      audioRef.current.play().catch(() => {});
    } catch (e) {}
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setNotifications(data);
    } catch (e) {
      console.error('Erro ao buscar notificações', e);
    } finally {
      setLoading(false);
    }
  };

  // Conecta ao SSE para notificações em tempo real
  const connectSSE = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Usa fetch com credenciais para SSE (cookies)
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const es = new EventSource(`${apiBase}/notifications/stream`, {
      withCredentials: true,
    } as any);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') return;
        // Nova notificação recebida
        setNotifications(prev => [data, ...prev]);
        playSound();
        // Mostra toast/alerta visual
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(data.title, { body: data.body.replace(/\*/g, ''), icon: '/favicon.ico' });
          }
        }
      } catch (e) {}
    };

    es.onerror = () => {
      es.close();
      // Reconecta após 5s
      setTimeout(connectSSE, 5000);
    };

    eventSourceRef.current = es;
  };

  React.useEffect(() => {
    fetchNotifications();
    connectSSE();

    // Pede permissão para notificações nativas
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {}
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
    } catch { return ''; }
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors w-full text-left text-zinc-400 hover:text-white hover:bg-white/5"
      >
        <Bell className="w-4 h-4" />
        <span>Notificações</span>
        {unreadCount > 0 && (
          <span className="absolute left-7 top-1.5 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 md:inset-auto md:left-64 md:top-0 z-[9999] w-full md:w-80 h-screen bg-[#111] border-l border-white/10 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-[#111] z-10">
            <h3 className="font-bold text-sm uppercase tracking-widest text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-400" />
              Notificações
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1.5">{unreadCount}</span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} title="Marcar todas como lidas" className="text-zinc-400 hover:text-white transition-colors">
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-xs text-zinc-500">Carregando...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="p-8 text-center text-xs text-zinc-500 uppercase tracking-widest">
                Sem notificações
              </div>
            )}
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.isRead) markRead(n.id);
                  if (n.type === 'APPOINTMENT' || n.type === 'CANCELLED') {
                    const basePath = pathname.startsWith('/owner') ? '/owner' : '/barber';
                    let url = `${basePath}/appointments`;
                    try {
                      if (n.data) {
                        const parsed = JSON.parse(n.data);
                        if (parsed.appointmentId) {
                          url += `?highlight=${parsed.appointmentId}`;
                        }
                      }
                    } catch (e) {}
                    router.push(url);
                    setOpen(false);
                  }
                }}
                className={cn(
                  'p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5',
                  !n.isRead ? 'bg-yellow-400/5 border-l-2 border-l-yellow-400' : ''
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold truncate', !n.isRead ? 'text-white' : 'text-zinc-400')}>
                      {n.title}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                      {n.body.replace(/\*/g, '')}
                    </p>
                    <p className="text-[10px] text-zinc-600 mt-1">{formatTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
