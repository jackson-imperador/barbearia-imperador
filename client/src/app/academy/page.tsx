'use client';
import * as React from 'react';
import { PlayCircle, Award, Star, BookOpen, Clock, Download, MessageSquare } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function AcademyPage() {
  const [courses, setCourses] = React.useState<any[]>([]);
  const [cmsSettings, setCmsSettings] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        const data = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.data || [];
        
        const formatted = data.map((c: any) => {
          // Resolve image URL
          let rawUrl = c.image?.url || c.thumbnailUrl || (typeof c.image === 'string' ? c.image : null);
          let imageUrl = rawUrl;
          if (imageUrl && !imageUrl.startsWith('http')) {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            imageUrl = `${baseUrl}${imageUrl}`;
          }
          
          return {
            ...c,
            instructor: c.instructor || 'Mestre da Barbearia',
            modules: c.modules || 1,
            lessons: c.lessons || 10,
            duration: c.duration || '2h',
            rating: c.rating || 5.0,
            image: imageUrl || 'https://images.unsplash.com/photo-1593702288056-ccbf90343eac?auto=format&fit=crop&w=800&q=80',
            myProgress: 0,
          };
        });
        
        setCourses(formatted);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchCmsSettings = async () => {
      try {
        const res = await api.get('/cms/settings');
        const d = res.data?.data || res.data;
        setCmsSettings(d);
      } catch (err) {
        console.error('Erro ao carregar configurações CMS', err);
      }
    };

    fetchCourses();
    fetchCmsSettings();
  }, []);

  const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${api.defaults.baseURL}${url}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Academy Hero */}
      <div className="relative h-[300px] md:h-[400px] w-full flex items-center justify-center overflow-hidden border-b border-primary-foreground/30">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url('${
              cmsSettings?.academyBanner?.url ? resolveUrl(cmsSettings.academyBanner.url) :
              'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1600&q=80'
            }')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="relative z-10 text-center px-4 max-w-2xl">
          <span className="text-primary-foreground text-xs uppercase tracking-[0.3em] font-bold mb-4 block">Formação Profissional</span>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-widest text-white mb-4 leading-tight">
            {cmsSettings?.academyName || 'Academy Premium'}
          </h1>
          <p className="text-sm text-gray-300">
            {cmsSettings?.academyDescription || 'Domine as técnicas avançadas e a gestão financeira para faturar como uma barbearia de elite.'}
          </p>
        </div>
      </div>


      <div className="max-w-[1200px] mx-auto px-4 py-12 space-y-16">
        
        {/* Meus Cursos (Continuar Assistindo) */}
        {courses.filter(c => c.myProgress > 0).length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <PlayCircle className="w-5 h-5 text-primary-foreground" />
              <h2 className="text-lg font-bold uppercase tracking-widest text-white">Continuar Assistindo</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.filter(c => c.myProgress > 0).map(c => (
                <div key={c.id} className="bg-card border border-border p-4 rounded-xl flex flex-col md:flex-row gap-6 hover:border-primary-foreground/50 transition">
                  <div className="w-full md:w-48 aspect-video bg-input rounded-lg overflow-hidden relative flex-shrink-0">
                    <img src={c.image} alt={c.title || c.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <PlayCircle className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-[10px] uppercase tracking-widest text-primary-foreground mb-1">Módulo 3 • Aula 12</span>
                    <h3 className="font-bold text-white mb-4 line-clamp-2">{c.title || c.name}</h3>
                    <div className="w-full bg-input h-2 rounded-full overflow-hidden mb-2">
                      <div className="bg-primary-foreground h-full rounded-full" style={{ width: `${c.myProgress}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
                      <span>{c.myProgress}% Concluído</span>
                      <span className="text-white hover:text-primary-foreground cursor-pointer flex items-center gap-1"><Award className="w-3 h-3"/> Certificado</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Todos os Cursos */}
        <section>
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
            <h2 className="text-lg font-bold uppercase tracking-widest text-white">Cursos Disponíveis</h2>
          </div>
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {courses.map(c => (
                <div key={c.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary-foreground/50 transition group flex flex-col">
                  <div className="relative aspect-video bg-input">
                    <img src={c.image} alt={c.title || c.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur px-2 py-1 rounded flex items-center gap-1 text-[10px] text-white font-bold">
                      <Star className="w-3 h-3 fill-primary-foreground text-primary-foreground" /> {c.rating}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-white mb-2">{c.title || c.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4">Com {c.instructor}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      <div className="bg-input/50 p-2 rounded flex items-center gap-2 text-xs text-gray-300">
                        <BookOpen className="w-4 h-4 text-primary-foreground" /> {c.lessons} Aulas
                      </div>
                      <div className="bg-input/50 p-2 rounded flex items-center gap-2 text-xs text-gray-300">
                        <Clock className="w-4 h-4 text-primary-foreground" /> {c.duration}
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                      {Number(c.price) === 0 ? (
                        <span className="text-xl font-black text-amber-500">Gratuito</span>
                      ) : (
                        <span className="text-xl font-black text-white">R$ {(Number(c.price) || 0).toFixed(2).replace('.',',')}</span>
                      )}
                      <Link href={`/customer/academy/course/${c.id}`} className="bg-primary-foreground text-primary uppercase text-xs font-bold px-6 py-2 rounded hover:opacity-90 transition inline-block text-center">
                        {Number(c.price) === 0 ? 'ASSISTIR' : 'MATRICULAR'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-xl border border-border">
              <BookOpen className="w-12 h-12 text-primary-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nenhum curso disponível</h3>
              <p className="text-muted-foreground">Em breve lançaremos novos cursos premium.</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
