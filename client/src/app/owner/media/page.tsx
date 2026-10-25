'use client';
import * as React from 'react';
import { MediaLibrary } from '@/components/media/MediaLibrary';

export default function MediaLibraryPage() {
  return (
    <div className="h-[calc(100vh-80px)]">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-widest text-primary-foreground mb-2">Biblioteca de Mídia</h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest">Gerenciamento centralizado de ativos</p>
        </div>
      </div>
      <div className="h-full border border-border">
        <MediaLibrary selectionMode="multiple" />
      </div>
    </div>
  );
}
