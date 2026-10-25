'use client';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Plus, X, Search, Scissors, DollarSign, Clock, ToggleLeft, ToggleRight, Loader2, Save, Image as ImageIcon, Trash2 } from 'lucide-react';
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function resolveUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return `${API_URL}${url}`;
}

export default function AdminServicesPage() {
  const [services, setServices] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<any>(null);
  
  // Form state
  const [formData, setFormData] = React.useState({
    categoryId: '',
    name: '',
    description: '',
    duration: 30,
    price: 0,
    imageUrl: '',
    isActive: true
  });
  const [saving, setSaving] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("folder", "servicos");

      const res = await api.post("/media/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const uploadedUrl = res.data?.url || res.data?.data?.url;
      if (uploadedUrl) {
        setFormData(prev => ({ ...prev, imageUrl: uploadedUrl }));
      } else {
        alert("Não foi possível obter a URL da imagem.");
      }
    } catch (err) {
      console.error("Erro ao fazer upload da imagem", err);
      alert("Falha ao fazer upload da imagem.");
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [svcRes, catRes] = await Promise.all([
        api.get('/services'),
        api.get('/service-categories')
      ]);
      setServices(Array.isArray(svcRes.data) ? svcRes.data : (svcRes.data?.data || []));
      setCategories(Array.isArray(catRes.data) ? catRes.data : (catRes.data?.data || []));
    } catch (error) {
      console.error('Falha ao buscar SERVIÇOs', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenNew = () => {
    setSelectedService(null);
    setFormData({
      categoryId: categories.length > 0 ? categories[0].id : '',
      name: '',
      description: '',
      duration: 30,
      price: 0,
      imageUrl: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: any) => {
    setSelectedService(s);
    setFormData({
      categoryId: s.categoryId,
      name: s.name,
      description: s.description || '',
      duration: s.duration,
      price: Number(s.price) || 0,
      imageUrl: s.imageUrl || '',
      isActive: s.isActive
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const payload = {
        categoryId: formData.categoryId,
        name: formData.name,
        description: formData.description,
        duration: Number(formData.duration),
        price: Number(formData.price),
        imageUrl: formData.imageUrl,
        isActive: formData.isActive
      };
      
      if (selectedService) {
        await api.patch(`/services/${selectedService.id}`, payload);
      } else {
        if (!payload.categoryId && categories.length === 0) {
          // Fallback if no category exists, we must create one first
          const catRes = await api.post('/service-categories', {
            name: 'Geral',
            isActive: true
          });
          const newCat = catRes.data?.data || catRes.data;
          payload.categoryId = newCat.id;
        }
        await api.post('/services', payload);
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Erro ao salvar', err);
      alert(err?.response?.data?.message || err?.message || 'Erro ao salvar SERVIÇO.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/services/${s.id}`, { isActive: !s.isActive });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (s: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Tem certeza que deseja excluir o serviço "${s.name}"?`)) return;
    try {
      await api.delete(`/services/${s.id}`);
      fetchData();
    } catch (err: any) {
      console.error('Erro ao excluir', err);
      alert(err?.response?.data?.message || err?.message || 'Erro ao excluir SERVIÇO.');
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="border-b border-border pb-4 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-primary-foreground">Catálogo de Serviços</h1>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1 uppercase tracking-widest">Gerencie cortes, barbas e combos</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar SERVIÇO..." 
              className="w-full bg-input border border-border pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-foreground transition-colors rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleOpenNew} className="bg-primary-foreground text-primary font-bold uppercase tracking-widest text-xs px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap">
            <Plus className="w-4 h-4" /> <span className="hidden md:inline">Novo SERVIÇO</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
        {loading ? (
          <div className="col-span-full py-10 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary-foreground" />
            <p className="text-xs uppercase tracking-widest">Carregando SERVIÇOs...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="col-span-full py-10 text-center text-xs uppercase tracking-widest text-muted-foreground bg-card border border-border rounded-lg p-10">
            Nenhum serviço encontrado.
          </div>
        ) : filteredServices.map((s: any) => (
          <div key={s.id} onClick={() => handleOpenEdit(s)} className="bg-card border border-border rounded-xl cursor-pointer hover:border-primary/60 hover:-translate-y-2 hover:shadow-[0_10px_25px_rgba(255,215,0,0.15)] transition-all duration-300 active:scale-95 group relative overflow-hidden flex flex-col">
            {s.imageUrl ? (
              <div className="w-full h-24 sm:h-32 bg-input overflow-hidden">
                <img src={resolveUrl(s.imageUrl)} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            ) : (
              <div className="w-full h-24 sm:h-32 bg-input flex items-center justify-center text-muted-foreground border-b border-border/50">
                <Scissors className="w-8 h-8 sm:w-10 sm:h-10 opacity-20" />
              </div>
            )}
            
            <div className="p-3 sm:p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-1 sm:mb-2 gap-1">
                <h3 className="font-bold text-sm sm:text-lg text-white leading-tight">{s.name}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button 
                    onClick={(e) => handleDelete(s, e)}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                    title="Excluir serviço"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button 
                    onClick={(e) => toggleActive(s, e)}
                    className={`flex items-center ${s.isActive ? 'text-emerald-500' : 'text-rose-500'}`}
                    title={s.isActive ? 'Desativar serviço' : 'Ativar serviço'}
                  >
                    {s.isActive ? <ToggleRight className="w-5 h-5 sm:w-6 sm:h-6" /> : <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </button>
                </div>
              </div>
              
              <p className="text-xs sm:text-sm text-gray-400 line-clamp-1 sm:line-clamp-2 italic mb-2 sm:mb-4 flex-1">
                {s.description || 'Sem DESCRIÇÃO informada.'}
              </p>
              
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center pt-2 sm:pt-4 border-t border-border/50 gap-1 sm:gap-0">
                <div className="flex items-center gap-1 text-xs sm:text-sm text-primary-foreground font-bold">
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" /> 
                  {Number(s.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-widest">
                  <Clock className="w-3 h-3" /> {s.duration} min
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-full md:w-[500px] h-full bg-card border-l border-border z-50 overflow-y-auto flex flex-col shadow-2xl"
            >
              <div className="sticky top-0 bg-card/90 backdrop-blur-md border-b border-border p-6 flex justify-between items-center z-10">
                <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-primary-foreground" />
                  {selectedService ? 'Editar SERVIÇO' : 'Novo SERVIÇO'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-input rounded-full transition-colors">
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-1">
                
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Categoria</label>
                  <select 
                    value={formData.categoryId}
                    onChange={e => setFormData({...formData, categoryId: e.target.value})}
                    className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors rounded text-white"
                  >
                    <option value="" disabled>Selecione uma categoria...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-[10px] text-amber-500">Nenhuma categoria existe. Uma categoria "Geral" ser criada automaticamente.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Nome do SERVIÇO</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors rounded text-white"
                    placeholder="Corte Degradê"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3"/> PREÇO (R$)</label>
                    <input 
                      type="number" 
                      value={formData.price}
                      min="0"
                      step="0.01"
                      onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                      className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors rounded text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/> Duração (Min)</label>
                    <input 
                      type="number" 
                      value={formData.duration}
                      min="5"
                      step="5"
                      onChange={e => setFormData({...formData, duration: Number(e.target.value)})}
                      className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors rounded text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">DESCRIÇÃO</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors rounded text-white min-h-[80px]"
                    placeholder="Corte completo com finalização e navalha..."
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Imagem do Serviço (Opcional)</label>
                  
                  {formData.imageUrl && (
                    <div className="relative w-32 h-32 mb-2 rounded-lg overflow-hidden border border-border group">
                      <img src={resolveUrl(formData.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, imageUrl: ''})}
                        className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {!formData.imageUrl && (
                    <div className="flex items-center gap-2 w-full bg-input border border-border p-3 text-sm rounded transition-colors focus-within:border-primary-foreground relative">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
                          <span className="text-muted-foreground">Enviando imagem...</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Clique para fazer upload de uma foto...</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Ou insira a URL:</span>
                    <input 
                      type="url" 
                      value={formData.imageUrl}
                      onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                      className="flex-1 bg-input border border-border p-2 text-xs focus:outline-none focus:border-primary-foreground transition-colors rounded text-white"
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-input/50 border border-border rounded-lg">
                  <button 
                    onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                    className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${formData.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}
                  >
                    {formData.isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    {formData.isActive ? 'SERVIÇO Ativo' : 'SERVIÇO Inativo'}
                  </button>
                  <p className="text-[10px] text-muted-foreground ml-auto">
                    Controla visibilidade no app.
                  </p>
                </div>
              </div>
              
              <div className="p-6 bg-input border-t border-border mt-auto flex gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-transparent border border-border text-white font-bold uppercase tracking-widest text-xs py-4 rounded hover:bg-card transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving || !formData.name || formData.price < 0 || formData.duration <= 0}
                  className="flex-1 bg-primary-foreground text-primary font-bold uppercase tracking-widest text-xs py-4 rounded hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Salvando...' : 'Salvar SERVIÇO'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
