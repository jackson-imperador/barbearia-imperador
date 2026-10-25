'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function HomePage() {
  const router = useRouter();
  const [services, setServices] = React.useState<any[]>([]);
  const [barbers, setBarbers] = React.useState<any[]>([]);
  const [courses, setCourses] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [siteSettings, setSiteSettings] = React.useState<any>(null);
  const [banners, setBanners] = React.useState<any[]>([]);
  const [galleries, setGalleries] = React.useState<any[]>([]);
  const [testimonials, setTestimonials] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [resServices, resBarbers, resCourses, resProducts, resSettings, resBanners, resGalleries, resTestimonials] = await Promise.all([
          api.get('/services').catch(() => ({ data: { data: [] } })),
          api.get('/barbers').catch(() => ({ data: { data: [] } })),
          api.get('/courses').catch(() => ({ data: [] })),
          api.get('/products').catch(() => ({ data: [] })),
          api.get('/cms/settings').catch(() => ({ data: null })),
          api.get('/cms/banners').catch(() => ({ data: [] })),
          api.get('/cms/galleries').catch(() => ({ data: [] })),
          api.get('/cms/testimonials').catch(() => ({ data: [] }))
        ]);
        
        setServices(resServices.data?.data || []);
        setBarbers(resBarbers.data?.data || []);
        setCourses(resCourses.data?.data || resCourses.data || []);
        setProducts(resProducts.data?.data || resProducts.data || []);
        setSiteSettings(resSettings.data || null);
        setBanners(resBanners.data || []);
        setGalleries(resGalleries.data || []);
        setTestimonials(resTestimonials.data || []);
      } catch (err) {
        console.error("Failed to load home page data", err);
      }
    }
    loadData();
  }, []);

  const handleBookNow = () => {
    router.push('/agendamento');
  };

  const handleCourses = () => {
    router.push('/academy');
  };

  const aboutUsText = siteSettings?.aboutUs || "Mais do que um simples corte de cabelo, oferecemos uma experiência de renovação. Nosso ambiente foi cuidadosamente desenhado para proporcionar conforto, luxo e a verdadeira essência da barbearia clássica combinada com a excelência moderna. Como diz o quadro que nos inspira diariamente: 'Nunca foi sorte. Sempre foi Deus!'. Acreditamos no trabalho duro, no detalhe perfeito e na satisfação total de cada cliente que senta em nossa cadeira.";
  const mainBanner = banners.length > 0 ? banners[0] : null;
  const siteName = siteSettings?.siteName || "Império Barber";
  const homeTitle = siteSettings?.homeTitle || mainBanner?.title || <><span className="text-primary-foreground">Império</span> Barber</>;
  const logoHero = siteSettings?.logo?.url;
  const homeSubtitle = siteSettings?.homeSubtitle || mainBanner?.subtitle || "Experimente o ápice do cuidado e maestria. Um santuário premium para o cavalheiro moderno.";
  const heroImage = siteSettings?.heroBanner?.url || mainBanner?.image?.url || "/images/hero-bg-desktop.webp";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground overflow-hidden">
      
      {/* 1. Hero */}
      <section className="relative w-full h-screen flex flex-col items-center justify-center bg-black">
        <picture className="absolute inset-0 w-full h-full opacity-40">
           <img src={heroImage} alt={siteName as string} className="w-full h-full object-cover" />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
        
        <motion.div 
          className="relative z-10 text-center px-4 max-w-4xl mt-20"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="mb-6 flex justify-center items-center">
            {logoHero ? (
              <img src={logoHero} alt={siteName as string} className="h-24 md:h-32 object-contain drop-shadow-2xl" />
            ) : (
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white uppercase drop-shadow-lg">
                {homeTitle}
              </h1>
            )}
          </motion.div>
          <motion.p variants={fadeInUp} className="text-lg md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto font-light drop-shadow-md">
            {homeSubtitle}
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={handleBookNow} className="w-full sm:w-auto text-lg px-8 py-6 rounded-none bg-primary-foreground text-primary hover:bg-white transition-colors uppercase font-bold">
              Agendar Horário
            </Button>
            <Button size="lg" onClick={handleCourses} variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 rounded-none border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary transition-colors uppercase font-bold">
              Explorar Cursos
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Nossa Barbearia - Nova Seção */}
      <section className="w-full py-24 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div 
              className="lg:w-1/2"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="relative p-2 bg-card border border-border">
                <img src="/images/gallery-barbearia.webp" alt="Nossa Barbearia" className="w-full h-auto object-cover" />
                <div className="absolute -bottom-6 -right-6 w-32 h-32 border-4 border-primary-foreground hidden md:block"></div>
              </div>
            </motion.div>
            <motion.div 
              className="lg:w-1/2 space-y-6"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tight text-primary-foreground">Nossa Barbearia</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {aboutUsText}
              </p>
              <div className="pt-6">
                <Button onClick={handleBookNow} variant="outline" className="rounded-none border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary uppercase tracking-widest px-8">
                  Viver a Experiência
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Services Preview */}
      <section className="w-full py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <SectionTitle title="Nossos Serviços" />
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Experiências de cuidados feitas sob medida para a perfeição.</p>
          </div>
          
          {/* Mobile: horizontal scroll. Desktop: grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {services.length > 0 ? services.slice(0, 6).map((service: any) => (
              <Card key={service.id} onClick={handleBookNow} className="overflow-hidden border-border bg-background group cursor-pointer rounded-none">
                <div className="h-48 bg-muted overflow-hidden relative">
                  <img src={service.image?.url || `/images/gallery-barbearia.webp`} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70" />
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-base font-bold uppercase line-clamp-1">{service.name}</h3>
                    <span className="text-primary-foreground font-semibold text-sm">R$ {Number(service.price).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">{service.duration} Min • {service.description || 'Experiência premium'}</p>
                  <Button onClick={handleBookNow} variant="outline" className="w-full rounded-none border-border uppercase text-xs">Agendar</Button>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-3 text-center text-muted-foreground">Nenhum serviço disponível no momento.</div>
            )}
          </div>
          {/* Mobile horizontal scroll */}
          <div className="flex md:hidden gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
            {services.length > 0 ? services.map((service: any) => (
              <div key={service.id} onClick={handleBookNow} className="flex-shrink-0 w-52 snap-start bg-card border border-border rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform">
                <div className="h-36 bg-muted overflow-hidden">
                  <img src={service.image?.url || `/images/gallery-barbearia.webp`} alt={service.name} className="w-full h-full object-cover opacity-75" />
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm uppercase line-clamp-1 text-white">{service.name}</h3>
                  <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{service.duration} min</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                    <span className="text-amber-500 font-black text-sm">R$ {Number(service.price).toFixed(2).replace('.', ',')}</span>
                    <span className="text-[10px] text-amber-500 uppercase font-bold">Agendar →</span>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-muted-foreground text-sm">Nenhum serviço disponível.</p>
            )}
          </div>
          <div className="mt-8 text-center">
            <Button onClick={() => router.push('/services')} variant="link" className="text-primary-foreground uppercase tracking-widest">Ver Todos os Serviços →</Button>
          </div>
        </div>
      </section>

      {/* 4. Featured Barbers */}
      <section className="w-full py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <SectionTitle title="Nossa Equipe" />
          </div>
          {/* Desktop grid */}
          <div className="hidden md:grid md:grid-cols-4 gap-6">
            {barbers.length > 0 ? barbers.map((barber: any) => (
              <div key={barber.id} className="group text-center">
                <div className="relative overflow-hidden aspect-[3/4] mb-4 bg-card border border-border">
                  <img src={barber.photo?.url || `/images/gallery-barbearia.webp`} alt={barber.user.firstName} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 opacity-80" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-wider">{barber.user.firstName} {barber.user.lastName}</h3>
                <p className="text-sm text-primary-foreground">Barbeiro Profissional</p>
              </div>
            )) : (
              <div className="col-span-4 text-center text-muted-foreground">Nenhum barbeiro disponível no momento.</div>
            )}
          </div>
          {/* Mobile: horizontal scroll */}
          <div className="flex md:hidden gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
            {barbers.length > 0 ? barbers.map((barber: any) => (
              <div key={barber.id} className="flex-shrink-0 w-40 snap-start text-center">
                <div className="relative overflow-hidden rounded-xl aspect-[3/4] mb-3 bg-card border border-border">
                  <img src={barber.photo?.url || `/images/gallery-barbearia.webp`} alt={barber.user.firstName} className="w-full h-full object-cover opacity-80" />
                </div>
                <h3 className="text-sm font-bold uppercase text-white leading-tight">{barber.user.firstName} {barber.user.lastName}</h3>
                <p className="text-[10px] text-amber-500 uppercase mt-0.5">Barbeiro</p>
              </div>
            )) : (
              <p className="text-muted-foreground text-sm">Nenhum barbeiro disponível.</p>
            )}
          </div>
        </div>
      </section>

      {/* 5. Featured Courses */}
      <section className="w-full py-24 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16">
            <div>
              <SectionTitle title="Academia" />
              <p className="text-muted-foreground mt-4">Eleve sua arte com nossos cursos profissionais.</p>
            </div>
            <Button onClick={handleCourses} variant="outline" className="hidden md:inline-flex rounded-none mt-4 border-border uppercase">Navegar na Academia</Button>
          </div>
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {courses.length > 0 ? courses.map((course, i) => (
              <motion.div key={course.id} variants={fadeInUp}>
                <Card className="overflow-hidden border-border bg-background rounded-none">
                  <div className="h-48 bg-muted relative">
                    <img src={course.imageUrl || `/images/gallery-barbearia.webp`} alt={course.title} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute top-4 right-4 bg-primary-foreground text-primary text-xs font-bold px-2 py-1 uppercase">Pro</div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold uppercase mb-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{course.description || 'Curso profissionalizante.'}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold">R$ {Number(course.price).toFixed(2)}</span>
                      <Button onClick={handleCourses} className="rounded-none uppercase">Ver Detalhes</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )) : (
              <div className="col-span-3 text-center text-muted-foreground">Nenhum curso disponível no momento.</div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 6. Products */}
      <section className="w-full py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <SectionTitle title="Produtos Exclusivos" />
          </div>
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {products.length > 0 ? products.map((product, i) => (
              <motion.div key={product.id} variants={fadeInUp} className="group border border-border p-4 bg-card hover:border-primary-foreground transition-colors cursor-pointer">
                <div className="aspect-square bg-background mb-4 p-4 flex items-center justify-center relative overflow-hidden">
                  <img src={product.media?.[0]?.media?.url || `/images/gallery-barbearia.webp`} alt={product.name} className="object-cover w-full h-full opacity-50 group-hover:opacity-80 transition-opacity" />
                </div>
                <h4 className="text-sm font-semibold uppercase mb-1">{product.name}</h4>
                <p className="text-primary-foreground font-bold mb-4">R$ {Number(product.price).toFixed(2)}</p>
                <Button onClick={() => router.push('/store')} variant="outline" className="w-full rounded-none text-xs uppercase border-border">Comprar</Button>
              </motion.div>
            )) : (
              <div className="col-span-4 text-center text-muted-foreground">Nenhum produto disponível no momento.</div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 7. Gallery */}
      <section className="w-full py-24 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <SectionTitle title="Galeria" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
            {galleries.length > 0 ? galleries.map((item, idx) => (
              <div key={item.id} className={`bg-muted relative overflow-hidden border border-border ${idx === 0 || idx === 3 ? 'col-span-2' : ''} ${idx === 0 ? 'row-span-2' : ''}`}>
                <img src={item.image?.url || "/images/gallery-barbearia.webp"} className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700" alt={item.caption || "Galeria"} />
              </div>
            )) : (
              <>
                <div className="col-span-2 row-span-2 bg-muted relative overflow-hidden border border-border">
                  <img src="/images/hero-bg-mobile.webp" className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700" alt="Ambiente Barbearia" />
                </div>
                <div className="bg-muted relative overflow-hidden border border-border">
                   <img src="/images/gallery-barbearia.webp" className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700" alt="Cadeira de Barbeiro" />
                </div>
                <div className="bg-muted relative overflow-hidden border border-border">
                  <img src="/images/hero-bg-desktop.webp" className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700" alt="Detalhes" />
                </div>
                <div className="col-span-2 bg-muted relative overflow-hidden border border-border">
                  <img src="/images/gallery-barbearia.webp" className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700" alt="Visão Geral" />
                </div>
              </>
            )}
          </div>
          <div className="mt-12 text-center">
            <Button onClick={() => router.push('/gallery')} variant="link" className="text-primary-foreground uppercase tracking-widest">Ver Galeria Completa</Button>
          </div>
        </div>
      </section>

      {/* 8. Testimonials */}
      <section className="w-full py-24 bg-background">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <SectionTitle title="O Que Dizem Nossos Clientes" />
          {testimonials.length > 0 ? (
            <div className="mt-16">
              <p className="text-2xl italic text-gray-300 font-light leading-relaxed">
                "{testimonials[0].content}"
              </p>
              <div className="mt-8">
                <h4 className="font-bold uppercase tracking-widest text-sm text-primary-foreground">{testimonials[0].authorName}</h4>
                <p className="text-xs text-muted-foreground mt-1">Nota {testimonials[0].rating}/5</p>
              </div>
            </div>
          ) : (
            <div className="mt-16">
              <p className="text-2xl italic text-gray-300 font-light leading-relaxed">
                "A atenção aos detalhes é inigualável. O ambiente é extremamente luxuoso e o atendimento impecável. Definitivamente a melhor barbearia que já frequentei."
              </p>
              <div className="mt-8">
                <h4 className="font-bold uppercase tracking-widest text-sm text-primary-foreground">Carlos M.</h4>
                <p className="text-xs text-muted-foreground mt-1">Cliente Satisfeito</p>
              </div>
            </div>
          )}
          <div className="flex justify-center gap-2 mt-12">
            <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
            <div className="w-2 h-2 rounded-full bg-border"></div>
            <div className="w-2 h-2 rounded-full bg-border"></div>
          </div>
        </div>
      </section>

      {/* 10. CTA */}
      <section className="w-full py-32 bg-primary-foreground text-primary text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 mix-blend-multiply"></div>
        <div className="relative z-10 container mx-auto px-4">
          <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tight mb-6">Transforme Seu Estilo Hoje.</h2>
          <p className="text-lg mb-10 max-w-xl mx-auto opacity-80 font-medium">Agende seu horário agora e experimente o mais alto padrão de cuidados masculinos.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={handleBookNow} className="rounded-none bg-primary text-primary-foreground hover:bg-black uppercase tracking-widest px-8 font-bold">Agendar Horário</Button>
            <Button size="lg" onClick={handleCourses} variant="outline" className="rounded-none border-primary text-primary hover:bg-primary hover:text-primary-foreground uppercase tracking-widest px-8 font-bold">Ver Cursos</Button>
          </div>
        </div>
      </section>
      
    </main>
  );
}
