"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Star, MapPin, Users, Heart, Camera, Scissors, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function BarberProfilePage() {
  const { id } = useParams() as { id: string };
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/barbers/profile/${id}`);
      setProfile(res.data);
      // Check if user is following (mock logic or adjust if backend returns it)
      // setIsFollowing(res.data.isFollowing);
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/barbers/profile/${id}/follow`);
        setIsFollowing(false);
        setProfile({ ...profile, followers: profile.followers.slice(0, -1) }); // optimistic update
      } else {
        await api.post(`/barbers/profile/${id}/follow`);
        setIsFollowing(true);
        setProfile({ ...profile, followers: [...profile.followers, { id: "new" }] });
      }
    } catch (err: any) {
      alert("Failed to follow/unfollow: " + (err.message || ""));
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      await api.post(`/barbers/profile/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment
      });
      alert("Review submitted successfully!");
      setReviewComment("");
      setReviewRating(5);
      fetchProfile(); // Refresh
    } catch (err: any) {
      alert("Failed to submit review: " + (err.message || ""));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0f172a]">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0f172a] text-white">
        <h2 className="text-2xl font-bold text-red-500">{error || "Profile not found"}</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-20 font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-panel {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
        }
        .btn-premium {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
          transition: all 0.3s ease;
        }
        .btn-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
        }
        .btn-outline {
          border: 2px solid #f59e0b;
          color: #f59e0b;
          transition: all 0.3s ease;
        }
        .btn-outline:hover {
          background: rgba(245, 158, 11, 0.1);
        }
      `}} />

      {/* Hero Header */}
      <div className="relative h-80 overflow-hidden">
        <img 
          src={profile.photo?.url || "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80"} 
          alt="Barber Background" 
          className="w-full h-full object-cover opacity-40 blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-8 flex items-end gap-6">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-32 h-32 rounded-full border-4 border-[#0f172a] overflow-hidden bg-slate-800 shadow-2xl"
          >
            <img 
              src={profile.photo?.url || "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80"} 
              alt="Barber Portrait" 
              className="w-full h-full object-cover"
            />
          </motion.div>
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-2"
          >
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Barbeiro Premium</h1>
            <div className="flex items-center gap-4 text-sm text-slate-300">
              <span className="flex items-center gap-1"><Users size={16} /> {profile.followers?.length || 0} Seguidores</span>
              <span className="flex items-center gap-1 text-amber-400"><Star size={16} fill="currentColor" /> {profile.reviews?.length ? (profile.reviews.reduce((acc: any, curr: any) => acc + curr.rating, 0) / profile.reviews.length).toFixed(1) : "New"}</span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-auto mb-2 flex gap-3"
          >
            <button 
              onClick={handleFollow}
              className={`px-6 py-2 rounded-full font-semibold flex items-center gap-2 ${isFollowing ? 'btn-outline' : 'btn-premium'}`}
            >
              <Heart size={18} fill={isFollowing ? "currentColor" : "none"} /> 
              {isFollowing ? "Seguindo" : "Seguir"}
            </button>
            <button className="px-6 py-2 rounded-full font-semibold bg-slate-800 hover:bg-slate-700 transition border border-slate-700 flex items-center gap-2">
              <Clock size={18} /> Agendar
            </button>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Info & Specialties */}
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Scissors className="text-amber-500" /> Sobre mim</h3>
            <p className="text-slate-400 leading-relaxed">
              {profile.bio || "Especialista em cortes modernos e clássicos. Transformando visuais e elevando a autoestima com precisão e estilo."}
            </p>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><CheckCircle className="text-amber-500" /> Especialidades</h3>
            <div className="flex flex-wrap gap-2">
              {profile.specialties?.map((s: any) => (
                <span key={s.id} className="bg-slate-800 text-amber-400 px-3 py-1 rounded-full text-sm font-medium border border-slate-700">
                  {s.specialty}
                </span>
              ))}
              {!profile.specialties?.length && <span className="text-slate-500 italic">Nenhuma especialidade listada</span>}
            </div>
          </div>
        </div>

        {/* Right Column: Portfolio & Reviews */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Portfolio Section */}
          <div>
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2"><Camera className="text-amber-500" /> Portfólio</h3>
              <button className="text-amber-500 hover:text-amber-400 text-sm font-medium">Ver todos</button>
            </div>
            
            {profile.portfolio?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.portfolio.map((item: any) => (
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    key={item.id} 
                    className="aspect-square rounded-xl overflow-hidden relative group"
                  >
                    <img src={item.media?.url || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80"} alt="Portfolio" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Heart className="text-white hover:text-amber-500 cursor-pointer transition" />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-10 text-center text-slate-500">
                <Camera size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma foto no portfólio ainda.</p>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="glass-panel p-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Star className="text-amber-500" /> Avaliações</h3>
            
            <div className="space-y-6 mb-8 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {profile.reviews?.map((review: any) => (
                <div key={review.id} className="border-b border-slate-700/50 pb-4 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                      {/* Random avatar for reviewer */}
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userId}`} alt="User" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200">Cliente</div>
                      <div className="flex text-amber-500 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                    </div>
                    <div className="ml-auto text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                  </div>
                  <p className="text-slate-400 text-sm ml-13">{review.comment}</p>
                </div>
              ))}
              {!profile.reviews?.length && <p className="text-slate-500 italic text-center">Seja o primeiro a avaliar!</p>}
            </div>

            {/* Leave a Review Form */}
            <form onSubmit={submitReview} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
              <h4 className="font-semibold text-white mb-4">Deixe sua avaliação</h4>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    type="button" 
                    key={star} 
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    <Star 
                      size={24} 
                      fill={star <= reviewRating ? "#f59e0b" : "none"} 
                      color={star <= reviewRating ? "#f59e0b" : "#64748b"} 
                      className="transition-colors"
                    />
                  </button>
                ))}
              </div>
              <textarea 
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Como foi sua experiência?" 
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition mb-4 resize-none h-24"
              ></textarea>
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSubmittingReview}
                  className="btn-premium px-6 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                  {isSubmittingReview ? "Enviando..." : "Publicar Avaliação"}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5); 
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3); 
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5); 
        }
      `}} />
    </div>
  );
}
