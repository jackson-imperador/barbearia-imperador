"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, Users, DollarSign, Calendar, ChevronUp, ChevronDown, 
  ArrowUpRight, BarChart3, Activity, PieChart, Star, Crown
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from "recharts";
import Link from 'next/link';
import { api } from "@/lib/api";

const dataRevenue = [
  { name: 'Seg', total: 1200 },
  { name: 'Ter', total: 1800 },
  { name: 'Qua', total: 1500 },
  { name: 'Qui', total: 2400 },
  { name: 'Sex', total: 3200 },
  { name: 'Sáb', total: 4500 },
  { name: 'Dom', total: 3800 },
];

const dataAppointments = [
  { name: '08:00', appointments: 4 },
  { name: '10:00', appointments: 7 },
  { name: '12:00', appointments: 5 },
  { name: '14:00', appointments: 9 },
  { name: '16:00', appointments: 12 },
  { name: '18:00', appointments: 15 },
  { name: '20:00', appointments: 8 },
];

export default function OwnerDashboard() {
  const [period, setPeriod] = useState("Mês");
  const [overview, setOverview] = useState<any>(null);
  const [financial, setFinancial] = useState<any>(null);
  const [customers, setCustomers] = useState<any>(null);
  const [appointments, setAppointments] = useState<any>(null);
  const [ranking, setRanking] = useState<any>({ topBarbers: [], topServices: [] });
  const [growth, setGrowth] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ovRes, finRes, cusRes, appRes, rankRes, groRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/financial'),
          api.get('/dashboard/customers'),
          api.get('/dashboard/appointments'),
          api.get('/dashboard/ranking'),
          api.get('/dashboard/growth')
        ]);
        setOverview(ovRes.data);
        setFinancial(finRes.data);
        setCustomers(cusRes.data);
        setAppointments(appRes.data);
        setRanking(rankRes.data);
        setGrowth(groRes.data);
      } catch (err) {
        console.error("Erro ao buscar dados do dashboard", err);
      }
    };
    fetchDashboardData();
  }, []);

  const getRevenueForPeriod = () => {
    if (!overview) return 0;
    switch(period) {
      case 'Hoje': return overview.revenue.today;
      case 'Semana': return overview.revenue.week;
      case 'Mês': return overview.revenue.month;
      case 'Ano': return overview.revenue.month; // Fallback
      default: return overview.revenue.month;
    }
  };

  const kpis = [
    { title: "Faturamento Total", href: "/owner/financial", value: overview ? `R$ ${getRevenueForPeriod().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "R$ --", change: growth ? `${growth.monthlyGrowth > 0 ? '+' : ''}${growth.monthlyGrowth}%` : "--", icon: <DollarSign />, trend: growth && growth.monthlyGrowth >= 0 ? "up" : "down" },
    { title: "Agendamentos", href: "/owner/appointments", value: financial?.quantidadeVendas || "--", change: appointments ? `${appointments.taxaComparecimento}% comp.` : "--", icon: <Calendar />, trend: "up" },
    { title: "Novos Clientes", href: "/owner/customers", value: customers?.clientesNovos || "--", change: growth ? `+${growth.newCustomers}` : "--", icon: <Users />, trend: "up" },
    { title: "Ticket Médio", href: "/owner/financial", value: overview ? `R$ ${overview.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "R$ --", change: "--", icon: <TrendingUp />, trend: "up" },
  ];

  const chartDataRevenue = [
    { name: 'Hoje', total: overview?.revenue.today || 0 },
    { name: 'Semana', total: overview?.revenue.week || 0 },
    { name: 'Mês', total: overview?.revenue.month || 0 },
  ];

  return (
    <div className="text-zinc-300 font-sans pb-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 sm:gap-6 mb-4 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
            Dashboard <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm hidden sm:block">Visão geral do império. Acompanhe métricas, ranking e crescimento.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800 w-full md:w-auto">
          {["Hoje", "Semana", "Mês", "Ano"].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                period === p ? "bg-amber-600 text-white shadow-lg" : "text-zinc-500 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-8">
        {kpis.map((kpi, i) => (
          <Link href={kpi.href} key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 sm:p-5 md:p-6 relative overflow-hidden group hover:border-amber-500/30 transition-colors block">
            <div className="absolute -right-4 -top-4 w-16 h-16 sm:w-24 sm:h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
            <div className="flex flex-row justify-between items-start gap-1 mb-2 sm:mb-4">
              <div className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-500 shrink-0">
                {kpi.icon}
              </div>
              <div className={`flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md ${
                kpi.trend === "up" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
              }`}>
                {kpi.trend === "up" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <span className="truncate">{kpi.change}</span>
              </div>
            </div>
            <div className="text-zinc-400 text-[9px] sm:text-xs md:text-sm font-medium mb-0.5 sm:mb-1 truncate">{kpi.title}</div>
            <div className="text-base sm:text-2xl md:text-3xl font-black text-white truncate">{kpi.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-xl sm:rounded-2xl p-3 sm:p-6">
          <div className="flex justify-between items-center mb-3 sm:mb-8">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" /> Faturamento Acumulado
            </h3>
            <Link href="/owner/financial" className="text-amber-500 text-sm font-bold flex items-center gap-1 hover:underline">
              Relatório Completo <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="h-[180px] sm:h-[260px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d97706" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#d97706', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="total" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Barbers Ranking */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 overflow-y-auto max-h-[300px] sm:max-h-[400px]">
          <h3 className="text-sm sm:text-lg font-bold text-white mb-3 sm:mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" /> Ranking da Equipe
          </h3>
          <div className="space-y-4">
            {ranking.topBarbers.length > 0 ? ranking.topBarbers.map((barber: any, i: number) => (
              <Link href="/owner/barbers" key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center font-bold text-white">
                      {barber.avatar}
                    </div>
                    {i === 0 && <div className="absolute -top-2 -right-2 text-amber-500"><Crown className="w-4 h-4 fill-amber-500" /></div>}
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{barber.name}</div>
                    <div className="text-zinc-500 text-xs">{barber.role}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-sm">{barber.value}</div>
                  <div className="text-amber-500 text-xs flex items-center justify-end gap-1">
                    <Activity className="w-3 h-3" /> {barber.score} atends
                  </div>
                </div>
              </Link>
            )) : <div className="text-zinc-500 text-sm">Nenhum barbeiro classificado.</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
        {/* Top Services Activity */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl sm:rounded-2xl p-3 sm:p-6">
          <h3 className="text-sm sm:text-lg font-bold text-white mb-3 sm:mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" /> Top Serviços Realizados
          </h3>
          <div className="h-[160px] sm:h-[220px] md:h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranking.topServices} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                />
                <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights AI */}
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl sm:rounded-2xl p-3 sm:p-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-600/10 rounded-full blur-3xl" />
          <h3 className="text-sm sm:text-lg font-bold text-white mb-3 sm:mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-500" /> Insights Gerados
          </h3>
          
          <div className="space-y-4 relative z-10 overflow-y-auto max-h-[250px]">
            {overview?.insights?.length > 0 ? overview.insights.map((insight: string, i: number) => (
              <div key={i} className="p-4 rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-200">
                <p className="text-sm font-medium leading-relaxed">
                  {insight}
                </p>
              </div>
            )) : (
               <div className="p-4 rounded-xl border bg-zinc-800/50 border-zinc-700 text-zinc-300">
                <p className="text-sm font-medium leading-relaxed">
                  Sem insights disponíveis no momento.
                </p>
              </div>
            )}
            
            {appointments?.taxaFaltas > 10 && (
              <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-rose-200">
                <p className="text-sm font-medium leading-relaxed">
                  A taxa de faltas está em {appointments.taxaFaltas}%. Verifique a política de no-show.
                </p>
              </div>
            )}
            
            {customers?.clientesInativos > 0 && (
              <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-rose-200">
                <p className="text-sm font-medium leading-relaxed">
                  Você tem {customers.clientesInativos} clientes inativos há mais de 30 dias.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
