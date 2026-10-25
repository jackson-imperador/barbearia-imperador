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
  const [cmsSettings, setCmsSettings] = React.useState<any>(null);

  // Cart State
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = React.useState(false);
  const [pixData, setPixData] = React.useState<any>(null);
  const [pixCountdown, setPixCountdown] = React.useState(600);
  const [couponCode, setCouponCode] = React.useState('');
  const [externalCoupons, setExternalCoupons] = React.useState<any[]>([]);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pixData && pixData.paymentId && checkoutSuccess) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/payments/${pixData.paymentId}/status`);
          if (res.data.status === 'approved') {
             setPixData(null);
             // Payment confirmed, green check will show alone
             setTimeout(() => {
                setCheckoutSuccess(false);
                setIsCartOpen(false);
             }, 3000);
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
      const [prodRes, favRes, couponRes, cmsRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/customer/favorites').catch(() => ({ data: [] })),
        api.get('/coupons').catch(() => ({ data: [] })),
        api.get('/cms/settings').catch(() => ({ data: { data: {} } }))
      ]);
      setProducts(prodRes.data || []);
      setFavorites(favRes.data.map((f: any) => f.id) || []);
      setExternalCoupons(couponRes.data || []);
      setCmsSettings(cmsRes.data.data || {});
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
      const payload: any = { items, paymentMethod: 'PIX' };
      if (couponCode.trim()) payload.couponCode = couponCode.trim();
      const res = await api.post('/store/checkout', payload);
      setCart([]);
      setCouponCode('');
      setCheckoutSuccess(true);
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
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header Loja */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-primary-foreground">{cmsSettings?.storeName || 'Barber Store'}</h1>
          <div className="flex gap-4">
            <button className="relative p-2 hover:bg-input rounded-full transition">
              <Heart className="w-5 h-5 text-muted-foreground" />
              {favorites.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-primary-foreground rounded-full text-[10px] font-bold text-black flex items-center justify-center">{favorites.length}</span>}
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-input rounded-full transition">
              <ShoppingCart className="w-5 h-5 text-white" />
              {cartItemCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-primary-foreground rounded-full text-[10px] font-bold text-black flex items-center justify-center">{cartItemCount}</span>}
            </button>
          </div>
        </div>
        
        {/* Busca e Filtros */}
        <div className="max-w-[1200px] mx-auto px-4 pb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Buscar produtos..." className="w-full bg-input border border-border pl-10 pr-4 py-3 rounded-lg text-sm focus:border-primary-foreground outline-none text-white" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="px-4 bg-input border border-border rounded-lg flex items-center gap-2 hover:border-primary-foreground transition"><Filter className="w-4 h-4 text-white"/> <span className="text-xs uppercase tracking-widest hidden md:inline text-white">Filtros</span></button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
             <div className="w-8 h-8 border-4 border-primary-foreground border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-xs uppercase tracking-widest">Carregando catálogo...</p>
           </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center py-20 text-red-400">
             <AlertCircle className="w-12 h-12 mb-4" />
             <p className="text-sm font-bold">{error}</p>
             <button onClick={fetchStoreData} className="mt-4 bg-input px-4 py-2 rounded text-xs text-white uppercase tracking-widest hover:bg-card">Tentar Novamente</button>
           </div>
        ) : filteredProducts.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
             <Package className="w-12 h-12 mb-4 opacity-50" />
             <p className="text-sm">Nenhum produto encontrado.</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map(p => {
              const isFav = favorites.includes(p.id);
              let rawUrl = p.image?.url || p.media?.[0]?.media?.url;
              const imageUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${rawUrl}`) : 'https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?auto=format&fit=crop&w=400&q=80';
              
              return (
                <div key={p.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary-foreground/50 transition-colors group flex flex-col">
                  <div className="relative aspect-square bg-input">
                    <img src={imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <button onClick={() => toggleFavorite(p.id)} className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur rounded-full hover:bg-primary-foreground/20 transition">
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-primary-foreground text-primary-foreground' : 'text-white'}`} />
                    </button>
                    {p.commercializationType === 'PROPRIO' && p.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="bg-red-500 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded">Esgotado</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3 h-3 fill-primary-foreground text-primary-foreground" />
                      <span className="text-[10px] text-muted-foreground">{(p.reviews?.length || 0)} avaliações</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2 line-clamp-2 flex-1">{p.name}</h3>
                    {p.commercializationType === 'PARCEIRO' ? (
                      <div className="mt-auto">
                        <div className="mb-2">
                          {p.promoPrice && <span className="block text-[10px] text-muted-foreground line-through">R$ {Number(p.price).toFixed(2).replace('.',',')}</span>}
                          <span className="text-lg font-bold text-primary-foreground">R$ {(p.promoPrice ? Number(p.promoPrice) : Number(p.price)).toFixed(2).replace('.',',')}</span>
                        </div>
                        {(() => {
                          const coupon = externalCoupons.find(c => c.productId === p.id || !c.productId);
                          if (coupon) {
                            return (
                              <div className="mb-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex flex-col items-center">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Cupom Disponível</span>
                                <div className="flex w-full">
                                  <div className="bg-background flex-1 text-center py-1 rounded-l text-xs font-black text-white">{coupon.code}</div>
                                  <button onClick={() => navigator.clipboard.writeText(coupon.code)} className="bg-blue-500 text-white px-2 py-1 rounded-r text-[10px] font-bold uppercase hover:bg-blue-600 transition">Copiar</button>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        <div className="flex gap-2 w-full">
                          {[
                            { link: p.shopeeLink, label: 'Shopee' },
                            { link: p.mercadoLivreLink, label: 'Mercado Livre' },
                            { link: p.amazonLink, label: 'Amazon' }
                          ].filter(x => x.link).map((partner, idx, arr) => (
                            <a 
                              key={partner.label} 
                              href={partner.link!} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center text-center bg-white text-black py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-primary-foreground transition-colors"
                            >
                              {arr.length === 1 ? 'Comprar' : `Comprar na ${partner.label}`}
                            </a>
                          ))}
                          {(!p.shopeeLink && !p.mercadoLivreLink && !p.amazonLink) && (
                            <button disabled className="w-full bg-input text-muted-foreground py-2 rounded-lg text-xs font-bold uppercase">Indisponível</button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-end justify-between mt-auto">
                        <div>
                          {p.promoPrice && <span className="block text-[10px] text-muted-foreground line-through">R$ {Number(p.price).toFixed(2).replace('.',',')}</span>}
                          <span className="text-lg font-bold text-primary-foreground">R$ {(p.promoPrice ? Number(p.promoPrice) : Number(p.price)).toFixed(2).replace('.',',')}</span>
                        </div>
                        <button disabled={p.stock === 0} onClick={() => addToCart(p)} className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center hover:bg-primary-foreground disabled:opacity-50 disabled:bg-input transition-colors">
                          <Package className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !checkoutLoading && setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-card border-l border-border h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary-foreground" />
                Seu Carrinho
              </h2>
              <button onClick={() => !checkoutLoading && setIsCartOpen(false)} className="p-2 hover:bg-input rounded-full transition text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {cmsSettings?.storeMessage && (
              <div className="bg-primary/20 border-b border-primary/30 p-3 text-center">
                <p className="text-xs text-primary-foreground font-bold uppercase tracking-widest">{cmsSettings.storeMessage}</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 && !checkoutSuccess ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-sm uppercase tracking-widest text-center">Seu carrinho está vazio</p>
                </div>
              ) : checkoutSuccess ? null : (
                cart.map(item => {
                  const price = item.product.promoPrice ? Number(item.product.promoPrice) : Number(item.product.price);
                  let rawUrl = item.product.image?.url || item.product.media?.[0]?.media?.url;
                  const imageUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${rawUrl}`) : 'https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?auto=format&fit=crop&w=400&q=80';
                  return (
                    <div key={item.product.id} className="flex gap-4 bg-input rounded-xl p-3 border border-border/50">
                      <div className="w-20 h-20 bg-background rounded-lg overflow-hidden shrink-0">
                        <img src={imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white line-clamp-1">{item.product.name}</h4>
                          <p className="text-xs text-primary-foreground font-semibold mt-1">R$ {price.toFixed(2).replace('.',',')}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center bg-background rounded-lg overflow-hidden border border-border">
                            <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1 hover:bg-muted text-white transition"><Minus className="w-4 h-4" /></button>
                            <span className="w-8 text-center text-xs font-bold text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1 hover:bg-muted text-white transition"><Plus className="w-4 h-4" /></button>
                          </div>
                          <p className="text-sm font-bold text-white">R$ {(price * item.quantity).toFixed(2).replace('.',',')}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {(cart.length > 0 || checkoutSuccess) && (
              <div className="p-4 border-t border-border bg-card/90 backdrop-blur-md pb-8">
                {!checkoutSuccess && (
                  <>
                    <div className="mb-4">
                      <div className="flex bg-input rounded-lg border border-border overflow-hidden focus-within:border-primary-foreground transition-colors">
                        <input 
                          type="text" 
                          placeholder="CÓDIGO DO CUPOM"
                          value={couponCode}
                          onChange={e => setCouponCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                          className="flex-1 bg-transparent px-4 py-3 text-xs font-bold outline-none text-white uppercase placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-4 text-white">
                      <span className="text-sm text-muted-foreground uppercase tracking-widest">Subtotal</span>
                      <span className="text-2xl font-bold text-primary-foreground">R$ {cartTotal.toFixed(2).replace('.',',')}</span>
                    </div>
                  </>
                )}
                
                {checkoutError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{checkoutError}</p>
                  </div>
                )}

                {checkoutSuccess ? (
                  <div className="flex flex-col items-center">
                    <div className="w-full bg-green-500/10 border border-green-500/20 text-green-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Pedido Realizado!</span>
                    </div>
                    {pixData && (
                      <div className="bg-white p-4 rounded-xl flex flex-col items-center mt-2 w-full">
                        <div className="flex justify-between w-full items-center mb-4">
                          <span className="text-black text-xs font-bold uppercase tracking-widest">Escaneie para pagar</span>
                          <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded">
                            {Math.floor(pixCountdown / 60)}:{(pixCountdown % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <img src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48 object-contain mb-4" />
                        <span className="text-black text-[10px] break-all text-center px-4 mb-2 select-all bg-gray-100 p-2 rounded">{pixData.qrCode}</span>
                        <div className="flex gap-2 w-full mt-2">
                          <button 
                            onClick={() => navigator.clipboard.writeText(pixData.qrCode)} 
                            className="flex-1 bg-black text-white py-3 rounded-lg text-xs font-bold uppercase transition hover:bg-black/80"
                          >
                            Copiar PIX
                          </button>
                          <button 
                            onClick={() => { setCheckoutSuccess(false); setPixData(null); setIsCartOpen(false); }} 
                            className="flex-1 bg-gray-200 text-black py-3 rounded-lg text-xs font-bold uppercase transition hover:bg-gray-300"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={handleCheckout} 
                    disabled={checkoutLoading}
                    className="w-full bg-primary-foreground text-black font-bold uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary-foreground/90 transition disabled:opacity-50"
                  >
                    {checkoutLoading ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Finalizar Compra
                      </>
                    )}
                  </button>
                )}
                
                <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest">
                  Pagamento via PIX no checkout
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {cmsSettings?.storePolicy && (
        <div className="max-w-[1200px] mx-auto px-4 py-8 mt-12 border-t border-border/50">
          <h2 className="text-sm font-bold uppercase tracking-widest text-primary-foreground mb-4">Políticas da Loja</h2>
          <div className="bg-input/30 p-6 rounded-lg text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {cmsSettings.storePolicy}
          </div>
        </div>
      )}
    </div>
  );
}
