'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useSearchParams } from 'next/navigation';

export default function RegisterPage() {
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    tenantName: '',
  });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/register', formData);
      const accessToken = res.data?.data?.accessToken || res.data?.accessToken;
      
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        document.cookie = `accessToken=${accessToken}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
      }
      
      const redirectUrl = searchParams.get('redirect') || '/customer';
      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Falha ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-background flex flex-col justify-center items-center p-4 pt-24 pb-24">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-card border border-border p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-foreground text-primary font-bold text-xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-primary-foreground">Criar Conta</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">Comece seu legado</p>
        </div>

        {error && (
          <div className="bg-red-900/20 text-red-400 p-3 mb-6 text-sm uppercase tracking-widest text-center border border-red-900/50">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Nome</label>
              <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors text-white" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Sobrenome</label>
              <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors text-white" />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Nome da Barbearia (Opcional se for cliente)</label>
            <input type="text" name="tenantName" value={formData.tenantName} onChange={handleChange} placeholder="Sua Barbearia" className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors text-white" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Celular (WhatsApp)</label>
            <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="(11) 99999-9999" className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors text-white" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Email</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors text-white" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Senha</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors text-white" />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full bg-primary-foreground text-primary hover:bg-white uppercase tracking-widest py-6 rounded-none text-xs mt-4">
            {loading ? 'Criando...' : 'Cadastrar'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          JÃ¡ tem uma conta? <a href="/login" className="text-primary-foreground hover:underline">Entrar</a>
        </p>
      </motion.div>
    </main>
  );
}
