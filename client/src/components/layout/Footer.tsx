'use client';
import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export function Footer() {
  const [settings, setSettings] = React.useState<any>(null);

  React.useEffect(() => {
    api.get('/cms/settings')
      .then(res => setSettings(res.data))
      .catch(() => {});
  }, []);

  const companyName = settings?.aboutUs ? "Império" : "Império Barber"; // Se houver nome na setting, usaria.

  return (
    <footer className="w-full bg-black text-white border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            {settings?.logo?.url ? (
              <img src={settings.logo.url} alt={settings.siteName || "Logo da Barbearia"} className="h-16 mb-6 object-contain" />
            ) : (
              <h3 className="text-2xl font-bold uppercase tracking-widest text-primary-foreground mb-6">{settings?.siteName || "Império Barber"}</h3>
            )}
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              {settings?.aboutUs || "O destino premium para o cavalheiro moderno. Experimente a maestria inigualável em cuidados e estilo."}
            </p>
            <div className="flex space-x-4">
              {settings?.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-primary-foreground transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              )}
              {settings?.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-primary-foreground transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              )}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest mb-6">Explorar</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="/services" className="hover:text-primary-foreground transition-colors">Serviços</a></li>
              <li><a href="/academy" className="hover:text-primary-foreground transition-colors">Academia</a></li>
              <li><a href="/store" className="hover:text-primary-foreground transition-colors">Loja</a></li>
              <li><a href="/gallery" className="hover:text-primary-foreground transition-colors">Galeria</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest mb-6">Contato e Horários</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="/contact" className="hover:text-primary-foreground transition-colors">Fale Conosco</a></li>
              {settings?.whatsapp && <li><span className="text-gray-400">WhatsApp: {settings.whatsapp}</span></li>}
              {settings?.contactPhone && <li><span className="text-gray-400">Telefone: {settings.contactPhone}</span></li>}
              {settings?.contactEmail && <li><span className="text-gray-400">E-mail: {settings.contactEmail}</span></li>}
              {settings?.workingHours && <li><span className="text-gray-400">Horários: {settings.workingHours}</span></li>}
              {settings?.address && <li><span className="text-gray-400">Endereço: {settings.address}</span></li>}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest mb-6">Newsletter</h4>
            <p className="text-sm text-gray-400 mb-4">Inscreva-se para ofertas exclusivas e dicas de estilo.</p>
            <form className="flex" aria-label="Newsletter Subscription" onSubmit={(e) => { e.preventDefault(); alert('Inscrito com sucesso!'); }}>
              <input 
                type="email" 
                placeholder="Seu melhor e-mail" 
                className="w-full bg-input border border-border px-4 py-2 text-sm focus:outline-none focus:border-primary-foreground text-white" 
                aria-label="Email address"
                required 
              />
              <Button type="submit" className="rounded-none bg-primary-foreground text-primary hover:bg-white px-4 uppercase tracking-widest text-xs font-bold">Assinar</Button>
            </form>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-gray-500 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} {settings?.siteName || "Império Barber"}. Todos os direitos reservados.
          </p>
          <div className="flex space-x-4 text-xs text-gray-500">
            <span className="text-gray-700">Feito para dominar.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}