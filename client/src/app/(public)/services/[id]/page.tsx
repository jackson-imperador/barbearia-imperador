'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, Clock, DollarSign, Calendar, ChevronLeft, ArrowRight, User } from 'lucide-react';

export default function PremiumServicePage() {
  const { id } = useParams();
  const router = useRouter();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchService() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/services/${id}?isCustomer=true`);
        if (res.ok) {
          const data = await res.json();
          setService(data);
        }
      } catch (err) {
        console.error('Error fetching service details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchService();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <h1 className="text-3xl font-bold mb-4">Serviço não encontrado</h1>
        <button onClick={() => router.back()} className="text-amber-500 hover:underline">Voltar</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans pb-24 selection:bg-amber-500/30">
      {/* Hero Section */}
      <div className="relative h-[60vh] w-full bg-zinc-900">
        {service.image?.url ? (
          <Image
            src={service.image.url}
            alt={service.name}
            fill
            className="object-cover opacity-60 mix-blend-overlay"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
        
        <div className="absolute top-0 left-0 w-full p-6 z-10 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-amber-500 transition-colors border border-white/10"
          >
            <ChevronLeft size={24} />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-8 z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-500 text-xs font-medium uppercase tracking-wider rounded-full mb-4">
                {service.category?.name || 'Serviço Premium'}
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-2">
                {service.name}
              </h1>
              <div className="flex items-center gap-6 text-zinc-300 text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-amber-500" />
                  <span>{service.duration} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-amber-500 fill-amber-500" />
                  <span>5.0 ({service.reviews?.length || 0} avaliações)</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shrink-0 text-center min-w-[200px]">
              <div className="text-zinc-400 text-sm mb-1">Valor do investimento</div>
              <div className="text-4xl font-black text-white mb-4">
                R$ {Number(service.price).toFixed(2)}
              </div>
              <button 
                onClick={() => router.push(`/agendamento?service=${service.id}`)}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Agendar Agora
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Description */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-[2px] bg-amber-500"></div>
              Sobre o Serviço
            </h2>
            <p className="text-zinc-300 text-lg leading-relaxed font-light">
              {service.description || 'Um serviço de excelência executado pelos nossos melhores profissionais. Relaxe e aproveite uma experiência única pensada para o seu bem-estar e estilo.'}
            </p>
          </section>

          {/* Barbers */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-[2px] bg-amber-500"></div>
              Especialistas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {service.barbers && service.barbers.length > 0 ? (
                service.barbers.map((barber: any) => (
                  <div key={barber.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center gap-4 hover:border-amber-500/50 transition-colors group">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden relative border-2 border-transparent group-hover:border-amber-500 transition-colors">
                      {barber.photo ? (
                        <Image src={barber.photo} alt={barber.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                          <User size={24} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{barber.name}</h3>
                      <p className="text-zinc-400 text-sm line-clamp-1">{barber.bio || 'Especialista Premium'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-center text-zinc-400">
                  Nenhum especialista atribuído no momento.
                </div>
              )}
            </div>
          </section>

          {/* Reviews */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-[2px] bg-amber-500"></div>
              Avaliações de Clientes
            </h2>
            <div className="space-y-4">
              {service.reviews && service.reviews.length > 0 ? (
                service.reviews.map((review: any, i: number) => (
                  <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 p-6 rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 overflow-hidden relative">
                          {review.user?.avatarUrl ? (
                            <Image src={review.user.avatarUrl} alt="Avatar" fill className="object-cover" />
                          ) : (
                            <span className="font-bold text-sm uppercase">{review.user?.firstName?.[0] || 'C'}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">{review.user?.firstName || 'Cliente'} {review.user?.lastName || ''}</div>
                          <div className="text-xs text-zinc-500">{new Date(review.createdAt).toLocaleDateString('pt-BR')}</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(review.rating)].map((_, idx) => (
                          <Star key={idx} size={14} className="fill-amber-500 text-amber-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-zinc-300 italic">"{review.comment}"</p>
                  </div>
                ))
              ) : (
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-center text-zinc-400">
                  Nenhuma avaliação ainda. Seja o primeiro a avaliar!
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Sidebar - Related Services */}
        <div>
          <div className="sticky top-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              Combina perfeitamente com
            </h2>
            <div className="space-y-4">
              {service.relatedServices && service.relatedServices.length > 0 ? (
                service.relatedServices.map((related: any) => (
                  <div key={related.id} onClick={() => router.push(`/services/${related.id}`)} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl cursor-pointer hover:border-amber-500/50 transition-colors group flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden relative shrink-0">
                      {related.image?.url ? (
                        <Image src={related.image.url} alt={related.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-zinc-800"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white group-hover:text-amber-500 transition-colors">{related.name}</h3>
                      <div className="text-amber-500 font-medium text-sm mt-1">R$ {Number(related.price).toFixed(2)}</div>
                    </div>
                    <ArrowRight size={18} className="text-zinc-600 group-hover:text-amber-500 transition-colors shrink-0" />
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 text-sm">
                  Nenhum serviço relacionado encontrado.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
