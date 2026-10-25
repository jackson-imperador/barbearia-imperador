'use client';
import * as React from 'react';

export function LessonPlayer() {
  return (
    <div className="w-full bg-black border border-border aspect-video relative flex items-center justify-center group overflow-hidden shadow-2xl">
      {/* Netflix style player placeholder */}
      <img src="https://images.unsplash.com/photo-1512806282869-906005bd9f9e?auto=format&fit=crop&w=1200&q=80" className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale" alt="Video cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50"></div>
      
      <button className="relative z-10 w-20 h-20 rounded-full border-2 border-white/50 bg-black/30 backdrop-blur-md flex items-center justify-center hover:scale-110 hover:border-primary-foreground transition-all duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-2"><path d="M5 3l14 9-14 9V3z"/></svg>
      </button>

      {/* Player Controls (Mock) */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col">
        <div className="w-full h-1 bg-white/20 mb-4 cursor-pointer relative">
          <div className="absolute left-0 top-0 h-full bg-primary-foreground" style={{ width: '35%' }}></div>
        </div>
        <div className="flex justify-between items-center text-xs text-white uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <button><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg></button>
            <button><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg></button>
            <span>12:45 / 45:00</span>
          </div>
          <div className="flex items-center gap-4">
            <button>CC</button>
            <button><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"/><path d="M7 2v20M17 2v20M2 12h20"/></svg></button>
          </div>
        </div>
      </div>
    </div>
  );
}
