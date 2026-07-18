'use client';

import { useEffect, useRef, useState } from 'react';
import { buscarProductosInteligente } from '@/services/productSearchService';
import type { ProductoBusqueda } from '@/lib/search/productSearch';

type Props = { onAgregar: (producto: ProductoBusqueda, cantidad: number) => void };

export function ProductoAutocomplete({ onAgregar }: Props) {
  const [termino, setTermino] = useState('');
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const secuencia = useRef(0);

  useEffect(() => {
    const consulta = termino.trim();
    if (consulta.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResultados([]);
      setError('');
      return;
    }

    const actual = ++secuencia.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await buscarProductosInteligente(consulta, 10);
        if (actual === secuencia.current) setResultados(data);
      } catch (err) {
        console.error(err);
        if (actual === secuencia.current) setError('No se pudo buscar productos.');
      } finally {
        if (actual === secuencia.current) setLoading(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [termino]);

  function agregar(producto: ProductoBusqueda) {
    const qty = Number(cantidad);
    onAgregar(producto, Number.isFinite(qty) && qty > 0 ? qty : 1);
    setTermino('');
    setResultados([]);
  }

  return (
    <div className="mt-4 rounded-xl border border-cyan-900/70 bg-slate-950/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-bold text-cyan-300">Buscador inteligente</div>
          <div className="text-xs text-slate-400">Busca por código, medida, descripción, material o abreviatura.</div>
        </div>
        <input type="number" min="1" step="1" value={cantidad} onChange={(event) => setCantidad(Number(event.target.value))} className="w-24 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-right" aria-label="Cantidad" />
      </div>

      <input value={termino} onChange={(event) => setTermino(event.target.value)} placeholder='Ej.: 3 x 15, 2-203, F9 8-12, cordón 4 mm, pin 8*40' className="mt-3 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-3" />

      {loading && <div className="mt-2 text-xs text-cyan-300">Buscando...</div>}
      {error && <div className="mt-2 text-xs text-red-300">{error}</div>}
      {termino.trim().length >= 2 && !loading && resultados.length === 0 && !error && <div className="mt-2 text-xs text-slate-400">Sin coincidencias. Prueba con una parte del código o la medida.</div>}

      {resultados.length > 0 && (
        <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
          {resultados.map((producto) => (
            <button type="button" key={producto.codigo} onClick={() => agregar(producto)} className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-left hover:border-cyan-500 hover:bg-slate-800">
              <div className="flex justify-between gap-3">
                <div>
                  <div className="font-bold text-cyan-300">{producto.codigo}</div>
                  <div className="text-sm text-white">{producto.descripcion}</div>
                  <div className="mt-1 text-xs text-slate-400">{[producto.categoria, producto.material, producto.tipo, producto.medida].filter(Boolean).join(' · ')}</div>
                </div>
                <div className="whitespace-nowrap text-sm font-bold">${Number(producto.precio_usd_sin_igv || 0).toFixed(4)}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
