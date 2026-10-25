'use client';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Lock, CheckCircle2, Circle, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function PlayerPage() {
  const { lessonId } = useParams() as { lessonId: string };
  const router = useRouter();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watched, setWatched] = useState(false);
  const [markingWatched, setMarkingWatched] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!lessonId) return;
    const fetchLesson = async () => {
      try {
        const res = await api.get(`/courses/lessons/play/${lessonId}`);
        setLesson(res.data);

        // Fetch progress to know which lessons are completed
        try {
          const progressRes = await api.get(`/courses/player/${lessonId}`);
          const completedIds: string[] = progressRes.data?.completedLessons || [];
          setCompletedLessons(new Set(completedIds));
          setWatched(completedIds.includes(lessonId));
        } catch {
          // progress endpoint may not exist — ignore
        }

        // Open the module containing this lesson by default
        const course = res.data?.module?.course;
        if (course?.modules) {
          const parentModule = course.modules.find((m: any) =>
            m.lessons?.some((l: any) => l.id === lessonId)
          );
          if (parentModule) {
            setOpenModules({ [parentModule.id]: true });
          }
        }
      } catch (err: any) {
        if (err.statusCode === 403 || err.response?.status === 403) {
          setError('Você não tem acesso a esta aula. Matricule-se no curso para assistir.');
        } else {
          setError('Erro ao carregar a aula. Tente novamente mais tarde.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId]);

  const markAsWatched = async () => {
    if (watched || markingWatched) return;
    setMarkingWatched(true);
    try {
      await api.post(`/courses/lessons/${lessonId}/complete`);
      setWatched(true);
      setCompletedLessons(prev => new Set([...prev, lessonId]));
    } catch {
      // Fallback: mark locally even if API doesn't have endpoint yet
      setWatched(true);
      setCompletedLessons(prev => new Set([...prev, lessonId]));
    } finally {
      setMarkingWatched(false);
    }
  };

  // Auto-mark as watched when video ends
  const handleVideoEnded = () => markAsWatched();

  const goToNextLesson = () => {
    const course = lesson?.module?.course;
    if (!course?.modules) return;
    const allLessons = course.modules.flatMap((m: any) => m.lessons || []);
    const idx = allLessons.findIndex((l: any) => l.id === lessonId);
    if (idx >= 0 && idx < allLessons.length - 1) {
      router.push(`/customer/academy/player/${allLessons[idx + 1].id}`);
    }
  };

  const toggleModule = (id: string) =>
    setOpenModules(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-zinc-400 text-sm font-medium">Carregando aula...</span>
      </div>
    </div>
  );

  if (error || !lesson) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 bg-red-500/10 text-red-500 flex items-center justify-center rounded-full mb-6">
        <Lock size={36} />
      </div>
      <h2 className="text-2xl font-black text-white mb-3">{error || 'Aula não encontrada'}</h2>
      <Link href="/customer/academy" className="mt-4 bg-amber-500 text-black px-6 py-3 rounded-xl font-bold hover:bg-amber-400 transition-colors">
        Voltar para a Academy
      </Link>
    </div>
  );

  const course = lesson.module?.course;
  const allLessons = course?.modules?.flatMap((m: any) => m.lessons || []) || [];
  const currentIdx = allLessons.findIndex((l: any) => l.id === lessonId);
  const hasNext = currentIdx >= 0 && currentIdx < allLessons.length - 1;
  const totalLessons = allLessons.length;
  const completedCount = completedLessons.size;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col md:flex-row">

      {/* ─── SIDEBAR ─── */}
      <aside className="w-full md:w-72 lg:w-80 bg-zinc-950 border-r border-zinc-800/60 flex flex-col md:h-screen md:sticky top-0 order-2 md:order-1 shrink-0">
        {/* Course header */}
        <div className="p-5 border-b border-zinc-800/60">
          <Link
            href={course?.id ? `/customer/academy/course/${course.id}` : '/customer/academy'}
            className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-amber-400 text-xs font-semibold mb-4 transition-colors uppercase tracking-wider"
          >
            <ChevronLeft size={14} /> Voltar ao curso
          </Link>
          <h2 className="text-sm font-black text-white leading-snug line-clamp-2">{course?.title}</h2>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] font-semibold text-zinc-500 mb-1.5">
              <span>{completedCount}/{totalLessons} aulas</span>
              <span className="text-amber-400">{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Module list */}
        <div className="flex-1 overflow-y-auto py-2">
          {course?.modules?.map((m: any, mIdx: number) => {
            const isOpen = openModules[m.id] ?? false;
            const moduleDone = m.lessons?.every((l: any) => completedLessons.has(l.id));
            return (
              <div key={m.id}>
                <button
                  onClick={() => toggleModule(m.id)}
                  className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-zinc-900/60 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-black ${moduleDone ? 'bg-amber-500 border-amber-500 text-black' : 'border-zinc-700 text-zinc-500'}`}>
                      {moduleDone ? '✓' : mIdx + 1}
                    </span>
                    <span className="text-xs font-semibold text-zinc-300 group-hover:text-white truncate transition-colors">
                      {m.title}
                    </span>
                  </div>
                  <ChevronDown size={14} className={`shrink-0 text-zinc-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="pb-1">
                    {m.lessons?.map((l: any, lIdx: number) => {
                      const isActive = l.id === lessonId;
                      const isDone = completedLessons.has(l.id);
                      return (
                        <Link
                          key={l.id}
                          href={`/customer/academy/player/${l.id}`}
                          className={`flex items-center gap-3 px-5 py-2.5 text-xs transition-colors ${
                            isActive
                              ? 'bg-amber-500/10 border-l-2 border-amber-500 text-amber-400 font-bold'
                              : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40 border-l-2 border-transparent'
                          }`}
                        >
                          {isDone
                            ? <CheckCircle2 size={14} className="shrink-0 text-amber-500" />
                            : <Circle size={14} className={`shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-700'}`} />
                          }
                          <span className="truncate">{lIdx + 1}. {l.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 order-1 md:order-2 flex flex-col md:h-screen md:overflow-y-auto">

        {/* Video */}
        <div className="w-full bg-black aspect-video relative">
          {lesson.video?.url ? (
            <video
              ref={videoRef}
              src={lesson.video.url.startsWith('http') ? lesson.video.url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${lesson.video.url}`}
              controls
              controlsList="nodownload"
              className="w-full h-full"
              onEnded={handleVideoEnded}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-3">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Lock size={24} />
              </div>
              <p className="text-sm font-medium">Vídeo ainda não disponível</p>
            </div>
          )}
        </div>

        {/* Lesson info */}
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-10">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 font-medium mb-4 flex-wrap">
            <span>Módulo {lesson.module?.title}</span>
            <ChevronRight size={11} />
            <span className="text-zinc-400">Aula {currentIdx + 1}</span>
          </div>

          {/* Title + mark-watched */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {lesson.title}
            </h1>

            <button
              onClick={markAsWatched}
              disabled={watched || markingWatched}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0 active:scale-95 ${
                watched
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30 cursor-default'
                  : 'bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20'
              }`}
            >
              {watched ? (
                <><CheckCircle2 size={16} /> Assistida</>
              ) : markingWatched ? (
                <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Salvando...</>
              ) : (
                <><CheckCircle2 size={16} /> Marcar como assistida</>
              )}
            </button>
          </div>

          {/* Description */}
          {lesson.description && (
            <p className="text-zinc-400 leading-relaxed text-sm sm:text-base mb-8 border-l-2 border-zinc-800 pl-4">
              {lesson.description}
            </p>
          )}

          {/* Next lesson button */}
          {hasNext && (
            <button
              onClick={goToNextLesson}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors mb-8"
            >
              Próxima aula <ChevronRight size={16} />
            </button>
          )}

          {/* PDFs */}
          {lesson.pdfs?.length > 0 && (
            <div className="border-t border-zinc-800/60 pt-8">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <FileText size={16} className="text-amber-500" />
                Material Complementar
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {lesson.pdfs.map((pdf: any) => (
                  <a
                    key={pdf.id}
                    href={pdf.media.url.startsWith('http') ? pdf.media.url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${pdf.media.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 p-4 rounded-xl flex items-center gap-3 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate group-hover:text-amber-400 transition-colors">
                        {pdf.media.originalName || 'Material'}
                      </p>
                      <p className="text-[11px] text-zinc-500">Clique para baixar</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
