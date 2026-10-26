"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  MapPin, MessageCircle, Star, Phone, Clock, Calendar,
  ChevronRight, Scissors, ShoppingBag, GraduationCap,
  Crown, CheckCircle, Camera,
  Menu, X, ChevronDown, Play, Award, Users, TrendingUp, Zap
} from "lucide-react";

// ─── TIPOS ────────────────────────────────────────────────────────────────────
interface SiteSettings { [key: string]: any;
  siteName?: string;
  homeTitle?: string;
  homeSubtitle?: string;
  aboutUs?: string;
  address?: string;
  workingHours?: string;
  whatsapp?: string;
  contactPhone?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  heroBanner?: { url?: string };
  homeVideo?: { url?: string };
}

interface Service { id: string; name: string; description?: string; price: number; duration?: number; imageUrl?: string; }
interface Barber { id: string; user: { firstName: string; lastName: string }; bio?: string; photoUrl?: string; specialties?: { name: string }[]; }
interface Product { id: string; name: string; description?: string; price: number; imageUrl?: string; images?: { url: string }[]; }
interface Course { id: string; title?: string; name?: string; description?: string; price: number; level?: string; thumbnailUrl?: string; }
interface GalleryItem { id: string; caption?: string; image?: { url: string }; imageUrl?: string; }
interface Testimonial { id: string; authorName: string; content: string; rating?: number; authorPhoto?: any; }

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://barbearia-imperador.onrender.com";

function resolveUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

function formatPrice(price: any) {
  const numPrice = Number(price) || 0;
  return `R$ ${numPrice.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

async function fetchPublic(path: string) {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// ─── ANIMAÇÕES ────────────────────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.8 },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

// Mocks Removed. Data strictly comes from API.

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dados da API
  const [settings, setSettings] = useState<SiteSettings>({});
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    async function loadData() {
      const [settingsData, servicesData, barbersData, productsData, coursesData, galleriesData, testimonialsData] = await Promise.all([
        fetchPublic("/cms/settings"),
        fetchPublic("/services"),
        fetchPublic("/users/barbers"),
        fetchPublic("/products"),
        fetchPublic("/courses"),
        fetchPublic("/cms/galleries"),
        fetchPublic("/cms/testimonials"),
      ]);

      if (settingsData) setSettings(settingsData.data || settingsData);
      
      // Serviços
      const svcArr = Array.isArray(servicesData) ? servicesData : servicesData?.items || servicesData?.data || [];
      setServices(svcArr.slice(0, 6));

      // Barbeiros
      const brbArr = Array.isArray(barbersData) ? barbersData : barbersData?.items || barbersData?.data || [];
      setBarbers(brbArr.slice(0, 3));

      // Produtos
      const prodArr = Array.isArray(productsData) ? productsData : productsData?.items || productsData?.data || [];
      setProducts(prodArr.slice(0, 4));

      // Cursos
      const courseArr = Array.isArray(coursesData) ? coursesData : coursesData?.items || coursesData?.data || [];
      setCourses(courseArr.slice(0, 3));

      // Galeria
      const galArr = Array.isArray(galleriesData) ? galleriesData : galleriesData?.items || galleriesData?.data || [];
      setGallery(galArr.slice(0, 6));

      // Depoimentos
      const testArr = Array.isArray(testimonialsData) ? testimonialsData : testimonialsData?.items || testimonialsData?.data || [];
      setTestimonials(testArr.slice(0, 3));

      setLoading(false);
    }
    loadData();
  }, []);

  // Dados reais
  const displayServices = services;
  const displayBarbers = barbers;
  const displayGallery = gallery;
  const displayTestimonials = testimonials;
  const displayProducts = products.length > 0 ? products : [];
  const displayCourses = courses.length > 0 ? courses : [];

  const siteName = settings.siteName || "IMPÉRIO BARBER";
  const heroTitle = settings.homeTitle || "Forjando\nSeu Legado";
  const heroSubtitle = settings.homeSubtitle || "Onde a tradição da barbearia clássica encontra o luxo contemporâneo. Uma experiência exclusiva para homens exigentes.";
  const aboutText = settings.aboutUs || "A Barbearia Império nasceu da paixão pela arte de transformar. Fundada por mestres do corte, somos referência em excelência, sofisticação e atendimento personalizado. Cada visita é uma experiência premium, do ambiente ao resultado final.";
  const address = settings.address || "Av. Principal, 1000 - Centro, Sua Cidade, SP";
  const workingHours = settings.workingHours || "Seg - Sáb: 09:00 às 20:00";
  const whatsapp = settings.whatsapp || "5511999999999";
  const phone = settings.contactPhone || "(11) 99999-9999";
  const instagramUrl = settings.instagramUrl || "https://instagram.com/barbeariaimperio";
  const heroImgUrl = resolveUrl(settings.heroBanner?.url);

  const navLinks = [
    { label: "Serviços", href: "#services" },
    { label: "Equipe", href: "#team" },
    { label: "Cursos", href: "/academy" },
    { label: "Loja", href: "/store" },
    { label: "Galeria", href: "#gallery" },
    { label: "Contato", href: "#contact" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 font-sans selection:bg-amber-600 selection:text-white">

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? "bg-black/90 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent py-5"}`}>
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-xl md:text-2xl font-black tracking-tighter text-white uppercase">
            {siteName.split(" ")[0]}<span className="text-amber-500">.</span>
          </motion.div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className="hover:text-amber-500 transition-colors uppercase tracking-widest text-xs">{l.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:block text-xs uppercase tracking-widest font-bold hover:text-white text-zinc-400 transition-colors">
              Entrar
            </Link>
            <Link href="/agendamento" className="bg-amber-600 hover:bg-amber-500 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.5)]">
              Agendar
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white p-2">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/5 px-4 pb-6"
            >
              <nav className="flex flex-col gap-4 pt-4">
                {navLinks.map(l => (
                  <a key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)} className="text-zinc-300 hover:text-amber-500 transition-colors uppercase tracking-widest text-sm py-2 border-b border-white/5">
                    {l.label}
                  </a>
                ))}
                <Link href="/login" className="text-zinc-400 uppercase tracking-widest text-sm pt-2">Entrar</Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/70 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-black/40 to-transparent z-10" />
          {heroImgUrl ? (
            <img src={heroImgUrl} alt="Barbearia Império" className="w-full h-full object-cover" />
          ) : (
            <video autoPlay muted loop playsInline className="w-full h-full object-cover">
              <source src="https://assets.mixkit.co/videos/preview/mixkit-barber-cutting-hair-with-scissors-and-comb-41716-large.mp4" type="video/mp4" />
            </video>
          )}
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-20 pt-24 pb-16">
          <div className="max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.2 }}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-amber-500 text-xs font-bold uppercase tracking-widest mb-6 md:mb-8">
                <Star className="w-3.5 h-3.5 fill-amber-500" /> Experiência Premium
              </motion.div>

              <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-white leading-[1.05] mb-6 md:mb-8 tracking-tighter">
                {heroTitle.split("\n").map((line, i) => (
                  <span key={i}>
                    {i === 1 ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-500 to-amber-700 italic pr-4">{line}</span> : line}
                    {i === 0 && <br />}
                  </span>
                ))}
              </h1>

              <p className="text-base md:text-xl text-zinc-400 mb-8 md:mb-12 max-w-2xl leading-relaxed font-light">
                {heroSubtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/agendamento" className="bg-amber-600 text-white px-8 py-4 md:py-5 rounded-full font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-amber-500 transition-all hover:scale-105 active:scale-95 group shadow-[0_0_40px_rgba(217,119,6,0.4)]">
                  Agendar Horário <Calendar className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                </Link>
                <a href="#services" className="bg-white/5 backdrop-blur-md text-white px-8 py-4 md:py-5 rounded-full font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-white/10 transition-all border border-white/10">
                  Ver Serviços
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats bar */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
          className="absolute bottom-0 left-0 right-0 z-20 bg-black/60 backdrop-blur-xl border-t border-white/5">
          <div className="container mx-auto px-4 md:px-6 py-4 md:py-5">
            <div className="grid grid-cols-3 gap-4 md:gap-8 text-center">
              {[
                { icon: <Users className="w-4 h-4" />, value: "5.000+", label: "Clientes" },
                { icon: <Award className="w-4 h-4" />, value: "12+", label: "Anos de Excelência" },
                { icon: <TrendingUp className="w-4 h-4" />, value: "4.9★", label: "Avaliação Média" },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="text-amber-500 flex items-center gap-1 text-xs uppercase tracking-widest">{s.icon} {s.label}</div>
                  <div className="text-xl md:text-2xl font-black text-white">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── SOBRE ────────────────────────────────────────────────────────── */}
      <section id="about" className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/5 rounded-full blur-[120px]" />
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <motion.div {...fadeUp}>
              <div className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-4">
                <span className="w-12 h-[1px] bg-amber-500" /> Nossa História
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6 leading-tight">
                Sobre a<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Barbearia</span>
              </h2>
              <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8">{aboutText}</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Scissors className="w-5 h-5" />, label: "Cortes Precisos" },
                  { icon: <Crown className="w-5 h-5" />, label: "Ambiente Premium" },
                  { icon: <CheckCircle className="w-5 h-5" />, label: "Produtos Importados" },
                  { icon: <Star className="w-5 h-5" />, label: "Atendimento VIP" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-3">
                    <div className="text-amber-500">{item.icon}</div>
                    <span className="text-sm font-medium text-zinc-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeUp} className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-48 md:h-64 rounded-2xl overflow-hidden">
                  <img src={resolveUrl(settings.aboutImage1?.url) || "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=800"} alt="Barbearia 1" className="w-full h-full object-cover" />
                </div>
                <div className="h-48 md:h-64 rounded-2xl overflow-hidden mt-8">
                  <img src={resolveUrl(settings.aboutImage2?.url) || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800"} alt="Barbearia 2" className="w-full h-full object-cover" />
                </div>
                <div className="h-48 md:h-64 rounded-2xl overflow-hidden">
                  <img src={resolveUrl(settings.aboutImage3?.url) || "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=800"} alt="Barbearia 3" className="w-full h-full object-cover" />
                </div>
                <div className="h-48 md:h-64 rounded-2xl overflow-hidden mt-8">
                  <img src={resolveUrl(settings.aboutImage4?.url) || "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800"} alt="Barbearia 4" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-amber-600 text-white p-4 md:p-6 rounded-2xl shadow-2xl">
                <p className="text-2xl md:text-3xl font-black">12+</p>
                <p className="text-xs uppercase tracking-widest mt-1">Anos de Arte</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SERVIÇOS ─────────────────────────────────────────────────────── */}
      <section id="services" className="py-24 md:py-32 bg-zinc-950 relative">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div {...fadeUp} className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-end mb-12 md:mb-20">
            <div className="max-w-2xl">
              <div className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-4">
                <span className="w-12 h-[1px] bg-amber-500" /> A Arte
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Nossos Serviços</h2>
            </div>
            <Link href="/agendamento" className="text-white hover:text-amber-500 font-bold uppercase tracking-widest text-xs transition-colors flex items-center gap-2 shrink-0">
              Agendar Agora <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {displayServices.map((svc, i) => {
              const imgSrc = resolveUrl(svc.imageUrl);
              const icons = [<Scissors key="s" />, <CheckCircle key="c" />, <Crown key="cr" />, <Zap key="z" />, <Star key="st" />, <Award key="a" />];
              return (
                <motion.div key={svc.id} variants={staggerItem}
                  className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden hover:bg-white/[0.04] transition-all group hover:border-amber-500/20 hover:-translate-y-1 duration-300">
                  {imgSrc && (
                    <div className="h-48 overflow-hidden">
                      <img src={imgSrc} alt={svc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale-[0.3] group-hover:grayscale-0" />
                    </div>
                  )}
                  <div className="p-6 md:p-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform duration-300">
                      {icons[i % icons.length]}
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-white mb-3 tracking-tight">{svc.name}</h3>
                    {svc.description && <p className="text-zinc-400 text-sm leading-relaxed mb-6">{svc.description}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-amber-500 text-xl md:text-2xl font-black">{formatPrice(svc.price)}</span>
                      {svc.duration && <span className="text-zinc-500 text-xs uppercase tracking-widest">{svc.duration} min</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div {...fadeUp} className="mt-12 text-center">
            <Link href="/services" className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 font-bold uppercase tracking-widest text-xs transition-colors">
              Ver Todos os Serviços <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── EQUIPE / BARBEIROS ────────────────────────────────────────────── */}
      <section id="team" className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div {...fadeUp} className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-end mb-12 md:mb-20">
            <div>
              <div className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-4">
                <span className="w-12 h-[1px] bg-amber-500" /> Os Mestres
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Nossa Equipe</h2>
            </div>
            <Link href="/agendamento" className="text-white hover:text-amber-500 font-bold uppercase tracking-widest text-xs transition-colors flex items-center gap-2 shrink-0">
              Agendar com Eles <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {displayBarbers.map((barber, i) => {
              const photo = resolveUrl(barber.photoUrl);
              const firstName = barber.user?.firstName || "";
              const lastName = barber.user?.lastName || "";
              return (
                <motion.div key={barber.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.2, duration: 0.6 }} className="group">
                  <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden mb-5">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10 opacity-70" />
                    {photo ? (
                      <img src={photo} alt={firstName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <Scissors className="w-20 h-20 text-zinc-600" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-5">
                      <h4 className="text-xl font-black text-white">{firstName} {lastName}</h4>
                    </div>
                  </div>
                  {barber.bio && <p className="text-zinc-400 text-sm leading-relaxed">{barber.bio}</p>}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ACADEMIA / CURSOS ─────────────────────────────────────────────── */}
      {(displayCourses.length > 0 || courses.length === 0) && (
        <section id="academy" className="py-24 md:py-32 bg-zinc-950 relative overflow-hidden">
          {settings.academyBanner?.url && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20" 
              style={{ backgroundImage: `url('${resolveUrl(settings.academyBanner.url)}')` }} 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent z-0" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-600/5 rounded-full blur-[100px] z-0" />
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
              <div className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-4">Academia</div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">{settings.academyName || "Meus Cursos"}</h2>
              <p className="text-zinc-400 text-base md:text-lg">{settings.academyDescription || "Aprenda com os melhores. Cursos em vídeo para barbeiros e entusiastas."}</p>
            </motion.div>

            {displayCourses.length > 0 ? (
              <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {displayCourses.map((course, i) => {
                  const thumb = resolveUrl(course.thumbnailUrl);
                  return (
                    <motion.div key={course.id} variants={staggerItem}
                      className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all group hover:-translate-y-1 duration-300">
                      <div className="relative h-48 bg-zinc-900">
                        {thumb ? (
                          <img src={thumb} alt={course.title || course.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <GraduationCap className="w-16 h-16 text-zinc-600" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                          {course.level || "Pro"}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                          <div className="w-14 h-14 rounded-full bg-amber-600 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white fill-white ml-1" />
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-black text-white mb-2">{course.title || course.name}</h3>
                        {course.description && <p className="text-zinc-400 text-sm line-clamp-2 mb-4">{course.description}</p>}
                        <div className="flex items-center justify-between">
                          <span className="text-amber-500 font-black text-lg">{formatPrice(course.price)}</span>
                          <Link href="/academy" className="text-xs text-amber-500 hover:text-amber-400 font-bold uppercase tracking-widest">Ver Curso →</Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div {...fadeUp} className="text-center py-16">
                <div className="w-24 h-24 rounded-full bg-amber-600/10 flex items-center justify-center mx-auto mb-6">
                  <GraduationCap className="w-12 h-12 text-amber-500" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">Em Breve</h3>
                <p className="text-zinc-400 max-w-md mx-auto">Novos cursos em desenvolvimento. Cadastre-se para ser notificado quando lançarmos.</p>
                <Link href="/register" className="inline-flex mt-6 bg-amber-600 text-white px-6 py-3 rounded-full font-bold uppercase tracking-widest text-sm">
                  Cadastrar
                </Link>
              </motion.div>
            )}

            <div className="text-center mt-10">
              <Link href="/academy" className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 font-bold uppercase tracking-widest text-xs">
                Ver Toda a Academia <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── PRODUTOS / LOJA ───────────────────────────────────────────────── */}
      {(displayProducts.length > 0 || products.length === 0) && (
        <section id="store" className="py-24 md:py-32 relative overflow-hidden">
          {settings.defaultImage?.url && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-10" 
              style={{ backgroundImage: `url('${resolveUrl(settings.defaultImage.url)}')`, backgroundAttachment: 'fixed' }} 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a] z-0" />
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div {...fadeUp} className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-end mb-12 md:mb-20">
              <div>
                <div className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-4">
                  <span className="w-12 h-[1px] bg-amber-500" /> Linha Premium
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">{settings.storeName || "Nossa Loja"}</h2>
              </div>
              <Link href="/store" className="text-white hover:text-amber-500 font-bold uppercase tracking-widest text-xs transition-colors flex items-center gap-2 shrink-0">
                Ver Todos os Produtos <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {displayProducts.length > 0 ? (
              <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {displayProducts.map((product) => {
                  const img = resolveUrl(product.imageUrl || product.images?.[0]?.url);
                  return (
                    <motion.div key={product.id} variants={staggerItem}
                      className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/30 transition-all group hover:-translate-y-1 duration-300">
                      <div className="h-40 md:h-56 bg-zinc-900">
                        {img ? (
                          <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-12 h-12 text-zinc-600" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-black text-white text-sm mb-1 truncate">{product.name}</h3>
                        <span className="text-amber-500 font-bold text-base">{formatPrice(product.price)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div {...fadeUp} className="text-center py-16">
                <div className="w-24 h-24 rounded-full bg-amber-600/10 flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-12 h-12 text-amber-500" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">Loja em Breve</h3>
                <p className="text-zinc-400 max-w-md mx-auto">Produtos premium para o cuidado masculino em breve disponíveis.</p>
                <Link href="/store" className="inline-flex mt-6 bg-amber-600 text-white px-6 py-3 rounded-full font-bold uppercase tracking-widest text-sm">
                  Visitar Loja
                </Link>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ── GALERIA ───────────────────────────────────────────────────────── */}
      <section id="gallery" className="py-24 md:py-32 bg-black relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
            <div className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-4">Portfólio</div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">Galeria</h2>
            <p className="text-zinc-400 text-base md:text-lg">Confira a excelência dos nossos profissionais impressa no estilo dos nossos clientes.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {displayGallery.map((item, i) => {
              const imgSrc = resolveUrl(item.image?.url || item.imageUrl);
              return (
                <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="group relative aspect-square rounded-xl md:rounded-2xl overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-black/40 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white translate-y-4 group-hover:translate-y-0 transition-all duration-300" />
                  </div>
                  {imgSrc ? (
                    <img src={imgSrc} alt={item.caption || "Galeria"} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                      <Camera className="w-10 h-10 text-zinc-600" />
                    </div>
                  )}
                  {item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-medium">{item.caption}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link href="/customer/lookbook" className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 font-bold uppercase tracking-widest text-xs">
              Ver Galeria Completa <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ───────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-zinc-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-600/5 rounded-full blur-[120px]" />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
            <div className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-4">Reconhecimento</div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">A Voz de {siteName}</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTestimonials.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6 }}
                className="bg-white/[0.03] p-6 md:p-8 rounded-3xl border border-white/5 relative hover:border-amber-500/20 transition-all">
                <div className="absolute -top-5 left-8 w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center shadow-lg border-2 border-[#0a0a0a] overflow-hidden">
                  {t.authorPhoto ? (
                    <img src={resolveUrl(t.authorPhoto.url)} alt={t.authorName} className="w-full h-full object-cover" />
                  ) : (
                    <Star className="w-5 h-5 text-white fill-white" />
                  )}
                </div>
                <div className="flex gap-1 mb-4 mt-4">
                  {Array.from({ length: t.rating || 5 }).map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-zinc-300 text-base leading-relaxed mb-6 italic">"{t.content}"</p>
                <div>
                  <p className="font-black text-white text-lg">{t.authorName}</p>
                  <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Cliente Premium</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTATO / MAPA ────────────────────────────────────────────────── */}
      <section id="contact" className="py-24 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeUp}>
              <div className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-4">
                <span className="w-12 h-[1px] bg-amber-500" /> Encontre-nos
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-8">Nossa Sede</h2>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-600/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-white font-bold mb-1">Endereço</p>
                    <p className="text-zinc-400 text-sm leading-relaxed">{address}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-600/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-white font-bold mb-1">Horário de Atendimento</p>
                    <p className="text-zinc-400 text-sm">{workingHours}</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-600/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-white font-bold mb-1">Telefone</p>
                    <p className="text-zinc-400 text-sm">{phone}</p>
                  </div>
                </li>
              </ul>

              <div className="flex gap-4 mt-8">
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
                <a href={instagramUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all">
                  <Camera className="w-4 h-4" /> Instagram
                </a>
              </div>
            </motion.div>

            <motion.div {...fadeUp} className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden h-80 md:h-96">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                  <p className="text-white font-bold text-lg mb-2">{siteName}</p>
                  <p className="text-zinc-400 text-sm">{address}</p>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer"
                    className="inline-flex mt-4 bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-500 transition-colors">
                    Abrir no Maps
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2000" alt="Background" className="w-full h-full object-cover opacity-20 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-[#0a0a0a]" />
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-4xl">
          <motion.h2 {...fadeUp} className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">
            Sua Transformação<br />Começa <span className="text-amber-500 italic">Agora.</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-zinc-400 mb-10 text-base md:text-xl max-w-2xl mx-auto font-light">
            Não deixe sua imagem para depois. Agende seu horário e eleve seu padrão de estilo.
          </motion.p>
          <motion.div {...fadeUp}>
            <Link href="/agendamento" className="bg-amber-600 text-white px-8 md:px-12 py-4 md:py-6 rounded-full font-black uppercase tracking-widest text-base md:text-lg inline-flex items-center gap-4 hover:bg-amber-500 transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(217,119,6,0.5)]">
              Reservar Horário VIP <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-black pt-16 md:pt-24 pb-8 md:pb-12 border-t border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="text-2xl font-black tracking-tighter text-white mb-4 uppercase">
                {siteName.split(" ")[0]}<span className="text-amber-500">.</span>
              </div>
              <p className="text-zinc-500 mb-6 text-sm font-light leading-relaxed">
                A barbearia que transforma homens comuns em verdadeiros imperadores do seu próprio estilo.
              </p>
              <div className="flex gap-3">
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-amber-600 hover:text-white transition-all">
                  <Camera className="w-4 h-4" />
                </a>
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:bg-green-600 hover:text-white transition-all">
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-5 uppercase tracking-widest text-xs">Explorar</h4>
              <ul className="space-y-3 text-zinc-500 text-sm">
                <li><a href="#services" className="hover:text-amber-500 transition-colors">Serviços</a></li>
                <li><Link href="/academy" className="hover:text-amber-500 transition-colors">Academia</Link></li>
                <li><Link href="/store" className="hover:text-amber-500 transition-colors">Produtos</Link></li>
                <li><Link href="#gallery" className="hover:text-amber-500 transition-colors">Galeria</Link></li>
                <li><Link href="/agendamento" className="hover:text-amber-500 transition-colors">Agendar</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-5 uppercase tracking-widest text-xs">Suporte</h4>
              <ul className="space-y-3 text-zinc-500 text-sm">
                <li><Link href="/about" className="hover:text-amber-500 transition-colors">Sobre Nós</Link></li>
                <li><Link href="/contact" className="hover:text-amber-500 transition-colors">Contato</Link></li>
                <li><a href="#" className="hover:text-amber-500 transition-colors">Perguntas Frequentes</a></li>
                <li><a href="#" className="hover:text-amber-500 transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-amber-500 transition-colors">Privacidade</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-5 uppercase tracking-widest text-xs">Contato</h4>
              <ul className="space-y-3 text-zinc-500 text-sm">
                <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />{address}</li>
                <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500 shrink-0" />{workingHours}</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-500 shrink-0" />{phone}</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-600 text-xs border-t border-white/5 pt-8 font-light">
            <p>© {new Date().getFullYear()} {siteName}. Todos os direitos reservados.</p>
            <p>Feito para Imperadores.</p>
          </div>
        </div>
      </footer>

      {/* ── WHATSAPP FAB ──────────────────────────────────────────────────── */}
      <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:scale-110 hover:bg-green-400 transition-all z-50 group">
        <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
        <span className="absolute right-16 md:right-20 bg-black/90 backdrop-blur-md text-white text-xs font-bold px-3 py-2 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 uppercase tracking-widest">
          Fale Conosco
        </span>
      </a>
    </div>
  );
}
