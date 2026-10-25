'use client';
import * as React from 'react';
import { ShoppingCart, Search, Heart, Star, Filter, Package, AlertCircle, X, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

interface CartItem {
  product: any;
  quantity: number;
}

export default function StorefrontPage() {
  const [products, setProducts] = React.useState<any[]>([]);
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  // Cart State
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = React.useState(false);
  const [pixData, setPixData] = React.useState<any>(null);
  const [pixCountdown, setPixCountdown] = React.useState(600);
  const [lastOrderId, setLastOrderId] = React.useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = React.useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pixData && pixData.paymentId && checkoutSuccess) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/payments/${pixData.paymentId}/status`);
          if (res.data.status === 'approved') {
             setPaymentConfirmed(true);
             setPixData(null);
          }
        } catch (e) {
           console.error('Error polling pix status', e);
        }

        setPixCountdown(prev => {
          if (prev <= 5) {
            clearInterval(interval);
            return 0;
          }
          return prev - 5;
        });
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [pixData, checkoutSuccess]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodRes, favRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/customer/favorites').catch(() => ({ data: [] }))
      ]);
      setProducts(prodRes.data || []);
      setFavorites(favRes.data.map((f: any) => f.id) || []);
    } catch (err: any) {
      console.error('Erro ao carregar loja', err);
      setError('Não foi possível carregar o catálogo de produtos.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStoreData();
  }, []);

  const toggleFavorite = async (productId: string) => {
    try {
      // Optimistic update
      const isFav = favorites.includes(productId);
      if (isFav) {
        setFavorites(prev => prev.filter(id => id !== productId));
      } else {
        setFavorites(prev => [...prev, productId]);
      }
      
      await api.post(`/products/${productId}/favorite`);
    } catch (err) {
      alert('Erro ao atualizar favorito. Você precisa estar logado.');
      fetchStoreData(); // Revert
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQ = item.quantity + delta;
          return { ...item, quantity: newQ > 0 ? newQ : 0 };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));
      const res = await api.post('/store/checkout', { items, paymentMethod: 'PIX' });
      setCart([]);
      setCheckoutSuccess(true);
      setPaymentConfirmed(false);
      setLastOrderId(res.data.order?.id || null);
      if (res.data.pix) {
        setPixData(res.data.pix);
        setPixCountdown(600);
      } else {
        setTimeout(() => {
          setCheckoutSuccess(false);
          setIsCartOpen(false);
        }, 3000);
      }
    } catch (err: any) {
      setCheckoutError(err.response?.data?.message || 'Erro ao processar checkout. Tente novamente.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const cartTotal = cart.reduce((acc, item) => {
    const price = item.product.promoPrice ? Number(item.product.promoPrice) : Number(item.product.price);
    return acc + (price * item.quantity);
  }, 0);
  
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24 font-sans selection:bg-amber-500/30">
      
      {/* HEADER HERO PREMIUM */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-[#0a0a0a]/80 to-[#0a0a0a] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 md:py-12 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-1">
                Produtos <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">na Promoção</span>
              </h1>
              <p className="text-[10px] md:text-xs text-amber-500 font-bold tracking-[0.2em] uppercase">Compre mais barato aqui &lt;&lt;</p>
            </div>
            
            <div className="flex gap-3">
              <button className="relative p-3.5 bg-zinc-900/50 backdrop-blur-md hover:bg-zinc-800 rounded-2xl transition-all border border-white/10 group shadow-lg">
                <Heart className="w-5 h-5 text-zinc-400 group-hover:text-amber-500 transition-colors" />
                {favorites.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 rounded-full text-[10px] font-black text-black flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.6)]">{favorites.length}</span>}
              </button>
              <button onClick={() => setIsCartOpen(true)} className="relative p-3.5 bg-amber-500/10 backdrop-blur-md hover:bg-amber-500/20 rounded-2xl transition-all border border-amber-500/20 group shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                {cartItemCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 rounded-full text-[10px] font-black text-black flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.8)]">{cartItemCount}</span>}
              </button>
            </div>
          </div>
          
          {/* SEARCH & FILTER (Glassmorphism) */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-transparent opacity-0 group-focus-within:opacity-100 rounded-2xl transition-opacity blur-md" />
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-amber-500 transition-colors z-10" />
              <input 
                type="text" 
                placeholder="O que você está procurando hoje?" 
                className="relative w-full bg-[#111] border border-white/10 pl-12 pr-4 py-4 rounded-2xl text-sm md:text-base focus:border-amber-500/50 focus:bg-[#151515] transition-all outline-none text-white placeholder:text-zinc-600 shadow-inner z-10" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <button className="px-6 py-4 bg-[#111] border border-white/10 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#1a1a1a] hover:border-white/20 transition-all shadow-inner group">
              <Filter className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors"/> 
              <span className="text-xs font-black uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">Filtros</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 md:py-12">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
             <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-6"></div>
             <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Preparando vitrine...</p>
           </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center py-20 bg-red-500/5 border border-red-500/10 rounded-3xl mt-8">
             <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
             <p className="text-sm font-bold text-red-400">{error}</p>
             <button onClick={fetchStoreData} className="mt-6 bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-xl text-xs font-bold text-white uppercase tracking-widest hover:bg-zinc-800 transition-colors">Tentar Novamente</button>
           </div>
        ) : filteredProducts.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-24 text-zinc-500 bg-zinc-900/20 border border-zinc-800/50 rounded-3xl mt-8 backdrop-blur-sm">
             <Package className="w-16 h-16 mb-6 opacity-20" />
             <p className="text-sm font-medium">Nenhum produto encontrado na sua busca.</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredProducts.map(p => {
              const isFav = favorites.includes(p.id);
              let rawUrl = p.image?.url || p.media?.[0]?.media?.url;
              const imageUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${rawUrl}`) : 'https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?auto=format&fit=crop&w=800&q=80';
              const isEsgotado = (!p.commercializationType || p.commercializationType === 'PROPRIO') && p.stock === 0;
              
              return (
                <div key={p.id} className="bg-[#0f0f0f] border border-white/5 rounded-3xl overflow-hidden hover:border-amber-500/30 transition-all duration-500 group flex flex-col shadow-xl hover:shadow-[0_10px_40px_-15px_rgba(245,158,11,0.15)] relative">
                  
                  {/* Etiqueta de Promoção (Se houver promoPrice) */}
                  {p.promoPrice && !isEsgotado && (
                    <div className="absolute top-4 left-4 z-20 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                      Oferta
                    </div>
                  )}

                  <div className="relative aspect-[4/5] bg-[#151515] overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent opacity-80" />
                    
                    <button 
                      onClick={() => toggleFavorite(p.id)} 
                      className="absolute top-4 right-4 p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-all z-20 border border-white/10"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${isFav ? 'fill-amber-500 text-amber-500' : 'text-white group-hover:text-amber-500'}`} />
                    </button>
                    
                    {isEsgotado && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-[2px] z-10">
                        <span className="bg-red-500 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg border border-red-400/50">Esgotado</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1 relative z-10 -mt-8 bg-gradient-to-b from-transparent to-[#0f0f0f]">
                    <div className="flex items-center gap-1.5 mb-3 bg-black/50 w-fit px-2.5 py-1 rounded-full border border-white/5 backdrop-blur-md">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span className="text-[10px] font-bold text-zinc-300">{(p.reviews?.length || 0)} avaliações</span>
                    </div>
                    
                    <h3 className="text-base font-black text-white mb-2 line-clamp-2 flex-1 leading-tight">{p.name}</h3>
                    
                    <div className="flex items-end justify-between mt-auto mb-5">
                      <div className="flex flex-col">
                        {p.promoPrice && <span className="text-xs text-zinc-500 line-through font-medium mb-0.5">R$ {Number(p.price).toFixed(2).replace('.',',')}</span>}
                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                          R$ {(p.promoPrice ? Number(p.promoPrice) : Number(p.price)).toFixed(2).replace('.',',')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full mt-auto">
                      {(!p.commercializationType || p.commercializationType === 'PROPRIO') ? (
                        <button 
                          disabled={isEsgotado} 
                          onClick={() => addToCart(p)} 
                          className="w-full h-12 bg-white text-black rounded-xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-amber-500 disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 transition-all active:scale-95 shadow-lg group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        >
                          <Package className="w-4 h-4" /> Comprar
                        </button>
                      ) : (
                        <div className="flex gap-2 w-full mt-1">
                          {[
                            { link: p.shopeeLink, label: 'Shopee', color: 'bg-[#EE4D2D] text-white hover:shadow-[0_0_15px_rgba(238,77,45,0.4)]' },
                            { link: p.mercadoLivreLink, label: 'M. Livre', color: 'bg-[#FFE600] text-[#2D3277] hover:shadow-[0_0_15px_rgba(255,230,0,0.4)]' },
                            { link: p.amazonLink, label: 'Amazon', color: 'bg-[#232F3E] text-white hover:shadow-[0_0_15px_rgba(35,47,62,0.4)]' }
                          ].filter(x => x.link).map((partner, idx, arr) => (
                            <a 
                              key={partner.label} 
                              href={partner.link!} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`flex-1 h-12 ${partner.color} rounded-xl flex items-center justify-center text-[10px] font-black uppercase transition-all active:scale-95`}
                            >
                              {arr.length === 1 ? 'Comprar Agora' : partner.label}
                            </a>
                          ))}
                          {(!p.shopeeLink && !p.mercadoLivreLink && !p.amazonLink) && (
                            <button disabled className="w-full bg-zinc-900 border border-zinc-800 text-zinc-600 h-12 rounded-xl text-xs font-black uppercase">Indisponível</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Sidebar Modal (Redesenhado) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => !checkoutLoading && setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-[#0a0a0a] border-l border-white/10 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#111]">
              <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <ShoppingCart className="w-5 h-5 text-amber-500" />
                </div>
                Carrinho
              </h2>
              <button onClick={() => !checkoutLoading && setIsCartOpen(false)} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white border border-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 && !checkoutSuccess ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                  <ShoppingCart className="w-20 h-20 mb-6 opacity-10" />
                  <p className="text-xs font-bold uppercase tracking-widest text-center">Sua sacola está vazia</p>
                </div>
              ) : checkoutSuccess ? null : (
                cart.map(item => {
                  const price = item.product.promoPrice ? Number(item.product.promoPrice) : Number(item.product.price);
                  let rawUrl = item.product.image?.url || item.product.media?.[0]?.media?.url;
                  const imageUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${rawUrl}`) : 'https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?auto=format&fit=crop&w=400&q=80';
                  return (
                    <div key={item.product.id} className="flex gap-4 bg-[#111] rounded-2xl p-3 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="w-24 h-24 bg-[#0a0a0a] rounded-xl overflow-hidden shrink-0">
                        <img src={imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">{item.product.name}</h4>
                          <p className="text-xs text-amber-500 font-black mt-1">R$ {price.toFixed(2).replace('.',',')}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center bg-black rounded-lg overflow-hidden border border-white/10 h-8">
                            <button onClick={() => updateQuantity(item.product.id, -1)} className="w-8 h-full flex items-center justify-center hover:bg-white/10 text-zinc-400 transition-colors"><Minus className="w-3 h-3" /></button>
                            <span className="w-8 text-center text-xs font-black text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, 1)} className="w-8 h-full flex items-center justify-center hover:bg-white/10 text-zinc-400 transition-colors"><Plus className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {(cart.length > 0 || checkoutSuccess) && (
              <div className="p-6 border-t border-white/10 bg-[#111] pb-10">
                {!checkoutSuccess && (
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Total da Compra</span>
                    <span className="text-3xl font-black text-white">R$ {cartTotal.toFixed(2).replace('.',',')}</span>
                  </div>
                )}
                
                {checkoutError && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-xs font-medium">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{checkoutError}</p>
                  </div>
                )}

                {checkoutSuccess ? (
                  <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                    {paymentConfirmed ? (
                      <div className="w-full bg-green-500/10 border border-green-500/20 text-green-400 font-black py-6 px-4 rounded-2xl flex flex-col items-center justify-center gap-3 mb-6 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                        <span className="text-center text-lg">PAGAMENTO APROVADO!</span>
                        <div className="bg-black/50 p-4 rounded-xl w-full text-center border border-green-500/30">
                          <p className="text-xs text-green-500/70 uppercase tracking-widest mb-1">Garantia da Compra</p>
                          <p className="text-sm font-bold text-white mb-2">Sua compra foi confirmada em nossa loja física.</p>
                          <p className="text-xs text-zinc-400 uppercase tracking-widest">Número do Pedido:</p>
                          <p className="text-xl font-black text-amber-500 mt-1 select-all">{lastOrderId ? lastOrderId.split('-')[0].toUpperCase() : 'CONFIRMADO'}</p>
                        </div>
                        <button onClick={() => { setCheckoutSuccess(false); setPaymentConfirmed(false); setIsCartOpen(false); }} className="mt-4 bg-green-600 text-white w-full py-3 rounded-xl font-bold uppercase hover:bg-green-500 transition shadow-lg shadow-green-500/20">Continuar Comprando</button>
                      </div>
                    ) : pixData ? (
                      <div className="bg-white p-6 rounded-3xl flex flex-col items-center w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
                        
                        {lastOrderId && (
                          <div className="w-full bg-amber-50 p-3 rounded-xl mb-6 text-center border border-amber-200">
                            <span className="text-[10px] text-amber-700 font-black uppercase tracking-widest block mb-1">Número do Pedido</span>
                            <span className="text-sm font-black text-amber-600">{lastOrderId.split('-')[0].toUpperCase()}</span>
                          </div>
                        )}

                        <div className="flex justify-between w-full items-center mb-6">
                          <span className="text-black text-[10px] font-black uppercase tracking-widest">Escaneie para Pagar</span>
                          <span className="text-red-500 text-xs font-black bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 flex items-center gap-1">
                            {Math.floor(pixCountdown / 60)}:{(pixCountdown % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 shadow-inner mb-6">
                          <img src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48 object-contain" />
                        </div>
                        <div className="w-full bg-zinc-100 rounded-xl p-3 mb-4 border border-zinc-200">
                          <span className="block text-black text-[10px] font-medium break-all text-center select-all leading-tight">{pixData.qrCode}</span>
                        </div>
                        <div className="flex gap-2 w-full">
                          <button 
                            onClick={() => navigator.clipboard.writeText(pixData.qrCode)} 
                            className="flex-[2] bg-black text-white py-3.5 rounded-xl text-xs font-black uppercase transition-transform active:scale-95 shadow-lg"
                          >
                            Copiar PIX
                          </button>
                          <button 
                            onClick={() => { setCheckoutSuccess(false); setPixData(null); setIsCartOpen(false); }} 
                            className="flex-1 bg-zinc-200 text-black py-3.5 rounded-xl text-xs font-black uppercase transition-transform active:scale-95"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full bg-zinc-800/50 border border-zinc-700 text-zinc-400 font-black py-4 rounded-2xl flex items-center justify-center gap-2 mb-6">
                        <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Aguardando Pagamento...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={handleCheckout} 
                    disabled={checkoutLoading}
                    className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 hover:from-amber-300 hover:to-amber-400 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95"
                  >
                    {checkoutLoading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 fill-current" />
                        Finalizar Compra Segura
                      </>
                    )}
                  </button>
                )}
                
                <p className="text-[9px] text-center text-zinc-500 mt-4 font-bold uppercase tracking-[0.2em]">
                  Ambiente Seguro • Pagamento via PIX
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
