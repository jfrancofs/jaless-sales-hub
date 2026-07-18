import type { InsightComercial } from '@/lib/jaless/comercialInsights';

export function ComercialInsights({ insights }: { insights: InsightComercial[] }) {
  if (insights.length === 0) return null;

  const estilos = {
    alerta: 'border-amber-600 bg-amber-950/30 text-amber-100',
    sugerencia: 'border-cyan-700 bg-cyan-950/30 text-cyan-100',
    bien: 'border-emerald-700 bg-emerald-950/30 text-emerald-100',
  } as const;

  return (
    <section className="mt-5 rounded-xl border border-slate-700 bg-slate-950 p-4">
      <h3 className="text-lg font-bold">Asistente comercial Jaless AI</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {insights.map((insight, index) => (
          <div key={`${insight.titulo}-${index}`} className={`rounded-lg border p-3 ${estilos[insight.tipo]}`}>
            <div className="font-bold">{insight.titulo}</div>
            <div className="mt-1 text-sm opacity-90">{insight.detalle}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
