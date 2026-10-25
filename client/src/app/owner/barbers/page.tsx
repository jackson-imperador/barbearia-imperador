'use client';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/utils';
import { Plus, X, Search, Scissors, Star, Activity, ToggleLeft, ToggleRight, Loader2, Save, Trash2, Calendar as CalendarIcon, Image as ImageIcon } from 'lucide-react';
import { MediaLibrary } from '@/components/media/MediaLibrary';
import { Button } from '@/components/ui/Button';

export default function AdminBarbersPage() {
  const [barbers, setBarbers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedBarber, setSelectedBarber] = React.useState<any>(null);
  
  // Form state
  const [showMediaLibrary, setShowMediaLibrary] = React.useState(false);
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    bio: '',
    title: '',
    avatarUrl: '',
    isActive: true
  });
  const [saving, setSaving] = React.useState(false);

  // Blocks State
  const [isBlocksModalOpen, setIsBlocksModalOpen] = React.useState(false);
  const [selectedBarberForBlocks, setSelectedBarberForBlocks] = React.useState<any>(null);
  const [blockedPeriods, setBlockedPeriods] = React.useState<any[]>([]);
  const [newBlockDate, setNewBlockDate] = React.useState('');
  const [newBlockIsFullDay, setNewBlockIsFullDay] = React.useState(true);
  const [newBlockStartTime, setNewBlockStartTime] = React.useState('00:00');
  const [newBlockEndTime, setNewBlockEndTime] = React.useState('23:59');
  const [loadingBlocks, setLoadingBlocks] = React.useState(false);

  // Working Hours State
  const [isHoursModalOpen, setIsHoursModalOpen] = React.useState(false);
  const [selectedBarberForHours, setSelectedBarberForHours] = React.useState<any>(null);
  const [workingHours, setWorkingHours] = React.useState<any[]>([]);
  const [savingHours, setSavingHours] = React.useState(false);

  const defaultHours = Array.from({length: 7}).map((_, i) => ({
    dayOfWeek: i,
    startTime: '09:00',
    endTime: '18:00',
    isWorkingDay: i >= 1 && i <= 5 // Mon to Fri
  }));

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/barbers');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setBarbers(data);
    } catch (error) {
      console.error('Falha ao buscar barbeiros', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBarbers();
  }, []);

  const filteredBarbers = barbers.filter(b => {
    const term = searchTerm.toLowerCase();
    const name = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.toLowerCase();
    return name.includes(term);
  });

  const fetchBlocks = async (barberId: string) => {
    try {
      setLoadingBlocks(true);
      const res = await api.get(`/blocked-periods?barberId=${barberId}`);
      setBlockedPeriods(res.data?.data || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const handleOpenBlocks = (barber: any) => {
    setSelectedBarberForBlocks(barber);
    setIsBlocksModalOpen(true);
    fetchBlocks(barber.id);
  };

  const handleAddBlock = async () => {
    if (!newBlockDate) return alert('Selecione uma data');
    if (!newBlockIsFullDay && (!newBlockStartTime || !newBlockEndTime)) return alert('Preencha os horários');
    try {
      setLoadingBlocks(true);
      const start = new Date(`${newBlockDate}T${newBlockIsFullDay ? '00:00:00' : newBlockStartTime + ':00'}`);
      const end = new Date(`${newBlockDate}T${newBlockIsFullDay ? '23:59:59' : newBlockEndTime + ':00'}`);
      await api.post(`/blocked-periods`, {
        barberId: selectedBarberForBlocks.id,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        reason: newBlockIsFullDay ? 'Folga Manual (Dia Inteiro)' : 'Bloqueio de Horário'
      });
      setNewBlockDate('');
      setNewBlockIsFullDay(true);
      setNewBlockStartTime('00:00');
      setNewBlockEndTime('23:59');
      fetchBlocks(selectedBarberForBlocks.id);
    } catch (e) {
      console.error(e);
      alert('Erro ao adicionar folga');
      setLoadingBlocks(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      setLoadingBlocks(true);
      await api.delete(`/blocked-periods/${id}`);
      fetchBlocks(selectedBarberForBlocks.id);
    } catch (e) {
      console.error(e);
      alert('Erro ao remover folga');
      setLoadingBlocks(false);
    }
  };

  const handleOpenHours = async (barber: any) => {
    setSelectedBarberForHours(barber);
    setIsHoursModalOpen(true);
    const sortFromToday = (hoursArray: any[]) => {
      const currentDay = new Date().getDay();
      return [...hoursArray].sort((a, b) => {
        let diffA = a.dayOfWeek - currentDay;
        if (diffA < 0) diffA += 7;
        let diffB = b.dayOfWeek - currentDay;
        if (diffB < 0) diffB += 7;
        return diffA - diffB;
      });
    };

    try {
      const res = await api.get(`/barbers/${barber.id}`);
      const existing = res.data?.data?.workingHours || res.data?.workingHours || [];
      if (existing.length > 0) {
        // Merge with default to ensure all 7 days exist in UI
        const merged = defaultHours.map(def => {
          const found = existing.find((e: any) => e.dayOfWeek === def.dayOfWeek);
          return found ? { ...def, ...found } : def;
        });
        setWorkingHours(sortFromToday(merged));
      } else {
        setWorkingHours(sortFromToday(defaultHours));
      }
    } catch (e) {
      console.error(e);
      setWorkingHours(sortFromToday(defaultHours));
    }
  };

  const handleSaveHours = async () => {
    try {
      setSavingHours(true);
      // Salvar cada dia sequencialmente
      for (const day of workingHours) {
        await api.post(`/barbers/${selectedBarberForHours.id}/working-hours`, {
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
          isWorkingDay: day.isWorkingDay
        });
      }
      setIsHoursModalOpen(false);
      alert('Expediente salvo com sucesso!');
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar expediente.');
    } finally {
      setSavingHours(false);
    }
  };

  const updateDayHour = (index: number, field: string, value: any) => {
    const newHours = [...workingHours];
    newHours[index] = { ...newHours[index], [field]: value };
    setWorkingHours(newHours);
  };

  const handleOpenNew = () => {
    setSelectedBarber(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      bio: '',
      title: '',
      avatarUrl: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: any) => {
    setSelectedBarber(b);
    setFormData({
      firstName: b.user?.firstName || '',
      lastName: b.user?.lastName || '',
      email: b.user?.email || '',
      password: '', // Edit doesn't need password usually unless resetting
      bio: b.bio || '',
      title: b.title || '',
      avatarUrl: b.user?.avatarUrl || '',
      isActive: b.isActive
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (selectedBarber) {
        // Edit flow
        await api.patch(`/users/${selectedBarber.userId}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          avatarUrl: formData.avatarUrl || undefined
        });
        
        await api.patch(`/barbers/${selectedBarber.id}`, {
          bio: formData.bio,
          title: formData.title,
          isActive: formData.isActive
        });
        
      } else {
        // Create flow
        // 1. Fetch roles to get BARBER role ID
        const rolesRes = await api.get('/roles');
        const roles = Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data?.data || []);
        const barberRole = roles.find((r: any) => r.name === 'BARBER');
        
        // 2. Create User
        const userPayload: any = {
          email: formData.email,
          password: formData.password || 'Mudar123!',
          firstName: formData.firstName,
          lastName: formData.lastName,
          avatarUrl: formData.avatarUrl || undefined
        };
        if (barberRole) {
          userPayload.roleId = barberRole.id;
        }
        
        const userRes = await api.post('/users', userPayload);
        const newUser = userRes.data?.data || userRes.data;
        
        // 3. Create Barber profile
        await api.post('/barbers', {
          userId: newUser.id,
          bio: formData.bio,
          title: formData.title,
          isActive: formData.isActive
        });
      }
      
      setIsModalOpen(false);
      fetchBarbers();
    } catch (err: any) {
      console.error('Erro ao salvar', err);
      alert(err?.response?.data?.message || err?.message || 'Erro ao salvar barbeiro. Verifique os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBarber = async () => {
    if (!selectedBarber) return;
    if (!window.confirm(`Tem certeza que deseja excluir o barbeiro ${selectedBarber.user?.firstName}? Esta ação removerá o barbeiro permanentemente.`)) {
      return;
    }
    
    try {
      setSaving(true);
      await api.delete(`/barbers/${selectedBarber.id}`);
      setIsModalOpen(false);
      fetchBarbers();
    } catch (err: any) {
      console.error('Erro ao excluir', err);
      alert(err?.response?.data?.message || 'Erro ao excluir barbeiro.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/barbers/${b.id}`, { isActive: !b.isActive });
      fetchBarbers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="border-b border-border pb-4 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-widest text-primary-foreground">Equipe de Barbeiros</h1>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1 uppercase tracking-widest">Gerencie seus profissionais</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar barbeiro..." 
              className="w-full bg-input border border-border pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-foreground transition-colors rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleOpenNew} className="bg-primary-foreground text-primary font-bold uppercase tracking-widest text-xs px-4 py-2 rounded flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap">
            <Plus className="w-4 h-4" /> <span className="hidden md:inline">Novo Barbeiro</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {loading ? (
          <div className="col-span-full py-10 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary-foreground" />
            <p className="text-xs uppercase tracking-widest">Carregando barbeiros...</p>
          </div>
        ) : filteredBarbers.length === 0 ? (
          <div className="col-span-full py-10 text-center text-xs uppercase tracking-widest text-muted-foreground bg-card border border-border rounded-lg p-10">
            Nenhum barbeiro encontrado.
          </div>
        ) : filteredBarbers.map((b: any) => (
          <div key={b.id} onClick={() => handleOpenEdit(b)} className="bg-card border border-border rounded-xl p-3 sm:p-5 cursor-pointer hover:border-primary-foreground/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-foreground/10 transition-all duration-300 active:scale-95 group relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-2 sm:p-4 flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBarber(b);
                  // Workaround: We need to set it to state, then call delete. But state update is async.
                  // So we just call the API directly here instead of using the modal's handleDeleteBarber.
                  if (window.confirm(`Tem certeza que deseja excluir o barbeiro ${b.user?.firstName}? Esta ação é irreversível.`)) {
                    setSaving(true);
                    api.delete(`/barbers/${b.id}`)
                      .then(() => fetchBarbers())
                      .catch(err => alert(err?.response?.data?.message || 'Erro ao excluir.'))
                      .finally(() => setSaving(false));
                  }
                }}
                className="text-red-500 hover:text-red-400 p-1 bg-red-500/10 rounded-full transition-colors"
                title="Excluir Barbeiro"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => toggleActive(b, e)}
                className={`flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold ${b.isActive ? 'text-emerald-500' : 'text-rose-500'}`}
              >
                {b.isActive ? <ToggleRight className="w-5 h-5 sm:w-6 sm:h-6" /> : <ToggleLeft className="w-5 h-5 sm:w-6 sm:h-6" />}
                <span className="hidden sm:group-hover:inline">{b.isActive ? 'Ativo' : 'Inativo'}</span>
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4 mt-6 sm:mt-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 flex items-center justify-center text-primary-foreground font-bold text-lg sm:text-xl uppercase overflow-hidden shrink-0">
                {b.user?.avatarUrl ? (
                   <img src={resolveMediaUrl(b.user.avatarUrl)} alt={b.user.firstName} className="w-full h-full object-cover" />
                ) : (
                  `${(b.user?.firstName?.[0] || 'B')}${(b.user?.lastName?.[0] || '')}`
                )}
              </div>
              <div className="truncate w-full pr-2">
                <h3 className="font-bold text-sm sm:text-lg text-white truncate">{b.user?.firstName} {b.user?.lastName}</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 mt-0.5 sm:mt-1 truncate">
                  <Scissors className="w-3 h-3 shrink-0" /> <span className="truncate">{b.title || 'Especialista'}</span>
                </p>
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-gray-400 line-clamp-1 sm:line-clamp-2 italic mb-3 sm:mb-4 sm:h-10">
              "{b.bio || 'Sem biografia informada.'}"
            </p>
            
            <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-border/50">
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-amber-500 font-bold">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-500" /> {b.rating || '5.0'}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {b.user?.email}
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button 
                onClick={(e) => { e.stopPropagation(); handleOpenHours(b); }} 
                title="Configurar Expediente"
                className="flex-1 bg-primary-foreground/10 border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 py-1.5 sm:py-2 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
              >
                <CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="hidden sm:inline">Expediente</span>
                <span className="sm:hidden">Exp.</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleOpenBlocks(b); }} 
                title="Folgas e Bloqueios"
                className="flex-1 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 py-1.5 sm:py-2 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="hidden sm:inline">Folgas</span>
                <span className="sm:hidden">Blq.</span>
              </button>
            </div>
            <div className="mt-2">
              <a 
                href={`/owner/barbers/${b.id}`}
                onClick={(e) => e.stopPropagation()}
                title="Ver Relatório de Serviços e Valores"
                className="w-full bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 py-1.5 sm:py-2 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
              >
                <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                Relatório de Desempenho
              </a>
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
                  {selectedBarber ? 'Editar Barbeiro' : 'Novo Barbeiro'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-input rounded-full transition-colors">
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Nome</label>
                    <input 
                      type="text" 
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors rounded text-white"
                      placeholder="João"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Sobrenome</label>
                    <input 
                      type="text" 
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors rounded text-white"
                      placeholder="Silva"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">E-mail</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    disabled={!!selectedBarber}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors rounded text-white disabled:opacity-50"
                    placeholder="joao@barbearia.com"
                  />
                  {selectedBarber && <p className="text-[10px] text-muted-foreground">O e-mail não pode ser alterado após a criação.</p>}
                </div>

                {!selectedBarber && (
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Senha (Provisória)</label>
                    <input 
                      type="text" 
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors rounded text-white"
                      placeholder="Senha123!"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Foto do Barbeiro</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-input border border-border flex items-center justify-center overflow-hidden bg-black/50 relative">
                      {formData.avatarUrl ? (
                        <img src={resolveMediaUrl(formData.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
                      ) : <ImageIcon className="w-8 h-8 text-muted-foreground/30" />}
                    </div>
                    <Button onClick={() => setShowMediaLibrary(true)} variant="outline" className="text-xs uppercase tracking-widest w-full sm:w-auto">Escolher Foto</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Título / Reconhecimento</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors rounded text-white"
                    placeholder="Ex: Master Barber, Especialista em Degradê"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Biografia</label>
                  <textarea 
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    className="w-full bg-input border border-border p-3 text-sm focus:outline-none focus:border-primary-foreground transition-colors rounded text-white min-h-[100px]"
                    placeholder="História ou mais detalhes..."
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-input/50 border border-border rounded-lg">
                  <button 
                    onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                    className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${formData.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}
                  >
                    {formData.isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                    {formData.isActive ? 'Perfil Ativo' : 'Perfil Inativo'}
                  </button>
                  <p className="text-[10px] text-muted-foreground ml-auto">
                    Se inativo, não aparecerá no app.
                  </p>
                </div>
              </div>
              
              <div className="p-6 bg-input border-t border-border mt-auto flex flex-col gap-4">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-transparent border border-border text-white font-bold uppercase tracking-widest text-xs py-4 rounded hover:bg-card transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving || !formData.firstName || (!selectedBarber && !formData.email)}
                    className="flex-1 bg-primary-foreground text-primary font-bold uppercase tracking-widest text-xs py-4 rounded hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
                
                {selectedBarber && (
                  <button 
                    onClick={handleDeleteBarber}
                    disabled={saving}
                    className="w-full bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 py-3 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir Barbeiro Permanentemente
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* BLOCKS MODAL */}
      <AnimatePresence>
        {isBlocksModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border p-6 rounded-lg w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-red-500 uppercase tracking-widest flex items-center gap-2"><CalendarIcon className="w-5 h-5"/> Folgas (Bloqueios)</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                    {selectedBarberForBlocks?.user?.firstName || selectedBarberForBlocks?.firstName} {selectedBarberForBlocks?.user?.lastName || selectedBarberForBlocks?.lastName}
                  </p>
                </div>
                <button onClick={() => setIsBlocksModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col gap-3 mb-6 bg-input/30 p-4 rounded border border-border">
                <div className="flex gap-2">
                  <input 
                    type="date" 
                    value={newBlockDate}
                    onChange={e => setNewBlockDate(e.target.value)}
                    className="flex-1 bg-input border border-border p-3 text-sm focus:outline-none focus:border-red-500 transition-colors rounded text-white" 
                  />
                  <button 
                    onClick={handleAddBlock}
                    disabled={loadingBlocks || !newBlockDate}
                    className="bg-red-500 text-white px-6 rounded font-bold text-xs uppercase tracking-widest hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newBlockIsFullDay}
                      onChange={e => setNewBlockIsFullDay(e.target.checked)}
                      className="w-4 h-4 rounded border-border bg-input text-red-500 focus:ring-red-500 focus:ring-offset-background cursor-pointer"
                    />
                    <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground select-none">Dia Inteiro</span>
                  </label>

                  {!newBlockIsFullDay && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                      <input 
                        type="time" 
                        value={newBlockStartTime}
                        onChange={e => setNewBlockStartTime(e.target.value)}
                        className="bg-input border border-border p-2 text-sm focus:outline-none focus:border-red-500 transition-colors rounded text-white w-28" 
                      />
                      <span className="text-muted-foreground font-bold">até</span>
                      <input 
                        type="time" 
                        value={newBlockEndTime}
                        onChange={e => setNewBlockEndTime(e.target.value)}
                        className="bg-input border border-border p-2 text-sm focus:outline-none focus:border-red-500 transition-colors rounded text-white w-28" 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {loadingBlocks ? (
                  <p className="text-center text-xs uppercase tracking-widest text-muted-foreground py-10 animate-pulse">Carregando folgas...</p>
                ) : blockedPeriods.length === 0 ? (
                  <div className="text-center border border-dashed border-border p-10 rounded">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Nenhuma folga marcada.</p>
                  </div>
                ) : (
                  blockedPeriods.map((block: any) => {
                    const dateStr = new Date(block.startDateTime).toLocaleDateString('pt-BR');
                    return (
                      <div key={block.id} className="border border-red-500/30 bg-red-500/5 p-4 rounded flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-red-500/20 flex items-center justify-center">
                            <CalendarIcon className="w-5 h-5 text-red-500" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-red-500">{dateStr}</p>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                              {block.reason?.includes('Dia Inteiro') || (new Date(block.startDateTime).getHours() === 0 && new Date(block.endDateTime).getHours() === 23) 
                                ? 'Dia Inteiro' 
                                : `${new Date(block.startDateTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} às ${new Date(block.endDateTime).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteBlock(block.id)} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HORARIOS MODAL */}
      <AnimatePresence>
        {isHoursModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border p-6 rounded-lg w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-primary-foreground uppercase tracking-widest">Expediente</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                    {selectedBarberForHours?.user?.firstName || selectedBarberForHours?.firstName} {selectedBarberForHours?.user?.lastName || selectedBarberForHours?.lastName}
                  </p>
                </div>
                <button onClick={() => setIsHoursModalOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {workingHours.map((day, i) => (
                  <div key={i} className={`border p-4 rounded flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between ${day.isWorkingDay ? 'bg-input/80 border-primary-foreground/30' : 'bg-background border-border opacity-60'}`}>
                    <div className="flex items-center gap-3 min-w-[120px]">
                      <button onClick={() => updateDayHour(i, 'isWorkingDay', !day.isWorkingDay)} className="flex items-center justify-center">
                        {day.isWorkingDay ? <ToggleRight className="w-8 h-8 text-primary-foreground" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                      </button>
                      <span className={`font-bold uppercase tracking-widest text-sm flex items-center gap-2 ${day.isWorkingDay ? 'text-white' : 'text-muted-foreground'}`}>
                        <span>{['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][day.dayOfWeek]}</span>
                        <span className="text-[10px] text-primary-foreground/70 font-normal">
                          {(() => {
                            const d = new Date();
                            d.setDate(d.getDate() + i);
                            return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                          })()}
                        </span>
                      </span>
                    </div>

                    {day.isWorkingDay ? (
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <input type="time" value={day.startTime} onChange={(e) => updateDayHour(i, 'startTime', e.target.value)} className="bg-background border border-border px-3 py-2 rounded text-sm text-white focus:border-primary-foreground outline-none w-24 text-center font-mono" />
                        <span className="text-muted-foreground font-bold">às</span>
                        <input type="time" value={day.endTime} onChange={(e) => updateDayHour(i, 'endTime', e.target.value)} className="bg-background border border-border px-3 py-2 rounded text-sm text-white focus:border-primary-foreground outline-none w-24 text-center font-mono" />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold flex-1 text-right">Folga</span>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={handleSaveHours} disabled={savingHours} className="w-full bg-primary-foreground text-primary font-bold uppercase tracking-widest text-xs py-4 rounded mt-6 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {savingHours ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {savingHours ? 'Salvando...' : 'Salvar Expediente'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {showMediaLibrary && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm">
          <div className="bg-card w-full max-w-5xl h-[90vh] md:h-[80vh] rounded-xl overflow-hidden relative border border-border shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border bg-card">
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Selecionar Foto
              </h2>
              <button onClick={() => setShowMediaLibrary(false)} className="p-2 hover:bg-input rounded-full transition-colors text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto relative">
              <MediaLibrary 
                selectionMode="single"
                onSelect={(ids, medias) => {
                  if (medias && medias.length > 0) {
                    setFormData(prev => ({ ...prev, avatarUrl: medias[0].url }));
                    setShowMediaLibrary(false);
                  }
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
