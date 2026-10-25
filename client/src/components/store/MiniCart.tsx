'use client';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

export function MiniCart({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-card border-l border-border z-50 flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-border flex justify-between items-center bg-background">
              <h3 className="font-bold uppercase tracking-widest text-lg">Your Bag</h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-20 h-20 bg-background border border-border p-2 relative">
                    <Image src="https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?auto=format&fit=crop&w=150&q=80" alt="Product" fill className="object-contain mix-blend-screen" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold uppercase">Matte Clay Pomade</h4>
                      <p className="text-xs text-muted-foreground mt-1">100g • Signature Scent</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-medium text-primary-foreground">$28.00</span>
                      <button className="text-xs text-danger hover:underline">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-border bg-background">
              <div className="flex justify-between items-center mb-6">
                <span className="uppercase text-sm tracking-widest text-muted-foreground">Subtotal</span>
                <span className="text-xl font-bold text-primary-foreground">$56.00</span>
              </div>
              <a href="/store/checkout">
                <Button className="w-full rounded-none bg-primary-foreground text-primary hover:bg-white uppercase tracking-widest py-6">Checkout</Button>
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
