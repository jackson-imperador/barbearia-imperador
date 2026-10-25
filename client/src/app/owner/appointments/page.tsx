'use client';
import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { X, Search, Plus, Bell, CheckCircle2, XCircle, Clock, MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminAppointmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = React.useState<'pendentes' | 'list' | 'waitingList'>('pendentes');
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [pendingCount, setPendingCount] = React.useState(0);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const [isCreating, setIsCreating] = React.useState(searchParams.get('new') === 'true');
  const [barbers, setBarbers] = React.useState<any[]>([]);
  const [services, setServices] = React.useState<any[]>([]);
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [formData, setFormData] = React.useState({
    customerId: searchParams.get('customerId') || '',
    barberId: '',
    serviceId: '',
    date: new Date().toISOString().split('T')[0],
    time: ''
  });
  const [availableSlots, setAvailableSlots] = React.useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);

  const minDateStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const maxDateStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setAppointments(data);
      const pending = data.filter((a: any) => a.status === 'PENDING').length;
      setPendingCount(pending);
    } catch (error) {
      console.error('Falha ao buscar agendamentos', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [barbersRes, servicesRes, customersRes] = await Promise.all([
        api.get('/barbers'),
        api.get('/services'),
        api.get('/dashboard/crm/list')
      ]);
      setBarbers(Array.isArray(barbersRes.data) ? barbersRes.data : barbersRes.data?.data || []);
      setServices(Array.isArray(servicesRes.data) ? servicesRes.data : servicesRes.data?.data || []);
      setCustomers(Array.isArray(customersRes.data) ? customersRes.data : customersRes.data?.data || []);
    } catch (error) {
      console.error('Falha ao buscar dependencias', error);
    }
  };

  React.useEffect(() => {
    if (formData.barberId && formData.serviceId && formData.date) {
      setLoadingSlots(true);
      api.get(`/appointments/availability?barberId=${formData.barberId}&serviceId=${formData.serviceId}&date=${formData.date}`)
        .then(res => {
          const slots = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          setAvailableSlots(slots);
          setFormData(prev => ({ ...prev, time: '' }));
        })
        .catch(err => console.error('Falha ao buscar horarios', err))
        .finally(() => setLoadingSlots(false));
    } else {
      setAvailableSlots([]);
    }
  }, [formData.barberId, formData.serviceId, formData.date]);

  React.useEffect(() => {
    fetchAppointments();
    fetchDependencies();
    // Poll for new pending appointments every 30s
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time) {
      alert('Selecione um horário disponível.');
      return;
    }
    try {
      setLoading(true);
      const dateStr = new Date(`${formData.date}T${formData.time}:00`).toISOString();
      await api.post('/appointments', {
        customerId: formData.customerId,
        barberId: formData.barberId,
        serviceId: formData.serviceId,
        startDateTime: dateStr
      });
      setIsCreating(false);
      setFormData({ customerId: '', barberId: '', serviceId: '', date: new Date().toISOString().split('T')[0], time: '' });
      router.replace('/owner/appointments');
      await fetchAppointments();
    } catch (error) {
      console.error('Falha ao criar agendamento', error);
      alert('Erro ao criar agendamento. Verifique se os dados estão corretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, action: 'confirm' | 'cancel' | 'complete') => {
    try {
      setActionLoading(id + action);
      if (action === 'cancel') {
        await api.patch(`/appointments/${id}/cancel`, { reason: 'Cancelado pelo proprietário' });
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
    const barberName = apt.barber?.user?.firstName || apt.barber?.firstName || 'Barbeiro';
    const msg = encodeURIComponent(
      `Olá ${apt.customer?.firstName || ''}! Confirmando seu agendamento de *${apt.service?.name || 'serviço'}* com ${barberName} no dia ${dateStr}. Qualquer dúvida estou aqui!`
    );
    const num = phone.length === 11 ? `55${phone}` : phone.length === 10 ? `55${phone.substring(0,2)}9${phone.substring(2)}` : `55${phone}`;
    return `https://wa.me/${num}?text=${msg}`;
  };

  const pendingAppointments = appointments.filter((a: any) => a.status === 'PENDING');

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch =
      (apt.customer?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.customer?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((apt.barber?.user?.firstName || apt.barber?.firstName) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((apt.barber?.user?.lastName || apt.barber?.lastName) || '').toLowerCase().includes(searchTerm.toLowerCase());
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
      <div className="pb-4 mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-5 border-b border-white/5 w-full">
        <div className="flex justify-between items-center w-full sm:w-auto gap-2">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-primary-foreground to-amber-500 truncate drop-shadow-sm">Agendamentos</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase tracking-widest hidden sm:block truncate opacity-70">Sua agenda de reservas</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="sm:hidden shrink-0 bg-gradient-to-r from-primary-foreground to-amber-400 text-primary font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-full flex items-center gap-1.5 hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,180,0,0.3)] whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> NOVO
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="flex items-center w-full sm:w-auto bg-black/40 backdrop-blur-sm p-1 rounded-full border border-white/5 shadow-inner">
            {/* Tab: Notificações Pendentes */}
            <button
              onClick={() => setView('pendentes')}
              className={`relative flex-1 sm:flex-none text-center px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 flex items-center gap-1.5 justify-center ${view === 'pendentes' ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-white'}`}
            >
              <Bell className="w-3 h-3" />
              Notificações
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>
            <button onClick={() => setView('list')} className={`flex-1 sm:flex-none text-center px-5 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${view === 'list' ? 'bg-gradient-to-r from-primary-foreground to-amber-400 text-primary shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-white'}`}>Lista</button>
            <button onClick={() => setView('waitingList')} className={`flex-1 sm:flex-none text-center px-5 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-300 ${view === 'waitingList' ? 'bg-gradient-to-r from-primary-foreground to-amber-400 text-primary shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-white'}`}>Espera</button>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="hidden sm:flex bg-gradient-to-r from-primary-foreground to-amber-400 text-primary font-black uppercase tracking-widest text-xs px-5 py-2.5 rounded-full items-center gap-2 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,180,0,0.3)] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> NOVO AGENDAMENTO
          </button>
        </div>
      </div>

      {/* Modal Criar */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card border border-border p-6 rounded-lg w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary-foreground uppercase tracking-widest">Cadastrar Agendamento</h2>
              <button onClick={() => { setIsCreating(false); router.replace('/owner/appointments'); }} className="text-muted-foreground hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Cliente</label>
                <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full bg-input border border-border p-2 rounded text-white text-sm">
                  <option value="">Selecione o Cliente</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Barbeiro</label>
                <select required value={formData.barberId} onChange={e => setFormData({...formData, barberId: e.target.value})} className="w-full bg-input border border-border p-2 rounded text-white text-sm">
                  <option value="">Selecione o Barbeiro</option>
                  {barbers.map(b => <option key={b.id} value={b.id}>{b.user?.firstName || b.firstName} {b.user?.lastName || b.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Serviço</label>
                <select required value={formData.serviceId} onChange={e => setFormData({...formData, serviceId: e.target.value})} className="w-full bg-input border border-border p-2 rounded text-white text-sm">
                  <option value="">Selecione o Serviço</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {Number(s.price).toFixed(2)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Data (Máx 30 dias)</label>
                <input required type="date" min={minDateStr} max={maxDateStr} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-input border border-border p-2 rounded text-white text-sm" />
              </div>
              {formData.barberId && formData.serviceId && formData.date && (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Horários Disponíveis</label>
                  {loadingSlots ? (
                    <p className="text-xs text-muted-foreground">Buscando horários...</p>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {availableSlots.map(time => (
                        <button key={time} type="button" onClick={() => setFormData({...formData, time})} className={`py-2 px-1 text-xs font-mono rounded border transition-colors ${formData.time === time ? 'bg-primary-foreground text-primary border-primary-foreground font-bold' : 'bg-input/50 text-white border-border hover:border-primary-foreground/50'}`}>
                          {time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">Nenhum horário disponível para este barbeiro nesta data.</p>
                  )}
                </div>
              )}
              <button type="submit" disabled={loading || !formData.time} className="w-full bg-primary-foreground text-primary font-bold uppercase tracking-widest text-xs py-3 rounded mt-4 hover:opacity-90 transition-opacity disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar Agendamento'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============ TAB: NOTIFICAÇÕES PENDENTES ============ */}
      {view === 'pendentes' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2">
              <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                {pendingCount} agendamento{pendingCount !== 1 ? 's' : ''} aguardando aprovação
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Carregando notificações...</div>
          ) : pendingAppointments.length === 0 ? (
            <div className="bg-card/50 border border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center gap-3 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 opacity-40" />
              <p className="text-muted-foreground uppercase tracking-widest text-xs">Nenhum agendamento pendente.</p>
              <p className="text-muted-foreground/50 text-[10px]">Quando um cliente agendar, aparecerá aqui para você aceitar ou recusar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pendingAppointments.map((apt: any) => {
                const dateStr = apt.startDateTime
                  ? new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(apt.startDateTime))
                  : 'N/A';
                const timeStr = apt.startDateTime
                  ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(apt.startDateTime))
                  : '';
                const barberName = `${apt.barber?.user?.firstName || apt.barber?.firstName || ''} ${apt.barber?.user?.lastName || apt.barber?.lastName || ''}`.trim();
                const wppLink = buildWhatsAppLink(apt);

                return (
                  <div key={apt.id} className="relative bg-gradient-to-b from-[#1E1E1E] to-[#141414] border border-amber-500/20 rounded-3xl p-5 flex flex-col gap-4 overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.08)]">
                    {/* Glow top */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent rounded-t-3xl" />
                    <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                    {/* Badge novo */}
                    <div className="absolute top-4 right-4 bg-red-500/20 border border-red-500/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Novo</span>
                    </div>

                    {/* Infos */}
                    <div className="relative z-10">
                      <h3 className="font-black text-lg text-white tracking-wide pr-14">
                        {apt.customer?.firstName || 'Cliente'} {apt.customer?.lastName || ''}
                      </h3>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">
                        {apt.service?.name || 'Serviço'}{barberName && <> · <span className="text-primary-foreground/80">{barberName}</span></>}
                      </p>
                    </div>

                    {/* Data/hora destaque */}
                    <div className="relative z-10 bg-black/30 border border-white/5 rounded-2xl p-3 flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 min-w-[52px]">
                        <span className="text-xs font-black text-amber-400">{apt.startDateTime ? new Date(apt.startDateTime).getDate().toString().padStart(2,'0') : '--'}</span>
                        <span className="text-[9px] text-amber-400/70 uppercase tracking-widest">{apt.startDateTime ? new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(new Date(apt.startDateTime)) : ''}</span>
                      </div>
                      <div>
                        <div className="text-white font-bold text-sm font-mono">{timeStr}</div>
                        <div className="text-muted-foreground text-[10px] uppercase tracking-widest">{dateStr}</div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="relative z-10 flex gap-2 mt-auto">
                      <button
                        onClick={() => handleStatusChange(apt.id, 'cancel')}
                        disabled={actionLoading === apt.id + 'cancel'}
                        className="flex-1 py-2.5 rounded-xl bg-rose-500/5 text-rose-400 border border-rose-500/15 hover:bg-rose-500/15 hover:border-rose-500/30 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {actionLoading === apt.id + 'cancel' ? '...' : 'Recusar'}
                      </button>
                      <button
                        onClick={() => handleStatusChange(apt.id, 'confirm')}
                        disabled={actionLoading === apt.id + 'confirm'}
                        className="flex-[2] py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] disabled:opacity-40"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {actionLoading === apt.id + 'confirm' ? 'Confirmando...' : '✅ Aceitar Corte'}
                      </button>
                    </div>

                    {/* Botão WhatsApp Cliente */}
                    {wppLink && (
                      <a
                        href={wppLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative z-10 w-full py-2 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 hover:bg-[#25D366]/20 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all"
                      >
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

      {/* ============ TAB: LISTA ============ */}
      {view === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4 w-full">
            <div className="relative flex-1 min-w-0 group w-full">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary-foreground transition-colors" />
              <input type="text" placeholder="Buscar cliente ou barbeiro..." className="w-full bg-[#141414] border border-white/5 pl-11 pr-4 py-3 text-xs focus:outline-none focus:border-primary-foreground/50 focus:ring-1 focus:ring-primary-foreground/30 transition-all rounded-2xl shadow-inner text-white placeholder:text-muted-foreground/50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select
              className="bg-[#141414] border border-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest outline-none rounded-2xl text-white w-full sm:w-[140px] shrink-0 shadow-inner focus:outline-none focus:border-primary-foreground/50 transition-all appearance-none cursor-pointer text-center"
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

          {/* Desktop Table */}
          <div className="hidden md:block border border-border bg-card overflow-x-auto rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-input/50 text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Cliente</th>
                  <th className="px-6 py-4 font-medium">Barbeiro</th>
                  <th className="px-6 py-4 font-medium">Serviço</th>
                  <th className="px-6 py-4 font-medium">Data e Hora</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-4 text-center">Carregando...</td></tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-4 text-center">Nenhum agendamento encontrado.</td></tr>
                ) : filteredAppointments.map((apt: any) => (
                  <tr key={apt.id} className="border-b border-border hover:bg-input/30 transition-colors">
                    <td className="px-6 py-4 font-bold">{apt.customer?.firstName || 'Cliente'} {apt.customer?.lastName || ''}</td>
                    <td className="px-6 py-4">{(apt.barber?.user?.firstName || apt.barber?.firstName) || 'Barbeiro'} {(apt.barber?.user?.lastName || apt.barber?.lastName) || ''}</td>
                    <td className="px-6 py-4">{apt.service?.name || 'Serviço'}</td>
                    <td className="px-6 py-4">
                      <span className="text-primary-foreground font-mono">
                        {apt.startDateTime ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(apt.startDateTime)) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${statusClass(apt.status)}`}>{statusLabel(apt.status)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        {apt.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleStatusChange(apt.id, 'confirm')} className="text-xs uppercase tracking-widest text-emerald-500 hover:text-emerald-400 font-bold">Aceitar</button>
                            <button onClick={() => handleStatusChange(apt.id, 'cancel')} className="text-xs uppercase tracking-widest text-rose-500 hover:text-rose-400">Recusar</button>
                          </>
                        )}
                        {apt.status === 'CONFIRMED' && (
                          <>
                            <button onClick={() => handleStatusChange(apt.id, 'complete')} className="text-xs uppercase tracking-widest text-blue-400 hover:text-blue-300">Concluir</button>
                            <button onClick={() => handleStatusChange(apt.id, 'cancel')} className="text-xs uppercase tracking-widest text-rose-500 hover:text-rose-400">Cancelar</button>
                          </>
                        )}
                        {buildWhatsAppLink(apt) && (
                          <a href={buildWhatsAppLink(apt)!} target="_blank" rel="noopener noreferrer" title="WhatsApp do cliente" className="text-[#25D366] hover:text-[#25D366]/80 transition-colors">
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-4 pb-32">
            {loading ? (
              <div className="text-center py-10 text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Carregando agendamentos...</div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-10 text-xs uppercase tracking-widest text-muted-foreground bg-[#141414] rounded-2xl border border-white/5">Nenhum agendamento encontrado.</div>
            ) : filteredAppointments.map((apt: any) => (
              <div key={apt.id} className="bg-gradient-to-b from-[#1E1E1E] to-[#141414] border border-white/5 rounded-3xl p-4 flex flex-col gap-3 relative overflow-hidden shadow-xl shadow-black/50">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="flex justify-between items-start gap-2 relative z-10">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-white truncate tracking-wide">{apt.customer?.firstName || 'Cliente'} {apt.customer?.lastName || ''}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate uppercase tracking-widest">{apt.service?.name || 'Serviço'} <span className="text-white/30 px-1">•</span> <span className="text-primary-foreground/80">{(apt.barber?.user?.firstName || apt.barber?.firstName) || 'Barbeiro'}</span></p>
                  </div>
                  <span className={`shrink-0 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusClass(apt.status)}`}>{statusLabel(apt.status)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-white/90 mt-1 relative z-10 bg-black/20 p-2.5 rounded-xl border border-white/5 inline-flex w-fit shadow-inner">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
                  {apt.startDateTime ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(apt.startDateTime)) : 'Data Indisponível'}
                </div>
                <div className="flex gap-2 mt-1 pt-3 border-t border-white/5 relative z-10">
                  {apt.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleStatusChange(apt.id, 'cancel')} className="flex-1 py-2 rounded-xl bg-rose-500/5 text-rose-400 border border-rose-500/10 hover:bg-rose-500/10 flex justify-center items-center text-[10px] font-bold uppercase tracking-wider transition-all">Recusar</button>
                      <button onClick={() => handleStatusChange(apt.id, 'confirm')} className="flex-[2] py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 flex justify-center items-center text-[10px] font-bold uppercase tracking-wider transition-all">✅ Aceitar</button>
                    </>
                  )}
                  {apt.status === 'CONFIRMED' && (
                    <>
                      <button onClick={() => handleStatusChange(apt.id, 'cancel')} className="flex-1 py-2 rounded-xl bg-rose-500/5 text-rose-400 border border-rose-500/10 hover:bg-rose-500/10 flex justify-center items-center text-[10px] font-bold uppercase tracking-wider transition-all">Cancelar</button>
                      <button onClick={() => handleStatusChange(apt.id, 'complete')} className="flex-[2] py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 flex justify-center items-center text-[10px] font-bold uppercase tracking-wider transition-all">Concluir</button>
                    </>
                  )}
                  {buildWhatsAppLink(apt) && (
                    <a href={buildWhatsAppLink(apt)!} target="_blank" rel="noopener noreferrer" className="shrink-0 py-2 px-3 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 flex items-center justify-center transition-all">
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ TAB: LISTA DE ESPERA ============ */}
      {view === 'waitingList' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Carregando lista de espera...</div>
          ) : filteredAppointments.filter((a: any) => ['PENDING', 'CONFIRMED'].includes(a.status)).length === 0 ? (
            <div className="bg-card border border-border p-4 sm:p-6 h-[400px] flex items-center justify-center border-dashed rounded-lg mx-auto w-full text-center">
              <span className="text-muted-foreground uppercase tracking-widest text-xs sm:text-sm">Nenhum agendamento na lista de espera.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAppointments
                .filter((a: any) => ['PENDING', 'CONFIRMED'].includes(a.status))
                .sort((a: any, b: any) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
                .map((apt: any) => (
                  <div key={apt.id} className="bg-gradient-to-b from-[#1E1E1E] to-[#141414] border border-white/5 rounded-3xl p-5 flex flex-col gap-3 relative overflow-hidden shadow-xl shadow-black/50">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <div className="flex justify-between items-start gap-2 relative z-10">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-white truncate tracking-wide">{apt.customer?.firstName || 'Cliente'} {apt.customer?.lastName || ''}</h3>
                        <p className="text-xs text-muted-foreground mt-1 truncate uppercase tracking-widest">{apt.service?.name || 'Serviço'}</p>
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${statusClass(apt.status)}`}>{statusLabel(apt.status)}</span>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 border border-white/5 relative z-10 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm font-mono text-white/90">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                        {apt.startDateTime ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(apt.startDateTime)) : 'Data Indisponível'}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <span className="text-white/30">Barbeiro:</span> <span className="text-primary-foreground">{(apt.barber?.user?.firstName || apt.barber?.firstName) || 'Barbeiro'}</span>
                      </div>
                    </div>
                    {apt.status === 'PENDING' && (
                      <div className="relative z-10 flex gap-2">
                        <button onClick={() => handleStatusChange(apt.id, 'cancel')} className="flex-1 py-2 rounded-xl bg-rose-500/5 text-rose-400 border border-rose-500/10 hover:bg-rose-500/10 text-[10px] font-bold uppercase tracking-wider transition-all">Recusar</button>
                        <button onClick={() => handleStatusChange(apt.id, 'confirm')} className="flex-[2] py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] font-bold uppercase tracking-wider transition-all">✅ Aceitar</button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
