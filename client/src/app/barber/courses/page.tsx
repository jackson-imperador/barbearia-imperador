'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses/admin/list');
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

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este curso?')) {
      await api.delete(`/courses/${id}`);
      fetchCourses();
    }
  };

  const handleCreate = async () => {
    const title = prompt('Nome do novo curso:');
    if (title) {
      try {
        const res = await api.post('/courses', { title, isPublished: false, price: 0 });
        window.location.href = `/barber/courses/${res.data?.id || res.id}`;
      } catch (error: any) {
        console.error('Error creating course:', error);
        alert('Erro ao criar curso: ' + (error?.message || 'Erro desconhecido'));
      }
    }
  };

  if (loading) return <div className="p-8 text-white">Carregando...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestão de Cursos (LMS)</h1>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
        >
          <Plus size={20} />
          <span>Novo Curso</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {courses.map((course: any) => (
          <div key={course.id} className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl flex flex-col overflow-hidden group hover:border-amber-500/30 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(255,215,0,0.1)] transition-all duration-300 active:scale-95">
            <div className="h-24 sm:h-40 w-full bg-gray-900 relative">
              {course.image ? (
                <img src={course.image?.url ? (course.image.url.startsWith('http') ? course.image.url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${course.image.url}`) : '/placeholder.png'} alt={course.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs sm:text-base">Sem capa</div>
              )}
              <div className="absolute top-1 right-1 sm:top-2 sm:right-2 flex flex-col gap-1 sm:gap-2">
                <span className={`text-[8px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded shadow ${course.isPublished ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
                  {course.isPublished ? 'Publicado' : 'Rascunho'}
                </span>
                <span className={`text-[8px] sm:text-xs font-bold px-1 sm:px-2 py-0.5 sm:py-1 rounded shadow ${Number(course.price) === 0 ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}`}>
                  {Number(course.price) === 0 ? 'Gratuito' : `R$ ${Number(course.price).toFixed(2)}`}
                </span>
              </div>
            </div>
            
            <div className="p-3 sm:p-6 flex flex-col flex-1">
              <h2 className="text-xs sm:text-xl font-bold mb-1 sm:mb-2 text-white line-clamp-1 sm:line-clamp-none">{course.title}</h2>
              <p className="text-gray-400 text-[10px] sm:text-sm mb-2 sm:mb-4 line-clamp-1 sm:line-clamp-2">
                {course.description || 'Sem descrição...'}
              </p>
              
              <div className="flex justify-between items-center mt-auto pt-3 sm:pt-4 border-t border-gray-700">
                <span className="text-gray-500 text-[10px] sm:text-sm">{course.modules?.length || 0} Módulos</span>
                <div className="flex gap-1 sm:gap-2">
                  <Link href={`/barber/courses/${course.id}`} className="p-1 sm:p-2 bg-gray-700 hover:bg-blue-600 rounded-lg text-white transition">
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Link>
                  <button onClick={() => handleDelete(course.id)} className="p-1 sm:p-2 bg-gray-700 hover:bg-red-600 rounded-lg text-white transition">
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhum curso encontrado. Crie seu primeiro curso!
          </div>
        )}
      </div>
    </div>
  );
}
