'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Play, FileText, ChevronLeft, Menu, X } from 'lucide-react';
import Link from 'next/link';

export default function CourseViewerPage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/courses/${params.id}`);
        setCourse(res.data);
        if (res.data?.modules?.[0]?.lessons?.[0]) {
          setActiveLesson(res.data.modules[0].lessons[0]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [params.id]);

  if (loading) return <div className="p-8 text-white">Carregando curso...</div>;
  if (!course) return <div className="p-8 text-white">Curso não encontrado.</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-900 text-white overflow-hidden">
      {/* Sidebar / Modules List */}
      <div className={`flex-shrink-0 w-80 bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full absolute h-full z-10'}`}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 sticky top-0">
          <Link href="/academy" className="text-gray-400 hover:text-white flex items-center gap-2 transition">
            <ChevronLeft size={20} />
            <span className="font-semibold text-sm">Voltar</span>
          </Link>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h2 className="font-bold text-lg mb-6">{course.title}</h2>
            <div className="space-y-6">
              {course.modules?.map((module: any, mIdx: number) => (
                <div key={module.id}>
                  <h3 className="font-semibold text-gray-300 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                    <span className="bg-blue-600/20 text-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                      {mIdx + 1}
                    </span>
                    {module.title}
                  </h3>
                  <div className="space-y-1">
                    {module.lessons?.map((lesson: any, lIdx: number) => (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition flex items-start gap-3 ${
                          activeLesson?.id === lesson.id 
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                            : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <Play size={16} className={`mt-1 flex-shrink-0 ${activeLesson?.id === lesson.id ? 'text-blue-400' : 'text-gray-500'}`} />
                        <span className="text-sm font-medium leading-tight">
                          {lIdx + 1}. {lesson.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-black">
        {/* Mobile Header */}
        <div className="md:hidden p-4 flex items-center gap-4 bg-gray-900 border-b border-gray-800">
           <button onClick={() => setSidebarOpen(true)}>
             <Menu size={24} />
           </button>
           <h1 className="font-bold truncate">{course.title}</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeLesson ? (
            <div className="max-w-5xl mx-auto w-full">
              {/* Video Player */}
              <div className="aspect-video bg-black w-full relative">
                {activeLesson.video ? (
                  <video 
                    src={activeLesson.video.url} 
                    controls 
                    className="w-full h-full object-contain"
                    controlsList="nodownload"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 flex-col gap-4">
                    <Play size={48} className="opacity-20" />
                    <p>Nenhum vídeo disponível para esta aula</p>
                  </div>
                )}
              </div>

              {/* Lesson Details */}
              <div className="p-6 md:p-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{activeLesson.title}</h1>
                {activeLesson.description && (
                  <div className="prose prose-invert max-w-none mb-8 text-gray-300">
                    <p>{activeLesson.description}</p>
                  </div>
                )}

                {/* PDFs / Materials */}
                {activeLesson.pdfs?.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-800">
                    <h3 className="text-xl font-semibold mb-4">Materiais Complementares</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeLesson.pdfs.map((pdf: any) => (
                        <a
                          key={pdf.id}
                          href={pdf.media.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 rounded-xl border border-gray-700 bg-gray-800/50 hover:bg-gray-700 transition group"
                        >
                          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg group-hover:bg-red-500/20 transition">
                            <FileText size={24} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate group-hover:text-blue-400 transition">
                              {pdf.media.originalName || 'Documento PDF'}
                            </p>
                            <p className="text-xs text-gray-500">Clique para baixar</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Selecione uma aula no menu lateral para começar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
