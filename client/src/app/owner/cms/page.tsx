"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import {
  Settings, Image as ImageIcon, Quote, Layout,
  Upload, X, Check, RefreshCw, Eye, Trash2,
  Plus, Save, MessageCircle, Phone,
  MapPin, Clock, Film, Share2
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

function resolveUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

// ─── MODAL DE SELEÇÃO DE MÍDIA ───────────────────────────────────────────────
function MediaPickerModal({ onSelect, onClose }: { onSelect: (media: any) => void; onClose: () => void }) {
  const [medias, setMedias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedias = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/media?limit=50&type=IMAGE");
      const data = res.data?.data || res.data || [];
      setMedias(Array.isArray(data) ? data : []);
    } catch (e) {
      setMedias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMedias(); }, [fetchMedias]);

  const handleUpload = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "cms");
      try {
        await api.post("/media/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      } catch (e) { console.error("Upload failed:", e); }
    }
    await fetchMedias();
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white font-bold uppercase tracking-widest text-sm">Biblioteca de Mídia</h3>
          <div className="flex items-center gap-3">
            <button onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
              {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Enviando..." : "Enviar Foto"}
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden"
              onChange={e => e.target.files && handleUpload(Array.from(e.target.files))} />
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          ) : medias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ImageIcon className="w-16 h-16 text-zinc-600 mb-4" />
              <p className="text-zinc-400 font-bold mb-2">Nenhuma imagem na biblioteca</p>
              <p className="text-zinc-500 text-sm">Clique em "Enviar Foto" para adicionar sua primeira imagem.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {medias.map(media => (
                <button key={media.id} onClick={() => onSelect(media)}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-white/5 hover:border-amber-500 transition-all">
                  <img src={resolveUrl(media.url)} alt={media.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Check className="w-8 h-8 text-amber-500" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs truncate">{media.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTE DE SELEÇÃO DE IMAGEM ─────────────────────────────────────────
function ImageSelector({ value, onChange, label, placeholder = "Imagem atual" }: {
  value?: string; onChange: (media: any) => void; label: string; placeholder?: string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const imgSrc = resolveUrl(value);

  return (
    <div className="space-y-2">
      <label className="text-xs text-zinc-400 uppercase tracking-widest font-bold">{label}</label>
      <div className="border border-white/10 rounded-xl overflow-hidden bg-zinc-900/50">
        {imgSrc ? (
          <div className="relative">
            <img src={imgSrc} alt={label} className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <button onClick={() => setShowPicker(true)}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">
                Trocar Imagem
              </button>
            </div>
          </div>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center gap-2 text-zinc-500">
            <ImageIcon className="w-8 h-8" />
            <p className="text-xs">{placeholder}</p>
          </div>
        )}
        <div className="p-2 flex gap-2">
          <button onClick={() => setShowPicker(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">
            <Upload className="w-3 h-3" /> {imgSrc ? "Trocar" : "Escolher Imagem"}
          </button>
          {imgSrc && (
            <button onClick={() => onChange({ url: "", id: null })} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 py-2 rounded-lg transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {showPicker && <MediaPickerModal onSelect={(m) => { onChange(m); setShowPicker(false); }} onClose={() => setShowPicker(false)} />}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL DO CMS ─────────────────────────────────────────────────
export default function AdminCMSPage() {
  const [activeTab, setActiveTab] = useState("hero");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Settings
  const [settings, setSettings] = useState<any>({});
  const [heroBannerUrl, setHeroBannerUrl] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [aboutImage1Url, setAboutImage1Url] = useState<string>("");
  const [aboutImage2Url, setAboutImage2Url] = useState<string>("");
  const [aboutImage3Url, setAboutImage3Url] = useState<string>("");
  const [aboutImage4Url, setAboutImage4Url] = useState<string>("");

  // Galleries
  const [galleries, setGalleries] = useState<any[]>([]);

  // Testimonials
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [newTestimonial, setNewTestimonial] = useState<any>({ authorName: "", content: "", rating: 5, authorPhotoId: null, authorPhoto: null });

  useEffect(() => {
    fetchSettings();
    fetchGalleries();
    fetchTestimonials();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/cms/settings");
      if (res.data) {
        setSettings(res.data);
        setHeroBannerUrl(res.data.heroBanner?.url || "");
        setLogoUrl(res.data.logo?.url || "");
        setAboutImage1Url(res.data.aboutImage1?.url || "");
        setAboutImage2Url(res.data.aboutImage2?.url || "");
        setAboutImage3Url(res.data.aboutImage3?.url || "");
        setAboutImage4Url(res.data.aboutImage4?.url || "");
      }
    } catch (e) { console.error(e); }
  };

  const saveSettings = async (extraData?: any) => {
    setSaving(true);
    try {
      const rawPayload = {
        logoId: settings.logoId,
        aboutImage1Id: settings.aboutImage1Id,
        aboutImage2Id: settings.aboutImage2Id,
        aboutImage3Id: settings.aboutImage3Id,
        aboutImage4Id: settings.aboutImage4Id,
        appIconId: settings.appIconId,
        heroBannerId: settings.heroBannerId,
        homeVideoId: settings.homeVideoId,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        aboutUs: settings.aboutUs,
        siteName: settings.siteName,
        homeTitle: settings.homeTitle,
        homeSubtitle: settings.homeSubtitle,
        address: settings.address,
        workingHours: settings.workingHours,
        whatsapp: settings.whatsapp,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        facebookUrl: settings.facebookUrl,
        instagramUrl: settings.instagramUrl,
        twitterUrl: settings.twitterUrl,
        vipPrataPrice: settings.vipPrataPrice,
        vipOuroPrice: settings.vipOuroPrice,
        ...extraData
      };

      // Remove null and undefined so class-validator doesn't complain about types
      const payload: any = {};
      Object.keys(rawPayload).forEach(key => {
        if (rawPayload[key] !== null && rawPayload[key] !== undefined) {
          payload[key] = rawPayload[key];
        }
      });
      
      await api.put("/cms/settings", payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert("Erro ao salvar"); }
    setSaving(false);
  };

  const fetchGalleries = async () => {
    try {
      const res = await api.get("/cms/galleries");
      setGalleries(res.data || []);
    } catch (e) { console.error(e); }
  };

  const addToGallery = async (media: any) => {
    const caption = window.prompt("Digite a descrição ou nome do Corte Modelo:", media.name || "Foto da Barbearia");
    if (caption === null) return; // User clicked Cancel

    try {
      await api.post("/cms/galleries", { imageId: media.id, caption: caption });
      fetchGalleries();
    } catch (e) { alert("Erro ao adicionar à galeria"); }
  };

  const deleteGallery = async (id: string) => {
    try {
      await api.delete(`/cms/galleries/${id}`);
      fetchGalleries();
    } catch (e) { alert("Erro ao excluir"); }
  };

  const fetchTestimonials = async () => {
    try {
      const res = await api.get("/cms/testimonials");
      setTestimonials(res.data || []);
    } catch (e) { console.error(e); }
  };

  const createTestimonial = async () => {
    if (!newTestimonial.authorName || !newTestimonial.content) return alert("Nome e depoimento são obrigatórios");
    try {
      await api.post("/cms/testimonials", { ...newTestimonial, authorPhoto: undefined });
      setNewTestimonial({ authorName: "", content: "", rating: 5, authorPhotoId: null, authorPhoto: null });
      fetchTestimonials();
    } catch (e) { alert("Erro ao criar"); }
  };

  const deleteTestimonial = async (id: string) => {
    try {
      await api.delete(`/cms/testimonials/${id}`);
      fetchTestimonials();
    } catch (e) { alert("Erro ao excluir"); }
  };

  const tabs = [
    { id: "hero", label: "Hero", icon: Layout },
    { id: "info", label: "Informações", icon: Settings },
    { id: "gallery", label: "Galeria / Cortes Modelos", icon: ImageIcon },
    { id: "testimonials", label: "Depoimentos", icon: Quote },
    { id: "social", label: "Social", icon: Share2 },
  ];

  const inputClass = "w-full p-2.5 md:p-3 bg-zinc-900 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors";
  const labelClass = "text-[10px] md:text-xs text-zinc-400 uppercase tracking-widest font-bold block mb-1 sm:mb-1.5";
  const sectionClass = "bg-zinc-900/30 border border-white/5 rounded-2xl p-3 sm:p-4 md:p-6 space-y-3 md:space-y-4";

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-6 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-white">Editar Home</h1>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Gerencie todo conteúdo do site</p>
        </div>
        <a href="/" target="_blank" className="mt-3 md:mt-0 flex items-center gap-2 text-zinc-400 hover:text-amber-500 transition-colors text-xs uppercase tracking-widest">
          <Eye className="w-4 h-4" /> Ver Site
        </a>
      </div>

      {/* Tabs Mobile Scrollable */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 md:mx-0 px-4 md:px-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-colors whitespace-nowrap shrink-0 font-bold ${
                activeTab === tab.id ? "bg-amber-600 text-white" : "bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white"
              }`}>
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={() => saveSettings()} disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
            saved ? "bg-green-600 text-white" : "bg-amber-600 hover:bg-amber-500 text-white"
          }`}>
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : saved ? "Salvo!" : "Salvar Alterações"}
        </button>
      </div>

      {/* ── TAB: HERO ─────────────────────────────────────────────────────── */}
      {activeTab === "hero" && (
        <div className="space-y-5">
          <div className={sectionClass}>
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">📸 Imagem Principal do Hero</h3>
            <p className="text-xs text-zinc-500">Esta é a imagem/vídeo que aparece no fundo da tela inicial. Depois de trocar, a HOME reflete automaticamente.</p>
            <ImageSelector
              label="Foto do Hero (fundo da tela inicial)"
              value={heroBannerUrl}
              onChange={(media) => {
                setHeroBannerUrl(media.url);
                setSettings((prev: any) => ({ ...prev, heroBannerId: media.id }));
              }}
              placeholder="Sem imagem — mostrando vídeo padrão"
            />
          </div>

          <div className={sectionClass}>
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">🏷️ Logo</h3>
            <ImageSelector
              label="Logo da Barbearia"
              value={logoUrl}
              onChange={(media) => {
                setLogoUrl(media.url);
                setSettings((prev: any) => ({ ...prev, logoId: media.id }));
              }}
              placeholder="Sem logo configurada"
            />
          </div>

          <div className={sectionClass}>
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">✍️ Textos do Hero</h3>
            <div>
              <label className={labelClass}>Nome da Barbearia</label>
              <input className={inputClass} value={settings.siteName || ""} onChange={e => setSettings({ ...settings, siteName: e.target.value })} placeholder="Ex: Barbearia Império" />
            </div>
            <div>
              <label className={labelClass}>Título Principal (aparece em destaque na tela)</label>
              <input className={inputClass} value={settings.homeTitle || ""} onChange={e => setSettings({ ...settings, homeTitle: e.target.value })} placeholder="Ex: Forjando Seu Legado" />
            </div>
            <div>
              <label className={labelClass}>Subtítulo (frase abaixo do título)</label>
              <textarea className={`${inputClass} h-24 resize-none`} value={settings.homeSubtitle || ""}
                onChange={e => setSettings({ ...settings, homeSubtitle: e.target.value })}
                placeholder="Ex: Onde a tradição da barbearia clássica encontra o luxo contemporâneo..." />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: INFORMAÇÕES ──────────────────────────────────────────────── */}
      {activeTab === "info" && (
        <div className="space-y-5">
          <div className={sectionClass}>
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">📖 Sobre a Barbearia</h3>
            <div>
              <label className={labelClass}>Texto "Sobre Nós" (aparece na seção Sobre)</label>
              <textarea className={`${inputClass} h-32 resize-none`} value={settings.aboutUs || ""}
                onChange={e => setSettings({ ...settings, aboutUs: e.target.value })}
                placeholder="Escreva a história da sua barbearia..." />
            </div>

            <div className="mt-6">
              <label className={labelClass}>Imagens (Sobre a Barbearia)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-2">
                <ImageSelector
                  label="Imagem 1 - Superior Esquerda"
                  value={aboutImage1Url}
                  onChange={(media) => {
                    setAboutImage1Url(media.url);
                    setSettings((prev: any) => ({ ...prev, aboutImage1Id: media.id }));
                  }}
                  placeholder="Sem imagem"
                />
                <ImageSelector
                  label="Imagem 2 - Superior Direita"
                  value={aboutImage2Url}
                  onChange={(media) => {
                    setAboutImage2Url(media.url);
                    setSettings((prev: any) => ({ ...prev, aboutImage2Id: media.id }));
                  }}
                  placeholder="Sem imagem"
                />
                <ImageSelector
                  label="Imagem 3 - Inferior Esquerda"
                  value={aboutImage3Url}
                  onChange={(media) => {
                    setAboutImage3Url(media.url);
                    setSettings((prev: any) => ({ ...prev, aboutImage3Id: media.id }));
                  }}
                  placeholder="Sem imagem"
                />
                <ImageSelector
                  label="Imagem 4 - Inferior Direita"
                  value={aboutImage4Url}
                  onChange={(media) => {
                    setAboutImage4Url(media.url);
                    setSettings((prev: any) => ({ ...prev, aboutImage4Id: media.id }));
                  }}
                  placeholder="Sem imagem"
                />
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">📍 Localização e Contato</h3>
            <div>
              <label className={labelClass}><MapPin className="inline w-3 h-3 mr-1" /> Endereço Completo</label>
              <input className={inputClass} value={settings.address || ""} onChange={e => setSettings({ ...settings, address: e.target.value })} placeholder="Ex: Av. Principal, 1000 - Centro, São Paulo, SP" />
            </div>
            <div>
              <label className={labelClass}><Clock className="inline w-3 h-3 mr-1" /> Horário de Funcionamento</label>
              <input className={inputClass} value={settings.workingHours || ""} onChange={e => setSettings({ ...settings, workingHours: e.target.value })} placeholder="Ex: Seg - Sáb: 09:00 às 20:00" />
            </div>
            <div>
              <label className={labelClass}><MessageCircle className="inline w-3 h-3 mr-1" /> WhatsApp (somente números, ex: 5511999999999)</label>
              <input className={inputClass} value={settings.whatsapp || ""} onChange={e => setSettings({ ...settings, whatsapp: e.target.value })} placeholder="5511999999999" />
            </div>
            <div>
              <label className={labelClass}><Phone className="inline w-3 h-3 mr-1" /> Telefone Fixo</label>
              <input className={inputClass} value={settings.contactPhone || ""} onChange={e => setSettings({ ...settings, contactPhone: e.target.value })} placeholder="(11) 3000-0000" />
            </div>
            <div>
              <label className={labelClass}>E-mail de Contato</label>
              <input className={inputClass} type="email" value={settings.contactEmail || ""} onChange={e => setSettings({ ...settings, contactEmail: e.target.value })} placeholder="contato@barbearia.com" />
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">🎓 Textos da Academia e Loja</h3>
            <div>
              <label className={labelClass}>Título da Página Academia</label>
              <input className={inputClass} value={settings.academyTitle || ""} onChange={e => setSettings({ ...settings, academyTitle: e.target.value })} placeholder="Meus Cursos" />
            </div>
            <div>
              <label className={labelClass}>Título da Loja Virtual</label>
              <input className={inputClass} value={settings.storeTitle || ""} onChange={e => setSettings({ ...settings, storeTitle: e.target.value })} placeholder="Nossa Loja" />
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">🔍 SEO (Otimização para Google)</h3>
            <div>
              <label className={labelClass}>Título no Google</label>
              <input className={inputClass} value={settings.seoTitle || ""} onChange={e => setSettings({ ...settings, seoTitle: e.target.value })} placeholder="Barbearia Império - Excelência em Corte Masculino" />
            </div>
            <div>
              <label className={labelClass}>Descrição no Google</label>
              <textarea className={`${inputClass} h-20 resize-none`} value={settings.seoDescription || ""}
                onChange={e => setSettings({ ...settings, seoDescription: e.target.value })}
                placeholder="Descrição que aparece no Google..." />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: GALERIA ──────────────────────────────────────────────────── */}
      {activeTab === "gallery" && (
        <div className="space-y-5">
          <div className={sectionClass}>
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">🖼️ Galeria / Cortes Modelos</h3>
            <p className="text-xs text-zinc-500">Adicione fotos da sua barbearia, cortes realizados, ambiente, equipe, etc. Elas aparecerão na HOME e na aba de Modelos para os clientes.</p>

            {/* Add New Gallery Item */}
            <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center">
              <AddGalleryButton onAdd={addToGallery} />
            </div>
          </div>

          {/* Gallery Grid */}
          {galleries.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma foto na galeria ainda.</p>
              <p className="text-xs mt-1">Clique no botão acima para adicionar a primeira foto.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {galleries.map((item: any) => {
                const imgSrc = resolveUrl(item.image?.url || item.imageUrl);
                return (
                  <div key={item.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/20 active:scale-95">
                    {imgSrc ? (
                      <img src={imgSrc} alt={item.caption || "Galeria"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-zinc-600" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex justify-between items-end">
                      <p className="text-white text-sm font-black uppercase tracking-widest line-clamp-2 drop-shadow-md">
                        {item.caption || "Sem Nome"}
                      </p>
                      <button onClick={() => deleteGallery(item.id)}
                        className="bg-red-600/90 hover:bg-red-500 text-white p-2 rounded-lg transition-colors shrink-0 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: DEPOIMENTOS ──────────────────────────────────────────────── */}
      {activeTab === "testimonials" && (
        <div className="space-y-5">
          <div className={sectionClass}>
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">💬 Adicionar Depoimento</h3>
            <div>
              <label className={labelClass}>Nome do Cliente</label>
              <input className={inputClass} value={newTestimonial.authorName} onChange={e => setNewTestimonial({ ...newTestimonial, authorName: e.target.value })} placeholder="Ex: Lucas Mendes" />
            </div>
            <div>
              <label className={labelClass}>Foto de Perfil (Opcional)</label>
              <div className="flex gap-4 items-center">
                {newTestimonial.authorPhoto ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500">
                    <img src={resolveUrl(newTestimonial.authorPhoto.url)} alt="Foto" className="w-full h-full object-cover" />
                    <button onClick={() => setNewTestimonial({ ...newTestimonial, authorPhotoId: null, authorPhoto: null })} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                    <ImageIcon className="w-6 h-6 text-zinc-500" />
                  </div>
                )}
                <div className="flex-1">
                  <AddTestimonialPhotoButton onAdd={(m) => setNewTestimonial({ ...newTestimonial, authorPhotoId: m.id, authorPhoto: m })} />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Depoimento</label>
              <textarea className={`${inputClass} h-24 resize-none`} value={newTestimonial.content} onChange={e => setNewTestimonial({ ...newTestimonial, content: e.target.value })} placeholder="O que o cliente disse sobre a barbearia..." />
            </div>
            <div>
              <label className={labelClass}>Nota (1-5 estrelas)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setNewTestimonial({ ...newTestimonial, rating: star })}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors ${newTestimonial.rating >= star ? "bg-amber-600 text-white" : "bg-zinc-800 text-zinc-500"}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>
            <button onClick={createTestimonial} className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-colors">
              <Plus className="w-4 h-4" /> Adicionar Depoimento
            </button>
          </div>

          <div className="space-y-3">
            {testimonials.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Quote className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum depoimento ainda.</p>
              </div>
            ) : testimonials.map((t: any) => (
              <div key={t.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex gap-4 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {t.authorPhoto ? (
                      <img src={resolveUrl(t.authorPhoto.url)} alt={t.authorName} className="w-8 h-8 rounded-full object-cover border border-amber-500" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-amber-500">
                        {t.authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="font-bold text-white text-sm">{t.authorName}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.rating || 5 }).map((_, s) => <span key={s} className="text-amber-500 text-xs">★</span>)}
                    </div>
                  </div>
                  <p className="text-zinc-400 text-sm">{t.content}</p>
                </div>
                <button onClick={() => deleteTestimonial(t.id)} className="text-red-400 hover:text-red-300 transition-colors shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: SOCIAL ───────────────────────────────────────────────────── */}
      {activeTab === "social" && (
        <div className="space-y-5">
          <div className={sectionClass}>
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">📲 Redes Sociais e Links</h3>
            <div>
              <label className={labelClass}><Share2 className="inline w-3 h-3 mr-1" /> Instagram URL</label>
              <input className={inputClass} value={settings.instagramUrl || ""} onChange={e => setSettings({ ...settings, instagramUrl: e.target.value })} placeholder="https://instagram.com/suabarbearia" />
            </div>
            <div>
              <label className={labelClass}><Share2 className="inline w-3 h-3 mr-1" /> Facebook URL</label>
              <input className={inputClass} value={settings.facebookUrl || ""} onChange={e => setSettings({ ...settings, facebookUrl: e.target.value })} placeholder="https://facebook.com/suabarbearia" />
            </div>
            <div>
              <label className={labelClass}><MessageCircle className="inline w-3 h-3 mr-1" /> WhatsApp (botão flutuante)</label>
              <input className={inputClass} value={settings.whatsapp || ""} onChange={e => setSettings({ ...settings, whatsapp: e.target.value })} placeholder="5511999999999" />
              <p className="text-xs text-zinc-500 mt-1">Apenas números com código do país. Ex: 5511999999999</p>
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className="text-sm font-black uppercase tracking-widest text-amber-500">🎨 Cores do Tema</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className={labelClass}>Cor Primária (Dourado)</label>
                <div className="flex gap-2 items-center">
                  <input type="color" className="w-12 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                    value={settings.primaryColor || "#d97706"} onChange={e => setSettings({ ...settings, primaryColor: e.target.value })} />
                  <input className={inputClass} value={settings.primaryColor || ""} onChange={e => setSettings({ ...settings, primaryColor: e.target.value })} placeholder="#d97706" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Cor Secundária (Fundo)</label>
                <div className="flex gap-2 items-center">
                  <input type="color" className="w-12 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                    value={settings.secondaryColor || "#0a0a0a"} onChange={e => setSettings({ ...settings, secondaryColor: e.target.value })} />
                  <input className={inputClass} value={settings.secondaryColor || ""} onChange={e => setSettings({ ...settings, secondaryColor: e.target.value })} placeholder="#0a0a0a" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BOTÃO AUXILIAR DE GALERIA (com picker interno) ──────────────────────────
function AddGalleryButton({ onAdd }: { onAdd: (media: any) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <>
      <button onClick={() => setShowPicker(true)}
        className="flex flex-col items-center gap-2 text-zinc-500 hover:text-amber-500 transition-colors w-full py-8">
        <Plus className="w-8 h-8" />
        <span className="text-xs uppercase tracking-widest font-bold">Adicionar Foto à Galeria</span>
      </button>
      {showPicker && (
        <MediaPickerModal
          onSelect={(m) => { onAdd(m); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

// ─── BOTÃO AUXILIAR DE FOTO DE DEPOIMENTO ────────────────────────────────────
function AddTestimonialPhotoButton({ onAdd }: { onAdd: (media: any) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <>
      <button onClick={() => setShowPicker(true)}
        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">
        <Upload className="w-4 h-4" /> SELECIONAR FOTO
      </button>
      {showPicker && (
        <MediaPickerModal
          onSelect={(m) => { onAdd(m); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
