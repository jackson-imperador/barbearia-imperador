'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';

export function Filters() {
  return (
    <div className="w-full bg-card border border-border p-6 space-y-8">
      <div>
        <h4 className="uppercase tracking-widest text-sm font-bold mb-4 text-primary-foreground border-b border-border pb-2">Categories</h4>
        <div className="space-y-3 mt-4">
          {['Hair Care', 'Beard Grooming', 'Skin Care', 'Accessories', 'Fragrances'].map(cat => (
            <label key={cat} className="flex items-center space-x-3 cursor-pointer group">
              <Checkbox className="group-hover:border-primary-foreground transition-colors" />
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{cat}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="uppercase tracking-widest text-sm font-bold mb-4 text-primary-foreground border-b border-border pb-2">Price Range</h4>
        <div className="space-y-4 mt-4">
          <input type="range" min="0" max="200" className="w-full accent-primary-foreground" />
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>$0</span>
            <span>$200+</span>
          </div>
        </div>
      </div>
      <Button variant="outline" className="w-full rounded-none border-border uppercase tracking-widest text-xs hover:bg-white hover:text-black">Apply Filters</Button>
    </div>
  );
}
