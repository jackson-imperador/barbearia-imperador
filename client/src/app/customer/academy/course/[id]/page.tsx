"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ChevronLeft, PlayCircle, Clock, CheckCircle2, Lock, ChevronDown, Play } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from 'qrcode.react';

export default function CourseDetailsPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [course, setCourse] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Accordion state
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const fetchDetails = async () => {
    try {
      const [courseRes, enrollmentsRes] = await Promise.all([
        api.get(`/courses/${id}`),
        api.get('/enrollments')
      ]);
      const courseData = courseRes.data;
      setCourse(courseData);
      
      const enrolled = enrollmentsRes.data.some((e: any) => e.courseId === id);
      setIsEnrolled(enrolled);
      
      if (pixData && enrolled) {
        setCheckoutModalOpen(false);
      }

      // Open first module by default
      if (courseData.modules?.length > 0) {
        setOpenModules(prev => ({ ...prev, [courseData.modules[0].id]: true }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchDetails();
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (checkoutModalOpen && pixData && !isEnrolled) {
      interval = setInterval(async () => {
        try {
          if (pixData?.paymentId) {
            // Isso força o backend a consultar o Mercado Pago ativamente, suprindo a falta do webhook no localhost
            await api.get(`/payments/${pixData.paymentId}/status`);
          }
        } catch (e) {
          console.error(e);
        }
        fetchDetails();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [checkoutModalOpen, pixData, isEnrolled]);

  const handleAction = async () => {
    if (isEnrolled) {
      router.push(`/customer/academy/player/${course.modules?.[0]?.lessons?.[0]?.id || ''}`);
      return;
    }

    if (Number(course.price) === 0) {
      try {
        await api.post(`/enrollments/${course.id}`);
        setIsEnrolled(true);
      } catch (err) {
        alert("Erro ao matricular no curso gratuito.");
      }
    } else {
      try {
        const res = await api.post(`/courses/${course.id}/checkout`);
        setPixData(res.data);
        setCheckoutModalOpen(true);
      } catch (err) {
        alert("Erro ao gerar checkout. Tente novamente.");
      }
    }
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-medium">Carregando...</div>;
  if (!course) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-medium">Curso não encontrado.</div>;

  const isFree = Number(course.price) === 0;
  const canWatch = isEnrolled || isFree;
  const totalLessons = course.modules?.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24 selection:bg-amber-500/30">
      
      {/* HEADER NAV */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-900 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center">
          <Link href="/customer/academy" className="text-zinc-400 hover:text-white flex items-center gap-2 text-sm font-medium transition">
            <ChevronLeft className="w-5 h-5" /> Academy
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 pt-6 md:pt-10">
        
        {/* HERO SECTION */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 mb-12">
          
          {/* Cover */}
          <div className="w-full md:w-1/2 aspect-video md:aspect-[4/3] lg:aspect-video relative rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.05)] border border-zinc-800 group">
            <img 
              src={course.image?.url ? (course.image.url.startsWith('http') ? course.image.url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${course.image.url}`) : "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1200&auto=format&fit=crop"} 
              alt={course.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {isFree && (
                <span className="bg-amber-500 text-black text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-full shadow-lg tracking-wider">
                  CURSO GRATUITO
                </span>
              )}
              {isEnrolled && !isFree && (
                <span className="bg-green-500 text-black text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 tracking-wider">
                  <CheckCircle2 className="w-3 h-3" /> ADQUIRIDO
                </span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-[1.1] tracking-tight">
              {course.title}
            </h1>
            
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-6 line-clamp-3">
              {course.description || "Aprimore suas técnicas e entregue o melhor resultado para seus clientes."}
            </p>
            
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-medium text-zinc-300 mb-8">
              <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800/50">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{course.modules?.length || 0} Módulos</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800/50">
                <PlayCircle className="w-4 h-4 text-amber-500" />
                <span>{totalLessons} Aulas</span>
              </div>
            </div>

            <button 
              onClick={handleAction}
              className={`w-full py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 ${
                isEnrolled 
                  ? "bg-zinc-100 text-black hover:bg-white" 
                  : "bg-amber-500 text-black hover:bg-amber-400"
              }`}
            >
              {isEnrolled ? (
                <> <Play className="w-5 h-5 fill-current" /> Continuar Assistindo </>
              ) : isFree ? (
                <> <Play className="w-5 h-5 fill-current" /> Começar Agora </>
              ) : (
                <> Adquirir por R$ {Number(course.price).toFixed(2)} </>
              )}
            </button>
          </div>
        </div>

        {/* PROGRESS */}
        {canWatch && (
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 sm:p-6 mb-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
            <div className="flex justify-between items-end mb-4 relative z-10">
              <h3 className="text-xs sm:text-sm font-bold text-zinc-400 uppercase tracking-widest">Seu Progresso</h3>
              <span className="text-2xl sm:text-3xl font-black text-white">0%</span>
            </div>
            <div className="w-full bg-zinc-950 rounded-full h-2.5 sm:h-3 overflow-hidden border border-zinc-800 relative z-10">
              <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: '0%' }}></div>
            </div>
            <p className="text-xs text-zinc-500 mt-3 relative z-10">Continue assistindo para avançar no curso.</p>
          </div>
        )}

        {/* CURRICULUM ACCORDION */}
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white mb-6">Conteúdo do Curso</h2>
          
          <div className="space-y-4">
            {course.modules?.map((module: any, mIdx: number) => {
              const isOpen = openModules[module.id];
              const moduleNum = String(mIdx + 1).padStart(2, '0');
              
              return (
                <div key={module.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm">
                  <button 
                    onClick={() => toggleModule(module.id)}
                    className="w-full text-left p-5 sm:p-6 flex items-center justify-between hover:bg-zinc-800/80 transition-colors focus:outline-none"
                  >
                    <div className="pr-4">
                      <h3 className="text-[10px] sm:text-xs font-bold text-amber-500 uppercase tracking-widest mb-1.5">
                        Módulo {moduleNum}
                      </h3>
                      <h4 className="font-bold text-base sm:text-lg text-white leading-tight">{module.title}</h4>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs sm:text-sm font-medium text-zinc-500 hidden sm:block">
                        {module.lessons?.length || 0} aulas
                      </span>
                      <div className={`p-2 rounded-full bg-zinc-950 text-zinc-400 transition-transform duration-300 border border-zinc-800/50 ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </div>
                  </button>
                  
                  {isOpen && (
                    <div className="border-t border-zinc-800/80 bg-zinc-950/80 divide-y divide-zinc-800/40">
                      {module.lessons?.length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 text-sm">
                          Nenhuma aula disponível neste módulo.
                        </div>
                      ) : (
                        module.lessons?.map((lesson: any, lIdx: number) => {
                          const lessonNum = String(lIdx + 1).padStart(2, '0');
                          
                          const LessonContent = (
                            <div className={`p-4 sm:p-5 flex items-center justify-between transition-colors group cursor-pointer ${canWatch ? 'hover:bg-zinc-900/80' : 'opacity-60'}`}>
                              <div className="flex items-start sm:items-center gap-4">
                                <div className={`shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 mt-0.5 sm:mt-0 ${
                                  canWatch 
                                    ? 'bg-zinc-900 text-zinc-400 group-hover:bg-amber-500 group-hover:text-black group-hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                                    : 'bg-zinc-900 text-zinc-600'
                                }`}>
                                  {canWatch ? <Play className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5" /> : <Lock className="w-3 h-3 sm:w-4 sm:h-4" />}
                                </div>
                                
                                <div>
                                  <div className={`font-bold text-sm sm:text-base transition-colors leading-tight mb-1 sm:mb-0 ${
                                    canWatch ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-500'
                                  }`}>
                                    <span className="text-zinc-500 font-medium mr-2">Aula {lessonNum}</span> 
                                    <span className="block sm:inline mt-0.5 sm:mt-0">{lesson.title}</span>
                                  </div>
                                  {!canWatch && (
                                    <div className="text-[10px] sm:text-xs text-zinc-500 mt-1 flex items-center gap-1 font-medium uppercase tracking-wider">
                                      <Lock className="w-3 h-3" /> Bloqueada
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {lesson.pdfs?.length > 0 && (
                                <span className="shrink-0 text-[10px] sm:text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg hidden sm:block">
                                  + Material
                                </span>
                              )}
                            </div>
                          );

                          return canWatch ? (
                            <Link href={`/customer/academy/player/${lesson.id}`} key={lesson.id} className="block outline-none focus:bg-zinc-900/80">
                              {LessonContent}
                            </Link>
                          ) : (
                            <div key={lesson.id}>{LessonContent}</div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {course.modules?.length === 0 && (
              <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
                <p className="text-zinc-500 text-sm">Este curso ainda não possui módulos disponíveis.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      {checkoutModalOpen && pixData && !isEnrolled && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl">
            <button 
              onClick={() => setCheckoutModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2"
            >
              ✕
            </button>
            <h3 className="text-xl sm:text-2xl font-black text-white text-center mb-2">Checkout Academy</h3>
            <p className="text-zinc-400 text-sm sm:text-base text-center mb-6 sm:mb-8">Pague via PIX para liberar o acesso imediato ao curso.</p>
            
            <div className="bg-white p-4 rounded-2xl flex justify-center mb-6 max-w-[200px] mx-auto shadow-inner">
              <QRCodeSVG value={pixData.qrCode} size={168} />
            </div>

            <div className="mb-6">
              <p className="text-xs sm:text-sm font-medium text-zinc-400 mb-2 text-center uppercase tracking-widest">Ou copie o código PIX:</p>
              <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-1.5 overflow-hidden">
                <input 
                  type="text" 
                  value={pixData.qrCode} 
                  readOnly 
                  className="bg-transparent text-zinc-400 text-xs sm:text-sm outline-none flex-1 truncate px-3"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(pixData.qrCode)}
                  className="bg-zinc-800 text-white px-4 py-2 rounded-lg hover:bg-zinc-700 text-xs sm:text-sm font-bold transition-colors active:scale-95"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-amber-500 animate-pulse text-xs sm:text-sm font-medium">
              <Clock size={16} /> Aguardando confirmação...
            </div>
          </div>
        </div>
      )}

      {checkoutModalOpen && isEnrolled && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
          <div className="bg-zinc-900 border border-green-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(34,197,94,0.1)]">
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Pagamento Confirmado!</h3>
            <p className="text-zinc-400 text-sm mb-8">O curso foi liberado na sua conta com sucesso.</p>
            <button 
              onClick={() => router.push(`/customer/academy/player/${course.modules?.[0]?.lessons?.[0]?.id || ''}`)}
              className="w-full bg-green-500 text-black font-black py-4 sm:py-5 rounded-2xl hover:bg-green-400 transition-transform active:scale-95 shadow-lg shadow-green-500/20"
            >
              Começar a Assistir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
