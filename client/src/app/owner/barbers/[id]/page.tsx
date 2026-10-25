'use client';
import * as React from 'react';
import { useState, useEffect, use } from 'react';
import { api } from '@/lib/api';
import { ArrowLeft, CreditCard, DollarSign, Clock, Calendar, Scissors, User } from 'lucide-react';
import Link from 'next/link';
import { resolveMediaUrl } from '@/lib/utils';
import { AppointmentCard } from '@/components/scheduling/AppointmentCard';

export default function BarberReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const barberId = resolvedParams.id;
  
  const [loading, setLoading] = useState(true);
  const [barber, setBarber] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [period, setPeriod] = useState('Este Mês');

  useEffect(() => {
    fetchData(period);
  }, [period, barberId]);

  const fetchData = async (selectedPeriod: string) => {
    try {
      setLoading(true);
      
      const [barberRes, metricsRes, finRes, apptRes] = await Promise.all([
        api.get(`/barbers/${barberId}`),
        api.get(`/dashboard/overview?barberId=${barberId}`),
        api.get(`/dashboard/financial/detailed?period=${selectedPeriod}&barberId=${barberId}`),
        api.get(`/appointments?barberId=${barberId}&limit=10`) // get the 10 most recent
      ]);

      setBarber(barberRes.data?.data || barberRes.data);
      setMetrics(metricsRes.data);
      setFinancials(finRes.data);
      setAppointments(Array.isArray(apptRes.data) ? apptRes.data : (apptRes.data?.data || []));
      
    } catch (err) {
      console.error('Failed to load barber report:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  if (loading && !barber) {
    return <div className="text-center p-12 uppercase tracking-widest text-xs text-muted-foreground animate-pulse">Carregando relatório do barbeiro...</div>;
  }

  if (!barber) {
    return <div className="text-center p-12 text-red-500 uppercase tracking-widest text-xs">Barbeiro não encontrado.</div>;
  }

  const user = barber.user || {};

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 border-b border-border pb-6">
        <Link href="/owner/barbers" className="p-2 bg-card border border-border rounded-lg hover:bg-input transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-white" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 overflow-hidden flex items-center justify-center">
            {user.avatarUrl ? (
              <img src={resolveMediaUrl(user.avatarUrl)} alt={user.firstName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-xl text-primary-foreground">{(user.firstName?.[0] || 'B')}{(user.lastName?.[0] || '')}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-primary-foreground">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 uppercase tracking-widest flex items-center gap-1">
              <Scissors className="w-3 h-3" /> Relatório de Desempenho
            </p>
          </div>
        </div>
        
        <div className="md:ml-auto mt-4 md:mt-0">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-card border border-border px-4 py-2 text-xs uppercase tracking-widest outline-none focus:border-primary-foreground text-white rounded-md cursor-pointer hover:border-primary-foreground/50 transition-colors"
          >
            <option>Hoje</option>
            <option>Essa Semana</option>
            <option>Este Mês</option>
            <option>Este Ano</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-b from-card to-card/50 border border-border p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Valor Adquirido (Realizado)</span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-white">{formatCurrency(financials?.totalRevenue?.value)}</div>
        </div>
        
        <div className="bg-gradient-to-b from-card to-card/50 border border-border p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Valor Previsto (Aguardando)</span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-white">{formatCurrency(financials?.predictedRevenue?.value)}</div>
        </div>

        <div className="bg-gradient-to-b from-card to-card/50 border border-border p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Scissors className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Serviços Operados</span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-white">{metrics?.appointmentsCount || 0}</div>
        </div>

        <div className="bg-gradient-to-b from-card to-card/50 border border-border p-5 rounded-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <User className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Clientes Atendidos</span>
          </div>
          <div className="text-2xl md:text-3xl font-black text-white">{metrics?.customersCount || 0}</div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-sm font-bold text-primary-foreground uppercase tracking-widest border-b border-border pb-4 mb-6">Últimos Serviços Operados</h2>
        
        {appointments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {appointments.map(apt => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        ) : (
          <div className="text-center p-10 bg-card border border-border rounded-xl">
            <p className="text-muted-foreground text-xs uppercase tracking-widest">Nenhum serviço registrado neste período.</p>
          </div>
        )}
      </div>
    </div>
  );
}
