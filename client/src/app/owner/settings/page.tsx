'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Crown, Star, Image as ImageIcon, CheckCircle, Store, BookOpen, Clock, Settings, FileText, Shield, Users, UserPlus, Key, Trash2 } from 'lucide-react';
import { MediaLibrary } from '@/components/media/MediaLibrary';
import Image from 'next/image';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('geral');
  const [showMediaLibrary, setShowMediaLibrary] = useState<{ open: boolean, field: string }>({ open: false, field: '' });
  
  const [admins, setAdmins] = useState<any[]>([]);
  const [newAdmin, setNewAdmin] = useState({ firstName: '', lastName: '', email: '', password: '', roleName: 'ADMIN' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [adminStatus, setAdminStatus] = useState('');
  const [passStatus, setPassStatus] = useState('');

  const [data, setData] = useState({
    siteName: '',
    contactEmail: '',
    contactPhone: '',
    whatsapp: '',
    address: '',
    primaryColor: '#C8A96A',
    secondaryColor: '#000000',
    logoId: '',
    logoUrl: '',
    faviconId: '',
    faviconUrl: '',
    defaultImageId: '',
    defaultImageUrl: '',
    aboutImage1Id: '',
    aboutImage1Url: '',
    aboutImage2Id: '',
    aboutImage2Url: '',
    aboutImage3Id: '',
    aboutImage3Url: '',
    aboutImage4Id: '',
    aboutImage4Url: '',
    workingHours: '',
    closedDays: '',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    cancellationLimitHours: 24,
    noShowPolicy: '',
    confirmationMessage: '',
    vipPrataPrice: 120,
    vipOuroPrice: 150,
    storeName: '',
    storeMessage: '',
    storePolicy: '',
    academyName: '',
    academyDescription: '',
    academyBannerId: '',
    academyBannerUrl: '',
    policyCancellation: '',
    policyPrivacy: '',
    termsOfUse: ''
  });

  useEffect(() => {
    fetchData();
    fetchAdmins();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cms/settings');
      const d = res.data?.data || res.data;
      if (d) {
        setData({
          siteName: d.siteName || '',
          contactEmail: d.contactEmail || '',
          contactPhone: d.contactPhone || '',
          whatsapp: d.whatsapp || '',
          address: d.address || '',
          primaryColor: d.primaryColor || '#C8A96A',
          secondaryColor: d.secondaryColor || '#000000',
          logoId: d.logoId || '',
          logoUrl: d.logo?.url || '',
          faviconId: d.faviconId || '',
          faviconUrl: d.favicon?.url || '',
          defaultImageId: d.defaultImageId || '',
          defaultImageUrl: d.defaultImage?.url || '',
          aboutImage1Id: d.aboutImage1Id || '',
          aboutImage1Url: d.aboutImage1?.url || '',
          aboutImage2Id: d.aboutImage2Id || '',
          aboutImage2Url: d.aboutImage2?.url || '',
          aboutImage3Id: d.aboutImage3Id || '',
          aboutImage3Url: d.aboutImage3?.url || '',
          aboutImage4Id: d.aboutImage4Id || '',
          aboutImage4Url: d.aboutImage4?.url || '',
          workingHours: d.workingHours || '',
          closedDays: d.closedDays || '',
          currency: d.currency || 'BRL',
          timezone: d.timezone || 'America/Sao_Paulo',
          cancellationLimitHours: d.cancellationLimitHours || 24,
          noShowPolicy: d.noShowPolicy || '',
          confirmationMessage: d.confirmationMessage || '',
          vipPrataPrice: Number(d.vipPrataPrice) || 120,
          vipOuroPrice: Number(d.vipOuroPrice) || 150,
          storeName: d.storeName || '',
          storeMessage: d.storeMessage || '',
          storePolicy: d.storePolicy || '',
          academyName: d.academyName || '',
          academyDescription: d.academyDescription || '',
          academyBannerId: d.academyBannerId || '',
          academyBannerUrl: d.academyBanner?.url || '',
          policyCancellation: d.policyCancellation || '',
          policyPrivacy: d.policyPrivacy || '',
          termsOfUse: d.termsOfUse || ''
        });
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/users/admins');
      setAdmins(res.data);
    } catch (err) {
      console.error('Erro ao carregar administradores', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const payload = {
        siteName: data.siteName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        whatsapp: data.whatsapp,
        address: data.address,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        logoId: data.logoId || undefined,
        faviconId: data.faviconId || undefined,
        defaultImageId: data.defaultImageId || undefined,
        aboutImage1Id: data.aboutImage1Id || undefined,
        aboutImage2Id: data.aboutImage2Id || undefined,
        aboutImage3Id: data.aboutImage3Id || undefined,
        aboutImage4Id: data.aboutImage4Id || undefined,
        academyBannerId: data.academyBannerId || undefined,
        workingHours: data.workingHours,
        closedDays: data.closedDays,
        currency: data.currency,
        timezone: data.timezone,
        cancellationLimitHours: Number(data.cancellationLimitHours),
        noShowPolicy: data.noShowPolicy,
        confirmationMessage: data.confirmationMessage,
        vipPrataPrice: Number(data.vipPrataPrice),
        vipOuroPrice: Number(data.vipOuroPrice),
        storeName: data.storeName,
        storeMessage: data.storeMessage,
        storePolicy: data.storePolicy,
        academyName: data.academyName,
        academyDescription: data.academyDescription,
        policyCancellation: data.policyCancellation,
        policyPrivacy: data.policyPrivacy,
        termsOfUse: data.termsOfUse
      };
      
      await api.put('/cms/settings', payload);
      alert('Configurações salvas com sucesso! O Portal do Cliente já reflete estas informações.');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleMediaSelect = (arg1: any, arg2?: any) => {
    let media = null;
    if (Array.isArray(arg2) && arg2.length > 0) {
      media = arg2[0];
    } else if (Array.isArray(arg1) && arg1.length > 0 && typeof arg1[0] === 'object') {
      media = arg1[0];
    } else if (arg1 && typeof arg1 === 'object' && !Array.isArray(arg1)) {
      media = arg1;
    }

    if (!media || !media.id) {
      console.error('handleMediaSelect failed to extract media', { arg1, arg2 });
      return;
    }

    console.log('Media selected:', media.id, media.url);

    if (showMediaLibrary.field === 'logo') {
      setData(prev => ({ ...prev, logoId: media.id, logoUrl: media.url }));
    } else if (showMediaLibrary.field === 'favicon') {
      setData(prev => ({ ...prev, faviconId: media.id, faviconUrl: media.url }));
    } else if (showMediaLibrary.field === 'defaultImage') {
      setData(prev => ({ ...prev, defaultImageId: media.id, defaultImageUrl: media.url }));
    } else if (showMediaLibrary.field === 'academyBanner') {
      setData(prev => ({ ...prev, academyBannerId: media.id, academyBannerUrl: media.url }));
    } else if (showMediaLibrary.field === 'aboutImage1') {
      setData(prev => ({ ...prev, aboutImage1Id: media.id, aboutImage1Url: media.url }));
    } else if (showMediaLibrary.field === 'aboutImage2') {
      setData(prev => ({ ...prev, aboutImage2Id: media.id, aboutImage2Url: media.url }));
    } else if (showMediaLibrary.field === 'aboutImage3') {
      setData(prev => ({ ...prev, aboutImage3Id: media.id, aboutImage3Url: media.url }));
    } else if (showMediaLibrary.field === 'aboutImage4') {
      setData(prev => ({ ...prev, aboutImage4Id: media.id, aboutImage4Url: media.url }));
    }
    setShowMediaLibrary({ open: false, field: '' });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPassStatus('Salvando...');
      await api.patch('/auth/password', passwords);
      setPassStatus('Senha alterada com sucesso!');
      setPasswords({ currentPassword: '', newPassword: '' });
      setTimeout(() => setPassStatus(''), 3000);
    } catch (err: any) {
      setPassStatus(err.response?.data?.message || 'Erro ao alterar senha.');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAdminStatus('Criando...');
      await api.post('/users/admins', newAdmin);
      setAdminStatus('Administrador criado!');
      setNewAdmin({ firstName: '', lastName: '', email: '', password: '', roleName: 'ADMIN' });
      fetchAdmins();
      setTimeout(() => setAdminStatus(''), 3000);
    } catch (err: any) {
      setAdminStatus(err.response?.data?.message || 'Erro ao criar administrador.');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este administrador?')) return;
    try {
      setAdminStatus('Excluindo...');
      await api.delete(`/users/admins/${adminId}`);
      setAdminStatus('Administrador excluído!');
      fetchAdmins();
      setTimeout(() => setAdminStatus(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir administrador.');
      setAdminStatus('');
    }
  };

  const handleResetAdminPassword = async (adminId: string, adminName: string) => {
    const newPassword = window.prompt(`Digite a nova senha para o administrador ${adminName} (mínimo 6 caracteres):`);
    if (!newPassword) return;
    if (newPassword.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      setAdminStatus(`Atualizando senha de ${adminName}...`);
      await api.patch(`/users/${adminId}`, { password: newPassword });
      setAdminStatus('Senha do administrador atualizada com sucesso!');
      setTimeout(() => setAdminStatus(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao atualizar a senha do administrador.');
      setAdminStatus('');
    }
  };

  if (loading) return <div className="p-8 text-white uppercase tracking-widest text-sm">Carregando configurações...</div>;

  const tabs = [
    { id: 'geral', label: 'Geral & Contato', icon: Settings },
    { id: 'marca', label: 'Marca e Aparência', icon: ImageIcon },
    { id: 'horarios', label: 'Regras e Horários', icon: Clock },
    { id: 'agendamentos', label: 'Agendamentos', icon: Clock },
    { id: 'loja', label: 'Loja', icon: Store },
    { id: 'academy', label: 'Academy', icon: BookOpen },
    { id: 'vip', label: 'VIP / Pagamentos', icon: Crown },
    { id: 'politicas', label: 'Políticas Legais', icon: FileText },
    { id: 'seguranca', label: 'Segurança e Equipe', icon: Shield }
  ];

  return (
    <div className="space-y-8 max-w-6xl pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-border pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-primary-foreground">Central de Controle</h1>
          <p className="text-sm text-muted-foreground mt-1 uppercase tracking-widest">Painel Administrativo da Barbearia</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-primary-foreground text-primary font-bold uppercase tracking-widest text-xs px-8 py-4 h-auto shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all">
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      {error && <div className="bg-red-500/10 text-red-500 p-4 border border-red-500/20 font-bold uppercase text-xs">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* SIDEBAR TABS */}
        <div className="md:col-span-1 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary-foreground text-primary shadow-[0_0_15px_rgba(212,175,55,0.2)] border-l-4 border-primary'
                  : 'bg-card text-muted-foreground hover:bg-muted/10 border-l-4 border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div className="md:col-span-3 bg-card border border-border p-4 sm:p-8 shadow-xl relative min-h-[600px] rounded-xl overflow-hidden">
          
          {/* TAB: GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-xl font-bold uppercase tracking-widest text-primary-foreground border-b border-border pb-4 mb-6">Informações Gerais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Nome da Barbearia</label>
                  <input type="text" name="siteName" value={data.siteName} onChange={handleChange} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Moeda Padrão</label>
                  <select name="currency" value={data.currency} onChange={handleChange} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground transition-colors">
                    <option value="BRL">Real (R$)</option>
                    <option value="USD">Dólar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Fuso Horário</label>
                  <select name="timezone" value={data.timezone} onChange={handleChange} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground transition-colors">
                    <option value="America/Sao_Paulo">Brasília (BRT)</option>
                    <option value="America/Manaus">Manaus (AMT)</option>
                    <option value="America/New_York">New York (EST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">E-mail Comercial</label>
                  <input type="email" name="contactEmail" value={data.contactEmail} onChange={handleChange} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">WhatsApp Comercial</label>
                  <input type="text" name="whatsapp" value={data.whatsapp} onChange={handleChange} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Telefone Fixo</label>
                  <input type="text" name="contactPhone" value={data.contactPhone} onChange={handleChange} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Endereço Completo</label>
                  <input type="text" name="address" value={data.address} onChange={handleChange} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground transition-colors" />
                </div>
              </div>

              {/* IMAGENS — SOBRE A BARBEARIA */}
              <div className="mt-8 border-t border-border pt-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary-foreground mb-6">Imagens — Sobre a Barbearia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                  {[
                    { key: 'aboutImage1', label: 'Imagem 1 — Superior esquerda', url: data.aboutImage1Url },
                    { key: 'aboutImage2', label: 'Imagem 2 — Superior direita', url: data.aboutImage2Url },
                    { key: 'aboutImage3', label: 'Imagem 3 — Inferior esquerda', url: data.aboutImage3Url },
                    { key: 'aboutImage4', label: 'Imagem 4 — Inferior direita', url: data.aboutImage4Url },
                  ].map((img, i) => (
                    <div key={i}>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">{img.label}</label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="w-32 h-32 bg-input border border-border flex items-center justify-center overflow-hidden bg-black/50 relative">
                          {img.url ? (
                            <Image src={img.url} alt={`Sobre ${i+1}`} fill className="object-cover" />
                          ) : <ImageIcon className="w-8 h-8 text-muted-foreground/30" />}
                        </div>
                        <Button onClick={() => setShowMediaLibrary({ open: true, field: img.key })} variant="outline" className="text-xs uppercase tracking-widest w-full sm:w-auto mt-2 sm:mt-0">Escolher Imagem</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: MARCA */}
          {activeTab === 'marca' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-xl font-bold uppercase tracking-widest text-primary-foreground border-b border-border pb-4 mb-6">Marca e Aparência</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Logo Principal</label>
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 bg-input border border-border flex items-center justify-center overflow-hidden bg-black/50 p-2">
                      {data.logoUrl ? (
                        <div className="relative w-full h-full"><Image src={data.logoUrl} alt="Logo" fill className="object-contain" /></div>
                      ) : <ImageIcon className="w-8 h-8 text-muted-foreground/30" />}
                    </div>
                    <Button onClick={() => setShowMediaLibrary({ open: true, field: 'logo' })} variant="outline" className="text-xs uppercase tracking-widest">Alterar Logo</Button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Favicon (Ícone do Navegador)</label>
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-input border border-border flex items-center justify-center overflow-hidden bg-black/50 p-2">
                      {data.faviconUrl ? (
                        <div className="relative w-full h-full"><Image src={data.faviconUrl} alt="Favicon" fill className="object-contain" /></div>
                      ) : <ImageIcon className="w-6 h-6 text-muted-foreground/30" />}
                    </div>
                    <Button onClick={() => setShowMediaLibrary({ open: true, field: 'favicon' })} variant="outline" className="text-xs uppercase tracking-widest">Alterar Favicon</Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Cor Principal (Primária)</label>
                  <div className="flex items-center gap-3">
                    <input type="color" name="primaryColor" value={data.primaryColor} onChange={handleChange} className="w-12 h-12 bg-transparent cursor-pointer" />
                    <input type="text" name="primaryColor" value={data.primaryColor} onChange={handleChange} className="flex-1 bg-input border border-border p-3 text-sm font-mono text-white outline-none focus:border-primary-foreground uppercase" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Cor Secundária (Fundo)</label>
                  <div className="flex items-center gap-3">
                    <input type="color" name="secondaryColor" value={data.secondaryColor} onChange={handleChange} className="w-12 h-12 bg-transparent cursor-pointer" />
                    <input type="text" name="secondaryColor" value={data.secondaryColor} onChange={handleChange} className="flex-1 bg-input border border-border p-3 text-sm font-mono text-white outline-none focus:border-primary-foreground uppercase" />
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-6">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Imagem Padrão (Fallback)</label>
                <div className="flex items-center gap-6">
                  <div className="w-32 h-20 bg-input border border-border flex items-center justify-center overflow-hidden bg-black/50 p-2">
                    {data.defaultImageUrl ? (
                      <div className="relative w-full h-full"><Image src={data.defaultImageUrl} alt="Default" fill className="object-cover" /></div>
                    ) : <ImageIcon className="w-8 h-8 text-muted-foreground/30" />}
                  </div>
                  <Button onClick={() => setShowMediaLibrary({ open: true, field: 'defaultImage' })} variant="outline" className="text-xs uppercase tracking-widest">Selecionar Imagem Genérica</Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: HORÁRIOS */}
          {activeTab === 'horarios' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-xl font-bold uppercase tracking-widest text-primary-foreground border-b border-border pb-4 mb-6">Regras de Horários</h2>
              
              <div className="mb-6">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Horário de Funcionamento Geral</label>
                <p className="text-xs text-muted-foreground mb-4">Exibido publicamente no rodapé e perfil da barbearia.</p>
                <input type="text" name="workingHours" value={data.workingHours} onChange={handleChange} placeholder="Ex: Seg a Sab, 09:00 - 20:00" className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground" />
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Dias Fechados / Feriados Gerais</label>
                <p className="text-xs text-muted-foreground mb-4">Especifique dias da semana ou datas em que o estabelecimento não abre. (Separe por vírgula)</p>
                <input type="text" name="closedDays" value={data.closedDays} onChange={handleChange} placeholder="Ex: Domingo, Feriados Nacionais" className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground" />
              </div>
            </div>
          )}

          {/* TAB: AGENDAMENTOS */}
          {activeTab === 'agendamentos' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-xl font-bold uppercase tracking-widest text-primary-foreground border-b border-border pb-4 mb-6">Regras de Agendamento</h2>
              
              <div className="mb-6">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Antecedência Mínima Cancelamento (Horas)</label>
                <input type="number" name="cancellationLimitHours" value={data.cancellationLimitHours} onChange={handleChange} min="1" className="w-32 bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground" />
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Política de No-Show (Falta sem aviso)</label>
                <p className="text-xs text-muted-foreground mb-4">Esta regra aparecerá na confirmação do agendamento.</p>
                <textarea name="noShowPolicy" value={data.noShowPolicy} onChange={handleChange} rows={3} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground resize-y"></textarea>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Mensagem de Confirmação (WhatsApp/Email)</label>
                <textarea name="confirmationMessage" value={data.confirmationMessage} onChange={handleChange} rows={4} placeholder="Ex: Olá! Seu agendamento na Império está confirmado..." className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground resize-y"></textarea>
              </div>
            </div>
          )}

          {/* TAB: LOJA */}
          {activeTab === 'loja' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-xl font-bold uppercase tracking-widest text-primary-foreground border-b border-border pb-4 mb-6">Configurações da Loja / Estoque</h2>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Nome Público da Loja</label>
                <input type="text" name="storeName" value={data.storeName} onChange={handleChange} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground" />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Aviso/Banner no Checkout</label>
                <input type="text" name="storeMessage" value={data.storeMessage} onChange={handleChange} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground" />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Política da Loja (Devoluções, Prazos de Retirada)</label>
                <textarea name="storePolicy" value={data.storePolicy} onChange={handleChange} rows={5} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground resize-none"></textarea>
              </div>
            </div>
          )}

          {/* TAB: ACADEMY */}
          {activeTab === 'academy' && (
            <div className="bg-input/50 border border-border p-4 sm:p-6 rounded-lg mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-xl font-bold uppercase tracking-widest text-primary-foreground border-b border-border pb-4 mb-6">Configurações Academy</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Banner da Área Academy</label>
                  <div className="flex items-center gap-6">
                    <div className="w-48 h-24 bg-input border border-border flex items-center justify-center overflow-hidden bg-black/50 p-2 relative">
                    {data.academyBannerUrl ? (
                      <img src={data.academyBannerUrl.startsWith('http') ? data.academyBannerUrl : `${api.defaults.baseURL}${data.academyBannerUrl}`} alt="Academy Banner" className="w-full h-full object-cover" />
                    ) : <ImageIcon className="w-8 h-8 text-muted-foreground/30" />}
                    </div>
                  <Button onClick={() => setShowMediaLibrary({ open: true, field: 'academyBanner' })} variant="outline" className="text-xs uppercase tracking-widest">Alterar Banner</Button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Nome da Área de Cursos</label>
                <input type="text" name="academyName" value={data.academyName} onChange={handleChange} placeholder="Ex: Império Academy" className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground" />
              </div>
              
              <div className="mt-6">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Descrição/Apresentação dos Cursos</label>
                <textarea name="academyDescription" value={data.academyDescription} onChange={handleChange} rows={4} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground resize-none"></textarea>
              </div>
            </div>
          )}

          {/* TAB: VIP E PAGAMENTOS */}
          {activeTab === 'vip' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-xl font-bold uppercase tracking-widest text-primary-foreground border-b border-border pb-4 mb-6">Clube VIP e Gateway de Pagamento</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-input/30 border border-gray-400/30 p-5 rounded">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-4 h-4 text-gray-400" />
                    <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">VIP Prata ({data.currency}/mês)</p>
                  </div>
                  <input type="number" name="vipPrataPrice" value={data.vipPrataPrice} onChange={handleChange} min="1" step="0.01" className="w-full bg-input border border-border p-3 text-lg font-bold text-white outline-none focus:border-gray-400 text-center" />
                </div>
                
                <div className="bg-input/30 border border-yellow-500/30 p-5 rounded">
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <p className="text-xs uppercase tracking-widest text-yellow-500 font-bold">VIP Ouro ({data.currency}/mês)</p>
                  </div>
                  <input type="number" name="vipOuroPrice" value={data.vipOuroPrice} onChange={handleChange} min="1" step="0.01" className="w-full bg-input border border-border p-3 text-lg font-bold text-white outline-none focus:border-yellow-500 text-center" />
                </div>
              </div>

              <div className="border border-green-500/20 bg-green-500/5 p-6 rounded">
                <h3 className="text-sm font-bold text-green-500 uppercase tracking-widest mb-2 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Integração Mercado Pago</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">As chaves de API (Tokens e Webhooks) estão armazenadas nativamente no Backend (variáveis de ambiente do servidor) por motivos de segurança. Não expomos secrets nesta interface.<br/>Status atual: <strong>Produção / Online</strong></p>
                <div className="flex gap-4 text-xs font-mono text-green-400 bg-black/40 p-3 rounded">
                  <span>WEBHOOK: /payments/webhook/mercadopago</span>
                  <span>ENV: PRODUCTION</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: POLÍTICAS */}
          {activeTab === 'politicas' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-xl font-bold uppercase tracking-widest text-primary-foreground border-b border-border pb-4 mb-6">Políticas e Termos Legais</h2>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Termos de Uso (Geral)</label>
                <textarea name="termsOfUse" value={data.termsOfUse} onChange={handleChange} rows={5} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground resize-y"></textarea>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Política de Privacidade (LGPD)</label>
                <textarea name="policyPrivacy" value={data.policyPrivacy} onChange={handleChange} rows={5} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground resize-y"></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Política de Cancelamento (Financeiro)</label>
                <textarea name="policyCancellation" value={data.policyCancellation} onChange={handleChange} rows={5} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground resize-y"></textarea>
              </div>
            </div>
          )}

          {/* TAB: SEGURANÇA E EQUIPE */}
          {activeTab === 'seguranca' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-widest text-primary-foreground border-b border-border pb-4 mb-6 flex items-center gap-2"><Key className="w-5 h-5"/> Alterar Minha Senha</h2>
                <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Senha Atual</label>
                    <input type="password" required value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Nova Senha</label>
                    <input type="password" required minLength={6} value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground" />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between mt-2">
                    <span className="text-xs text-primary-foreground font-bold">{passStatus}</span>
                    <Button type="submit" variant="outline" className="text-xs uppercase tracking-widest">Atualizar Senha</Button>
                  </div>
                </form>
              </div>

              <div>
                <h2 className="text-xl font-bold uppercase tracking-widest text-primary-foreground border-b border-border pb-4 mb-6 flex items-center gap-2"><Users className="w-5 h-5"/> Administradores da Plataforma</h2>
                
                <div className="overflow-x-auto mb-8">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 text-[10px] uppercase tracking-widest text-muted-foreground">
                        <th className="p-3">Nome</th>
                        <th className="p-3">E-mail</th>
                        <th className="p-3">Permissão (Role)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map(admin => (
                        <tr key={admin.id} className="border-b border-border/10 text-sm">
                          <td className="p-3 font-bold text-white">{admin.firstName} {admin.lastName}</td>
                          <td className="p-3 text-muted-foreground">{admin.email}</td>
                          <td className="p-3">
                            <span className="bg-primary/20 text-primary-foreground text-[10px] px-2 py-1 rounded tracking-widest">{admin.roles.join(', ')}</span>
                          </td>
                          <td className="p-3">
                            {admin.isActive ? <span className="text-green-500 text-xs">ATIVO</span> : <span className="text-red-500 text-xs">INATIVO</span>}
                          </td>
                          <td className="p-3 text-right">
                            <button onClick={() => handleResetAdminPassword(admin.id, admin.firstName)} className="text-yellow-500 hover:text-yellow-400 p-2 rounded-full hover:bg-yellow-500/10 transition-colors mr-2" title="Alterar Senha">
                              <Key className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteAdmin(admin.id)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10 transition-colors" title="Excluir">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {admins.length === 0 && (
                        <tr><td colSpan={5} className="p-4 text-center text-sm text-muted-foreground">Nenhum administrador encontrado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-black/30 border border-border p-6 rounded">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary-foreground mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4"/> Adicionar Novo Administrador</h3>
                  <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                      <input type="text" required placeholder="Nome" value={newAdmin.firstName} onChange={e => setNewAdmin({...newAdmin, firstName: e.target.value})} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground" />
                    </div>
                    <div>
                      <input type="text" required placeholder="Sobrenome" value={newAdmin.lastName} onChange={e => setNewAdmin({...newAdmin, lastName: e.target.value})} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground" />
                    </div>
                    <div>
                      <input type="email" required placeholder="E-mail" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground" />
                    </div>
                    <div>
                      <input type="password" required minLength={6} placeholder="Senha Inicial" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} className="w-full bg-input border border-border p-3 text-sm text-white outline-none focus:border-primary-foreground" />
                    </div>
                    <div className="md:col-span-2 lg:col-span-4 flex items-center justify-between mt-2">
                      <span className="text-xs text-primary-foreground font-bold">{adminStatus}</span>
                      <Button type="submit" variant="outline" className="text-xs uppercase tracking-widest bg-primary text-black hover:bg-primary-foreground">Criar Administrador</Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showMediaLibrary.open && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8">
          <div className="bg-card w-full max-w-5xl h-[80vh] rounded-xl overflow-hidden relative border border-border">
            <button onClick={() => setShowMediaLibrary({ open: false, field: '' })} className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black font-bold uppercase text-xs tracking-widest">Fechar Biblioteca</button>
            <div className="h-full overflow-y-auto pt-12">
              <MediaLibrary
                selectionMode="single"
                onSelect={handleMediaSelect}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
