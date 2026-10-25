'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Plus, Tag, ExternalLink, Trash2, Edit3, X, Percent, DollarSign, Store } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'INTERNAL',
    marketplace: '',
    productId: '',
    discountValue: '',
    discountType: 'PERCENTAGE',
    link: '',
    startDate: '',
    endDate: '',
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
    fetchProducts();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/coupons/admin');
      setCoupons(res.data);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        type: coupon.type,
        marketplace: coupon.marketplace || '',
        productId: coupon.productId || '',
        discountValue: coupon.discountValue,
        discountType: coupon.discountType,
        link: coupon.link || '',
        startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 16) : '',
        endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 16) : '',
        isActive: coupon.isActive
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: '',
        description: '',
        type: 'INTERNAL',
        marketplace: '',
        productId: '',
        discountValue: '',
        discountType: 'PERCENTAGE',
        link: '',
        startDate: '',
        endDate: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        discountValue: Number(formData.discountValue),
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        productId: formData.productId || null
      };

      if (editingCoupon) {
        await api.patch(`/coupons/${editingCoupon.id}`, data);
      } else {
        await api.post('/coupons', data);
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao salvar cupom');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cupom permanentemente?')) {
      try {
        await api.delete(`/coupons/${id}`);
        fetchCoupons();
      } catch (err) {
        alert('Erro ao excluir cupom');
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/coupons/${id}`, { isActive: !currentStatus });
      fetchCoupons();
    } catch (err) {
      alert('Erro ao alterar status');
    }
  };

  const isExpired = (endDate: string) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-primary-foreground flex items-center gap-2">
            <Tag className="w-6 h-6" /> Cupons Promocionais
          </h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">
            Gerencie descontos da loja e vitrines de afiliados
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-primary-foreground text-black px-4 py-2 font-bold uppercase tracking-widest text-xs rounded hover:bg-white transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Cupom
        </button>
      </div>

      {loading ? (
        <div className="text-muted-foreground uppercase text-xs tracking-widest animate-pulse">Carregando cupons...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {coupons.map(coupon => {
            const expired = isExpired(coupon.endDate);
            return (
              <div key={coupon.id} className={`bg-card border ${expired ? 'border-red-500/30' : coupon.isActive ? 'border-primary-foreground/50' : 'border-border'} rounded-xl p-3 sm:p-5 flex flex-col relative overflow-hidden transition-colors hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-foreground/10 duration-300 active:scale-95 group`}>
                {!coupon.isActive && !expired && <div className="absolute top-2 right-[-20px] sm:right-[-20px] bg-red-500 text-white text-[8px] sm:text-[10px] font-bold uppercase tracking-widest px-6 sm:px-8 py-0.5 sm:py-1 rotate-45">Inativo</div>}
                {expired && <div className="absolute top-2 right-[-20px] sm:right-[-20px] bg-red-900 text-white text-[8px] sm:text-[10px] font-bold uppercase tracking-widest px-6 sm:px-8 py-0.5 sm:py-1 rotate-45">Expirado</div>}
                
                <div className="flex justify-between items-start mb-3 sm:mb-4 mt-2 sm:mt-0">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 sm:p-2 rounded shrink-0 ${coupon.type === 'INTERNAL' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-blue-500/20 text-blue-400'}`}>
                      {coupon.type === 'INTERNAL' ? <Store className="w-4 h-4 sm:w-5 sm:h-5" /> : <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-black text-xs sm:text-lg text-white truncate max-w-full">{coupon.code}</h2>
                      <span className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-widest block truncate">{coupon.type === 'INTERNAL' ? 'Loja Império' : 'Afiliado'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                  <p className="text-[10px] sm:text-xs text-white line-clamp-2">{coupon.description || 'Sem descrição'}</p>
                  <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                    <span className="text-sm sm:text-2xl font-black text-primary-foreground">
                      {coupon.discountType === 'FIXED' ? `R$ ${Number(coupon.discountValue).toFixed(2)}` : `${Number(coupon.discountValue)}%`}
                    </span>
                    <span className="text-[8px] sm:text-[10px] uppercase font-bold text-muted-foreground">Off</span>
                  </div>
                  {coupon.type === 'EXTERNAL' && coupon.marketplace && (
                    <div className="text-[8px] sm:text-[10px] uppercase font-bold text-blue-400 truncate">Marketplace: {coupon.marketplace}</div>
                  )}
                  {coupon.endDate && (
                    <div className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-widest ${expired ? 'text-red-400' : 'text-green-400'}`}>
                      Val.: {new Date(coupon.endDate).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-border mt-auto">
                  <button 
                    onClick={() => toggleStatus(coupon.id, coupon.isActive)}
                    className={`text-[8px] sm:text-[10px] font-bold uppercase px-2 py-1 sm:px-3 sm:py-1 rounded ${coupon.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                  >
                    {coupon.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <div className="flex gap-1.5 sm:gap-2">
                    <button onClick={() => handleOpenModal(coupon)} className="p-1.5 sm:p-2 bg-input rounded hover:bg-white hover:text-black transition text-muted-foreground">
                      <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button onClick={() => handleDelete(coupon.id)} className="p-1.5 sm:p-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500 hover:text-white transition">
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {coupons.length === 0 && (
            <div className="col-span-full py-12 text-center border border-dashed border-border rounded-xl">
              <Tag className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Nenhum cupom cadastrado</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-input">
              <h2 className="text-lg font-black uppercase tracking-widest text-primary-foreground">{editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Tipo de Cupom</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-input border border-border p-3 text-sm rounded outline-none focus:border-primary-foreground text-white"
                  >
                    <option value="INTERNAL">Interno (Loja Império)</option>
                    <option value="EXTERNAL">Externo (Afiliado / Parceiro)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Código do Cupom</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.code} 
                    onChange={e => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s/g, '')})}
                    placeholder="Ex: IMPERIO10"
                    className="w-full bg-input border border-border p-3 text-sm rounded outline-none focus:border-primary-foreground text-white uppercase"
                  />
                </div>
              </div>

              {formData.type === 'EXTERNAL' && (
                <div className="grid grid-cols-2 gap-4 bg-blue-500/5 p-4 rounded-lg border border-blue-500/20">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Marketplace</label>
                    <select 
                      value={formData.marketplace} 
                      onChange={e => setFormData({...formData, marketplace: e.target.value})}
                      className="w-full bg-input border border-border p-3 text-sm rounded outline-none text-white"
                    >
                      <option value="">Selecione...</option>
                      <option value="SHOPEE">Shopee</option>
                      <option value="MERCADO_LIVRE">Mercado Livre</option>
                      <option value="AMAZON">Amazon</option>
                      <option value="OUTRO">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Link de Afiliado (Opcional)</label>
                    <input 
                      type="url" 
                      value={formData.link} 
                      onChange={e => setFormData({...formData, link: e.target.value})}
                      placeholder="https://shopee.com.br/..."
                      className="w-full bg-input border border-border p-3 text-sm rounded outline-none text-white"
                    />
                    <p className="text-[9px] text-muted-foreground mt-1">Se vazio, usará o link salvo no produto.</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Produto Específico (Opcional)</label>
                <select 
                  value={formData.productId} 
                  onChange={e => setFormData({...formData, productId: e.target.value})}
                  className="w-full bg-input border border-border p-3 text-sm rounded outline-none focus:border-primary-foreground text-white"
                >
                  <option value="">Válido para toda a loja / Válido por link</option>
                  {products.filter(p => formData.type === 'EXTERNAL' ? p.commercializationType === 'PARCEIRO' : p.commercializationType === 'PROPRIO').map(p => (
                    <option key={p.id} value={p.id}>{p.name} - R$ {Number(p.promoPrice || p.price).toFixed(2)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Tipo de Desconto</label>
                  <div className="flex bg-input rounded overflow-hidden">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, discountType: 'PERCENTAGE'})}
                      className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-1 ${formData.discountType === 'PERCENTAGE' ? 'bg-primary-foreground text-black' : 'text-muted-foreground'}`}
                    >
                      <Percent className="w-4 h-4" /> %
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, discountType: 'FIXED'})}
                      className={`flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-1 ${formData.discountType === 'FIXED' ? 'bg-primary-foreground text-black' : 'text-muted-foreground'}`}
                    >
                      <DollarSign className="w-4 h-4" /> R$
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Valor do Desconto</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    required 
                    value={formData.discountValue} 
                    onChange={e => setFormData({...formData, discountValue: e.target.value})}
                    placeholder={formData.discountType === 'PERCENTAGE' ? "Ex: 10" : "Ex: 25.00"}
                    className="w-full bg-input border border-border p-3 text-sm rounded outline-none focus:border-primary-foreground text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Descrição Comercial</label>
                <input 
                  type="text" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Ex: Cupom de 10% de desconto na máquina Wahl"
                  className="w-full bg-input border border-border p-3 text-sm rounded outline-none focus:border-primary-foreground text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Válido a partir de (Opcional)</label>
                  <input 
                    type="datetime-local" 
                    value={formData.startDate} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full bg-input border border-border p-3 text-sm rounded outline-none text-white [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Válido até (Opcional)</label>
                  <input 
                    type="datetime-local" 
                    value={formData.endDate} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full bg-input border border-border p-3 text-sm rounded outline-none text-white [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-xs uppercase font-bold text-muted-foreground hover:text-white transition">Cancelar</button>
                <button type="submit" className="px-6 py-3 bg-primary-foreground text-black text-xs uppercase font-bold rounded hover:bg-white transition flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Salvar Cupom
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
