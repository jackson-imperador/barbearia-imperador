'use client';
import * as React from 'react';

export function StatWidget({ label, value, trend, positive }: { label: string; value: string; trend?: string; positive?: boolean }) {
  return (
    <div className="p-6 bg-card border border-border flex flex-col justify-between hover:border-primary-foreground/50 transition-colors cursor-default">
      <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">{label}</h4>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded \${positive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
