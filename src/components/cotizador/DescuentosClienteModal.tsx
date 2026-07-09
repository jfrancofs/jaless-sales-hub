'use client';

import { useEffect, useState } from 'react';
import type { Cliente } from '@/types/comercial';
import { CATEGORIAS_DESCUENTO, guardarDescuentosCliente } from '@/services/clientesService';

type Props = {
  open: boolean;
  cliente: Cliente | null;
  descuentosActuales: Record<string, number>;
  onClose: () => void;
  onGuardado: (descuentos: Record<string, number>) => void;
};

export function DescuentosClienteModal({ open, cliente, descuentosActuales, onClose, onGuardado }: Props) {
  const [descuentos, setDescuentos] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const inicial: Record<string, number> = {};
    CATEGORIAS_DESCUENTO.forEach((categoria) => {
      inicial[categoria] = Number(descuentosActuales[categoria] || 0);
    });
    setDescuentos(inicial);
  }, [open, descuentosActuales]);

  if (!open || !cliente) return null;

  function cambiar(categoria: string, value: string) {
    const n = Math.max(0, Math.min(100, Number(value) || 0));
    setDescuentos((actual) => ({ ...actual, [categoria]: n }));
  }

  async function guardar() {
    setLoading(true);
    setError('');
    try {
      await guardarDescuentosCliente(cliente.id, descuentos);
      onGuardado(descuentos);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'No se pudieron guardar los descuentos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Descuentos por categoría</h2>
            <p className="text-sm text-slate-300 mt-1">{cliente.razon_social}</p>
          </div>
          <button onClick={onClose} className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2">Cerrar</button>
        </div>
        {error && <div className="mt-4 rounded-xl border border-red-500 bg-red-950/40 p-3 text-red-200">{error}</div>}

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIAS_DESCUENTO.map((categoria) => (
            <label key={categoria} className="rounded-xl bg-slate-950 border border-slate-700 p-4 text-sm font-bold">
              {categoria}
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={descuentos[categoria] ?? 0}
                  onChange={(e) => cambiar(categoria, e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-right"
                />
                <span>%</span>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-3 font-bold">Cancelar</button>
          <button onClick={guardar} disabled={loading} className="rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-black px-5 py-3 font-bold">
            {loading ? 'Guardando...' : 'Guardar descuentos'}
          </button>
        </div>
      </div>
    </div>
  );
}
