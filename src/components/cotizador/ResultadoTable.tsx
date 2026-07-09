import type { Producto, ResultadoCotizacion } from '@/types/comercial';
import { money } from '@/lib/utils/format';

type Props = {
  resultados: ResultadoCotizacion[];
  onSeleccionarOpcion: (item: number, producto: Producto) => void;
};

export function ResultadoTable({ resultados, onSeleccionarOpcion }: Props) {
  return (
    <div className="mt-4 overflow-auto max-h-[620px] border border-slate-700 rounded-xl">
      <table className="w-full min-w-[1120px] text-sm">
        <thead className="bg-slate-800 sticky top-0">
          <tr>
            <th className="p-3 text-left">Item</th>
            <th className="p-3 text-left">Estado</th>
            <th className="p-3 text-left">Código</th>
            <th className="p-3 text-left">Descripción</th>
            <th className="p-3 text-right">Cant.</th>
            <th className="p-3 text-right">P. Lista</th>
            <th className="p-3 text-right">Dscto.</th>
            <th className="p-3 text-right">P. Final</th>
            <th className="p-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {resultados.map((row) => (
            <tr key={`${row.item}-${row.clave}`} className="border-t border-slate-800 align-top">
              <td className="p-3">{row.item}</td>
              <td className={`p-3 font-bold ${row.estado === 'Exacto' ? 'text-emerald-300' : row.estado === 'Múltiples' ? 'text-orange-300' : 'text-yellow-300'}`}>{row.estado}</td>
              <td className="p-3 text-cyan-300">{row.codigo}</td>
              <td className="p-3">
                <div>{row.descripcion}</div>
                {row.estado === 'Múltiples' && row.opciones && row.opciones.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-orange-200 font-bold">Seleccione el producto correcto:</div>
                    {row.opciones.map((opcion) => (
                      <button
                        key={opcion.codigo}
                        type="button"
                        onClick={() => onSeleccionarOpcion(row.item, opcion)}
                        className="block w-full text-left rounded-lg border border-slate-600 hover:border-cyan-400 bg-slate-950 hover:bg-slate-800 px-3 py-2"
                      >
                        <div className="text-cyan-300 font-bold">{opcion.codigo}</div>
                        <div className="text-xs text-slate-200">{opcion.descripcion}</div>
                        <div className="text-xs text-slate-400">Precio: {money(Number(opcion.precio_usd_sin_igv || 0))}</div>
                      </button>
                    ))}
                  </div>
                )}
              </td>
              <td className="p-3 text-right">{row.cantidad}</td>
              <td className="p-3 text-right">{money(row.precioLista)}</td>
              <td className="p-3 text-right">{row.descuento.toFixed(2)}%</td>
              <td className="p-3 text-right">{money(row.precioFinal)}</td>
              <td className="p-3 text-right font-bold">{money(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
