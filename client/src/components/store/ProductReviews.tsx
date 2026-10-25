'use client';
import * as React from 'react';

export function ProductReviews() {
  return (
    <div className="py-12 border-t border-border">
      <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">Avaliações de Clientes</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="p-6 bg-card border border-border text-center flex flex-col items-center justify-center">
          <h4 className="text-5xl font-bold text-primary-foreground mb-2">4.9</h4>
          <div className="flex text-primary-foreground text-sm mb-2">★★★★★</div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Baseado em 128 Avaliações</p>
        </div>
        <div className="md:col-span-2 flex flex-col justify-center space-y-4">
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="flex items-center gap-4 text-sm">
              <span className="w-20 text-right">{star} Estrelas</span>
              <div className="flex-1 h-2 bg-input overflow-hidden">
                <div className="h-full bg-primary-foreground" style={{ width: star === 5 ? '85%' : star === 4 ? '10%' : '2%' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        {[1, 2].map(i => (
          <div key={i} className="border-b border-border pb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h5 className="font-bold">{i === 1 ? 'Carlos Silva' : 'Marcos Paulo'}</h5>
                <div className="text-primary-foreground text-xs mt-1">★★★★★</div>
              </div>
              <span className="text-xs text-muted-foreground">12 Out, 2026</span>
            </div>
            <p className="text-sm text-gray-300">Qualidade excepcional do produto. A textura e a fixação são exatamente como descritas. Vale cada centavo para uma rotina de cuidados premium.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
