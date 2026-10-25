"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ImageIcon, Scissors, X, ChevronLeft, ChevronRight } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function resolveUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_URL}${url}`;
}

export default function CustomerLookbookPage() {
  const [galleries, setGalleries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Group galleries by caption/category
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = async () => {
    setLoading(true);
    try {
      const res = await api.get("/cms/galleries");
      setGalleries(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Group by caption (if exists), else all in one group
  const grouped: Record<string, any[]> = {};
  galleries.forEach((item) => {
    const key = item.caption || "Outros";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });
  const categories = Object.keys(grouped);

  // Items to show: if a category is selected, show those; else show all
  const displayItems = selectedCategory ? (grouped[selectedCategory] || []) : galleries;

  // Lightbox
  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);
  const goPrev = () => setSelectedIndex(i => (i !== null && i > 0 ? i - 1 : displayItems.length - 1));
  const goNext = () => setSelectedIndex(i => (i !== null && i < displayItems.length - 1 ? i + 1 : 0));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, displayItems.length]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-white flex items-center gap-2">
            <Scissors className="w-6 h-6 text-amber-500" /> Cortes Modelos
          </h1>
          <p className="text-xs text-zinc-500 mt-2 uppercase tracking-widest leading-relaxed">
            Clique em uma foto para ver em destaque. Mostre ao barbeiro o que você quer!
          </p>
        </div>
      </div>

      {/* Category Filter — horizontal scroll */}
      {!loading && categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
              !selectedCategory
                ? "bg-amber-500 text-black border-amber-500"
                : "border-white/20 text-zinc-400 hover:border-amber-500/50"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border transition-all ${
                selectedCategory === cat
                  ? "bg-amber-500 text-black border-amber-500"
                  : "border-white/20 text-zinc-400 hover:border-amber-500/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-white/5 rounded-2xl bg-zinc-900/30">
          <ImageIcon className="w-16 h-16 text-zinc-600 mb-4" />
          <p className="text-zinc-400 font-bold mb-2">Nenhum modelo disponível ainda</p>
          <p className="text-zinc-500 text-sm">O administrador ainda não adicionou fotos de inspiração.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {displayItems.map((item: any, index: number) => {
            const imgSrc = resolveUrl(item.image?.url || item.imageUrl);
            return (
              <button
                key={item.id}
                onClick={() => openLightbox(index)}
                className="group relative aspect-square rounded-xl overflow-hidden border border-white/5 hover:border-amber-500/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={item.caption || "Corte Modelo"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-zinc-600" />
                  </div>
                )}
                {/* Overlay com nome */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-[11px] font-black uppercase tracking-widest drop-shadow-md text-left line-clamp-1">
                    {item.caption || "Ver foto"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedIndex !== null && displayItems[selectedIndex] && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev */}
          {displayItems.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 z-10 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative max-w-lg w-full max-h-[80vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={resolveUrl(displayItems[selectedIndex].image?.url || displayItems[selectedIndex].imageUrl)}
              alt={displayItems[selectedIndex].caption || "Corte Modelo"}
              className="max-h-[70vh] w-full object-contain rounded-xl"
            />
            {displayItems[selectedIndex].caption && (
              <div className="mt-4 text-center">
                <p className="text-white font-black uppercase tracking-widest text-lg">
                  {displayItems[selectedIndex].caption}
                </p>
                <p className="text-zinc-500 text-xs mt-1">{selectedIndex + 1} / {displayItems.length}</p>
              </div>
            )}
          </div>

          {/* Next */}
          {displayItems.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 z-10 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
