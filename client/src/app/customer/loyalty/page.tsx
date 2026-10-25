"use client";

import { useEffect, useState } from 'react';

interface LoyaltyInfo {
  points: number;
  loyaltyLevel: string;
  achievements: any[];
}

export default function LoyaltyPage() {
  const [loyalty, setLoyalty] = useState<LoyaltyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoyaltyInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/loyalty/my`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setLoyalty(data);
        }
      } catch (error) {
        console.error('Failed to fetch loyalty info', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoyaltyInfo();
  }, []);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!loyalty) return <div className="p-8 text-center text-red-500">Erro ao carregar informações de fidelidade.</div>;

  const nextLevelPoints = loyalty.points < 500 ? 500 : loyalty.points < 1000 ? 1000 : 2000;
  const progress = Math.min((loyalty.points / nextLevelPoints) * 100, 100);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Meu Programa de Fidelidade</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
        <h2 className="text-xl font-semibold mb-2">Seu Nível Atual</h2>
        <div className="flex items-end justify-between mb-4">
          <span className="text-4xl font-black text-indigo-600">{loyalty.loyaltyLevel}</span>
          <span className="text-lg text-gray-600 font-medium">{loyalty.points} pontos</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div 
            className="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 text-right">
          Faltam {nextLevelPoints - loyalty.points} pontos para o próximo nível
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Conquistas</h2>
        {loyalty.achievements && loyalty.achievements.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {loyalty.achievements.map((ach: any, idx: number) => (
              <div key={idx} className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
                {ach.badgeUrl ? (
                  <img src={ach.badgeUrl} alt={ach.title} className="w-16 h-16 mb-2" />
                ) : (
                  <div className="w-16 h-16 mb-2 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center text-2xl">
                    🏆
                  </div>
                )}
                <span className="font-medium text-center">{ach.title}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Você ainda não tem conquistas.</p>
        )}
      </div>
    </div>
  );
}
