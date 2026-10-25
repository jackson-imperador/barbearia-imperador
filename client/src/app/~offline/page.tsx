'use client';
import React from 'react';
import { Button } from '@/components/ui/Button';

export default function OfflineFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
      <div className="w-16 h-16 border-4 border-primary-foreground border-t-transparent rounded-full animate-spin mb-8"></div>
      <h1 className="text-2xl font-bold uppercase tracking-widest text-primary-foreground mb-4">Você está Offline</h1>
      <p className="text-muted-foreground mb-8">
        Parece que você perdeu a conexão com a internet. Verifique sua rede para continuar usando o aplicativo da Império Barber.
      </p>
      <Button 
        onClick={() => window.location.reload()} 
        className="bg-primary-foreground text-primary-background hover:bg-white uppercase tracking-widest font-bold"
      >
        Tentar Novamente
      </Button>
    </div>
  );
}
