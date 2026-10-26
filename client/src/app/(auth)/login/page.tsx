'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      
      // NestJS TransformInterceptor wraps responses in { data: { ... } }
      const accessToken = res.data?.data?.accessToken || res.data?.accessToken;
      const refreshToken = res.data?.data?.refreshToken || res.data?.refreshToken;
      
      if (!accessToken) {
        throw new Error('Token not received from server');
      }

      // 1. Save token to localStorage for api.ts request interceptor
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // 2. IMPORTANT: Set cookie on the client domain so proxy.ts (middleware) can read it!
      // max-age set to 1 year (365 days) to keep login saved as requested
      document.cookie = `accessToken=${accessToken}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
      
      // Fetch user profile to get roles
      const meRes = await api.get('/auth/me');
      
      // meRes could also be wrapped in data
      const userData = meRes.data?.data || meRes.data;
      
      // Map nested userRoles to an array of string role names
      let roles: string[] = [];
      if (userData?.userRoles && Array.isArray(userData.userRoles)) {
        roles = userData.userRoles.map((ur: any) => ur.role?.name).filter(Boolean);
      } else if (userData?.roles && Array.isArray(userData.roles)) {
        roles = userData.roles; // fallback just in case
      }
      
      let targetUrl = '/customer';
      const isAdmin = roles.includes('SUPER_ADMIN') || roles.includes('OWNER') || roles.includes('ADMIN');
      const isBarber = roles.includes('BARBER');

      if (isAdmin) {
        targetUrl = '/owner';
      } else if (isBarber) {
        targetUrl = '/barber/dashboard';
      }
      
      // Redirect to the originally intended page if it exists, otherwise go to default dashboard
      const redirectUrl = searchParams.get('redirect');
      if (isAdmin) {
        window.location.href = (redirectUrl && !redirectUrl.startsWith('/customer')) ? redirectUrl : '/owner';
      } else if (isBarber) {
        window.location.href = (redirectUrl && !redirectUrl.startsWith('/customer')) ? redirectUrl : '/barber/dashboard';
      } else {
        window.location.href = redirectUrl || targetUrl;
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-card border border-border p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-foreground text-primary font-bold text-xl flex items-center justify-center mx-auto mb-4">I</div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-primary-foreground">Bem-vindo de Volta</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">Entre na sua conta</p>
        </div>

        {error && (
          <div className="bg-danger/10 text-danger p-3 mb-6 text-sm uppercase tracking-widest text-center border border-danger/30">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">E-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors text-white" 
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs uppercase tracking-widest text-muted-foreground">Senha</label>
              <a href="/recuperar-senha" className="text-xs text-primary-foreground hover:underline">Esqueceu a senha?</a>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors text-white" 
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary-foreground text-primary hover:bg-white uppercase tracking-widest py-6 rounded-none text-xs">
            {loading ? 'Autenticando...' : 'Entrar'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Ainda não tem conta? <a href="/register" className="text-primary-foreground hover:underline">Cadastre-se</a>
        </p>
      </motion.div>
    </main>
  );
}