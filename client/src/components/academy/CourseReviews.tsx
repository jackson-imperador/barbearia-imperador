'use client';
import * as React from 'react';
import Image from 'next/image';

export function CourseReviews() {
  return (
    <div className="py-12">
      <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">Student Reviews</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="p-6 bg-card border border-border text-center flex flex-col items-center justify-center">
          <h4 className="text-5xl font-bold text-primary-foreground mb-2">4.9</h4>
          <div className="flex text-primary-foreground text-sm mb-2">★★★★★</div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">1.2k Ratings</p>
        </div>
        <div className="md:col-span-3 flex flex-col justify-center space-y-4">
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="flex items-center gap-4 text-sm">
              <span className="w-12 text-right text-muted-foreground">{star} Stars</span>
              <div className="flex-1 h-2 bg-input overflow-hidden">
                <div className="h-full bg-primary-foreground" style={{ width: star === 5 ? '85%' : star === 4 ? '10%' : '0%' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-6 bg-card border border-border">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-input overflow-hidden relative">
                  <Image src={`https://images.unsplash.com/photo-\${1500000000000 + i}?auto=format&fit=crop&w=100&q=80`} fill className="object-cover" alt="Student" />
                </div>
                <div>
                  <h5 className="font-bold text-sm">Marcus L.</h5>
                  <div className="text-primary-foreground text-[10px] mt-1">★★★★★</div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Oct 12, 2026</span>
            </div>
            <p className="text-sm text-gray-300">The techniques taught here completely transformed how I approach fading. Highly recommend to any aspiring barber.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
