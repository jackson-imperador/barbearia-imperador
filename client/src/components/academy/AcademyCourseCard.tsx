'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface AcademyCourseCardProps {
  course: any;
  onView?: () => void;
}

export function AcademyCourseCard({ course, onView }: AcademyCourseCardProps) {
  return (
    <motion.div onClick={onView} whileHover={{ y: -5 }} className="group block border border-border bg-card overflow-hidden cursor-pointer relative">
      <div className="absolute top-2 left-2 z-10 bg-primary-foreground text-primary text-[10px] font-bold uppercase tracking-widest px-2 py-1">PRO</div>
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img src={course?.imageUrl || "/images/gallery-barbearia.webp"} alt={course?.title || "Curso"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
        <div className="absolute bottom-3 left-3 text-white text-xs font-bold uppercase tracking-widest">
          {course?.title || 'Academia Império'}
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{course?.instructor || 'Equipe Império'} • {course?.lessonsCount || 0} Aulas</p>
        <div className="flex items-center gap-1 text-primary-foreground text-xs mb-4">
          ★★★★★ <span className="text-muted-foreground">(5.0) • Profissional</span>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <p className="text-lg font-bold text-primary-foreground">R$ {Number(course?.price || 0).toFixed(2)}</p>
        </div>
        <Button onClick={(e) => { e.stopPropagation(); onView && onView(); }} variant="outline" className="w-full rounded-none border-border group-hover:bg-primary-foreground group-hover:text-primary uppercase tracking-widest text-xs transition-colors">Ver Curso</Button>
      </div>
    </motion.div>
  );
}
