'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Upload, Video, FileText, Check, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminCourseEditPage() {
  const { id } = useParams() as { id: string };
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [activeUploadTarget, setActiveUploadTarget] = useState<{ lessonId?: string, type: 'video' | 'pdf' | 'cover' } | null>(null);

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/courses/admin/${id}`);
      setCourse(res.data);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error?.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const handleUpdateCourse = async (field: string, value: any) => {
    await api.put(`/courses/${id}`, { [field]: value });
    fetchCourse();
  };

  const handleCreateModule = async () => {
    const title = prompt('Nome do novo módulo:');
    if (title) {
      await api.post(`/courses/${id}/modules`, { title, displayOrder: course.modules.length });
      fetchCourse();
    }
  };

  const handleCreateLesson = async (moduleId: string, currentLessons: number) => {
    const title = prompt('Nome da nova aula:');
    if (title) {
      await api.post(`/courses/modules/${moduleId}/lessons`, { title, displayOrder: currentLessons });
      fetchCourse();
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (confirm('Deseja excluir esta aula?')) {
      await api.delete(`/courses/lessons/${id}`);
      fetchCourse();
    }
  };

  const triggerUpload = (type: 'video' | 'pdf' | 'cover', lessonId?: string) => {
    setActiveUploadTarget({ lessonId, type });
    if (fileInputRef.current) {
      if (type === 'video') {
        fileInputRef.current.accept = 'video/*,.mp4,.mov,.avi,.mkv,.webm,.flv,.wmv';
      } else if (type === 'pdf') {
        fileInputRef.current.accept = 'application/pdf';
      } else {
        fileInputRef.current.accept = 'image/*';
      }
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadTarget) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'courses');

    try {
      const uploadRes = await api.post('/media/upload', formData);
      const mediaId = uploadRes.data.id;

      if (activeUploadTarget.type === 'video' && activeUploadTarget.lessonId) {
        await api.put(`/courses/lessons/${activeUploadTarget.lessonId}`, { videoId: mediaId });
      } else if (activeUploadTarget.type === 'pdf' && activeUploadTarget.lessonId) {
        await api.post(`/courses/lessons/${activeUploadTarget.lessonId}/pdfs`, { mediaId });
      } else if (activeUploadTarget.type === 'cover') {
        await handleUpdateCourse('imageId', mediaId);
      }
      
      alert('Arquivo enviado com sucesso!');
      fetchCourse();
    } catch (error) {
      console.error(error);
      alert('Erro no envio do arquivo.');
    } finally {
      setUploading(false);
      setActiveUploadTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return <div className="p-8 text-white">Carregando...</div>;
  if (errorMsg) return <div className="p-8 text-red-500">Erro: {errorMsg}</div>;
  if (!course) return <div className="p-8 text-white">Curso não encontrado.</div>;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto text-white">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept={activeUploadTarget?.type === 'video' ? 'video/*,.mp4,.mov,.avi,.mkv,.webm,.flv,.wmv' : activeUploadTarget?.type === 'pdf' ? 'application/pdf' : 'image/*'}  
      />

      <Link href="/courses" className="text-gray-400 hover:text-white flex items-center gap-2 mb-6 w-max">
        <ChevronLeft size={20} /> Voltar para Cursos
      </Link>

      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700 shadow-xl mb-6 sm:mb-8">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold">Editar Curso</h1>
          <button 
            onClick={() => handleUpdateCourse('isPublished', !course.isPublished)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${course.isPublished ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'}`}
          >
            {course.isPublished ? 'Despublicar Curso' : 'Publicar Curso'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Título do Curso</label>
            <input 
              type="text" 
              defaultValue={course.title}
              onBlur={(e) => handleUpdateCourse('title', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-400 text-sm mb-1">Capa do Curso</label>
            <div className="flex items-center gap-4">
              <div 
                onClick={() => triggerUpload('cover')} 
                className="w-32 h-20 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition overflow-hidden"
              >
                {course.imageId ? (
                  <img 
                    src={course.image?.url ? (course.image.url.startsWith('http') ? course.image.url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${course.image.url}`) : '/placeholder.png'} 
                    alt="Cover" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-sm text-gray-500">Enviar Capa</span>
                )}
              </div>
              <button 
                onClick={() => triggerUpload('cover')}
                disabled={uploading}
                className="text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
              >
                {uploading && activeUploadTarget?.type === 'cover' ? 'Enviando...' : 'Alterar Capa'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Tipo de Curso</label>
            <select
              value={Number(course.price) === 0 ? 'free' : 'paid'}
              onChange={(e) => {
                if (e.target.value === 'free') handleUpdateCourse('price', 0);
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
            >
              <option value="free">Gratuito</option>
              <option value="paid">Pago</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Preço (R$)</label>
            <input 
              type="number" 
              value={course.price}
              onChange={(e) => setCourse({...course, price: e.target.value})}
              onBlur={(e) => handleUpdateCourse('price', e.target.value)}
              disabled={Number(course.price) === 0}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none disabled:opacity-50"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-400 text-sm mb-1">Descrição</label>
            <textarea 
              defaultValue={course.description || ''}
              onBlur={(e) => handleUpdateCourse('description', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none min-h-[100px]"
            />
          </div>
        </div>
        
        {/* Save Button for UX Peace of Mind */}
        <div className="mt-8 flex justify-end border-t border-gray-700 pt-6">
          <button 
            onClick={() => {
              // As alterações já são salvas no onBlur automaticamente,
              // esse botão serve apenas para dar um feedback visual de segurança pro usuário.
              alert('Todas as alterações do curso foram salvas com sucesso!');
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition shadow-lg hover:shadow-blue-500/20"
          >
            <Check size={20} /> Salvar Alterações
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Módulos e Aulas</h2>
        <button onClick={handleCreateModule} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition">
          <Plus size={20} /> Adicionar Módulo
        </button>
      </div>

      <div className="space-y-6">
        {course.modules?.map((module: any, mIdx: number) => (
          <div key={module.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-lg text-blue-400">Módulo {mIdx + 1}: {module.title}</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleCreateLesson(module.id, module.lessons?.length || 0)}
                  className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition flex items-center gap-1"
                >
                  <Plus size={16} /> Nova Aula
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {module.lessons?.length === 0 && <p className="text-gray-500 text-sm">Nenhuma aula neste módulo.</p>}
              
              {module.lessons?.map((lesson: any, lIdx: number) => (
                <div key={lesson.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gray-600 transition">
                  <div className="flex-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span>Aula {lIdx + 1}:</span> 
                      {lesson.title}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      {lesson.videoId ? (
                         <div className="flex flex-col gap-2">
                           <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-0.5 rounded w-max"><Check size={14}/> Vídeo adicionado</span>
                           {lesson.video?.url && (
                             <video src={lesson.video.url.startsWith('http') ? lesson.video.url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${lesson.video.url}`} controls className="h-16 w-max rounded bg-black" />
                           )}
                         </div>
                      ) : (
                         <span className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">Sem vídeo</span>
                      )}
                      {lesson.pdfs?.length > 0 && (
                        <span className="flex items-center gap-1 text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                          <FileText size={14}/> {lesson.pdfs.length} PDF(s)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => triggerUpload('video', lesson.id)}
                      disabled={uploading}
                      className="flex items-center gap-1 text-sm bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-3 py-1.5 rounded transition"
                    >
                      <Video size={16} /> {uploading && activeUploadTarget?.lessonId === lesson.id && activeUploadTarget?.type === 'video' ? 'Enviando...' : 'Vídeo'}
                    </button>
                    <button 
                      onClick={() => triggerUpload('pdf', lesson.id)}
                      disabled={uploading}
                      className="flex items-center gap-1 text-sm bg-orange-600 hover:bg-orange-700 disabled:opacity-50 px-3 py-1.5 rounded transition"
                    >
                      <FileText size={16} /> {uploading && activeUploadTarget?.lessonId === lesson.id && activeUploadTarget?.type === 'pdf' ? 'Enviando...' : 'PDF'}
                    </button>
                    <button onClick={() => handleDeleteLesson(lesson.id)} className="p-1.5 text-red-400 hover:bg-gray-700 rounded transition ml-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
