import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center p-8">
      <div className="text-8xl font-black text-zinc-800 mb-4">404</div>
      <h1 className="text-2xl font-black text-white mb-2">Página não encontrada</h1>
      <p className="text-zinc-500 text-sm mb-8">O conteúdo que você procura não existe ou foi movido.</p>
      <Link
        href="/"
        className="bg-amber-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-amber-400 transition-colors"
      >
        Voltar ao início
      </Link>
    </div>
  );
}