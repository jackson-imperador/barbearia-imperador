'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { StatWidget } from '@/components/admin/StatWidget';
import { api } from '@/lib/api';
import { CreditCard, DollarSign, Calendar as CalendarIcon, Package, GraduationCap, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import Link from 'next/link';

export default function FinancialDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState('Este Mês');

  useEffect(() => {
    fetchData(period);
  }, [period]);

  const fetchData = async (selectedPeriod: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboard/financial/detailed?period=${selectedPeriod}`);
      if (res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-8 border-b border-border pb-3 sm:pb-6 gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-black uppercase tracking-widest text-primary-foreground">Financeiro</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 uppercase tracking-widest hidden sm:block">Receita, Previsto vs Realizado e Histórico</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-card border border-border px-4 py-2 text-xs uppercase tracking-widest outline-none focus:border-primary-foreground text-white rounded-md cursor-pointer hover:border-primary-foreground/50 transition-colors"
          >
            <option>Hoje</option>
            <option>Essa Semana</option>
            <option>Este Mês</option>
          </select>
        </div>
      </div>

      {error && <div className="bg-red-500/10 text-red-500 p-4 mb-4 border border-red-500/20 rounded-md font-bold text-sm uppercase tracking-widest">{error}</div>}

      {loading && !data ? (
        <div className="text-primary-foreground uppercase tracking-widest text-sm animate-pulse">Carregando dados financeiros...</div>
      ) : data ? (
        <div className="space-y-10">
          
          {/* SESSÃO 1: RESUMO FINANCEIRO (REALIZADO VS PREVISTO) */}
          <section>
            <h2 className="text-lg font-bold uppercase text-primary-foreground mb-4 border-l-4 border-primary pl-3">Resumo Geral</h2>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Link href="/barber/financial" className="bg-card border border-border p-3 sm:p-5 rounded-xl flex flex-col justify-between hover:border-primary-foreground hover:bg-card/80 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3 mb-2 text-muted-foreground group-hover:text-primary-foreground transition-colors">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <span className="text-xs uppercase tracking-widest font-bold">Receita Realizada</span>
                </div>
                <div className="text-xl sm:text-3xl font-black text-white">{formatCurrency(data.totalRevenue?.value)}</div>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase">Todo valor já recebido no caixa</p>
              </Link>

              <Link href="/barber/appointments" className="bg-card border border-border p-3 sm:p-5 rounded-xl flex flex-col justify-between hover:border-primary-foreground hover:bg-card/80 transition-colors cursor-pointer group">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground group-hover:text-primary-foreground transition-colors">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Receita Prevista</span>
                </div>
                <div className="text-xl sm:text-3xl font-black text-white">{formatCurrency(data.predictedRevenue?.value)}</div>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase">Agendamentos pendentes</p>
              </Link>

              <Link href="/barber/appointments" className="bg-card border border-border p-3 sm:p-5 rounded-xl flex flex-col justify-between hover:border-primary-foreground hover:bg-card/80 transition-colors cursor-pointer group">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground group-hover:text-primary-foreground transition-colors">
                  <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Serviços Recebido</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">{formatCurrency(data.servicesRevenue?.value)}</div>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase">Apenas serviços pagos</p>
              </Link>

              <Link href="/barber/store/orders" className="bg-card border border-border p-3 sm:p-5 rounded-xl flex flex-col justify-between hover:border-primary-foreground hover:bg-card/80 transition-colors cursor-pointer group">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground group-hover:text-primary-foreground transition-colors">
                  <Package className="w-4 h-4 text-purple-500 shrink-0" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">Produtos &amp; Cursos</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">{formatCurrency((data.productsRevenue?.value || 0) + (data.academyRevenue?.value || 0))}</div>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase">Lojas e Academia</p>
              </Link>
            </div>
          </section>

          {/* SESSÃO 2: MÉTRICAS DE QUANTIDADE */}
          <section>
            <h2 className="text-lg font-bold uppercase text-primary-foreground mb-4 border-l-4 border-primary pl-3">Métricas de Volume</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-4">
              <Link href="/barber/financial" className="bg-card/50 border border-border p-4 rounded-xl text-center hover:border-primary-foreground hover:bg-card transition-colors cursor-pointer group">
                <div className="text-2xl font-black text-white">{data.summary?.qtySales || 0}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 group-hover:text-primary-foreground transition-colors">Total Vendas/Recebimentos</div>
              </Link>
              <Link href="/barber/appointments" className="bg-card/50 border border-border p-4 rounded-xl text-center hover:border-primary-foreground hover:bg-card transition-colors cursor-pointer group">
                <div className="text-2xl font-black text-white">{data.summary?.qtyServices || 0}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 group-hover:text-primary-foreground transition-colors">Serviços Recebidos</div>
              </Link>
              <Link href="/barber/appointments" className="bg-card/50 border border-border p-4 rounded-xl text-center hover:border-primary-foreground hover:bg-card transition-colors cursor-pointer group">
                <div className="text-2xl font-black text-white">{data.summary?.scheduledAppointments || 0}</div>
                <div className="text-[10px] uppercase tracking-widest text-amber-500 mt-1">Agendamentos (Marcados)</div>
              </Link>
              <Link href="/barber/store/orders" className="bg-card/50 border border-border p-4 rounded-xl text-center hover:border-primary-foreground hover:bg-card transition-colors cursor-pointer group">
                <div className="text-2xl font-black text-white">{data.summary?.qtyOrders || 0}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 group-hover:text-primary-foreground transition-colors">Pedidos Loja</div>
              </Link>
              <Link href="/barber/courses" className="bg-card/50 border border-border p-4 rounded-xl text-center hover:border-primary-foreground hover:bg-card transition-colors cursor-pointer group">
                <div className="text-2xl font-black text-white">{data.summary?.qtyCourses || 0}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 group-hover:text-primary-foreground transition-colors">Cursos Vendidos</div>
              </Link>
            </div>
          </section>

          {/* SESSÃO 3: HISTÓRICO DE TRANSAÇÕES */}
          <section>
            <h2 className="text-lg font-bold uppercase text-primary-foreground mb-4 border-l-4 border-primary pl-3">Histórico de Transações</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {data.history && data.history.length > 0 ? (
                <div className="space-y-4">
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto border border-border rounded-xl">
                    <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/20 border-b border-border">
                        <th className="p-4 text-xs uppercase tracking-widest text-muted-foreground font-bold">Data</th>
                        <th className="p-4 text-xs uppercase tracking-widest text-muted-foreground font-bold">Descrição</th>
                        <th className="p-4 text-xs uppercase tracking-widest text-muted-foreground font-bold">Origem</th>
                        <th className="p-4 text-xs uppercase tracking-widest text-muted-foreground font-bold">Método</th>
                        <th className="p-4 text-xs uppercase tracking-widest text-muted-foreground font-bold text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.history.map((tx: any) => (
                        <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                          <td className="p-4 text-sm text-white">{formatDate(tx.date)}</td>
                          <td className="p-4 text-sm text-white max-w-xs truncate">{tx.description}</td>
                          <td className="p-4">
                            <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded ${
                              tx.origin === 'Serviço/Corte' ? 'bg-blue-500/20 text-blue-400' :
                              tx.origin === 'Produto' ? 'bg-purple-500/20 text-purple-400' :
                              tx.origin === 'Curso' ? 'bg-green-500/20 text-green-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {tx.origin}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground uppercase">{tx.paymentMethod}</td>
                          <td className={`p-4 text-sm font-bold text-right ${tx.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden flex flex-col gap-3 p-3">
                    {data.history.map((tx: any) => (
                      <div key={tx.id} className="bg-card/50 border border-border/50 rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div className="text-sm font-bold text-white max-w-[65%] truncate">{tx.description}</div>
                          <div className={`text-sm font-bold text-right shrink-0 ${tx.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                            {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </div>
                        </div>
                        <div className="flex justify-between items-end border-t border-border/50 pt-2 mt-1">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground">{formatDate(tx.date)}</span>
                            <span className="text-[10px] uppercase text-muted-foreground font-bold">{tx.paymentMethod}</span>
                          </div>
                          <span className={`text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${
                            tx.origin === 'Serviço/Corte' ? 'bg-blue-500/20 text-blue-400' :
                            tx.origin === 'Produto' ? 'bg-purple-500/20 text-purple-400' :
                            tx.origin === 'Curso' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {tx.origin}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground uppercase tracking-widest text-xs font-bold">
                  Nenhuma transação encontrada neste período.
                </div>
              )}
            </div>
          </section>

        </div>
      ) : null}
    </div>
  );
}
