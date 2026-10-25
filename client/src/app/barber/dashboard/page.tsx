'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Star, 
  Trophy, 
  TrendingUp, 
  User, 
  CheckCircle,
  Activity
} from 'lucide-react';

export default function BarberDashboard() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/barber-dashboard');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin text-primary">
          <Activity className="w-10 h-10" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
        Erro ao carregar dashboard.
      </div>
    );
  }

  const { agenda, metrics, nextClient } = data;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-widest text-primary-foreground font-mono">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest mt-1">
            Métricas de Desempenho e Agenda
          </p>
        </div>
        
        {nextClient && (
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-full">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Próximo Cliente em</p>
              <p className="text-xl font-bold font-mono text-primary-foreground">{nextClient.timeLeftMins} min</p>
            </div>
            <div className="border-l border-border pl-4">
              <p className="text-sm font-bold text-white">{nextClient.appointment.customer?.firstName}</p>
              <p className="text-xs text-muted-foreground">{new Date(nextClient.appointment.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
          </div>
        )}
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Daily Progress */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-20 h-20" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 text-green-400 rounded-lg"><DollarSign className="w-5 h-5"/></div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Faturamento Hoje</h3>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-bold font-mono text-white">R$ {Number(metrics.dailyRevenue || 0).toFixed(2).replace('.', ',')}</p>
            <div className="mt-4 w-full bg-input rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${metrics.dailyProgress || 0}%` }}></div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest text-right">Meta: R$ {metrics.dailyGoal}</p>
          </div>
        </motion.div>

        {/* Monthly Commission */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="w-20 h-20" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 text-primary-foreground rounded-lg"><TrendingUp className="w-5 h-5"/></div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Sua Comissão</h3>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-bold font-mono text-white">R$ {Number(metrics.commission || 0).toFixed(2).replace('.', ',')}</p>
            <div className="mt-4 w-full bg-input rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${metrics.monthlyProgress || 0}%` }}></div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest text-right">Meta Mês: R$ {metrics.monthlyGoal}</p>
          </div>
        </motion.div>

        {/* Reviews */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-card border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-500/20 text-yellow-500 rounded-lg"><Star className="w-5 h-5"/></div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Avaliações</h3>
          </div>
          <div className="mt-4 flex items-end gap-2">
            <p className="text-4xl font-bold font-mono text-white">{Number(metrics.reviews?.average || 0).toFixed(1)}</p>
            <p className="text-sm text-muted-foreground mb-1">/ 5.0</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">{metrics.reviews?.count || 0} avaliações no total</p>
        </motion.div>

        {/* Ranking */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Trophy className="w-20 h-20" />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg"><Trophy className="w-5 h-5"/></div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Seu Rank</h3>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-bold font-mono text-white">{metrics.ranking || '-'}</p>
            <p className="text-xs text-muted-foreground mt-2 uppercase tracking-widest">Entre os barbeiros da rede</p>
          </div>
        </motion.div>

      </div>

      {/* AGENDA TODAY */}
      <div className="mt-12">
        <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> Agenda de Hoje
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agenda.length === 0 ? (
            <p className="text-muted-foreground text-sm uppercase tracking-widest">Nenhum atendimento agendado para hoje.</p>
          ) : (
            agenda.map((app: any, idx: number) => (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * idx }} key={app.id} className="bg-card border border-border p-4 rounded-xl flex items-center gap-4 hover:border-primary/50 transition-colors">
                <div className="flex flex-col items-center">
                  <span className="text-lg font-bold font-mono text-white">
                    {new Date(app.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded mt-1 ${
                    app.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400' :
                    app.status === 'IN_PROGRESS' ? 'bg-primary/30 text-primary-foreground' :
                    'bg-input text-muted-foreground'
                  }`}>
                    {app.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex-1 border-l border-border pl-4">
                  <h4 className="font-bold text-sm text-white">{app.customer?.firstName} {app.customer?.lastName}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{app.service?.name}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
