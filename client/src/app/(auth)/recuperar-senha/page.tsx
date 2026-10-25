'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

export default function RecuperarSenhaPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-card border border-border p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-foreground text-primary font-bold text-xl flex items-center justify-center mx-auto mb-4">I</div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-primary-foreground">Recuperação</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">Redefinir sua senha</p>
        </div>

        <div className="bg-input/50 p-6 rounded-lg border border-border mb-8 text-center space-y-4">
          <p className="text-sm text-foreground">
            Para garantir a segurança da sua conta, a redefinição de senha deve ser solicitada diretamente ao administrador da barbearia.
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Por favor, entre em contato via WhatsApp ou presencialmente.
          </p>
        </div>

        <a href="/login" className="block w-full">
          <Button type="button" className="w-full bg-primary-foreground text-primary hover:bg-white uppercase tracking-widest py-6 rounded-none text-xs">
            Voltar ao Login
          </Button>
        </a>
      </motion.div>
    </main>
  );
}
