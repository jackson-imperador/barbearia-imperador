'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Curriculum({ interactive = false }: { interactive?: boolean }) {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(module => (
        <details key={module} className="group border border-border bg-card" open={module === 1}>
          <summary className="flex justify-between items-center font-bold uppercase tracking-widest text-sm p-4 cursor-pointer list-none bg-background/50 hover:bg-input transition-colors">
            Module {module}: Introduction to the Craft
            <span className="transition group-open:rotate-180">+</span>
          </summary>
          <div className="p-4 bg-card border-t border-border flex flex-col space-y-2">
            {[1, 2, 3].map(lesson => (
              <a 
                key={lesson} 
                href={interactive ? `/academy/player/\${lesson}` : '#'} 
                className={cn(
                  "flex justify-between items-center p-3 text-sm border border-transparent transition-colors",
                  interactive ? "hover:border-primary-foreground hover:bg-background cursor-pointer" : ""
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full border border-primary-foreground flex items-center justify-center text-[10px] text-primary-foreground">▶</span>
                  <span className="text-gray-300">1.{lesson} The History of Classic Cuts</span>
                </div>
                <span className="text-muted-foreground text-xs font-mono">15:00</span>
              </a>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
