'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Play, FileText, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function StudentAcademyPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading) return <div className="p-8 text-white">Carregando...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto text-white min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Minha Academia
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course: any) => (
          <Link href={`/academy/courses/${course.id}`} key={course.id}>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl hover:bg-gray-700/50 transition cursor-pointer group hover:scale-[1.02] duration-300">
              <div className="aspect-video bg-gray-900 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                 <Play size={48} className="text-white/50 group-hover:text-white transition z-20" />
              </div>
              <h2 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition">{course.title}</h2>
              <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                {course.description || 'Acesse o conteúdo deste curso agora mesmo.'}
              </p>
              
              <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-700/50 pt-4">
                <span>{course.modules?.length || 0} Módulos</span>
                <span className="text-blue-400 font-medium">Continuar aprendendo &rarr;</span>
              </div>
            </div>
          </Link>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-500 bg-gray-800/30 rounded-2xl border border-gray-700/30 border-dashed">
            <p className="text-lg">Você ainda não possui cursos disponíveis.</p>
          </div>
        )}
      </div>
    </div>
  );
}
