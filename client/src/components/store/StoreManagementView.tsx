'use client';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { 
  Plus, X, Search, Package, DollarSign, Tag, 
  ToggleLeft, ToggleRight, Loader2, Save, 
  Link as LinkIcon, Edit, Trash2, Image as ImageIcon,
  ShoppingBag, ChevronDown, ChevronUp, CheckCircle, Clock, 
  Truck, XCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import { MediaLibrary } from '@/components/media/MediaLibrary';
import { cn } from '@/lib/utils';

type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail?: string;
  status: OrderStatus;
  salesChannel: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

const statusConfig: Record<OrderStatus, { icon: any; color: string; bg: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Pendente' },
  PAID: { icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Pago' },
  SHIPPED: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Enviado' },
  COMPLETED: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Concluído' },
  CANCELLED: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Cancelado' },
};

interface StoreManagementViewProps {
  defaultTab?: 'produtos' | 'pedidos';
  basePath?: string;
}

function StoreManagementContent({ defaultTab = 'produtos', basePath }: StoreManagementViewProps) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'produtos' | 'pedidos') || defaultTab;
  const [activeTab, setActiveTab] = React.useState<'produtos' | 'pedidos'>(initialTab);

  // Sync tab with URL if changed externally
  React.useEffect(() => {
    const tabParam = searchParams.get('tab') as 'produtos' | 'pedidos' | null;
    if (tabParam && (tabParam === 'produtos' || tabParam === 'pedidos') && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'produtos' | 'pedidos') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // PRODUTOS STATE & LOGIC
  // ──────────────────────────────────────────────────────────────────────────
  const [products, setProducts] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = React.useState(true);
  const [searchProducts, setSearchProducts] = React.useState('');
  
  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = React.useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
  
  // Product Form state
  const [formData, setFormData] = React.useState({
    categoryId: '',
    name: '',
    description: '',
    price: 0,
    promoPrice: 0,
    stock: 0,
    commercializationType: 'PROPRIO',
    shopeeLink: '',
    mercadoLivreLink: '',
    amazonLink: '',
    isActive: true,
    imageId: null as string | null,
    imageUrl: null as string | null
  });
  const [savingProduct, setSavingProduct] = React.useState(false);

  // Category Form State
  const [catName, setCatName] = React.useState('');
  const [catSaving, setCatSaving] = React.useState(false);

  const fetchProductsData = async () => {
    try {
      setLoadingProducts(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/product-categories')
      ]);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data?.data || []));
      setCategories(Array.isArray(catRes.data) ? catRes.data : (catRes.data?.data || []));
    } catch (error) {
      console.error('Falha ao buscar produtos', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  React.useEffect(() => {
    fetchProductsData();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchProducts.toLowerCase())
  );

  const handleOpenNewProduct = () => {
    setSelectedProduct(null);
    setFormData({
      categoryId: categories.length > 0 ? categories[0].id : '',
      name: '',
      description: '',
      price: 0,
      promoPrice: 0,
      stock: 0,
      commercializationType: 'PROPRIO',
      shopeeLink: '',
      mercadoLivreLink: '',
      amazonLink: '',
      isActive: true,
      imageId: null,
      imageUrl: null
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: any) => {
    setSelectedProduct(p);
    setFormData({
      categoryId: p.categoryId,
      name: p.name,
      description: p.description || '',
      price: Number(p.price) || 0,
      promoPrice: Number(p.promoPrice) || 0,
      stock: p.stock || 0,
      commercializationType: p.commercializationType || 'PROPRIO',
      shopeeLink: p.shopeeLink || '',
      mercadoLivreLink: p.mercadoLivreLink || '',
      amazonLink: p.amazonLink || '',
      isActive: p.isActive,
      imageId: p.imageId || null,
      imageUrl: p.image?.url || null
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async () => {
    try {
      setSavingProduct(true);
      
      let payloadCategoryId = formData.categoryId;

      if (!payloadCategoryId && categories.length === 0) {
        const catRes = await api.post('/product-categories', { name: 'Geral', isActive: true });
        payloadCategoryId = catRes.data.id;
        setCategories([...categories, catRes.data]);
      } else if (!payloadCategoryId && categories.length > 0) {
        payloadCategoryId = categories[0].id;
      }

      const payload = {
        categoryId: payloadCategoryId,
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        promoPrice: Number(formData.promoPrice) > 0 ? Number(formData.promoPrice) : null,
        stock: Number(formData.stock),
        commercializationType: formData.commercializationType,
        shopeeLink: formData.shopeeLink,
        mercadoLivreLink: formData.mercadoLivreLink,
        amazonLink: formData.amazonLink,
        isActive: formData.isActive,
        imageId: formData.imageId
      };
      
      if (selectedProduct) {
        await api.patch('/products/' + selectedProduct.id, payload);
      } else {
        await api.post('/products', payload);
      }
      
      await fetchProductsData();
      setIsProductModalOpen(false);
    } catch (error) {
      console.error('Erro ao salvar produto', error);
      alert('Erro ao salvar produto.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await api.delete('/products/' + id);
        await fetchProductsData();
      } catch (e) {
        alert('Erro ao excluir produto.');
      }
    }
  };

  const handleSaveCategory = async () => {
    if (!catName.trim()) return;
    try {
      setCatSaving(true);
      await api.post('/product-categories', { name: catName, isActive: true });
      await fetchProductsData();
      setCatName('');
      setIsCategoryModalOpen(false);
    } catch (error) {
      alert('Erro ao criar categoria.');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Tem certeza? Isso pode falhar se houver produtos atrelados.')) {
      try {
        await api.delete('/product-categories/' + id);
        await fetchProductsData();
      } catch (e) {
        alert('Erro ao excluir categoria (provavelmente em uso).');
      }
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // PEDIDOS STATE & LOGIC
  // ──────────────────────────────────────────────────────────────────────────
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = React.useState(true);
  const [ordersError, setOrdersError] = React.useState('');
  const [orderFilter, setOrderFilter] = React.useState<OrderStatus | 'ALL'>('ALL');
  const [orderSearch, setOrderSearch] = React.useState('');
  const [expandedOrderId, setExpandedOrderId] = React.useState<string | null>(null);

  const fetchOrdersData = async () => {
    try {
      setLoadingOrders(true);
      setOrdersError('');
      const res = await api.get('/store/orders/all');
      const mappedOrders: Order[] = (res.data?.data || res.data || []).map((o: any) => ({
        id: o.id,
        customerName: o.customer ? `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.trim() : 'Visitante',
        customerEmail: o.customer?.email,
        status: o.status,
        salesChannel: o.salesChannel || 'SITE',
        totalAmount: Number(o.totalAmount || 0),
        createdAt: o.createdAt,
        items: (o.items || []).map((i: any) => ({
          id: i.id,
          productId: i.productId,
          productName: i.product?.name || 'Produto Desconhecido',
          quantity: i.quantity,
          price: Number(i.unitPrice || i.price || 0)
        }))
      }));
      setOrders(mappedOrders);
    } catch (err: any) {
      setOrdersError(err.message || 'Falha ao buscar pedidos');
    } finally {
      setLoadingOrders(false);
    }
  };

  React.useEffect(() => {
    fetchOrdersData();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const prevOrders = [...orders];
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    try {
      await api.patch(`/store/orders/${orderId}/status`, { status: newStatus });
    } catch (err: any) {
      setOrders(prevOrders);
      alert('Falha ao atualizar o status do pedido');
    }
  };

  const filteredOrders = orders
    .filter(o => orderFilter === 'ALL' || o.status === orderFilter)
    .filter(o => 
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
      (o.customerName || '').toLowerCase().includes(orderSearch.toLowerCase())
    );

  const pendingOrdersCount = orders.filter(o => o.status === 'PENDING').length;

  return (
    <div className="text-zinc-300 font-sans space-y-4 md:space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-6 border-b border-border/50 pb-5">
        <div>
          <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-amber-500" />
            Produtos & Pedidos da Loja
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Gerencie o catálogo de produtos, controle de estoque e acompanhe todos os pedidos da loja em um só lugar.
          </p>
        </div>

        {/* Global actions depending on active tab */}
        {activeTab === 'produtos' && (
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white rounded-xl font-bold transition-all text-xs sm:text-sm"
            >
              <Tag className="w-4 h-4 text-amber-500" />
              <span>Categorias</span>
            </button>
            <button
              onClick={handleOpenNewProduct}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-black transition-all shadow-lg shadow-amber-500/20 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Produto</span>
            </button>
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={fetchOrdersData}
              disabled={loadingOrders}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white rounded-xl font-bold transition-all text-xs sm:text-sm"
            >
              <RefreshCw className={cn("w-4 h-4 text-amber-500", loadingOrders && "animate-spin")} />
              <span>Atualizar Pedidos</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-zinc-900/60 p-1.5 rounded-2xl border border-zinc-800/80 w-fit">
        <button
          onClick={() => handleTabChange('produtos')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all",
            activeTab === 'produtos'
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          )}
        >
          <Package className="w-4 h-4" />
          <span>Produtos & Estoque</span>
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-full font-black",
            activeTab === 'produtos' ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-400"
          )}>
            {products.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('pedidos')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all",
            activeTab === 'pedidos'
              ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          )}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Pedidos da Loja</span>
          {pendingOrdersCount > 0 ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-600 text-white animate-pulse">
              {pendingOrdersCount} pendentes
            </span>
          ) : (
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-black",
              activeTab === 'pedidos' ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-400"
            )}>
              {orders.length}
            </span>
          )}
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ABA 1: PRODUTOS & CATÁLOGO                                              */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'produtos' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              type="text"
              value={searchProducts}
              onChange={(e) => setSearchProducts(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              placeholder="Buscar por nome do produto..."
            />
          </div>

          {/* Loading */}
          {loadingProducts && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 min-h-[300px]">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="mt-3 text-xs uppercase tracking-widest text-zinc-500">Carregando catálogo...</p>
            </div>
          ) : (
            /* Products Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden group hover:border-amber-500/30 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(255,215,0,0.1)] transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="p-3 sm:p-5">
                      <div className="flex justify-between items-start mb-3 sm:mb-4">
                        {product.image ? (
                          <img
                            src={product.image.url.startsWith('http') ? product.image.url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${product.image.url}`}
                            alt={product.name}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover border border-zinc-800 shadow-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-amber-500 shrink-0">
                            <Package className="w-6 h-6 sm:w-8 sm:h-8" />
                          </div>
                        )}
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleOpenEditProduct(product)}
                            className="text-zinc-500 hover:text-amber-500 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                            title="Editar Produto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-zinc-500 hover:text-rose-500 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
                            title="Excluir Produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-sm sm:text-base font-bold text-white mb-0.5 sm:mb-1 line-clamp-2 leading-tight h-10 sm:h-auto">
                        {product.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-zinc-500 mb-2 sm:mb-3 truncate">
                        {product.category?.name || 'Sem Categoria'}
                      </p>
                      
                      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-zinc-500" /> Preço
                          </span>
                          <span className="font-bold text-white">R$ {Number(product.price).toFixed(2)}</span>
                        </div>
                        {product.promoPrice && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs">
                            <span className="text-amber-500/80 flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-amber-500" /> Promocional
                            </span>
                            <span className="font-bold text-amber-500">R$ {Number(product.promoPrice).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <Package className="w-3.5 h-3.5 text-zinc-500" /> Estoque
                          </span>
                          <span className={cn("font-bold", product.stock <= 2 ? "text-amber-500" : "text-white")}>
                            {product.stock} un.
                          </span>
                        </div>

                        {product.shopeeLink && (
                          <div className="pt-1">
                            <a href={product.shopeeLink} target="_blank" rel="noreferrer" className="text-[11px] text-orange-500 hover:underline flex items-center gap-1">
                              <LinkIcon className="w-3 h-3"/> Shopee
                            </a>
                          </div>
                        )}
                        {product.mercadoLivreLink && (
                          <div className="pt-1">
                            <a href={product.mercadoLivreLink} target="_blank" rel="noreferrer" className="text-[11px] text-yellow-500 hover:underline flex items-center gap-1">
                              <LinkIcon className="w-3 h-3"/> Mercado Livre
                            </a>
                          </div>
                        )}
                        {product.amazonLink && (
                          <div className="pt-1">
                            <a href={product.amazonLink} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:underline flex items-center gap-1">
                              <LinkIcon className="w-3 h-3"/> Amazon
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-zinc-800/60 flex justify-between items-center mt-auto">
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                          product.commercializationType === 'PROPRIO' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        )}>
                          {product.commercializationType === 'PROPRIO' ? 'PRÓPRIO' : 'PARCEIRO'}
                        </span>
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                          product.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        )}>
                          {product.isActive ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-16 text-center bg-zinc-900/30 border border-zinc-800/60 rounded-3xl">
                  <Package className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">Nenhum produto encontrado</h3>
                  <p className="text-zinc-500 text-xs">Tente buscar com outros termos ou cadastre um novo produto.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* ABA 2: PEDIDOS DA LOJA                                                  */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pedidos' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-3 p-3 bg-zinc-900/50 border border-border rounded-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar pedido por ID ou Cliente..." 
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-input border border-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary outline-none transition-shadow text-white placeholder-zinc-500"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              {(['ALL', 'PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderFilter(status)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg whitespace-nowrap transition-colors",
                    orderFilter === status 
                      ? "bg-amber-500 text-black font-black" 
                      : "bg-input text-muted-foreground hover:text-white"
                  )}
                >
                  {status === 'ALL' ? 'TODOS' : statusConfig[status as OrderStatus].label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Loading */}
          {loadingOrders && orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 min-h-[300px]">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Package className="w-8 h-8 text-amber-500" />
              </motion.div>
              <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Carregando Pedidos...</p>
            </div>
          ) : ordersError ? (
            <div className="flex flex-col items-center justify-center py-16 text-rose-500 bg-zinc-900/30 border border-rose-500/20 rounded-2xl">
              <AlertCircle className="w-10 h-10 mb-3 opacity-60" />
              <p className="text-sm uppercase tracking-widest">{ordersError}</p>
              <button 
                onClick={fetchOrdersData}
                className="mt-4 px-5 py-2 border border-rose-500/40 hover:bg-rose-500/10 rounded-xl transition-colors text-xs uppercase tracking-widest"
              >
                Tentar Novamente
              </button>
            </div>
          ) : (
            /* Orders Table */
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-input/50 text-muted-foreground uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-6 py-4 font-medium">ID do Pedido</th>
                      <th className="px-6 py-4 font-medium">Cliente</th>
                      <th className="px-6 py-4 font-medium">Data</th>
                      <th className="px-6 py-4 font-medium">Total</th>
                      <th className="px-6 py-4 font-medium">Canal</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground text-xs">
                          Nenhum pedido encontrado com esses critérios.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const StatusIcon = statusConfig[order.status].icon;
                        return (
                          <React.Fragment key={order.id}>
                            <tr className="hover:bg-input/30 transition-colors group">
                              <td className="px-6 py-4 font-mono text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                                #{order.id.slice(0, 8)}...
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-white">{order.customerName || 'Visitante'}</div>
                                {order.customerEmail && (
                                  <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 font-bold text-white">
                                R$ {typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : order.totalAmount}
                              </td>
                              <td className="px-6 py-4">
                                <div className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  order.salesChannel === 'SITE' ? 'bg-amber-500/10 text-amber-500' :
                                  order.salesChannel === 'BALCAO' ? 'bg-zinc-500/10 text-zinc-400' :
                                  order.salesChannel === 'SHOPEE' ? 'bg-orange-500/10 text-orange-500' :
                                  order.salesChannel === 'MERCADO_LIVRE' ? 'bg-yellow-500/10 text-yellow-500' :
                                  order.salesChannel === 'AMAZON' ? 'bg-blue-400/10 text-blue-400' :
                                  'bg-purple-500/10 text-purple-500'
                                )}>
                                  {order.salesChannel === 'MERCADO_LIVRE' ? 'MERCADO LIVRE' : order.salesChannel}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                  statusConfig[order.status].bg,
                                  statusConfig[order.status].color
                                )}>
                                  <StatusIcon className="w-3.5 h-3.5" />
                                  {statusConfig[order.status].label}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <select
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                    className="bg-input border border-border text-xs rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer text-white"
                                  >
                                    <option value="PENDING">Pendente</option>
                                    <option value="PAID">Pago</option>
                                    <option value="SHIPPED">Enviado</option>
                                    <option value="COMPLETED">Concluído</option>
                                    <option value="CANCELLED">Cancelado</option>
                                  </select>
                                  <button
                                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                                    className="p-1.5 hover:bg-input rounded-lg transition-colors text-muted-foreground hover:text-white"
                                    title="Ver itens do pedido"
                                  >
                                    <ChevronDown className={cn("w-4 h-4 transition-transform", expandedOrderId === order.id && "rotate-180 text-amber-500")} />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Order Details */}
                            <AnimatePresence>
                              {expandedOrderId === order.id && (
                                <tr>
                                  <td colSpan={7} className="p-0 border-b border-border">
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden bg-black/40"
                                    >
                                      <div className="p-6 md:p-8">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-2">
                                          <Package className="w-4 h-4" /> Itens deste Pedido
                                        </h4>
                                        <div className="space-y-2.5">
                                          {(order.items || []).map((item, idx) => (
                                            <div key={item.id || idx} className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/70 border border-border/40">
                                              <div className="flex items-center gap-3.5">
                                                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                                  <Package className="w-4 h-4 text-amber-500" />
                                                </div>
                                                <div>
                                                  <p className="font-bold text-sm text-white">{item.productName}</p>
                                                  <p className="text-xs text-muted-foreground">Qtd: {item.quantity} × R$ {Number(item.price).toFixed(2)}</p>
                                                </div>
                                              </div>
                                              <div className="font-bold text-sm text-white">
                                                R$ {(item.price * item.quantity).toFixed(2)}
                                              </div>
                                            </div>
                                          ))}
                                          {(!order.items || order.items.length === 0) && (
                                            <p className="text-sm text-muted-foreground">Nenhum item registrado para este pedido.</p>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View */}
              <div className="lg:hidden flex flex-col p-2.5 gap-2.5">
                {filteredOrders.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10 text-xs">Nenhum pedido encontrado.</div>
                ) : (
                  filteredOrders.map((order) => {
                    const StatusIcon = statusConfig[order.status].icon;
                    return (
                      <div key={order.id} className="bg-zinc-950/60 border border-border/50 rounded-xl p-3 flex flex-col gap-2 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-xs text-white leading-tight">{order.customerName || 'Visitante'}</div>
                            <div className="text-[10px] text-muted-foreground font-mono mt-0.5">#{order.id.slice(0, 8)}</div>
                          </div>
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                            statusConfig[order.status].bg,
                            statusConfig[order.status].color
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[order.status].label}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                          <span className="font-black text-white">R$ {typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : order.totalAmount}</span>
                        </div>

                        <div className="flex justify-between items-center border-t border-border/30 pt-2 mt-1">
                          <div className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider",
                            order.salesChannel === 'SITE' ? 'bg-amber-500/10 text-amber-500' :
                            order.salesChannel === 'BALCAO' ? 'bg-zinc-500/10 text-zinc-400' :
                            order.salesChannel === 'SHOPEE' ? 'bg-orange-500/10 text-orange-500' :
                            order.salesChannel === 'MERCADO_LIVRE' ? 'bg-yellow-500/10 text-yellow-500' :
                            order.salesChannel === 'AMAZON' ? 'bg-blue-400/10 text-blue-400' :
                            'bg-purple-500/10 text-purple-500'
                          )}>
                            {order.salesChannel === 'MERCADO_LIVRE' ? 'MERCADO LIVRE' : order.salesChannel}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                              className="bg-input border border-border text-[11px] rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer text-white"
                            >
                              <option value="PENDING">Pendente</option>
                              <option value="PAID">Pago</option>
                              <option value="SHIPPED">Enviado</option>
                              <option value="COMPLETED">Concluído</option>
                              <option value="CANCELLED">Cancelado</option>
                            </select>
                            <button
                              onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                              className="p-1 hover:bg-input rounded-lg border border-border/50 transition-colors text-muted-foreground flex items-center justify-center"
                            >
                              {expandedOrderId === order.id ? <ChevronUp className="w-3.5 h-3.5 text-amber-500" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Detalhes expandidos no Mobile */}
                        {expandedOrderId === order.id && (
                          <div className="mt-1 pt-2 border-t border-border/30 space-y-1.5">
                            {(order.items || []).map((item, idx) => (
                              <div key={item.id || idx} className="flex justify-between items-center bg-zinc-900/60 p-2 rounded-lg text-xs border border-border/30">
                                <div className="flex items-center gap-2">
                                  <Package className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span className="text-zinc-200 line-clamp-1">{item.productName || 'Produto'}</span>
                                  <span className="text-muted-foreground whitespace-nowrap">x{item.quantity}</span>
                                </div>
                                <span className="text-zinc-400 font-bold whitespace-nowrap">R$ {Number(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* MODALS (PRODUTO, CATEGORIA, MÍDIA)                                     */}
      {/* ════════════════════════════════════════════════════════════════════════ */}
      
      {/* Product Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsProductModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900 z-10">
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  {selectedProduct ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button onClick={() => setIsProductModalOpen(false)} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-zinc-400 mb-2">Capa do Produto</label>
                    <div 
                      onClick={() => setIsMediaModalOpen(true)}
                      className="w-full h-48 bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-zinc-900/50 transition-all overflow-hidden relative group"
                    >
                      {formData.imageUrl ? (
                         <img src={formData.imageUrl.startsWith('http') ? formData.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${formData.imageUrl}`} alt="Capa" className="w-full h-full object-contain p-2" />
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-zinc-500 mb-2 group-hover:text-amber-500 transition-colors" />
                          <span className="text-zinc-500 font-medium group-hover:text-amber-500 transition-colors">Clique para selecionar uma foto real</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="col-span-full md:col-span-1 space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-zinc-400 mb-2">Nome do Produto</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="Ex: Pomada Efeito Matte"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-zinc-400 mb-2">Categoria</label>
                      <select
                        value={formData.categoryId}
                        onChange={e => setFormData({...formData, categoryId: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-zinc-400 mb-2">Estoque (Qtd)</label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={e => setFormData({...formData, stock: Number(e.target.value)})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="col-span-full md:col-span-1 space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-zinc-400 mb-2">Preço (R$)</label>
                      <input
                        type="number" step="0.01"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-zinc-400 mb-2">Preço Promocional (R$)</label>
                      <input
                        type="number" step="0.01"
                        value={formData.promoPrice}
                        onChange={e => setFormData({...formData, promoPrice: Number(e.target.value)})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                        placeholder="Deixe 0 para não ter promo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-zinc-400 mb-2">Status</label>
                      <button
                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                        className="flex items-center gap-3 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 transition-colors"
                      >
                        {formData.isActive ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-zinc-600" />}
                        <span className={formData.isActive ? "text-white font-bold" : "text-zinc-500"}>
                          {formData.isActive ? 'Produto Ativo' : 'Produto Inativo'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-zinc-400 mb-2">Tipo de Comercialização</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setFormData({...formData, commercializationType: 'PROPRIO'})}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold flex justify-center items-center gap-2 border transition-colors ${formData.commercializationType === 'PROPRIO' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                      >
                        Produto Próprio (Estoque Local)
                      </button>
                      <button
                        onClick={() => setFormData({...formData, commercializationType: 'PARCEIRO'})}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold flex justify-center items-center gap-2 border transition-colors ${formData.commercializationType === 'PARCEIRO' ? 'bg-purple-500/10 border-purple-500 text-purple-500' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                      >
                        Produto de Parceiro (Afiliado)
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      Produtos próprios controlam estoque e permitem venda direta (PIX). Produtos de parceiro não usam estoque e apenas redirecionam o cliente.
                    </p>
                  </div>

                  <div className="col-span-full space-y-4">
                    <label className="block text-sm font-bold text-zinc-400 flex items-center gap-2"><LinkIcon className="w-4 h-4"/> Links de Compra (Marketplaces)</label>
                    <input
                      type="url"
                      value={formData.shopeeLink}
                      onChange={e => setFormData({...formData, shopeeLink: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Link da Shopee"
                    />
                    <input
                      type="url"
                      value={formData.mercadoLivreLink}
                      onChange={e => setFormData({...formData, mercadoLivreLink: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Link do Mercado Livre"
                    />
                    <input
                      type="url"
                      value={formData.amazonLink}
                      onChange={e => setFormData({...formData, amazonLink: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Link da Amazon"
                    />
                    <p className="text-xs text-zinc-500 mt-2">Os links configurados aparecerão como botões na loja pública.</p>
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-bold text-zinc-400 mb-2">Descrição / Detalhes</label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
                      placeholder="Descreva o produto, marca, volume..."
                    />
                  </div>

                </div>
              </div>

              <div className="p-6 border-t border-zinc-800 bg-zinc-900 sticky bottom-0">
                <button
                  onClick={handleSaveProduct}
                  disabled={savingProduct || !formData.name}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-xl font-black text-lg transition-all shadow-lg shadow-amber-500/20"
                >
                  {savingProduct ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                  {savingProduct ? 'Salvando...' : 'Salvar Produto'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-500" /> Categorias de Produtos
                </h2>
                <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex gap-2 mb-6">
                  <input 
                    type="text" 
                    value={catName} 
                    onChange={e => setCatName(e.target.value)} 
                    placeholder="Nova categoria (ex: Pomadas)"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                  />
                  <button 
                    onClick={handleSaveCategory}
                    disabled={catSaving || !catName}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black px-4 rounded-xl font-bold flex items-center justify-center"
                  >
                    {catSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {categories.length === 0 && <p className="text-zinc-500 text-sm text-center py-4">Nenhuma categoria cadastrada.</p>}
                  {categories.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <span className="text-white font-medium">{c.name}</span>
                      <button onClick={() => handleDeleteCategory(c.id)} className="text-zinc-500 hover:text-rose-500 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Media Modal */}
      <AnimatePresence>
        {isMediaModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMediaModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl h-[80vh] bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-500" /> Selecionar Mídia
                </h2>
                <button onClick={() => setIsMediaModalOpen(false)} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden p-2">
                <MediaLibrary
                  selectionMode="single"
                  onSelect={(mediaIds, medias) => {
                    if (medias && medias.length > 0) {
                      setFormData({ ...formData, imageId: medias[0].id, imageUrl: medias[0].url });
                    }
                    setIsMediaModalOpen(false);
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export function StoreManagementView(props: StoreManagementViewProps) {
  return (
    <React.Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-sm">Carregando loja e produtos...</p>
      </div>
    }>
      <StoreManagementContent {...props} />
    </React.Suspense>
  );
}
