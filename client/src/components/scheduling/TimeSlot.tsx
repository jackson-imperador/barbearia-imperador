'use client';
import * as React from 'react';

interface TimeSlotProps {
  time: string;
  isAvailable: boolean;
  selected: boolean;
  onClick: () => void;
}

export function TimeSlot({ time, isAvailable, selected, onClick }: TimeSlotProps) {
  return (
    <button
      disabled={!isAvailable}
      onClick={onClick}
      className={`p-2 border text-center text-sm font-medium transition-all ${
        !isAvailable 
          ? 'opacity-50 cursor-not-allowed border-border/50 text-muted-foreground' 
          : selected 
            ? 'border-primary-foreground bg-primary-foreground text-primary font-bold' 
            : 'border-border hover:border-primary-foreground/50 hover:text-primary-foreground text-foreground'
      }`}
    >
      {time}
    </button>
  );
}
