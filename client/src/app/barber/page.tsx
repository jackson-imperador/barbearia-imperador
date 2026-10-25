'use client';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Play, Square, CheckCircle, XCircle, Clock, Calendar, DollarSign, RefreshCw, Smartphone, Search, AlertCircle, Check } from 'lucide-react';

export default function BarberSingleScreen() {
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  
  // Modals & Panels
  const [selectedClient, setSelectedClient] = React.useState<any>(null);
  const [paymentModalData, setPaymentModalData] = React.useState<any>(null);
  
  // Stopwatch
  const [activeAppointmentId, setActiveAppointmentId] = React.useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);

  // Tick clock
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Agenda
  const fetchAgenda = async () => {
    try {
      setLoading(true);
      // Puxando da API existente de Appointments do Motor Inteligente
      const res = await api.get('/appointments');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      
      // Filtra apenas de hoje para simplificar a visualização
      const todayStr = new Date().toISOString().split('T')[0];
      const todayAppointments = data.filter((a: any) => a.startDateTime?.startsWith(todayStr));
      
      // Sort by time
      todayAppointments.sort((a: any, b: any) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
      
      setAppointments(todayAppointments);
      
      // Auto-detect IN_PROGRESS
      const inProgress = todayAppointments.find((a: any) => a.status === 'IN_PROGRESS');
      if (inProgress) {
        setActiveAppointmentId(inProgress.id);
        const started = new Date(inProgress.startedAt || inProgress.updatedAt).getTime();
        setElapsedSeconds(Math.floor((Date.now() - started) / 1000));
      } else {
        setActiveAppointmentId(null);
      }
    } catch (error) {
      console.error('Erro ao buscar agenda', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAgenda();
  }, []);

  // Tick Stopwatch
  React.useEffect(() => {
    let timer: any;
    if (activeAppointmentId) {
      timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeAppointmentId]);

  // Actions
  const updateStatus = async (id: string, status: string, extraData: any = {}) => {
    try {
      // Otimização Otimista
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status, ...extraData } : a));
      
      await api.patch(`/appointments/${id}`, { status, ...extraData });
      if (status === 'IN_PROGRESS') {
        setActiveAppointmentId(id);
        setElapsedSeconds(0);
      }
      if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW') {
        if (activeAppointmentId === id) setActiveAppointmentId(null);
      }
    } catch (err) {
      console.error('Erro ao atualizar', err);
      fetchAgenda(); // Revert on error
    }
  };

  const handleStart = (id: string) => {
    if (activeAppointmentId && activeAppointmentId !== id) {
      return alert('Finalize o atendimento atual primeiro!');
    }
    updateStatus(id, 'IN_PROGRESS', { startedAt: new Date().toISOString() });
  };

  const handleFinish = (appointment: any) => {
    setPaymentModalData(appointment);
  };

  const processPayment = async (method: string, discount: number) => {
    if (!paymentModalData) return;
    try {
      const amount = paymentModalData.service?.price ? Number(paymentModalData.service.price) : 50;
      const finalAmount = Math.max(0, amount - discount);
      
      // API call to finish appointment and create FinancialTransaction
      await updateStatus(paymentModalData.id, 'COMPLETED', { 
        amountPaid: finalAmount, 
        paymentMethod: method,
        discount 
      });
      setPaymentModalData(null);
    } catch (err) {
      alert('Erro ao processar pagamento.');
    }
  };

  const formatStopwatch = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // derived state
  const remainingCount = appointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED' || a.status === 'CHECKED_IN').length;
  const inProgressAppt = appointments.find(a => a.id === activeAppointmentId);
  const nextAppts = appointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED' || a.status === 'CHECKED_IN');
  const nextAppt = nextAppts.length > 0 ? nextAppts[0] : null;

  return (
    <div className="space-y-4 pb-24 md:pb-8 min-h-screen bg-background">
      
      {/* HEADER FLUTUANTE (VISÃO RÁPIDA) */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border pb-4 pt-2 px-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-widest text-primary-foreground font-mono">
            {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-2 mt-1">
            <Calendar className="w-3 h-3" /> Hoje • {remainingCount} Atendimentos Restantes
          </p>
        </div>
        
        {inProgressAppt ? (
           <div className="flex items-center gap-4 bg-primary/20 border border-primary/50 px-4 py-2 rounded-lg">
             <div className="animate-pulse w-3 h-3 rounded-full bg-green-500"></div>
             <div>
               <p className="text-xs uppercase tracking-widest text-primary-foreground font-bold">Em Atendimento</p>
               <p className="font-mono text-xl text-white">{formatStopwatch(elapsedSeconds)}</p>
             </div>
             <button onClick={() => handleFinish(inProgressAppt)} className="ml-4 bg-primary-foreground text-primary uppercase text-xs font-bold px-4 py-2 rounded hover:opacity-90">
               FINALIZAR
             </button>
           </div>
        ) : (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Próximo Cliente</p>
            {nextAppt ? (
              <p className="text-sm font-bold text-white bg-input/50 px-3 py-1 rounded">
                {new Date(nextAppt.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {nextAppt.customer?.firstName || 'Cliente'}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">Livre</p>
            )}
          </div>
        )}
      </div>

      {/* LISTA DA AGENDA RÁPIDA */}
      <div className="space-y-3 px-2 pt-4">
        {loading ? (
          <div className="text-center text-xs text-muted-foreground uppercase tracking-widest py-10">Sincronizando Agenda...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground uppercase tracking-widest py-10">Agenda vazia hoje.</div>
        ) : (
          appointments.map((app) => {
            const isPast = new Date(app.startDateTime) < new Date();
            const isLate = isPast && (app.status === 'PENDING' || app.status === 'CONFIRMED');
            
            return (
              <div key={app.id} className={`p-4 border rounded-lg flex flex-col md:flex-row gap-4 items-start md:items-center transition-colors ${app.id === activeAppointmentId ? 'bg-primary/5 border-primary/50' : 'bg-card border-border'}`}>
                
                {/* INFO CLIENTE E HORÁRIO */}
                <div 
                  className="flex items-center gap-4 flex-1 cursor-pointer w-full"
                  onClick={() => setSelectedClient(app)}
                >
                  <div className="flex flex-col items-center justify-center min-w-[60px]">
                    <span className={`text-lg font-bold font-mono ${isLate ? 'text-red-400' : 'text-white'}`}>
                      {new Date(app.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded mt-1 ${
                      app.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400' :
                      app.status === 'IN_PROGRESS' ? 'bg-primary/30 text-primary-foreground' :
                      app.status === 'CHECKED_IN' ? 'bg-blue-900/30 text-blue-400' :
                      app.status === 'CANCELLED' || app.status === 'NO_SHOW' ? 'bg-red-900/30 text-red-400' :
                      'bg-input text-muted-foreground'
                    }`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex-shrink-0 flex items-center justify-center text-primary-foreground font-bold text-lg uppercase shadow-inner">
                    {app.customer?.firstName?.[0] || 'C'}{app.customer?.lastName?.[0] || ''}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-base leading-none">{app.customer?.firstName} {app.customer?.lastName}</h3>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">{app.service?.name || 'Serviço'} • {(app.service?.duration || 30)} min</p>
                    {isLate && <p className="text-[10px] text-red-400 uppercase tracking-widest mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Atrasado</p>}
                  </div>
                </div>

                {/* BOTÕES RÁPIDOS */}
                {app.status !== 'COMPLETED' && app.status !== 'CANCELLED' && app.status !== 'NO_SHOW' && (
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-border">
                    {app.status === 'PENDING' && (
                      <>
                        <button onClick={() => updateStatus(app.id, 'CONFIRMED')} className="flex-1 md:flex-none py-2 px-3 bg-input text-xs uppercase tracking-widest text-white rounded hover:bg-input/80 flex items-center justify-center gap-1"><Check className="w-3 h-3"/> Confirmar</button>
                        <button onClick={() => updateStatus(app.id, 'NO_SHOW')} className="flex-1 md:flex-none py-2 px-3 bg-red-900/20 text-xs uppercase tracking-widest text-red-400 rounded hover:bg-red-900/40 flex items-center justify-center gap-1"><XCircle className="w-3 h-3"/> Faltou</button>
                      </>
                    )}
                    {(app.status === 'PENDING' || app.status === 'CONFIRMED') && (
                      <button onClick={() => updateStatus(app.id, 'CHECKED_IN', { checkedInAt: new Date().toISOString() })} className="flex-1 md:flex-none py-2 px-3 bg-blue-900/20 text-xs uppercase tracking-widest text-blue-400 rounded hover:bg-blue-900/40 flex items-center justify-center gap-1"><Smartphone className="w-3 h-3"/> Chegou</button>
                    )}
                    {(app.status === 'PENDING' || app.status === 'CONFIRMED' || app.status === 'CHECKED_IN') && (
                      <button onClick={() => handleStart(app.id)} className="flex-1 md:flex-none py-2 px-6 bg-primary-foreground text-primary font-bold text-xs uppercase tracking-widest rounded hover:opacity-90 flex items-center justify-center gap-2"><Play className="w-4 h-4 fill-current"/> INICIAR</button>
                    )}
                    {app.status === 'IN_PROGRESS' && (
                       <button onClick={() => handleFinish(app)} className="flex-1 md:flex-none py-2 px-6 bg-green-500 text-black font-bold text-xs uppercase tracking-widest rounded hover:opacity-90 flex items-center justify-center gap-2"><Square className="w-4 h-4 fill-current"/> FINALIZAR / RECEBER</button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SLIDE OVER DO CLIENTE */}
      <AnimatePresence>
        {selectedClient && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedClient(null)} className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 w-full md:w-[450px] h-full bg-card border-l border-border z-50 overflow-y-auto flex flex-col shadow-2xl">
              <div className="sticky top-0 bg-card/90 backdrop-blur-md border-b border-border p-6 flex justify-between items-start z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground font-bold text-2xl uppercase">
                    {selectedClient.customer?.firstName?.[0] || 'C'}{selectedClient.customer?.lastName?.[0] || ''}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedClient.customer?.firstName} {selectedClient.customer?.lastName}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{selectedClient.customer?.phone || 'Sem telefone'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-input rounded-full transition-colors"><XCircle className="w-6 h-6 text-muted-foreground" /></button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-primary-foreground mb-3 font-bold border-l-2 border-primary-foreground pl-2">Observações para o Corte</h3>
                  <div className="bg-input/30 p-4 rounded-lg text-sm text-gray-300 italic border border-border">
                    {selectedClient.notes || 'Nenhuma observação informada.'}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-primary-foreground mb-3 font-bold border-l-2 border-primary-foreground pl-2">Inteligência (CRM Rápido)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-input/30 p-3 rounded-lg border border-border">
                      <span className="block text-[10px] uppercase text-muted-foreground">Último Corte</span>
                      <span className="text-white text-sm font-bold">15 Dias Atrás</span>
                    </div>
                    <div className="bg-input/30 p-3 rounded-lg border border-border">
                      <span className="block text-[10px] uppercase text-muted-foreground">Frequência</span>
                      <span className="text-white text-sm font-bold">Alta</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL DE PAGAMENTO (CAIXA RÁPIDO) */}
      <AnimatePresence>
        {paymentModalData && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 bg-input/50 border-b border-border text-center relative">
                <button onClick={() => setPaymentModalData(null)} className="absolute right-4 top-4"><XCircle className="w-5 h-5 text-muted-foreground hover:text-white" /></button>
                <h2 className="text-xl font-bold uppercase tracking-widest text-white">Receber Pagamento</h2>
                <p className="text-xs text-muted-foreground mt-1">{paymentModalData.customer?.firstName} - {paymentModalData.service?.name}</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Valor do Serviço</span>
                  <span className="text-4xl font-mono font-bold text-primary-foreground">R$ {(paymentModalData.service?.price || 50).toFixed(2).replace('.',',')}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => processPayment('PIX', 0)} className="py-4 border border-border rounded-lg bg-input hover:bg-primary/20 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2">
                    <span className="text-xs uppercase tracking-widest font-bold text-white">PIX</span>
                  </button>
                  <button onClick={() => processPayment('CREDIT', 0)} className="py-4 border border-border rounded-lg bg-input hover:bg-primary/20 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2">
                    <span className="text-xs uppercase tracking-widest font-bold text-white">Cartão (Crédito)</span>
                  </button>
                  <button onClick={() => processPayment('DEBIT', 0)} className="py-4 border border-border rounded-lg bg-input hover:bg-primary/20 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2">
                    <span className="text-xs uppercase tracking-widest font-bold text-white">Cartão (Débito)</span>
                  </button>
                  <button onClick={() => processPayment('CASH', 0)} className="py-4 border border-border rounded-lg bg-input hover:bg-primary/20 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2">
                    <span className="text-xs uppercase tracking-widest font-bold text-white">Dinheiro</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
