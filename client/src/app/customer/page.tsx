'use client';
import * as React from 'react';
import { Gift, RefreshCw, ShoppingBag, Clock, ArrowUpRight, AlertCircle, Package, Star } from 'lucide-react';
import { api } from '@/lib/api';

interface UserProfile {
  name?: string;
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  paymentMethod?: string;
  pixCode?: string;
  pixCodeBase64?: string;
  items?: OrderItem[];
}

interface FavoriteProduct {
  id: string;
  name: string;
  type?: string;
}

export default function CustomerDashboardPage() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const [profile, setProfile] = React.useState<UserProfile>({
    name: 'Cliente'
  });
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [favorites, setFavorites] = React.useState<FavoriteProduct[]>([]);
  const [recommendedProducts, setRecommendedProducts] = React.useState<any[]>([]);
  const [showAllOrders, setShowAllOrders] = React.useState(false);
  const [cancelingOrderId, setCancelingOrderId] = React.useState<string | null>(null);
  const [selectedPixOrder, setSelectedPixOrder] = React.useState<Order | null>(null);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar este pedido?')) return;
    
    setCancelingOrderId(orderId);
    try {
      await api.patch(`/store/orders/${orderId}/cancel`);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
    } catch (err) {
      alert('Não foi possível cancelar o pedido. Tente novamente.');
    } finally {
      setCancelingOrderId(null);
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [profileRes, ordersRes, favoritesRes, productsRes] = await Promise.all([
          api.get('/users/profile').catch(() => ({ data: {} })),
          api.get('/store/orders').catch(() => ({ data: [] })),
          api.get('/products/customer/favorites').catch(() => ({ data: [] })),
          api.get('/products').catch(() => ({ data: [] }))
        ]);

        if (profileRes.data) {
          setProfile({
            name: profileRes.data.name || 'Cliente'
          });
        }

        if (Array.isArray(ordersRes.data)) {
          setOrders(ordersRes.data);
        } else if (ordersRes.data && Array.isArray(ordersRes.data.orders)) {
          setOrders(ordersRes.data.orders);
        }

        if (Array.isArray(favoritesRes.data)) {
          setFavorites(favoritesRes.data);
        } else if (favoritesRes.data && Array.isArray(favoritesRes.data.favorites)) {
          setFavorites(favoritesRes.data.favorites);
        }

        if (productsRes.data) {
          const prods = Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data.data || []);
          setRecommendedProducts(prods.filter((p: any) => p.isActive).slice(0, 3));
        }

      } catch (err: any) {
        setError('Erro ao carregar dados do painel.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground uppercase tracking-widest text-xs font-bold">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-destructive/10 border border-destructive p-6 rounded-2xl flex flex-col items-center max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Ops, algo deu errado</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-destructive text-destructive-foreground px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-xs hover:opacity-90 transition-opacity">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      <div className="container mx-auto max-w-5xl">
        
        {/* HEADER */}
        <div className="mb-10 p-8 rounded-2xl border border-border bg-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-primary-foreground mb-2">
              MINHAS COMPRAS
            </h1>
            <p className="text-muted-foreground text-sm uppercase tracking-widest max-w-xl">
              Acompanhe seu histórico de pedidos, favoritos e as melhores recomendações.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* HISTÓRICO COMPLETO */}
          <section className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary-foreground mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4"/> Histórico de Pedidos
            </h3>
            
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Você ainda não tem pedidos no histórico.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, showAllOrders ? orders.length : 3).map((order) => (
                  <div key={order.id} className="p-4 bg-input/30 rounded-lg border border-border">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs uppercase tracking-widest font-bold text-primary-foreground bg-primary/10 px-2 py-1 rounded">
                          {order.status || 'Concluído'}
                        </span>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-2">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Data não disponível'}
                        </p>
                      </div>
                      <span className="font-mono text-primary-foreground font-bold">
                        R$ {Number(order.totalAmount ?? order.total ?? 0).toFixed(2)}
                      </span>
                    </div>
                    
                    {order.items && order.items.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Itens</p>
                        <ul className="space-y-1">
                          {order.items.map((item: any, idx: number) => (
                            <li key={item.id || idx} className="text-xs text-foreground flex justify-between">
                              <span>{item.quantity}x {item.product?.name || item.productName || 'Produto'}</span>
                              <span className="text-muted-foreground font-mono">R$ {Number(item.unitPrice ?? item.price ?? 0).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {order.status === 'PENDING' && (
                      <div className="mt-4 pt-3 border-t border-border/50 flex justify-end gap-2">
                        {order.paymentMethod === 'PIX' && order.pixCode && (
                          <button 
                            onClick={() => setSelectedPixOrder(order)}
                            className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground bg-primary px-3 py-1.5 rounded hover:bg-primary/80 transition-colors"
                          >
                            Pagar Agora
                          </button>
                        )}
                        <button 
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancelingOrderId === order.id}
                          className="text-[10px] font-bold uppercase tracking-widest text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                        >
                          {cancelingOrderId === order.id ? 'Cancelando...' : 'Cancelar Pedido'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {!showAllOrders && orders.length > 3 && (
              <button onClick={() => setShowAllOrders(true)} className="w-full mt-6 py-3 border border-border rounded-lg text-xs uppercase tracking-widest text-muted-foreground hover:bg-input transition-colors">
                Ver Todos os Pedidos
              </button>
            )}
          </section>

          {/* FAVORITOS E RECOMENDAÇÕES */}
          <section className="space-y-6">
             <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary-foreground mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4"/> Meus Favoritos
                </h3>
                
                {favorites.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-lg bg-input/10">
                    <p className="text-sm text-muted-foreground">Nenhum produto favoritado ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {favorites.map((f) => (
                      <div key={f.id} className="text-sm p-3 bg-input/30 rounded border border-border flex justify-between items-center group hover:border-primary-foreground/50 transition-colors">
                        <span className="text-white font-medium">{f.name || 'Produto'}</span>
                        <div className="flex items-center gap-3">
                          {f.type && (
                            <span className="text-[10px] uppercase text-muted-foreground bg-input px-2 py-1 rounded">
                              {f.type}
                            </span>
                          )}
                          <button className="text-muted-foreground hover:text-primary-foreground transition-colors" title="Ver produto">
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>

             <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary-foreground mb-6 flex items-center gap-2">
                  <Gift className="w-4 h-4"/> Produtos Recomendados
                </h3>
                <div className="space-y-4">
                {recommendedProducts.length > 0 ? recommendedProducts.map((prod: any) => (
                  <div key={prod.id} className="flex items-center gap-4 bg-background p-4 rounded-xl border border-border group hover:border-primary/50 transition-colors">
                    <div className="w-16 h-16 rounded-lg bg-input flex-shrink-0 flex items-center justify-center text-primary">
                      <Package className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-sm">{prod.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{prod.category?.name || 'Recomendado'}</p>
                    </div>
                    {prod.commercializationType === 'PARCEIRO' ? (
                      <div className="flex gap-2 w-full sm:w-auto">
                        {prod.shopeeLink && (
                          <a href={prod.shopeeLink} target="_blank" rel="noreferrer" className="bg-[#EE4D2D] text-white px-3 py-2 rounded font-bold uppercase text-[10px] hover:opacity-90 transition-opacity flex items-center justify-center">
                            Shopee
                          </a>
                        )}
                        {prod.mercadoLivreLink && (
                          <a href={prod.mercadoLivreLink} target="_blank" rel="noreferrer" className="bg-[#FFE600] text-[#2D3277] px-3 py-2 rounded font-bold uppercase text-[10px] hover:opacity-90 transition-opacity flex items-center justify-center">
                            M. Livre
                          </a>
                        )}
                        {prod.amazonLink && (
                          <a href={prod.amazonLink} target="_blank" rel="noreferrer" className="bg-[#232F3E] text-white px-3 py-2 rounded font-bold uppercase text-[10px] hover:opacity-90 transition-opacity flex items-center justify-center">
                            Amazon
                          </a>
                        )}
                      </div>
                    ) : (
                      <a href="/customer/store" className="w-full sm:w-auto bg-primary-foreground text-primary px-4 py-2 rounded font-bold uppercase text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                        <ShoppingBag className="w-4 h-4" /> Ver
                      </a>
                    )}
                  </div>
                )) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Nenhum produto disponível no momento.</p>
                  </div>
                )}
               </div>
              </div>
          </section>
        </div>

      </div>

      {/* PIX Modal */}
      {selectedPixOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
            <div className="p-6 flex flex-col items-center">
              <h3 className="text-xl font-bold uppercase tracking-widest text-primary-foreground mb-4">Pagamento PIX</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center">Escaneie o QR Code ou copie o código abaixo para pagar o seu pedido.</p>
              
              {selectedPixOrder.pixCodeBase64 && (
                <img src={`data:image/jpeg;base64,${selectedPixOrder.pixCodeBase64}`} alt="QR Code PIX" className="w-48 h-48 object-contain mb-6 bg-white rounded-lg p-2" />
              )}
              
              <div className="w-full bg-input/50 p-3 rounded-lg flex items-center justify-center mb-6">
                 <span className="text-xs font-mono break-all text-center select-all">{selectedPixOrder.pixCode}</span>
              </div>
              
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => {
                    if (selectedPixOrder.pixCode) {
                      navigator.clipboard.writeText(selectedPixOrder.pixCode);
                      alert('Código PIX copiado!');
                    }
                  }}
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-primary/90 transition-colors"
                >
                  Copiar PIX
                </button>
                <button 
                  onClick={() => setSelectedPixOrder(null)}
                  className="flex-1 bg-input text-foreground py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-input/80 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
