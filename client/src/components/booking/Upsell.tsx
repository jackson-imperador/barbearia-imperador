'use client';
import * as React from 'react';
import { ShoppingBag, BookOpen, Star, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export function SmartUpsell() {
  const [added, setAdded] = React.useState<number[]>([]);

  const products = [
    { id: 1, type: 'product', name: 'Pomada Matte 150g', price: 69.90, desc: 'Perfeito para manter o corte', image: 'https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?auto=format&fit=crop&w=200&q=80' },
    { id: 2, type: 'course', name: 'Curso de Autocuidado', price: 97.00, desc: 'Aprenda a fazer a barba em casa', image: 'https://images.unsplash.com/photo-1593702288056-ccbf90343eac?auto=format&fit=crop&w=200&q=80' }
  ];

  const handleAdd = (id: number) => {
    if (added.includes(id)) {
      setAdded(added.filter(i => i !== id));
    } else {
      setAdded([...added, id]);
    }
  };

  return (
    <div className="bg-card border border-primary-foreground/30 rounded-2xl p-6 relative overflow-hidden mt-8">
      <div className="absolute top-0 right-0 bg-primary-foreground text-primary text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-bl-lg">Oferta Exclusiva</div>
      
      <div className="flex items-center gap-2 mb-6">
        <Star className="w-5 h-5 text-primary-foreground fill-current" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-white">Complete sua Experiência</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products.map(p => (
          <motion.div whileHover={{ scale: 1.02 }} key={p.id} className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer ${added.includes(p.id) ? 'bg-primary/10 border-primary-foreground' : 'bg-input/50 border-border hover:border-primary-foreground/50'}`} onClick={() => handleAdd(p.id)}>
            <div className="w-16 h-16 bg-black rounded overflow-hidden flex-shrink-0 relative">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                {p.type === 'product' ? <ShoppingBag className="w-4 h-4 text-white" /> : <BookOpen className="w-4 h-4 text-white" />}
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-sm leading-tight">{p.name}</h4>
              <p className="text-[10px] text-muted-foreground mt-1">{p.desc}</p>
              <p className="text-primary-foreground font-bold font-mono text-sm mt-1">+ R$ {p.price.toFixed(2).replace('.',',')}</p>
            </div>
            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${added.includes(p.id) ? 'bg-primary-foreground border-primary-foreground text-black' : 'border-muted-foreground text-muted-foreground'}`}>
              <Plus className="w-4 h-4" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
