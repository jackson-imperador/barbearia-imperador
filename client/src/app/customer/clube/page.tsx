'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Star, CheckCircle2, ShieldCheck, Crown, QrCode, Copy, RefreshCw, Loader2 } from 'lucide-react';

export default function ClubeVipPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [subscription, setSubscription] = React.useState<any>(null);
  const [vipPrices, setVipPrices] = React.useState({ prata: 120, ouro: 150 });
  
  const [paymentData, setPaymentData] = React.useState<any>(null);
  const [generatingPix, setGeneratingPix] = React.useState(false);
  const [polling, setPolling] = React.useState(false);

  const fetchVipPrices = async () => {
    try {
      const res = await api.get('/cms/settings');
      const d = res.data?.data || res.data;
      setVipPrices({
        prata: d?.vipPrataPrice ?? 120,
        ouro: d?.vipOuroPrice ?? 150
      });
    } catch {
      // silently fall back to defaults 120 / 150
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/users/me/subscription');
      setSubscription(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSubscription();
    fetchVipPrices();
  }, []);

  const handleJoinClub = async (plan: 'OURO' | 'PRATA') => {
    setGeneratingPix(true);
    try {
      const res = await api.post('/users/me/subscription/join', { plan });
      const { paymentId } = res.data;

      // Mock/test mode: backend activates immediately, no polling needed
      if (Number(paymentId) === 999999999) {
        await fetchSubscription();
        alert(`Bem-vindo ao Clube VIP ${plan}! 🎉\nSua assinatura já está ativa.`);
        return;
      }

      // Real mode: show QR code and poll for confirmation
      setPaymentData(res.data);
      pollPaymentStatus(paymentId, plan);
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar pagamento. Tente novamente.');
    } finally {
      setGeneratingPix(false);
    }
  };

  const pollPaymentStatus = async (paymentId: string, plan: 'OURO' | 'PRATA') => {
    setPolling(true);
    let attempts = 0;
    const MAX_ATTEMPTS = 24; // 2 minutes max (24 × 5s)
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await api.get(`/payments/${paymentId}/status`);
        if (res.data.status === 'approved') {
          clearInterval(interval);
          setPaymentData(null);
          setPolling(false);
          await fetchSubscription(); // Recarrega do banco
          alert(`Pagamento aprovado! Bem-vindo ao Clube VIP ${plan}! 🎉\nSua assinatura já está ativa.`);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(interval);
        setPolling(false);
        alert('Pagamento ainda não confirmado. Se já pagou, aguarde alguns instantes e recarregue a página.');
      }
    }, 5000);
  };

  const copyPix = () => {
    if (paymentData?.copiaCola) {
      navigator.clipboard.writeText(paymentData.copiaCola);
      alert('Código Copia e Cola copiado!');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-primary-foreground uppercase tracking-widest text-xs animate-pulse">Carregando...</div>;
  }

  const isVip = subscription?.isActive;
  const isOuro = subscription?.plan === 'VIP_OURO';
  const isPrata = subscription?.plan === 'VIP_PRATA';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-yellow-500 flex items-center justify-center gap-3 text-center">
          <Crown className="w-8 h-8 text-yellow-500 shrink-0" />
          Seja VIP e Corte Sem Limites
        </h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest max-w-2xl mx-auto mt-4 leading-relaxed">
          {isVip ? 'Sua assinatura exclusiva está ativa.' : 'O benefício super VIP recomendado para quem gosta do conforto de chegar, cortar sem esperar e manter o visual sempre impecável.'}
        </p>
      </div>

      {isVip ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`bg-gradient-to-br border p-8 rounded-2xl relative overflow-hidden shadow-2xl ${isOuro ? 'from-yellow-900/40 to-black border-yellow-500/50 shadow-[0_0_50px_rgba(212,175,55,0.15)]' : 'from-gray-800 to-black border-gray-400/50 shadow-[0_0_50px_rgba(156,163,175,0.15)]'}`}>
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Crown className={`w-40 h-40 ${isOuro ? 'text-yellow-500' : 'text-gray-400'}`} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border mb-4 ${isOuro ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 'bg-gray-400/20 text-gray-300 border-gray-400/30'}`}>
                <ShieldCheck className="w-4 h-4" /> Assinante Ativo
              </div>
              <h2 className="text-3xl font-black text-white mb-1">{isOuro ? 'VIP OURO' : 'VIP PRATA'}</h2>
              <p className={`text-sm font-mono ${isOuro ? 'text-yellow-500/80' : 'text-gray-400/80'}`}>
                Válido até: {new Date(subscription.endDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
            
            <div className="bg-black/50 p-4 rounded-xl border border-white/10 w-full md:w-auto flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Seus Benefícios Exclusivos</p>
                <ul className="text-sm text-white font-bold space-y-3 mt-3">
                  {isOuro ? (
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Cortes Ilimitados para você</li>
                  ) : (
                    <li className="flex flex-col">
                      <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> 1 Corte por Semana Garantido</span>
                      <span className="text-[10px] text-gray-400 mt-1 ml-6 font-normal">Economia e garantia de horário toda semana.</span>
                      {subscription.hasUsedWeeklyQuota ? (
                        <span className="text-[10px] text-red-400 mt-1 ml-6 uppercase font-black">Cota semanal utilizada</span>
                      ) : (
                        <span className="text-[10px] text-green-400 mt-1 ml-6 uppercase font-black">Cota liberada! Agende agora.</span>
                      )}
                    </li>
                  )}
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Agendamento Prioritário</li>
                </ul>
              </div>
              
              {isPrata && (
                <div className="border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center items-center md:items-start">
                  <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest mb-2 text-center md:text-left">Quer cortar sem limites?</p>
                  <button 
                    onClick={() => handleJoinClub('OURO')}
                    disabled={generatingPix}
                    className="bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-black uppercase text-[10px] px-4 py-2.5 rounded-lg hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50"
                  >
                    {generatingPix ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                    Fazer Upgrade para Ouro
                  </button>
                  <p className="text-[9px] text-gray-500 mt-2 text-center md:text-left max-w-[150px]">Pague a diferença e libere cortes ilimitados agora.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid md:grid-cols-2 gap-6">
          
          {/* PRATA */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-gradient-to-r from-gray-500 to-gray-400 p-6 text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-black/20 mix-blend-multiply" />
               <div className="relative z-10">
                 <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">VIP Prata</h2>
                 <div className="text-4xl font-black text-white mb-2">
                   <span className="text-xl align-top">R$</span> {vipPrices.prata.toFixed(0)}<span className="text-xl">,00</span>
                   <span className="text-sm text-white/80 ml-1 font-normal">/mês</span>
                 </div>
                 <p className="text-xs font-bold text-white/90">
                   Direito a 1 corte por semana.
                 </p>
               </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="bg-gray-400/10 p-1.5 rounded-full"><CheckCircle2 className="w-4 h-4 text-gray-400" /></div>
                  <div>
                    <h4 className="font-bold text-white text-sm">1 Corte Semanal</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Agende de graça uma vez por semana (7 dias).</p>
                  </div>
                </li>
              </ul>
              <button 
                onClick={() => handleJoinClub('PRATA')}
                disabled={generatingPix}
                className="w-full bg-gray-500 text-white font-black uppercase tracking-widest text-sm py-4 rounded-xl hover:bg-gray-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generatingPix ? <Loader2 className="w-5 h-5 animate-spin" /> : <Star className="w-5 h-5" />}
                Assinar PRATA
              </button>
            </div>
          </div>

          {/* OURO */}
          <div className="bg-card border border-yellow-500/50 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.15)] flex flex-col">
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 p-6 text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-black/20 mix-blend-multiply" />
               <div className="relative z-10">
                 <h2 className="text-2xl font-black text-black uppercase tracking-widest mb-2">VIP Ouro</h2>
                 <div className="text-4xl font-black text-black mb-2">
                   <span className="text-xl align-top">R$</span> {vipPrices.ouro.toFixed(0)}<span className="text-xl">,00</span>
                   <span className="text-sm text-black/70 ml-1 font-normal">/mês</span>
                 </div>
                 <p className="text-xs font-bold text-black/80 px-2 leading-relaxed">
                   Corte quantas vezes quiser, <span className="underline decoration-2">somente para você</span>, por apenas o preço fixado mensal.<br/><br/>
                   Marque horário livremente e não pague mais nada por isso!
                 </p>
               </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="bg-yellow-500/10 p-1.5 rounded-full"><CheckCircle2 className="w-4 h-4 text-yellow-500" /></div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Cortes Sem Limites (Pessoal)</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Agende o dia e horário que quiser no app. Muito mais economia e conforto para você não ter que esperar.</p>
                  </div>
                </li>
              </ul>
              <button 
                onClick={() => handleJoinClub('OURO')}
                disabled={generatingPix}
                className="w-full bg-yellow-500 text-black font-black uppercase tracking-widest text-sm py-4 rounded-xl hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generatingPix ? <Loader2 className="w-5 h-5 animate-spin" /> : <Star className="w-5 h-5" />}
                Assinar OURO
              </button>
            </div>
          </div>

        </motion.div>
      )}

      {/* MODAL DE PAGAMENTO */}
      {paymentData && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card border border-border p-6 rounded-xl flex flex-col items-center text-center max-w-sm w-full">
            <h3 className="font-bold uppercase tracking-widest text-primary-foreground text-sm mb-4">Pagamento via PIX</h3>
            
            {paymentData.qrCodeBase64 ? (
              <img src={`data:image/jpeg;base64,${paymentData.qrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48 rounded-lg mb-4 bg-white p-2" />
            ) : (
              <div className="w-48 h-48 bg-white rounded-lg mb-4 flex items-center justify-center border-4 border-dashed border-gray-300">
                  <QrCode className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mb-4">Escaneie ou copie o código abaixo:</p>
            
            <button 
              onClick={copyPix}
              className="flex items-center gap-2 bg-background border border-border text-white text-xs px-4 py-3 rounded-lg hover:border-primary-foreground/50 transition-colors w-full justify-center font-mono truncate"
            >
              <Copy className="w-4 h-4 flex-shrink-0" /> Copiar PIX
            </button>

            <div className="mt-6 flex items-center gap-2 text-xs text-primary-foreground font-bold uppercase tracking-widest animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Aguardando Confirmação...
            </div>
            
            <button onClick={() => setPaymentData(null)} className="mt-4 text-xs text-muted-foreground underline uppercase">
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
