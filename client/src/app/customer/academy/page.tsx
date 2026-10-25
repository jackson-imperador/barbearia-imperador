"use client";

import React, { useState, useEffect } from "react";
import {
  Play, Award, BookOpen, PlayCircle, Clock,
  CheckCircle2, ChevronRight, Sparkles, GraduationCap, TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function courseImg(course: any) {
  const url = course?.image?.url;
  if (!url) return "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop";
  return url.startsWith("http") ? url : `${API}${url}`;
}

export default function AcademyPage() {
  const [activeTab, setActiveTab] = useState("meus");
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cRes, eRes] = await Promise.all([
          api.get("/courses"),
          api.get("/enrollments"),
        ]);
        setCourses(cRes.data || []);
        setEnrollments(eRes.data || []);
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const enrolledIds = new Set(enrollments.map((e: any) => e.courseId));
  const enrolledCourses = courses.filter((c) => enrolledIds.has(c.id));
  const availableCourses = courses.filter((c) => !enrolledIds.has(c.id));
  const completedCount = enrollments.filter((e: any) => e.isCompleted).length;
  const progressPct = enrollments.length > 0 ? Math.round((completedCount / enrollments.length) * 100) : 0;

  const tabs = [
    { id: "meus", label: "Meus Cursos", icon: <PlayCircle className="w-4 h-4" /> },
    { id: "explorar", label: "Explorar", icon: <BookOpen className="w-4 h-4" /> },
    { id: "certificados", label: "Certificados", icon: <Award className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm font-medium">Carregando cursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-6 font-sans">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
            Academy <span className="text-amber-400">Premium</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1.5 font-medium">
            Aprimore suas técnicas com os melhores profissionais.
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3 w-full sm:w-auto">
          <div className="text-center">
            <div className="text-xl font-black text-white">{enrollments.length}</div>
            <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Cursos</div>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-center">
            <div className="text-xl font-black text-amber-400">{progressPct}%</div>
            <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Progresso</div>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-center">
            <div className="text-xl font-black text-green-400">{completedCount}</div>
            <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Concluídos</div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/20"
                : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>

        {/* ── MEUS CURSOS ── */}
        {activeTab === "meus" && (
          <div className="space-y-6">
            {enrolledCourses.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/30 rounded-3xl border border-zinc-800/60 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <p className="text-white font-bold mb-1">Nenhum curso ainda</p>
                  <p className="text-zinc-500 text-sm">Explore os cursos disponíveis e comece a aprender.</p>
                </div>
                <button
                  onClick={() => setActiveTab("explorar")}
                  className="bg-amber-500 text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-400 transition-colors"
                >
                  Ver cursos disponíveis
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrolledCourses.map((course) => {
                  const enrollment = enrollments.find((e: any) => e.courseId === course.id);
                  const prog = enrollment?.progress || 0;
                  const isCompleted = enrollment?.isCompleted;
                  const firstLesson = course.modules?.[0]?.lessons?.[0];

                  return (
                    <Link
                      key={course.id}
                      href={firstLesson ? `/customer/academy/player/${firstLesson.id}` : `/customer/academy/course/${course.id}`}
                      className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all group block"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={courseImg(course)}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        {isCompleted && (
                          <div className="absolute top-3 right-3 bg-green-500 text-black text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={10} /> Concluído
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all"
                              style={{ width: `${prog}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-white/60 font-medium">Progresso</span>
                            <span className="text-[10px] text-amber-400 font-bold">{prog}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 mb-3 group-hover:text-amber-400 transition-colors">
                          {course.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                            <PlayCircle size={12} className="text-amber-500" />
                            {course.modules?.reduce((a: number, m: any) => a + (m.lessons?.length || 0), 0) || 0} aulas
                          </div>
                          <span className="text-amber-400 text-[11px] font-bold flex items-center gap-1">
                            Continuar <ChevronRight size={12} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── EXPLORAR ── */}
        {activeTab === "explorar" && (
          <div className="space-y-5">
            {availableCourses.length === 0 && enrolledCourses.length > 0 && (
              <div className="text-center py-10 text-zinc-500 text-sm">
                <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                Você já está matriculado em todos os cursos disponíveis!
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => {
                const isEnrolled = enrolledIds.has(course.id);
                const isFree = Number(course.price) === 0;
                return (
                  <Link
                    key={course.id}
                    href={`/customer/academy/course/${course.id}`}
                    className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all group block"
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={courseImg(course)}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                        {isEnrolled && (
                          <span className="bg-green-500/90 text-black text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={9} /> Matriculado
                          </span>
                        )}
                        {isFree && !isEnrolled && (
                          <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                            GRATUITO
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 mb-1 group-hover:text-amber-400 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-zinc-500 text-[11px] line-clamp-2 mb-3">
                        {course.description || "Aprenda com os melhores profissionais."}
                      </p>
                      <div className="flex items-center justify-between">
                        {isFree ? (
                          <span className="text-green-400 font-bold text-xs">Gratuito</span>
                        ) : (
                          <span className="text-amber-400 font-bold text-xs">R$ {Number(course.price).toFixed(2)}</span>
                        )}
                        <span className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                          isEnrolled
                            ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                            : "bg-amber-500 text-black hover:bg-amber-400"
                        }`}>
                          {isEnrolled ? "Acessar" : isFree ? "Começar" : "Ver curso"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CERTIFICADOS ── */}
        {activeTab === "certificados" && (
          <div className="space-y-4">
            {enrollments.filter((e: any) => e.isCompleted).length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/30 rounded-3xl border border-zinc-800/60 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <p className="text-white font-bold mb-1">Nenhum certificado ainda</p>
                  <p className="text-zinc-500 text-sm">Complete um curso para receber seu certificado.</p>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {enrollments.filter((e: any) => e.isCompleted).map((enrollment: any, i: number) => (
                  <div
                    key={i}
                    className="bg-gradient-to-br from-zinc-900 to-black border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden"
                  >
                    <div className="absolute -right-8 -bottom-8 opacity-5">
                      <Award className="w-40 h-40 text-amber-500" />
                    </div>
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <Award className="w-7 h-7 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1">
                          Concluído com Honras
                        </div>
                        <h3 className="text-base font-black text-white leading-tight line-clamp-2">
                          {enrollment.course?.title}
                        </h3>
                        <p className="text-zinc-600 text-xs mt-1">
                          {new Date(enrollment.updatedAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/customer/academy/certificate/${enrollment.id}`}
                      className="mt-4 w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                    >
                      Ver Certificado <ChevronRight size={13} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </motion.div>
    </div>
  );
}
