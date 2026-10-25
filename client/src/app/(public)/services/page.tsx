'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, Clock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.33:3001';

function resolveUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_URL}${url}`;
}

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    fetch(`${API_URL}/services`, { credentials: 'include' })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        // API returns { data: [...] } or directly [...]
        const arr = Array.isArray(json) ? json : (json?.data || []);
        setServices(arr);
      })
      .catch(err => {
        console.error('Erro ao carregar serviços:', err);
        setError('Não foi possível carregar os serviços. Tente novamente.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
        <Scissors className="w-12 h-12 text-zinc-600" />
        <p className="text-zinc-400">{error}</p>
        <button onClick={() => window.location.reload()} className="text-amber-500 underline text-sm">Tentar novamente</button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-28">
      {/* Header */}
      <section className="w-full py-12 bg-card border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Scissors className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-widest text-white">
              Nossos Serviços
            </h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Experiências de cuidados feitas sob medida para a perfeição.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="container mx-auto px-4 py-8">
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Scissors className="w-16 h-16 text-zinc-600 mb-4" />
            <p className="text-zinc-400 font-bold mb-2">Nenhum serviço disponível</p>
            <p className="text-zinc-500 text-sm">Os serviços ainda não foram cadastrados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {services.filter(s => s.isActive !== false).map((service: any) => {
              const imgUrl = resolveUrl(service.image?.url || service.imageUrl);
              return (
                <div
                  key={service.id}
                  onClick={() => router.push('/agendamento')}
                  className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-amber-500/60 transition-all duration-300 active:scale-95"
                >
                  {/* Image */}
                  <div className="w-full h-36 bg-zinc-800 overflow-hidden relative">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors className="w-10 h-10 text-zinc-600" />
                      </div>
                    )}
                    {/* Amber overlay on hover */}
                    <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 transition-colors duration-300" />
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-white uppercase leading-tight mb-1 line-clamp-2">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="text-xs text-zinc-500 mb-2 line-clamp-2">{service.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                      <span className="text-amber-500 font-black text-sm">
                        R$ {Number(service.price || 0).toFixed(2).replace('.', ',')}
                      </span>
                      {service.duration && (
                        <span className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase">
                          <Clock className="w-3 h-3" />
                          {service.duration} min
                        </span>
                      )}
                    </div>
                    <button className="mt-2 w-full text-xs font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-lg py-1.5 hover:bg-amber-500 hover:text-black transition-all">
                      Agendar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}