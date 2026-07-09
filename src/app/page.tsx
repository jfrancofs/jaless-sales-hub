import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
      <section className="max-w-4xl w-full rounded-3xl border border-slate-800 bg-slate-900 p-10">
        <p className="tracking-[0.5em] text-cyan-400 font-bold mb-4">JALESS ONE</p>
        <h1 className="text-5xl font-bold mb-5">Sistema Comercial Jaless</h1>
        <p className="text-slate-300 mb-8">Sprint 6: MIC con búsqueda exacta por medidas normalizadas.</p>
        <Link href="/cotizador" className="inline-block bg-cyan-500 text-slate-950 font-bold px-6 py-3 rounded-xl">Ir al cotizador</Link>
      </section>
    </main>
  );
}
