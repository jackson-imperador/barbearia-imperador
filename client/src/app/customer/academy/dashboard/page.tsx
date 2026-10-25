'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { AcademyCourseCard } from '@/components/academy/AcademyCourseCard';

export default function StudentDashboardPage() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-24">
      <div className="container mx-auto px-4 lg:px-12">
        <h1 className="text-xl sm:text-3xl font-bold uppercase tracking-widest mb-4 sm:mb-12 border-b border-border pb-3 sm:pb-6">My Dashboard</h1>

        {/* Continue Watching (Netflix Style) */}
        <section className="mb-16">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-6">Continue Watching</h2>
          <div className="border border-border bg-card overflow-hidden group cursor-pointer relative">
            <div className="flex flex-col md:flex-row h-full">
              <div className="w-full md:w-1/3 aspect-video relative">
                <img src="https://images.unsplash.com/photo-1512806282869-906005bd9f9e?auto=format&fit=crop&w=600&q=80" className="w-full h-full object-cover grayscale opacity-60 group-hover:opacity-100 transition-opacity" alt="Thumb" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-12 h-12 rounded-full bg-primary-foreground/90 flex items-center justify-center text-primary shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><path d="M5 3l14 9-14 9V3z"/></svg></span>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-black">
                  <div className="h-full bg-primary-foreground" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div className="p-6 md:p-8 flex flex-col justify-center flex-1">
                <p className="text-xs text-primary-foreground uppercase tracking-widest mb-2">Fade Mastery</p>
                <h3 className="text-2xl font-bold uppercase tracking-wider mb-2">1.3 - The Skin Fade Process</h3>
                <p className="text-sm text-muted-foreground mb-6">10:45 left</p>
                <a href="/academy/player/3">
                  <Button className="rounded-none bg-primary-foreground text-primary uppercase tracking-widest text-xs px-8">Resume</Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* My Courses */}
        <section className="mb-16">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-6">My Courses</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
            <AcademyCourseCard />
            <div className="border border-border bg-card p-6 flex flex-col items-center justify-center text-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
              <span className="text-4xl mb-4">+</span>
              <p className="uppercase tracking-widest text-sm font-bold">Discover More</p>
            </div>
          </div>
        </section>

        {/* Certificates */}
        <section>
          <h2 className="text-xl font-bold uppercase tracking-widest mb-6">Certificates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border bg-card p-6 flex justify-between items-center group">
              <div>
                <h4 className="font-bold uppercase tracking-wider mb-1">Classic Cuts Foundation</h4>
                <p className="text-xs text-muted-foreground">Completed on Sep 10, 2026</p>
              </div>
              <a href="/academy/certificate/123">
                <Button variant="outline" className="rounded-none border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary uppercase tracking-widest text-xs">View</Button>
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
