'use client';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function ProductGallery({ images }: { images: string[] }) {
  const [active, setActive] = React.useState(0);
  return (
    <div className="flex flex-col md:flex-row-reverse gap-6">
      <div className="w-full md:w-4/5 aspect-square bg-card border border-border flex items-center justify-center p-8 relative overflow-hidden group">
        <AnimatePresence mode="wait">
          <motion.div 
            key={active}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full relative"
          >
            <Image 
              src={images[active]} 
              alt="Product detail" 
              fill
              className="object-contain drop-shadow-2xl mix-blend-screen" 
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="w-full md:w-1/5 flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto no-scrollbar">
        {images.map((img, i) => (
          <button 
            key={i} 
            onClick={() => setActive(i)}
            className={cn(
              "shrink-0 w-20 md:w-full aspect-square border p-2 transition-all duration-300",
              active === i ? "border-primary-foreground bg-card" : "border-border bg-background hover:border-primary-foreground/50 opacity-60 hover:opacity-100"
            )}
          >
            <div className="w-full h-full relative">
              <Image src={img} alt="Thumbnail" fill className="object-contain mix-blend-screen" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
