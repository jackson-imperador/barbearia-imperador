"use client";
import React, { useState, useEffect } from "react";
import { Star, MessageCircle, Check } from "lucide-react";
import { api } from "@/lib/api";

export default function CustomerTestimonialsPage() {
  const [formData, setFormData] = useState({
    authorName: "",
    content: "",
    rating: 5,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Tenta pegar o nome do usuário logado
    api.get('/auth/me').then(res => {
      if (res.data && res.data.name) {
        setFormData(prev => ({ ...prev, authorName: res.data.name }));
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.authorName.trim() || !formData.content.trim()) {
      setError("Por favor, preencha o nome e o depoimento.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      await api.post("/cms/testimonials", formData);
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Ocorreu um erro ao enviar seu depoimento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Obrigado!</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Seu depoimento foi enviado com sucesso e em breve aparecerá em nosso site oficial.
          </p>
          <button 
            onClick={() => {
              setSubmitted(false);
              setFormData({ ...formData, content: "", rating: 5 });
            }}
            className="px-8 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-primary/90 transition-colors"
          >
            Enviar outro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2 flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-primary" />
          Deixe seu Depoimento
        </h1>
        <p className="text-muted-foreground">
          Compartilhe sua experiência na Império. Seu feedback é muito importante para nós!
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              Seu Nome
            </label>
            <input 
              type="text" 
              value={formData.authorName}
              onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
              className="w-full bg-input border border-border rounded-xl p-3 text-white focus:outline-none focus:border-primary transition-colors"
              placeholder="Como quer ser chamado?"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              Sua Avaliação
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    formData.rating >= star 
                      ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20" 
                      : "bg-input border border-border text-muted-foreground hover:bg-input/80"
                  }`}
                >
                  <Star className={`w-6 h-6 ${formData.rating >= star ? "fill-current" : ""}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              Seu Depoimento
            </label>
            <textarea 
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-input border border-border rounded-xl p-4 text-white min-h-[150px] resize-none focus:outline-none focus:border-primary transition-colors"
              placeholder="Conte-nos o que achou do atendimento, do ambiente e dos nossos profissionais..."
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? "Enviando..." : "Publicar Depoimento"}
          </button>
        </form>
      </div>
    </div>
  );
}
