'use client';
import * as React from 'react';
import { Certificate } from '@/components/academy/Certificate';
import { Button } from '@/components/ui/Button';

export default function CertificatePage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-24">
      <div className="w-full max-w-4xl text-center mb-12">
        <h1 className="text-3xl font-bold uppercase tracking-widest mb-4">Your Certificate</h1>
        <p className="text-muted-foreground text-sm uppercase tracking-widest">Share your achievement with the world</p>
      </div>

      <div className="w-full overflow-x-auto pb-12 px-4">
        <div className="min-w-[800px]">
          <Certificate />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button className="rounded-none bg-primary-foreground text-primary hover:bg-white uppercase tracking-widest px-12 py-6 text-sm">Download PDF</Button>
        <Button variant="outline" className="rounded-none border-border text-foreground hover:bg-input hover:text-white uppercase tracking-widest px-12 py-6 text-sm">Share on LinkedIn</Button>
      </div>
    </main>
  );
}
