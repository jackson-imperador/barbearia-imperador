'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, QrCode, PowerOff, Loader2, CheckCircle2, RefreshCcw } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminWhatsappPage() {
  const [status, setStatus] = useState<string>('DISCONNECTED');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/whatsapp/status');
      setStatus(res.data?.status || 'DISCONNECTED');
      setQrCode(res.data?.qrCode || null);
    } catch (err) {
      console.error('Erro ao buscar status do whatsapp', err);
      setStatus('ERROR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    const interval = setInterval(() => {
      if (['CONNECTING', 'WAITING_QR'].includes(status)) {
        fetchStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status]);

  const handleConnect = async () => {
    try {
      setActionLoading(true);
      await api.post('/whatsapp/connect');
      setStatus('CONNECTING');
    } catch (err) {
      alert('Erro ao iniciar conexão.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar este número?')) return;
    try {
      setActionLoading(true);
      await api.post('/whatsapp/logout');
      setStatus('DISCONNECTED');
      setQrCode(null);
    } catch (err) {
      alert('Erro ao desconectar.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="border-b border-border pb-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-primary-foreground flex items-center gap-3">
          <Smartphone className="w-8 h-8" />
          Conexão WhatsApp
        </h1>
        <p className="text-[10px] md:text-xs text-muted-foreground mt-1 uppercase tracking-widest">
          Automatize notificações para você e seus clientes
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 md:p-10 max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-10 h-10 animate-spin text-primary-foreground mb-4" />
            <p className="text-muted-foreground uppercase tracking-widest text-xs font-bold">Verificando status...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            
            {status === 'CONNECTED' && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">Aparelho Conectado</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
                  O sistema de notificações automáticas está rodando perfeitamente. O Robô enviará mensagens sempre que um agendamento for criado ou cancelado.
                </p>
                <button 
                  onClick={handleDisconnect}
                  disabled={actionLoading}
                  className="bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20 py-3 px-8 rounded font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PowerOff className="w-4 h-4" />}
                  Desconectar Aparelho
                </button>
              </motion.div>
            )}

            {status === 'WAITING_QR' && qrCode && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                <div className="mb-6 p-4 bg-white rounded-xl shadow-inner inline-block">
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Escaneie o QR Code</h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8">
                  1. Abra o WhatsApp no seu celular<br/>
                  2. Toque em Mais opções (⋮) ou Configurações<br/>
                  3. Toque em Aparelhos conectados {'>'} Conectar um aparelho
                </p>
                <div className="flex gap-4">
                  <button onClick={fetchStatus} className="text-muted-foreground hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-widest">
                    <RefreshCcw className="w-4 h-4" /> Atualizar
                  </button>
                </div>
              </motion.div>
            )}

            {(status === 'DISCONNECTED' || status === 'ERROR') && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                <div className="w-24 h-24 bg-input/50 rounded-full flex items-center justify-center mb-6 border border-border">
                  <QrCode className="w-12 h-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">Sistema Desconectado</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
                  Conecte o seu celular para habilitar o envio automático de mensagens para você e seus clientes (confirmações e cancelamentos).
                </p>
                <button 
                  onClick={handleConnect}
                  disabled={actionLoading || status === 'CONNECTING'}
                  className="bg-primary-foreground text-primary hover:opacity-90 py-4 px-10 rounded font-bold uppercase tracking-widest text-xs transition-opacity flex items-center justify-center gap-2"
                >
                  {actionLoading || status === 'CONNECTING' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Iniciando Motor...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      Gerar QR Code
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {status === 'CONNECTING' && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center py-10">
                <Loader2 className="w-16 h-16 animate-spin text-primary-foreground mb-6" />
                <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Iniciando Motor do WhatsApp</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Aguarde enquanto preparamos a sessão segura e geramos o seu QR Code único...
                </p>
              </motion.div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
