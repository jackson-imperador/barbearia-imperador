'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/scheduling/Calendar';
import { api } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/utils';
import { CheckCircle2, Clock, User, Scissors, ArrowLeft, CheckCircle, Lock, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
function resolveUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${API_URL}${url}`;
}

export default function AgendamentoPage() {
  const router = useRouter();
  
  const [services, setServices] = React.useState<any[]>([]);
  const [barbers, setBarbers] = React.useState<any[]>([]);
  const [availableTimes, setAvailableTimes] = React.useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
  
  const [selectedService, setSelectedService] = React.useState<any>(null);
  const [selectedBarber, setSelectedBarber] = React.useState<any>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [timesLoading, setTimesLoading] = React.useState(false);
  const [subscription, setSubscription] = React.useState<any>(null);
  const [bookingSuccess, setBookingSuccess] = React.useState(false);

  // Controle do Wizard
  const [currentStep, setCurrentStep] = React.useState(1);
  const [direction, setDirection] = React.useState(1); // 1 = avançando, -1 = voltando

  const changeStep = (newStep: number) => {
    setDirection(newStep > currentStep ? 1 : -1);
    setCurrentStep(newStep);
  };

  // Check authentication FIRST — redirect to login if not logged in
  React.useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      // Save intended destination and redirect to login
      router.replace('/login?redirect=/agendamento');
      return;
    }
    setIsAuthenticated(true);
    api.get('/users/me/subscription').then(res => {
      setSubscription(res.data);
    }).catch((err: any) => {
      if (err?.statusCode === 401 || err?.response?.status === 401) {
        router.replace('/login?redirect=/agendamento');
      }
    });
  }, []);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, barbersRes] = await Promise.all([
          api.get('/services'),
          api.get('/barbers')
        ]);
        
        const s = Array.isArray(servicesRes.data) ? servicesRes.data : (servicesRes.data?.data || []);
        const b = Array.isArray(barbersRes.data) ? barbersRes.data : (barbersRes.data?.data || []);
        
        setServices(s);
        setBarbers(b);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  React.useEffect(() => {
    if (selectedDate && selectedBarber && selectedService) {
      const fetchAvailability = async () => {
        setTimesLoading(true);
        try {
          const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
          const res = await api.get(`/appointments/availability?date=${dateStr}&barberId=${selectedBarber.id}&serviceId=${selectedService.id}`);
          setAvailableTimes(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        } catch (err) {
          console.error(err);
          setAvailableTimes([]);
        } finally {
          setTimesLoading(false);
        }
      };
      fetchAvailability();
    }
  }, [selectedDate, selectedBarber, selectedService]);

  const handleConfirm = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const localDateTime = `${dateStr}T${selectedTime}:00`;
      const startDateTime = new Date(localDateTime).toISOString();

      await api.post('/appointments', {
        serviceId: selectedService.id,
        barberId: selectedBarber.id,
        startDateTime
      });

      setBookingSuccess(true);
    } catch (err: any) {
      console.error(err);
      
      const status = err.statusCode || err.response?.status;
      const message = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Falha ao confirmar agendamento. Tente novamente.';

      if (status === 401) {
        alert('Sua sessão expirou ou você precisa fazer login para concluir o agendamento.');
        router.push('/login?redirect=/agendamento');
      } else {
        alert(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // While checking auth or redirecting, show nothing
  if (isAuthenticated === null) return null;

  if (loading) return <div className="text-center p-12 text-primary-foreground uppercase tracking-widest text-xs animate-pulse">Carregando...</div>;

  // Tela de sucesso com botão WhatsApp do barbeiro
  if (bookingSuccess) {
    const barberPhone = selectedBarber?.user?.phone?.replace(/\D/g, '') || '';
    let wppBarberLink = '';
    if (barberPhone) {
      const num = barberPhone.length === 11 ? `55${barberPhone}` : barberPhone.length === 10 ? `55${barberPhone.substring(0,2)}9${barberPhone.substring(2)}` : `55${barberPhone}`;
      const dateLabel = selectedDate ? `${selectedDate.toLocaleDateString('pt-BR')} às ${selectedTime}` : '';
      const barberName = `${selectedBarber?.user?.firstName || ''} ${selectedBarber?.user?.lastName || ''}`.trim();
      const msg = encodeURIComponent(
        `Olá ${barberName}! Acabei de agendar um *${selectedService?.name || 'serviço'}* no dia ${dateLabel}. Confirma meu horário?`
      );
      wppBarberLink = `https://wa.me/${num}?text=${msg}`;
    }

    return (
      <div className="container mx-auto px-4 py-12 max-w-lg flex flex-col items-center gap-8 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-white mb-2">Agendamento Confirmado!</h1>
          <p className="text-muted-foreground text-sm">Seu horário foi agendado com sucesso. O barbeiro receberá uma notificação.</p>
        </div>

        {/* Resumo */}
        <div className="w-full bg-card/50 border border-border rounded-2xl p-5 space-y-3 text-left">
          <div className="flex items-center gap-3">
            <Scissors className="w-4 h-4 text-primary-foreground shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Serviço</p>
              <p className="font-bold text-sm text-white">{selectedService?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-primary-foreground shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Profissional</p>
              <p className="font-bold text-sm text-white">{selectedBarber?.user?.firstName} {selectedBarber?.user?.lastName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-primary-foreground shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Data e Hora</p>
              <p className="font-bold text-sm text-white">{selectedDate?.toLocaleDateString('pt-BR')} às {selectedTime}</p>
            </div>
          </div>
        </div>

        {/* Botão WhatsApp do Barbeiro */}
        {wppBarberLink ? (
          <a
            href={wppBarberLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 bg-[#25D366] text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-[#1fba58] transition-all shadow-[0_0_25px_rgba(37,211,102,0.35)] flex items-center justify-center gap-3"
          >
            <MessageCircle className="w-5 h-5" />
            Falar com o barbeiro no WhatsApp
          </a>
        ) : (
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Nenhum número de WhatsApp cadastrado para este barbeiro.</p>
        )}

        <button
          onClick={() => router.push('/customer/appointments')}
          className="text-xs text-muted-foreground uppercase tracking-widest hover:text-white transition-colors underline underline-offset-4"
        >
          Ver meus agendamentos
        </button>
      </div>
    );
  }


  const variants = {
    initial: (dir: number) => ({
      x: dir > 0 ? 50 : -50,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -50 : 50,
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' }
    })
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl min-h-[calc(100vh-100px)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-center relative mb-8">
        {currentStep > 1 && (
          <button 
            onClick={() => changeStep(currentStep - 1)}
            className="absolute left-0 p-2 text-muted-foreground hover:text-white transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl md:text-3xl font-black uppercase tracking-widest text-primary-foreground text-center">Agendar Horário</h1>
      </div>

      <div className="flex justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map(step => (
          <div key={step} className={`h-1.5 rounded-full transition-all duration-300 ${step === currentStep ? 'w-12 bg-primary' : step < currentStep ? 'w-6 bg-primary/50' : 'w-6 bg-muted/30'}`} />
        ))}
      </div>

      <div className="flex-1 relative pb-20">
        <AnimatePresence mode="wait" custom={direction}>
          
          {/* STEP 1: SERVIÇOS */}
          {currentStep === 1 && (
            <motion.section 
              key="step1" custom={direction} variants={variants} initial="initial" animate="animate" exit="exit"
              className="w-full"
            >
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary-foreground mb-6 text-center">1. Qual serviço deseja?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {services.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => {
                      setSelectedService(svc);
                      changeStep(2);
                    }}
                    className={`flex flex-col bg-card border rounded-xl overflow-hidden transition-all duration-300 active:scale-95 text-left group ${
                      selectedService?.id === svc.id 
                        ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,215,0,0.2)] scale-[1.03]' 
                        : 'border-border hover:border-primary/60'
                    }`}
                  >
                    {svc.imageUrl ? (
                      <div className="w-full h-24 sm:h-32 bg-input overflow-hidden border-b border-border/50">
                        <img src={resolveUrl(svc.imageUrl)} alt={svc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    ) : (
                      <div className="w-full h-24 sm:h-32 bg-input flex items-center justify-center border-b border-border/50">
                        <Scissors className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground opacity-20" />
                      </div>
                    )}
                    
                    <div className="p-3 flex-1 flex flex-col w-full">
                      <h3 className="font-bold text-sm sm:text-base text-white leading-tight mb-2 line-clamp-2">{svc.name}</h3>
                      <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 pt-2 border-t border-border/30">
                        <div className="text-xs sm:text-sm font-black text-primary-foreground whitespace-nowrap">R$ {svc.price}</div>
                        <div className="text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-widest"><Clock className="w-3 h-3" /> {svc.duration} min</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.section>
          )}

          {/* STEP 2: PROFISSIONAL */}
          {currentStep === 2 && (
            <motion.section 
              key="step2" custom={direction} variants={variants} initial="initial" animate="animate" exit="exit"
              className="w-full"
            >
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary-foreground mb-6 text-center">2. Escolha o Profissional</h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {barbers.map(barber => (
                  <button
                    key={barber.id}
                    onClick={() => {
                      setSelectedBarber(barber);
                      changeStep(3);
                    }}
                    className={`flex flex-col items-center p-5 rounded-xl border transition-all active:scale-95 group ${
                      selectedBarber?.id === barber.id 
                        ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,215,0,0.15)] scale-[1.03]' 
                        : 'border-border bg-card/50 hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 border transition-colors overflow-hidden ${selectedBarber?.id === barber.id ? 'bg-primary/20 border-primary/50' : 'bg-muted/30 border-border group-hover:border-primary/50'}`}>
                      {barber.user?.avatarUrl ? (
                        <img src={resolveMediaUrl(barber.user.avatarUrl)} alt={barber.user?.firstName || 'Barbeiro'} className="w-full h-full object-cover" />
                      ) : (
                        <User className={`w-6 h-6 ${selectedBarber?.id === barber.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      )}
                    </div>
                    <h3 className="font-bold uppercase tracking-widest text-primary-foreground text-center text-sm">
                      {barber.user?.firstName} {barber.user?.lastName}
                    </h3>
                    {barber.bio && <p className="text-[10px] text-muted-foreground text-center mt-2 opacity-80 line-clamp-2">{barber.bio}</p>}
                  </button>
                ))}
              </div>
            </motion.section>
          )}

          {/* STEP 3: DATA E HORA */}
          {currentStep === 3 && (
            <motion.section 
              key="step3" custom={direction} variants={variants} initial="initial" animate="animate" exit="exit"
              className="w-full"
            >
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary-foreground mb-6 text-center">3. Escolha a Data e o Horário</h2>
              <div className="bg-card/50 border border-border p-4 sm:p-5 rounded-xl max-w-xl mx-auto">
                <Calendar 
                  selectedDate={selectedDate} 
                  onDateSelect={(d) => { setSelectedDate(d); setSelectedTime(null); }} 
                  maxDays={7}
                />
                
                {selectedDate && (
                  <div className="mt-6 border-t border-border pt-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 text-center">Horários Disponíveis</h3>
                    {timesLoading ? (
                      <p className="text-[10px] text-primary-foreground uppercase animate-pulse text-center">Buscando horários...</p>
                    ) : availableTimes.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {availableTimes.map(time => (
                          <button
                            key={time}
                            onClick={() => {
                              setSelectedTime(time);
                              changeStep(4);
                            }}
                            className={`p-3 rounded-lg border text-center font-bold text-sm transition-all active:scale-95 ${
                              selectedTime === time 
                                ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,215,0,0.3)]' 
                                : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-primary-foreground'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-red-400 uppercase font-bold text-center">Nenhum horário disponível.</p>
                    )}
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* STEP 4: CONFIRMAÇÃO */}
          {currentStep === 4 && (
            <motion.section 
              key="step4" custom={direction} variants={variants} initial="initial" animate="animate" exit="exit"
              className="w-full"
            >
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary-foreground mb-6 text-center">4. Resumo e Confirmação</h2>
              
              <div className="bg-card/50 border border-border p-6 rounded-xl max-w-xl mx-auto space-y-6">
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/20 rounded-lg"><Scissors className="w-4 h-4 text-primary-foreground" /></div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Serviço</span>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-white uppercase">{selectedService?.name}</p>
                          {subscription?.isActive && subscription?.plan === 'VIP_OURO' ? (
                            <span className="text-[10px] text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded uppercase border border-green-500/20">Grátis (VIP)</span>
                          ) : subscription?.isActive && subscription?.plan === 'VIP_PRATA' && !subscription?.hasUsedWeeklyQuota ? (
                            <span className="text-[10px] text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded uppercase border border-green-500/20">Grátis (VIP Prata)</span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground opacity-70">R$ {Number(selectedService?.price || 0).toFixed(2).replace('.', ',')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/20 rounded-lg"><User className="w-4 h-4 text-primary-foreground" /></div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Profissional</span>
                      <p className="font-bold text-sm text-white uppercase">{selectedBarber?.user?.firstName} {selectedBarber?.user?.lastName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/20 rounded-lg"><Clock className="w-4 h-4 text-primary-foreground" /></div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Data e Hora</span>
                      <p className="font-bold text-sm text-white uppercase">{selectedDate?.toLocaleDateString('pt-BR')} às {selectedTime}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4 text-center">
                    Pagamento poderá ser exigido para confirmar o agendamento caso não seja assinante VIP.
                  </p>
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="w-full py-4 px-6 bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {submitting ? 'Aguarde...' : 'Confirmar Agendamento'}
                  </button>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-3 opacity-70 text-center">
                    Ao confirmar, você concorda com nossas políticas e termos. Para pagamentos no local (dinheiro), comunique o barbeiro via WhatsApp.
                  </p>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
