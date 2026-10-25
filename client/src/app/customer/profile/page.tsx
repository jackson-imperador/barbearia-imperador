'use client';
import * as React from 'react';
import { api } from '@/lib/api';
import { User, Mail, Save, RefreshCw, Star, Clock, Crown, ArrowRight, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";
function resolveUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [profileData, setProfileData] = React.useState<any>(null);
  const [subscription, setSubscription] = React.useState<any>(null);
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [customerGallery, setCustomerGallery] = React.useState<any[]>([]);

  const handleFavorite = async (photoId: string) => {
    try {
      await api.patch(`/users/me/gallery/${photoId}/favorite`);
      
      setCustomerGallery(prev => prev.map(p => 
        p.id === photoId ? { ...p, isFavorite: !p.isFavorite } : p
      ));
    } catch (error) {
      console.error('Erro ao favoritar foto', error);
    }
  };

  React.useEffect(() => {
    const fetchProfileAndDashboard = async () => {
      try {
        const [resMe, resDash, resSub, resGallery] = await Promise.all([
          api.get('/auth/me'),
          api.get('/users/me/dashboard').catch(() => ({ data: null })),
          api.get('/users/me/subscription').catch(() => ({ data: null })),
          api.get('/users/me/gallery').catch(() => ({ data: [] }))
        ]);
        
        setUser(resMe.data);
        setFormData({
          firstName: resMe.data.firstName || '',
          lastName: resMe.data.lastName || '',
          email: resMe.data.email || '',
        });
        
        if (resDash.data) {
          setProfileData(resDash.data);
        }

        if (resSub.data?.isActive) {
          setSubscription(resSub.data);
        }

        setCustomerGallery(resGallery.data?.data || resGallery.data || []);
      } catch (err) {
        console.error('Erro ao buscar perfil', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndDashboard();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.patch(`/users/${user.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      setMessage('Perfil atualizado com sucesso!');
    } catch (err) {
      setMessage('Erro ao atualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
      window.location.href = '/login';
    }
  };

  const handleRepetirAtendimento = () => {
    if (profileData?.lastAppointment) {
      const stateToSave = {
        serviceId: profileData.lastAppointment.serviceId,
        barberId: profileData.lastAppointment.barberId,
      };
      localStorage.setItem('imperio_pending_appointment', JSON.stringify(stateToSave));
      router.push('/agendamento');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
        <span className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Carregando Perfil...</span>
      </div>
    );
  }

  // If the user has an active VIP subscription, show that in the badge
  // Otherwise fall back to the loyalty program level (BRONZE / PRATA / OURO)
  let loyaltyLevel: string;
  let loyaltySubtitle: string | null = null;

  if (subscription?.isActive && subscription?.plan) {
    // VIP subscription takes priority over loyalty program level
    const planLabel = subscription.plan === 'VIP_PRATA' ? 'PRATA' : 'OURO';
    loyaltyLevel = `VIP ${planLabel}`;
    loyaltySubtitle = subscription.plan === 'VIP_PRATA'
      ? '1 corte por semana incluso'
      : 'Cortes ilimitados inclusos';
  } else {
    loyaltyLevel = profileData?.loyalty?.level || 'BRONZE';
  }

  let loyaltyColor = 'text-orange-400';
  let loyaltyBg = 'bg-orange-400/10';
  let loyaltyBorder = 'border-orange-400/20';
  
  if (loyaltyLevel.includes('OURO') || loyaltyLevel.toUpperCase() === 'GOLD') {
    loyaltyColor = 'text-yellow-400';
    loyaltyBg = 'bg-yellow-400/10';
    loyaltyBorder = 'border-yellow-400/20';
  } else if (loyaltyLevel.includes('PRATA') || loyaltyLevel.toUpperCase() === 'SILVER') {
    loyaltyColor = 'text-gray-300';
    loyaltyBg = 'bg-gray-300/10';
    loyaltyBorder = 'border-gray-300/20';
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* PREMIUM HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-primary-foreground mb-2">
            MEU PERFIL
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            Gerencie suas informações e benefícios
          </p>
        </div>

        {/* LOYALTY BADGE */}
        <div className={`px-6 py-4 rounded-xl border ${loyaltyBorder} ${loyaltyBg} flex items-center gap-4`}>
          <div className={`p-3 rounded-full bg-background ${loyaltyColor}`}>
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Nível de Fidelidade</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-black uppercase tracking-widest ${loyaltyColor}`}>CLIENTE {loyaltyLevel}</span>
            </div>
            {loyaltySubtitle ? (
              <p className="text-xs mt-1" style={{color: 'inherit'}}>
                <span className={`${loyaltyColor} font-bold`}>✓</span> {loyaltySubtitle}
              </p>
            ) : (
              <p className="text-xs text-white/70 mt-1">{profileData?.loyalty?.points || 0} pontos acumulados</p>
            )}
            {loyaltyLevel.includes('PRATA') && (
              <p className="text-[10px] mt-2 italic opacity-80 uppercase tracking-widest text-gray-300">É um prazer ter você como cliente Prata! Obrigado pela preferência.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* REPETIR ATENDIMENTO */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Último Atendimento
            </h3>
            
            {profileData?.lastAppointment ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Serviço</p>
                  <p className="font-bold text-white text-sm">{profileData.lastAppointment.service?.name || 'Serviço'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Profissional</p>
                  <p className="font-medium text-white text-sm">{profileData.lastAppointment.barber?.firstName || 'Barbeiro'}</p>
                </div>
                {profileData.lastAppointment.startDateTime && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Data / Horário</p>
                    <p className="font-medium text-white text-sm">{new Date(profileData.lastAppointment.startDateTime).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                )}
                
                <button 
                  onClick={handleRepetirAtendimento}
                  className="w-full mt-4 bg-primary-foreground text-primary py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  Remarcar Este Corte <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground">Nenhum atendimento recente.</p>
                <button 
                  onClick={() => router.push('/agendamento')}
                  className="w-full mt-4 border border-primary-foreground text-primary-foreground py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-primary-foreground hover:text-primary transition-colors"
                >
                  Agendar Agora
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PROFILE FORM */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border p-6 rounded-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary-foreground mb-6 flex items-center gap-2">
              <User className="w-4 h-4" /> Dados Pessoais
            </h3>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <User className="w-3 h-3" /> Nome
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full bg-input/50 border border-border rounded-lg p-3 text-white focus:border-primary transition-colors outline-none text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <User className="w-3 h-3" /> Sobrenome
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full bg-input/50 border border-border rounded-lg p-3 text-white focus:border-primary transition-colors outline-none text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full bg-input/20 border border-border/50 rounded-lg p-3 text-muted-foreground cursor-not-allowed outline-none text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1">O email não pode ser alterado por aqui.</p>
              </div>

              {message && (
                <div className={`p-3 rounded-lg text-xs font-bold uppercase tracking-widest ${message.includes('sucesso') ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
                  {message}
                </div>
              )}

              <div className="pt-4 border-t border-border flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-destructive text-xs uppercase tracking-widest font-bold hover:opacity-80 transition-opacity"
                >
                  Sair da Conta
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="border border-border bg-input/50 text-white px-8 py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:border-primary-foreground hover:text-primary-foreground transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* GALERIA DE FOTOS (Real API) */}
        <div className="lg:col-span-3">
          <div className="bg-card border border-border p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary-foreground flex items-center gap-2">
                <Camera className="w-4 h-4" /> Minha Galeria de Cortes
              </h3>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Para você repetir o estilo</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {customerGallery.map((photo) => {
                const isFav = photo.isFavorite;
                return (
                  <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                    <img 
                      src={resolveUrl(photo.image?.url)} 
                      alt="Corte Anterior" 
                      className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <button 
                        onClick={() => handleFavorite(photo.id)}
                        className="w-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-widest text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                      >
                        <Star className={`w-3 h-3 ${isFav ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        {isFav ? 'Favoritado' : 'Favoritar'}
                      </button>
                    </div>
                    {isFav && (
                      <div className="absolute top-2 right-2 bg-yellow-500 text-black p-1.5 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.5)]">
                        <Star className="w-3 h-3 fill-black" />
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center p-4 bg-white/5">
                <Camera className="w-8 h-8 text-white/20 mb-2" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">O barbeiro adicionará fotos após o próximo corte.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
