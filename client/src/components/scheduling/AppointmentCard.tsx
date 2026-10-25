'use client';
import * as React from 'react';
import { motion } from 'framer-motion';

interface AppointmentCardProps {
  appointment: any;
  onCancel?: () => void;
}

export function AppointmentCard({ appointment, onCancel }: AppointmentCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-b from-[#1E1E1E] to-[#141414] border border-white/5 rounded-3xl p-5 sm:p-6 shadow-xl shadow-black/50 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-primary-foreground/10 transition-colors"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5 relative z-10">
        <div>
          <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border mb-3 ${
            appointment.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]' :
            appointment.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
            appointment.status === 'COMPLETED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {appointment.status === 'CONFIRMED' ? '✓ Confirmado' : appointment.status === 'PENDING' ? '⏳ Aguardando Confirmação' : appointment.status === 'COMPLETED' ? 'Concluído' : 'Cancelado'}
          </span>
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-white drop-shadow-md">
            {appointment.service?.name || "Corte de Cabelo"}
          </h3>
        </div>
        <div className="flex flex-col items-start sm:items-end bg-black/30 p-3 rounded-2xl border border-white/5 shadow-inner">
          <p className="text-sm font-bold text-white/90">{new Date(appointment.startDateTime).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse"></div>
            <p className="text-lg font-black text-primary-foreground font-mono">
              {new Date(appointment.startDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5 relative z-10">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 opacity-70">Profissional</p>
          <p className="text-sm text-white font-bold tracking-wide">
            {appointment.barber?.user?.firstName ? `${appointment.barber.user.firstName} ${appointment.barber.user.lastName}` : appointment.barber?.firstName || "Barbeiro da Casa"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 opacity-70">Detalhes</p>
          <p className="text-sm text-white font-bold tracking-wide">
            {appointment.service?.duration || '30'} min • R$ {Number(appointment.service?.price || 0).toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5 relative z-10">
        {appointment.status === 'CONFIRMED' ? (
          <p className="text-[10px] text-emerald-400/80 uppercase tracking-widest">
            Seu horário está garantido. Chegue 5 minutos antes!
          </p>
        ) : appointment.status === 'PENDING' ? (
          <p className="text-[10px] text-amber-400/80 uppercase tracking-widest">
            Aguarde o barbeiro confirmar seu horário.
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
            Agendamento finalizado.
          </p>
        )}
        
        {appointment.status === 'PENDING' && onCancel && (
          <button 
            onClick={onCancel}
            className="shrink-0 text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all shadow-[0_0_10px_rgba(244,63,94,0.2)]"
          >
            Cancelar
          </button>
        )}
      </div>
    </motion.div>
  );
}
