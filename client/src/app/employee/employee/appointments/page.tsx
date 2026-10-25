'use client';
import * as React from 'react';
import { Bell, CheckCircle2, XCircle, MessageCircle, Search } from 'lucide-react';
import { api } from '@/lib/api';

export default function EmployeeAppointmentsPage() {
  const [view, setView] = React.useState<'pendentes' | 'list'>('pendentes');
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [pendingCount, setPendingCount] = React.useState(0);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAppointments(data);
      const pending = data.filter((a: any) => a.status === 'PENDING').length;
      setPendingCount(pending);
      api.patch('/appointments/mark-viewed').catch(() => {});
    } catch (error) {
      console.error('Falha ao buscar agendamentos', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (id: string, action: 'confirm' | 'cancel' | 'complete') => {
    try {
      setActionLoading(id + action);
      if (action === 'cancel') {
        await api.patch(`/appointments/${id}/cancel`, { reason: 'Cancelado pelo colaborador' });
      } else {
        await api.patch(`/appointments/${id}/${action}`);
      }
      await fetchAppointments();
    } catch (error) {
      console.error(`Falha ao ${action} agendamento`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const buildWhatsAppLink = (apt: any) => {
    const phone = apt.customer?.phone?.replace(/\D/g, '');
    if (!phone) return null;
    const dateStr = apt.startDateTime
      ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(apt.startDateTime))
      : '';
    const barberName = apt.barber?.user?.firstName || apt.barber?.firstName || 'Profissional';
    const msg = encodeURIComponent(
      `Olá ${apt.customer?.firstName || ''}! Confirmando seu agendamento de *${apt.service?.name || 'serviço'}* com ${barberName} no dia ${dateStr}.`
    );
    const num = phone.length === 11 ? `55${phone}` : phone.length === 10 ? `55${phone.substring(0,2)}9${phone.substring(2)}` : `55${phone}`;
    return `https://wa.me/${num}?text=${msg}`;
  };

  const pendingAppointments = appointments.filter((a: any) => a.status === 'PENDING');

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch =
      (apt.customer?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.customer?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((apt.barber?.user?.firstName || apt.barber?.firstName) || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusLabel = (s: string) => {
    if (s === 'CONFIRMED') return 'Confirmado';
    if (s === 'PENDING') return 'Pendente';
    if (s === 'COMPLETED') return 'Concluído';
    if (s === 'CANCELLED') return 'Cancelado';
    return s;
  };

  const statusClass = (s: string) => {
    if (s === 'CONFIRMED') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (s === 'PENDING') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (s === 'COMPLETED') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  };

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="pb-4 mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-b border-white/5">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary-foreground to-amber-500 drop-shadow-sm">Agendamentos</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase tracking-widest opacity-70">Clientes que agendaram com você</p>
        </div>

        <div className="flex items-center bg-black/40 backdrop-blur-sm p-1 rounded-full border border-white/5 shadow-inner">
          <button
            onClick={() => setView('pendentes')}
            className={`relative flex-1 sm:flex-none text-center px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 flex items-center gap-1.5 justify-center ${view === 'pendentes' ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-white'}`}
          >
            <Bell className="w-3 h-3" />
            Novos
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
          <button onClick={() => setView('list')} className={`flex-1 sm:flex-none text-center px-6 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${view === 'list' ? 'bg-gradient-to-r from-primary-foreground to-amber-400 text-primary shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-white'}`}>Todos</button>
        </div>
      </div>

      {/* TAB: NOVOS AGENDAMENTOS */}
      {view === 'pendentes' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2">
              <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                {pendingCount} cliente{pendingCount !== 1 ? 's' : ''} querem ser atendidos
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Carregando...</div>
          ) : pendingAppointments.length === 0 ? (
            <div className="bg-card/50 border border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 opacity-40" />
              <p className="text-muted-foreground uppercase tracking-widest text-xs">Nenhum agendamento aguardando confirmação.</p>
              <p className="text-muted-foreground/50 text-[10px]">Quando um cliente agendar, aparecerá aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pendingAppointments.map((apt: any) => {
                const timeStr = apt.startDateTime
                  ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(apt.startDateTime))
                  : '';
                const wppLink = buildWhatsAppLink(apt);

                return (
                  <div key={apt.id} className="relative bg-gradient-to-b from-[#1E1E1E] to-[#141414] border border-amber-500/20 rounded-3xl p-5 flex flex-col gap-4 overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.08)]">
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent rounded-t-3xl" />
                    <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                    <div className="absolute top-4 right-4 bg-red-500/20 border border-red-500/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Novo</span>
                    </div>

                    <div className="relative z-10">
                      <h3 className="font-black text-lg text-white tracking-wide pr-14">
                        {apt.customer?.firstName || 'Cliente'} {apt.customer?.lastName || ''}
                      </h3>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
                        quer: <span className="text-primary-foreground/90 font-bold">{apt.service?.name || 'Serviço'}</span>
                      </p>
                    </div>

                    <div className="relative z-10 bg-black/30 border border-white/5 rounded-2xl p-3 flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 min-w-[52px]">
                        <span className="text-xs font-black text-amber-400">{apt.startDateTime ? new Date(apt.startDateTime).getDate().toString().padStart(2,'0') : '--'}</span>
                        <span className="text-[9px] text-amber-400/70 uppercase tracking-widest">{apt.startDateTime ? new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(apt.startDateTime)) : ''}</span>
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm font-mono">{timeStr}</div>
                        <div className="text-muted-foreground text-[10px] uppercase tracking-widest">
                          {apt.startDateTime ? new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(apt.startDateTime)) : ''}
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 flex gap-2 mt-auto">
                      <button
                        onClick={() => handleStatusChange(apt.id, 'cancel')}
                        disabled={actionLoading === apt.id + 'cancel'}
                        className="flex-1 py-2.5 rounded-xl bg-rose-500/5 text-rose-400 border border-rose-500/15 hover:bg-rose-500/15 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {actionLoading === apt.id + 'cancel' ? '...' : 'Recusar'}
                      </button>
                      <button
                        onClick={() => handleStatusChange(apt.id, 'confirm')}
                        disabled={actionLoading === apt.id + 'confirm'}
                        className="flex-[2] py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {actionLoading === apt.id + 'confirm' ? 'Confirmando...' : '✅ Aceitar'}
                      </button>
                    </div>

                    {wppLink && (
                      <a href={wppLink} target="_blank" rel="noopener noreferrer" className="relative z-10 w-full py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366]/20 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all">
                        <MessageCircle className="w-3.5 h-3.5" />
                        Falar com cliente no WhatsApp
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: TODOS OS AGENDAMENTOS */}
      {view === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Buscar cliente..." className="w-full bg-[#141414] border border-white/5 pl-11 pr-4 py-3 text-xs focus:outline-none focus:border-primary-foreground/50 transition-all rounded-2xl text-white placeholder:text-muted-foreground/50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select
              className="bg-[#141414] border border-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none rounded-2xl text-white w-full sm:w-[140px] shrink-0 appearance-none cursor-pointer text-center"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%23888888'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="COMPLETED">Concluído</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-10 text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Carregando...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-10 text-xs uppercase tracking-widest text-muted-foreground bg-[#141414] rounded-2xl border border-white/5">Nenhum agendamento encontrado.</div>
          ) : (
            <div className="flex flex-col gap-4 pb-24">
              {filteredAppointments.map((apt: any) => {
                const wppLink = buildWhatsAppLink(apt);
                return (
                  <div key={apt.id} className="bg-gradient-to-b from-[#1E1E1E] to-[#141414] border border-white/5 rounded-3xl p-4 flex flex-col gap-3 relative overflow-hidden shadow-xl shadow-black/50">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-white truncate">{apt.customer?.firstName || 'Cliente'} {apt.customer?.lastName || ''}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate uppercase tracking-widest">{apt.service?.name || 'Serviço'} <span className="text-white/30 px-1">•</span> <span className="text-primary-foreground/80">{(apt.barber?.user?.firstName || apt.barber?.firstName) || 'Profissional'}</span></p>
                      </div>
                      <span className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusClass(apt.status)}`}>{statusLabel(apt.status)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-white/90 bg-black/20 p-2.5 rounded-xl border border-white/5 w-fit">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
                      {apt.startDateTime ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(apt.startDateTime)) : 'Data Indisponível'}
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-white/5">
                      {apt.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleStatusChange(apt.id, 'cancel')} disabled={actionLoading === apt.id + 'cancel'} className="flex-1 py-2 rounded-xl bg-rose-500/5 text-rose-400 border border-rose-500/10 hover:bg-rose-500/10 flex justify-center items-center text-[10px] font-bold uppercase tracking-wider transition-all">Recusar</button>
                          <button onClick={() => handleStatusChange(apt.id, 'confirm')} disabled={actionLoading === apt.id + 'confirm'} className="flex-[2] py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 flex justify-center items-center text-[10px] font-bold uppercase tracking-wider transition-all">✅ Aceitar</button>
                        </>
                      )}
                      {apt.status === 'CONFIRMED' && (
                        <>
                          <button onClick={() => handleStatusChange(apt.id, 'cancel')} className="flex-1 py-2 rounded-xl bg-rose-500/5 text-rose-400 border border-rose-500/10 hover:bg-rose-500/10 flex justify-center items-center text-[10px] font-bold uppercase tracking-wider transition-all">Cancelar</button>
                          <button onClick={() => handleStatusChange(apt.id, 'complete')} className="flex-[2] py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 flex justify-center items-center text-[10px] font-bold uppercase tracking-wider transition-all">Concluir</button>
                        </>
                      )}
                      {wppLink && (
                        <a href={wppLink} target="_blank" rel="noopener noreferrer" className="shrink-0 py-2 px-3 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 flex items-center justify-center transition-all">
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
