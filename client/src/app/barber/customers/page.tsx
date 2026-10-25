'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { X, Search, Calendar, DollarSign, Package, BookOpen, Star, Clock, Camera } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";
function resolveUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCustomer, setSelectedCustomer] = React.useState<any | null>(null);
  const [customerGallery, setCustomerGallery] = React.useState<any[]>([]);
  const [uploadingGallery, setUploadingGallery] = React.useState(false);

  const [isCreating, setIsCreating] = React.useState(false);
  const [formData, setFormData] = React.useState({ firstName: '', lastName: '', email: '' });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/crm/list?_t=' + new Date().getTime()); 
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setCustomers(data);
    } catch (error) {
      console.error('Falha ao buscar clientes', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/dashboard/crm/customers', formData);
      setIsCreating(false);
      setFormData({ firstName: '', lastName: '', email: '' });
      await fetchCustomers();
    } catch (error) {
      console.error('Falha ao criar cliente', error);
      alert('Erro ao criar cliente. Verifique se o e-mail já existe.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      (c.firstName || '').toLowerCase().includes(term) ||
      (c.lastName || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term)
    );
  });

  const openProfile = async (c: any) => {
    try {
      // Show modal immediately with list data (isActive comes from the list)
      setSelectedCustomer({ ...c, ltv: c.ltv || 0, history: [], products: [], courses: [], loadingProfile: true });
      setCustomerGallery([]);
      
      const [res, galleryRes] = await Promise.all([
         api.get(`/dashboard/crm/profile/${c.id}?_t=` + new Date().getTime()),
         api.get(`/users/${c.id}/gallery`).catch(() => ({ data: [] }))
      ]);
      const profile = res.data?.data || res.data;
      const gallery = galleryRes.data?.data || galleryRes.data || [];
      
      setCustomerGallery(gallery);
      
      // IMPORTANT: Keep isActive and subscription from the list (c) because the profile endpoint does not return them
      setSelectedCustomer({
        ...profile,
        isActive: c.isActive,
        subscription: c.subscription,
        loadingProfile: false
      });
    } catch (error) {
      console.error('Falha ao buscar perfil do cliente', error);
      setSelectedCustomer({ ...c, ltv: c.ltv || 0, history: [], products: [], courses: [], loadingProfile: false });
    }
  };

  const handleUploadGalleryPhoto = async (e: React.ChangeEvent<HTMLInputElement>, customerId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingGallery(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "gallery");
      
      const mediaRes = await api.post("/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const media = mediaRes.data?.data || mediaRes.data;
      
      if (media && media.id) {
        await api.post(`/users/${customerId}/gallery`, { imageId: media.id });
        const galleryRes = await api.get(`/users/${customerId}/gallery`);
        setCustomerGallery(galleryRes.data?.data || galleryRes.data || []);
      }
    } catch (error: any) {
      console.error('Erro ao enviar foto', error.response?.data || error);
      alert(`Erro ao enviar foto: ${JSON.stringify(error.response?.data || error.message)}`);
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  };

  const handleResetPassword = async () => {
    if (!selectedCustomer) return;
    const newPassword = window.prompt(`Digite a nova senha para ${selectedCustomer.firstName}:`);
    if (!newPassword) return;
    
    try {
      await api.patch(`/users/${selectedCustomer.id}`, { password: newPassword });
      alert('Senha redefinida com sucesso!');
    } catch (error) {
      console.error('Erro ao redefinir senha', error);
      alert('Falha ao redefinir a senha do usuário.');
    }
  };

  const handleUpdateSubscription = async (plan: string) => {
    if (!selectedCustomer) return;
    try {
      await api.patch(`/dashboard/crm/customers/${selectedCustomer.id}/subscription/manual`, { plan });
      const newSubscription = plan === 'COMUM' ? null : { ...(selectedCustomer?.subscription || {}), plan, isActive: true };
      // Update modal state immediately
      setSelectedCustomer((prev: any) => ({ ...prev, subscription: newSubscription }));
      // Refresh list so the badge and future openProfile calls have fresh data
      await fetchCustomers();
      alert('Plano atualizado com sucesso (Registro financeiro incluído se VIP).');
    } catch (error) {
      console.error('Erro ao atualizar plano', error);
      alert('Erro ao atualizar plano do cliente.');
    }
  };

  const handleToggleBan = async () => {
    if (!selectedCustomer) return;
    const isBanning = selectedCustomer.isActive === true; // true = currently active → we are banning
    if (isBanning && !confirm('Tem certeza que deseja BANIR este cliente? Ele não poderá mais agendar horários.')) return;
    try {
      const newIsActive = !isBanning;
      await api.patch(`/dashboard/crm/customers/${selectedCustomer.id}/ban`, { isActive: newIsActive });
      // Update local state immediately so the UI switches right away
      setSelectedCustomer((prev: any) => ({ ...prev, isActive: newIsActive }));
      // Refresh the list in the background so the badge in the list also updates
      fetchCustomers();
      alert(isBanning ? 'Cliente BANIDO com sucesso.' : 'Cliente DESBANIDO e restaurado.');
    } catch (error) {
      console.error('Erro ao alterar status', error);
      alert('Erro ao alterar o status do cliente.');
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="border-b border-border pb-3 sm:pb-4 mb-3 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-widest text-primary-foreground">Clientes (CRM)</h1>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1 uppercase tracking-widest hidden sm:block">Base de clientes e inteligência</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              className="w-full sm:w-64 bg-input border border-border pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-foreground transition-colors rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="shrink-0 bg-primary-foreground text-primary font-bold uppercase tracking-widest text-xs px-4 sm:px-6 py-2 rounded hover:opacity-90 transition-opacity"
          >
            Novo
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card border border-border p-6 rounded-lg w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary-foreground uppercase tracking-widest">Cadastrar Cliente</h2>
              <button onClick={() => setIsCreating(false)} className="text-muted-foreground hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Nome</label>
                <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-input border border-border p-2 rounded text-white text-sm" placeholder="Nome" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Sobrenome</label>
                <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-input border border-border p-2 rounded text-white text-sm" placeholder="Sobrenome" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">E-mail</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-input border border-border p-2 rounded text-white text-sm" placeholder="email@exemplo.com" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-primary-foreground text-primary font-bold uppercase tracking-widest text-xs py-3 rounded mt-4 hover:opacity-90 transition-opacity disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {loading ? (
          <div className="col-span-full py-10 text-center text-xs uppercase tracking-widest text-muted-foreground">Carregando carteira de clientes...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full py-10 text-center text-xs uppercase tracking-widest text-muted-foreground">Nenhum cliente encontrado.</div>
        ) : filteredCustomers.map((c: any) => (
          <div key={c.id} onClick={() => openProfile(c)} className="bg-card border border-border p-3 sm:p-4 rounded-lg cursor-pointer hover:border-primary-foreground/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-foreground/10 transition-all duration-300 active:scale-95 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 relative overflow-hidden group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground font-bold text-sm sm:text-lg uppercase flex-shrink-0">
              {(c.firstName?.[0] || 'C')}{(c.lastName?.[0] || '')}
            </div>
            <div className="flex-1 min-w-0 w-full">
              <h3 className="font-bold text-sm sm:text-base text-white truncate flex flex-wrap items-center gap-1 sm:gap-2">
                <span className="truncate max-w-full">{c.firstName} {c.lastName}</span>
                {c.subscription?.isActive === false ? (
                  <span className="text-[8px] sm:text-[10px] shrink-0 bg-red-500/20 text-red-500 border border-red-500/50 px-1 sm:px-1.5 py-0.5 rounded tracking-widest uppercase font-bold animate-pulse">PENDENTE (VIP)</span>
                ) : c.subscription?.isActive && c.subscription?.plan === 'VIP_OURO' ? (
                  <span className="text-[8px] sm:text-[10px] shrink-0 bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 px-1 sm:px-1.5 py-0.5 rounded tracking-widest uppercase">VIP OURO</span>
                ) : c.subscription?.isActive && c.subscription?.plan === 'VIP_PRATA' ? (
                  <span className="text-[8px] sm:text-[10px] shrink-0 bg-gray-400/20 text-gray-300 border border-gray-400/50 px-1 sm:px-1.5 py-0.5 rounded tracking-widest uppercase">VIP PRATA</span>
                ) : (
                  <span className="text-[8px] sm:text-[10px] shrink-0 bg-white/5 text-muted-foreground border border-white/10 px-1 sm:px-1.5 py-0.5 rounded tracking-widest uppercase">COMUM</span>
                )}
                {!c.isActive && (
                  <span className="text-[8px] sm:text-[10px] shrink-0 bg-red-900/40 text-red-400 border border-red-500/30 px-1 sm:px-1.5 py-0.5 rounded tracking-widest uppercase">BANIDO</span>
                )}
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5 sm:mt-1">{c.phone || c.email || 'Sem contato'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* SLIDE OVER DO PERFIL DO CLIENTE */}
      <AnimatePresence>
        {selectedCustomer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-full md:w-[500px] h-full bg-card border-l border-border z-50 overflow-y-auto flex flex-col shadow-2xl"
            >
              <div className="sticky top-0 bg-card/90 backdrop-blur-md border-b border-border p-6 flex justify-between items-start z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground font-bold text-2xl uppercase shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                    {(selectedCustomer.firstName?.[0] || 'C')}{(selectedCustomer.lastName?.[0] || '')}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedCustomer.firstName} {selectedCustomer.lastName}</h2>
                    <p className="text-xs text-primary-foreground uppercase tracking-widest flex items-center gap-1 mt-1">
                      {selectedCustomer.subscription?.isActive ? (
                        <>
                          <Star className={`w-3 h-3 fill-current ${selectedCustomer.subscription.plan === 'VIP_OURO' ? 'text-yellow-500' : 'text-gray-400'}`} /> 
                          <span className={selectedCustomer.subscription.plan === 'VIP_OURO' ? 'text-yellow-500' : 'text-gray-400'}>
                            Cliente {selectedCustomer.subscription.plan.replace('_', ' ')}
                          </span>
                        </>
                      ) : selectedCustomer.subscription?.isActive === false ? (
                        <span className="text-red-500 font-bold flex items-center gap-1"><X className="w-3 h-3"/> VIP PENDENTE (NÃO PAGO)</span>
                      ) : (
                        <span className="text-muted-foreground">Cliente Comum</span>
                      )}
                    </p>
                    {selectedCustomer.isActive === false ? (
                      /* Cliente está BANIDO → mostrar selo + botão DESBANIR */
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-block bg-red-600 text-white text-xs px-2 py-1 rounded font-bold uppercase tracking-widest">
                          🚫 CONTA BANIDA
                        </span>
                        <button
                          onClick={handleToggleBan}
                          className="text-xs px-3 py-1 rounded bg-green-600 text-white border border-green-500 hover:bg-green-500 font-bold uppercase tracking-widest transition-colors"
                        >
                          ✓ Desbanir
                        </button>
                      </div>
                    ) : (
                      /* Cliente está ATIVO → mostrar botão BANIR */
                      <div className="mt-2">
                        <button
                          onClick={handleToggleBan}
                          className="text-xs px-3 py-1.5 rounded bg-red-600 text-white border border-red-500 hover:bg-red-500 font-bold uppercase tracking-widest transition-colors"
                        >
                          🚫 Banir Cliente
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-input rounded-full transition-colors">
                  <X className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-8 flex-1">
                {/* Métricas Principais */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-input border border-border p-4 rounded-lg flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3"/> Total Gasto (LTV)</span>
                    <span className="text-xl font-bold text-white">R$ {selectedCustomer.ltv.toFixed(2).replace('.',',')}</span>
                  </div>
                  <div className="bg-input border border-border p-4 rounded-lg flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Frequência</span>
                    <span className="text-xl font-bold text-white">{selectedCustomer.frequency}</span>
                  </div>
                </div>

                {/* Contato & Pessoal */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-primary-foreground mb-3 font-bold border-l-2 border-primary-foreground pl-2">Informações Pessoais</h3>
                  <div className="space-y-3 text-sm bg-input/30 p-4 rounded-lg border border-border">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Telefone</span>
                      <span className="text-white">{selectedCustomer.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">E-mail</span>
                      <span className="text-white">{selectedCustomer.email || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Aniversário</span>
                      <span className="text-white flex items-center gap-2">
                        {selectedCustomer.birthDate ? new Date(selectedCustomer.birthDate).toLocaleDateString() : 'Não informado'}
                      </span>
                    </div>
                  </div>
                  
                  {/* VIP ASSINATURA */}
                  <h3 className="text-xs uppercase tracking-widest text-primary-foreground mb-3 font-bold border-l-2 border-primary-foreground pl-2 mt-6">Plano de Assinatura</h3>
                  {selectedCustomer.subscription?.isActive ? (
                    <div className={`flex items-center gap-3 bg-input/30 p-4 rounded-lg border ${selectedCustomer.subscription.plan === 'VIP_OURO' ? 'border-yellow-500/20' : 'border-gray-400/20'}`}>
                      <div className={`p-2 rounded-lg ${selectedCustomer.subscription.plan === 'VIP_OURO' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-400/20 text-gray-400'}`}><Star className="w-4 h-4" /></div>
                      <div className="flex-1">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Status do Plano</span>
                        <p className="font-bold text-sm uppercase text-green-500">
                          {selectedCustomer.subscription.plan.replace('_', ' ')} - ATIVO
                        </p>
                      </div>
                    </div>
                  ) : selectedCustomer.subscription?.isActive === false ? (
                    <div className="flex items-center gap-3 bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                      <div className="p-2 rounded-lg bg-red-500/20 text-red-500"><Star className="w-4 h-4" /></div>
                      <div className="flex-1">
                        <span className="text-[10px] uppercase tracking-widest text-red-400">Status do Plano</span>
                        <p className="font-bold text-sm uppercase text-red-500 animate-pulse">
                          VIP GERADO - PENDENTE PAGAMENTO
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-input/30 p-4 rounded-lg border border-border/50">
                      <div className="p-2 rounded-lg bg-white/5 text-muted-foreground"><Star className="w-4 h-4" /></div>
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Status do Plano</span>
                        <p className="font-bold text-sm uppercase text-muted-foreground">
                          CLIENTE COMUM (SEM ASSINATURA)
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Controles do Admin para Assinatura */}
                  <div className="mt-4 p-4 bg-primary-foreground/5 border border-primary-foreground/20 rounded-lg">
                    <p className="text-xs uppercase tracking-widest text-primary-foreground mb-3 font-bold">Gestão Manual (Proprietário)</p>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => handleUpdateSubscription('VIP_OURO')}
                        className="text-xs px-3 py-1.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/20 font-bold uppercase transition-colors"
                      >Marcar Ouro</button>
                      <button 
                        onClick={() => handleUpdateSubscription('VIP_PRATA')}
                        className="text-xs px-3 py-1.5 rounded bg-gray-400/10 text-gray-300 border border-gray-400/30 hover:bg-gray-400/20 font-bold uppercase transition-colors"
                      >Marcar Prata</button>
                      <button 
                        onClick={() => handleUpdateSubscription('COMUM')}
                        className="text-xs px-3 py-1.5 rounded bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 font-bold uppercase transition-colors"
                      >Tornar Comum</button>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-primary-foreground mb-3 font-bold border-l-2 border-primary-foreground pl-2">Observações</h3>
                  <div className="bg-input/30 border border-border p-4 rounded-lg text-sm text-gray-300 italic">
                    {selectedCustomer.notes || 'Nenhuma observação registrada.'}
                  </div>
                </div>

                {/* Histórico */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest text-primary-foreground mb-3 font-bold border-l-2 border-primary-foreground pl-2 flex items-center gap-2"><Calendar className="w-4 h-4"/> Últimos Atendimentos</h3>
                  <div className="space-y-2">
                    {selectedCustomer.history.map((h: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-input/30 border border-border p-3 rounded-lg text-sm">
                        <div>
                          <p className="font-bold text-white">{h.service}</p>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{new Date(h.date).toLocaleDateString()} com {h.barber}</p>
                        </div>
                        <span className="font-mono text-primary-foreground">R$ {h.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GALERIA DE CORTES (CUSTOMER GALLERY) */}
                <div>
                  <div className="flex items-center justify-between mb-3 border-l-2 border-primary-foreground pl-2">
                    <h3 className="text-xs uppercase tracking-widest text-primary-foreground font-bold flex items-center gap-2"><Camera className="w-4 h-4"/> Galeria de Cortes</h3>
                    
                    <label className={`text-[10px] bg-primary-foreground text-primary px-3 py-1.5 rounded uppercase tracking-widest font-bold cursor-pointer hover:opacity-90 transition-opacity ${uploadingGallery ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadGalleryPhoto(e, selectedCustomer.id)} disabled={uploadingGallery} />
                      {uploadingGallery ? 'Enviando...' : 'Adicionar Foto'}
                    </label>
                  </div>
                  
                  {customerGallery.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {customerGallery.map((photo: any) => (
                         <div key={photo.id} className="aspect-square bg-input rounded overflow-hidden relative group border border-white/5">
                           <img src={resolveUrl(photo.image?.url)} alt="Corte" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                           {photo.isFavorite && (
                             <div className="absolute top-1 right-1 bg-yellow-500 text-black p-1 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]"><Star className="w-2 h-2 fill-black" /></div>
                           )}
                         </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-input/30 border border-border p-4 rounded-lg text-sm text-muted-foreground italic text-center">
                      Nenhuma foto adicionada à galeria.
                    </div>
                  )}
                </div>

                {/* Produtos e Cursos */}
                <div className="grid grid-cols-1 gap-6 mt-8">
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-primary-foreground mb-3 font-bold border-l-2 border-primary-foreground pl-2 flex items-center gap-2"><Package className="w-4 h-4"/> Produtos</h3>
                    {selectedCustomer.products.length > 0 ? (
                       <div className="space-y-2">
                        {selectedCustomer.products.map((p: any, i: number) => (
                          <div key={i} className="text-sm bg-input/30 border border-border p-2 rounded flex justify-between">
                            <span className="text-white">{p.name}</span>
                            <span className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-muted-foreground italic">Nenhum produto comprado.</p>}
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-widest text-primary-foreground mb-3 font-bold border-l-2 border-primary-foreground pl-2 flex items-center gap-2"><BookOpen className="w-4 h-4"/> Cursos</h3>
                    {selectedCustomer.courses.length > 0 ? (
                       <div className="space-y-2">
                        {selectedCustomer.courses.map((c: any, i: number) => (
                          <div key={i} className="text-sm bg-input/30 border border-border p-2 rounded flex justify-between">
                            <span className="text-white">{c.name}</span>
                            <span className="text-xs text-muted-foreground">{new Date(c.date).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-muted-foreground italic">Nenhum curso comprado.</p>}
                  </div>
                </div>

              </div>
              
              <div className="p-6 bg-input border-t border-border mt-auto space-y-3">
                <button 
                  onClick={() => router.push(`/barber/appointments?new=true&customerId=${selectedCustomer.id}`)}
                  className="w-full bg-primary-foreground text-primary font-bold uppercase tracking-widest text-xs py-4 rounded hover:opacity-90 transition-opacity"
                >
                  Novo Agendamento
                </button>
                <button 
                  onClick={handleResetPassword}
                  className="w-full bg-transparent border border-primary-foreground text-primary-foreground font-bold uppercase tracking-widest text-xs py-3 rounded hover:bg-primary-foreground/10 transition-colors"
                >
                  Redefinir Senha
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
