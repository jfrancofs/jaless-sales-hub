import { useState } from 'react';
import { ProductoAutocomplete } from './ProductoAutocomplete';
import { PedidoImagenModal } from './PedidoImagenModal';
import type { ProductoBusqueda } from '@/lib/search/productSearch';

type Props = {
  texto: string;
  observaciones: string;
  loading: boolean;
  exportando: boolean;
  puedeExportar: boolean;
  onTextoChange: (value: string) => void;
  onObservacionesChange: (value: string) => void;
  onGenerar: () => void;
  onExportar: () => void;
  onExportarPdf?: () => void;
  onAgregarProducto: (producto: ProductoBusqueda, cantidad: number) => void;
};

export function PedidoPanel({ texto, observaciones, loading, exportando, puedeExportar, onTextoChange, onObservacionesChange, onGenerar, onExportar, onExportarPdf, onAgregarProducto }: Props) {
  const [modalImagen, setModalImagen] = useState(false);

  function usarPedidoImagen(textoExtraido: string, modo: 'reemplazar' | 'agregar') {
    if (modo === 'reemplazar') {
      onTextoChange(textoExtraido);
      return;
    }

    onTextoChange(`${texto.trimEnd()}\n${textoExtraido}\n`);
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <label className="font-bold">Pedido del cliente / WhatsApp</label>
        <button type="button" onClick={() => setModalImagen(true)} className="rounded-xl border border-cyan-500 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-950/40">Cargar imagen</button>
      </div>
      <textarea value={texto} onChange={(event) => onTextoChange(event.target.value)} className="mt-4 w-full h-[380px] rounded-xl bg-slate-950 border border-slate-600 p-4 font-mono text-sm" />
      <div className="mt-2 text-xs text-slate-400">Puedes pegar un pedido estructurado o un mensaje libre de WhatsApp. Ej.: “20 orings 3x15”, “100 abrazaderas 10-16”, “25 metros cordón nitrilo 4 mm”.</div>

      <ProductoAutocomplete onAgregar={onAgregarProducto} />

      <label className="block mt-4 font-bold">Observaciones</label>
      <textarea value={observaciones} onChange={(event) => onObservacionesChange(event.target.value)} className="mt-2 w-full h-24 rounded-xl bg-slate-950 border border-slate-600 p-3 text-sm" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
        <button onClick={onGenerar} disabled={loading} className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-black font-bold px-8 py-4 rounded-xl">
          {loading ? 'Interpretando...' : 'Generar cotización'}
        </button>
        <button onClick={onExportar} disabled={exportando || !puedeExportar} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-6 py-4 rounded-xl">
          {exportando ? 'Exportando...' : 'Excel'}
        </button>
        <button onClick={onExportarPdf} disabled={!puedeExportar} className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold px-6 py-4 rounded-xl">
          PDF
        </button>
      </div>
      <PedidoImagenModal
        open={modalImagen}
        onClose={() => setModalImagen(false)}
        onUsarPedido={usarPedidoImagen}
      />
    </div>
  );
}
