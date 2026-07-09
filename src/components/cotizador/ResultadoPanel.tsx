import type { Producto, ResultadoCotizacion, TotalesCotizacion } from '@/types/comercial';
import { ResultadoTable } from './ResultadoTable';
import { TotalesBox } from './TotalesBox';

type Props = {
  resultados: ResultadoCotizacion[];
  revisiones: number;
  error: string;
  totales: TotalesCotizacion;
  onSeleccionarOpcion: (item: number, producto: Producto) => void;
};

export function ResultadoPanel({ resultados, revisiones, error, totales, onSeleccionarOpcion }: Props) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 overflow-hidden">
      <h2 className="text-2xl font-bold">Resultado</h2>
      {error && <div className="mt-4 border border-red-500 bg-red-950/40 rounded-xl p-3 text-red-200">{error}</div>}
      {revisiones > 0 && <div className="mt-4 border border-yellow-600 bg-yellow-950/40 rounded-xl p-3 text-yellow-200">{revisiones} línea(s) requieren revisión. Solo preguntamos cuando realmente hay ambigüedad.</div>}
      <ResultadoTable resultados={resultados} onSeleccionarOpcion={onSeleccionarOpcion} />
      <TotalesBox totales={totales} />
    </div>
  );
}
