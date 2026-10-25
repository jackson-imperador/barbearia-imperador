'use client';
import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface CalendarProps {
  selectedDate?: Date | null;
  onDateSelect: (date: Date) => void;
  maxDays?: number;
}

export function Calendar({ selectedDate, onDateSelect, maxDays = 7 }: CalendarProps) {
  // Generate the next 7 days
  const days = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < maxDays; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [maxDays]);

  const getDayName = (date: Date) => {
    const daysName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return daysName[date.getDay()];
  };

  const isSameDay = (d1: Date, d2?: Date | null) => {
    if (!d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex gap-3 min-w-max px-1">
        {days.map((date, idx) => {
          const selected = isSameDay(date, selectedDate);
          return (
            <button
              key={idx}
              onClick={() => onDateSelect(date)}
              className={`flex flex-col items-center justify-center min-w-[80px] h-[90px] rounded-2xl border transition-all ${
                selected 
                  ? 'border-primary bg-primary/20 text-primary-foreground shadow-[0_0_15px_rgba(255,215,0,0.2)]' 
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-input/50'
              }`}
            >
              <span className="text-xs uppercase tracking-widest font-bold mb-1">{getDayName(date)}</span>
              <span className={`text-2xl font-black ${selected ? 'text-primary-foreground' : 'text-white'}`}>
                {date.getDate().toString().padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase mt-1 opacity-70">
                {date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
