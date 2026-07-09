'use client';

import { useEffect, useState } from 'react';
import { listarCotizaciones, obtenerDetalleCotizacion } from '@/services/historialService';
import { money } from '@/lib/utils/format';
import { abrirPdfCotizacion } from '@/lib/pdf/exportarPdfCotizacion';
import { exportarExcelCotizacion } from '@/lib/excel/exportarCotizacion';
import type { CotizacionGuardada, CotizacionDetalleGuardada, ResultadoCotizacion, Cliente } from '@/types/comercial';

export default function HistorialPage() {
  const [busqueda, setBusqueda] = useState('');
  const [cotizaciones, setCotizaciones] = useState<CotizacionGuardada[]>([]);
  const [seleccionada, setSeleccionada] = useState<CotizacionGuardada | null>(null);
  const [detalle, setDetalle] = useState<CotizacionDetalleGuardada[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function cargar() {
    setLoading(true);
    setError('');
    try {
      const data = await listarCotizaciones(busqueda);
      setCotizaciones(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error cargando historial');
    } finally {
      setLoading(false);
    }
  }

  async function abrir(cotizacion: CotizacionGuardada) {
    setSeleccionada(cotizacion);
    setError('');
    try {
      const data = await obtenerDetalleCotizacion(cotizacion.id);
      setDetalle(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error cargando detalle');
    }
  }

  function resultadosDesdeDetalle(): ResultadoCotizacion[] {
    return detalle.map((row) => ({
      item: row.item,
      estado: row.estado === 'Exacto' ? 'Exacto' : 'No encontrado',
      codigo: row.codigo,
      descripcion: row.descripcion,
      categoria: row.categoria,
      interpretado: row.clave_busqueda,
      clave: row.clave_busqueda,
      cantidad: Number(row.cantidad || 0),
      precioLista: Number(row.precio_lista || 0),
      descuento: Number(row.descuento || 0),
      precioFinal: Number(row.precio_final || 0),
      total: Number(row.total || 0),
    })) as ResultadoCotizacion[];
  }

  function clienteDesdeSeleccionada(): Cliente | null {
    if (!seleccionada?.cliente_id && !seleccionada?.cliente_razon_social) return null;
    return {
      id: seleccionada.cliente_id || '',
      razon_social: seleccionada.cliente_razon_social || 'Sin cliente',
      ruc: seleccionada.cliente_ruc || '',
      direccion: seleccionada.cliente_direccion || '',
      ciudad: seleccionada.cliente_ciudad || '',
      condicion_pago: seleccionada.condicion_pago || 'Contado',
    };
  }

  async function exportarExcelDesdeHistorial() {
    if (!seleccionada || detalle.length === 0) return;
    setError('');
    try {
      await exportarExcelCotizacion({
        numero: seleccionada.numero,
        cliente: clienteDesdeSeleccionada(),
        resultados: resultadosDesdeDetalle(),
        observaciones: seleccionada.observaciones || '',
        totales: {
          subtotal: Number(seleccionada.subtotal || 0),
          igv: Number(seleccionada.igv || 0),
          total: Number(seleccionada.total || 0),
        },
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error exportando Excel');
    }
  }

  function duplicarCotizacion() {
    if (!seleccionada) return;
    localStorage.setItem(
      'jaless_cotizacion_duplicar',
      JSON.stringify({
        pedidoOriginal: seleccionada.pedido_original || '',
        observaciones: seleccionada.observaciones || '',
        clienteId: seleccionada.cliente_id || '',
      })
    );
    window.location.href = '/cotizador';
  }


  function exportarPdfDesdeHistorial() {
    if (!seleccionada || detalle.length === 0) return;

    abrirPdfCotizacion({
      numero: seleccionada.numero,
      cotizacion: seleccionada,
      cliente: clienteDesdeSeleccionada(),
      resultados: resultadosDesdeDetalle(),
      observaciones: seleccionada.observaciones || '',
      totales: {
        subtotal: Number(seleccionada.subtotal || 0),
        igv: Number(seleccionada.igv || 0),
        total: Number(seleccionada.total || 0),
      },
    });
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-[#020617] text-white p-6 lg:p-10">
      <section className="max-w-7xl mx-auto">
        <p className="tracking-[0.5em] text-cyan-400 text-sm font-bold">JALESS ONE</p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-3">
          <div>
            <h1 className="text-4xl font-bold">Historial de cotizaciones</h1>
            <p className="mt-2 text-slate-300">Busca, abre y revisa cotizaciones guardadas.</p>
          </div>
          <a href="/cotizador" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-5 py-3 rounded-xl text-center">Volver al cotizador</a>
        </div>

        <div className="mt-6 bg-slate-900 border border-slate-700 rounded-2xl p-5">
          <label className="block text-sm font-bold mb-2">Buscar por cliente, RUC o número de cotización</label>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              className="flex-1 bg-slate-950 border border-slate-600 rounded-xl px-4 py-3"
              placeholder="Ej: AYS PIURA, 20175674382, COT-2026..."
            />
            <button onClick={cargar} disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-bold px-6 py-3 rounded-xl">
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
          {error && <div className="mt-4 border border-red-500 bg-red-950/40 rounded-xl p-3 text-red-200">{error}</div>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[430px_1fr] gap-6 mt-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 overflow-hidden">
            <h2 className="text-2xl font-bold">Cotizaciones</h2>
            <div className="mt-4 space-y-3 max-h-[650px] overflow-auto pr-2">
              {cotizaciones.length === 0 && <div className="text-slate-400">No hay cotizaciones guardadas todavía.</div>}
              {cotizaciones.map((cotizacion) => (
                <button
                  key={cotizacion.id}
                  onClick={() => abrir(cotizacion)}
                  className={`w-full text-left rounded-xl border p-4 hover:bg-slate-800 ${seleccionada?.id === cotizacion.id ? 'border-cyan-400 bg-slate-800' : 'border-slate-700 bg-slate-950'}`}
                >
                  <div className="font-bold text-cyan-300">{cotizacion.numero}</div>
                  <div className="text-sm mt-1">{cotizacion.cliente_razon_social || 'Sin cliente'}</div>
                  <div className="text-xs text-slate-400 mt-1">RUC: {cotizacion.cliente_ruc || '-'}</div>
                  <div className="flex justify-between mt-3 text-sm">
                    <span>{new Date(cotizacion.fecha).toLocaleString('es-PE')}</span>
                    <b>{money(Number(cotizacion.total || 0))}</b>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 overflow-hidden">
            <h2 className="text-2xl font-bold">Detalle</h2>
            {!seleccionada && <div className="mt-4 text-slate-400">Selecciona una cotización para ver el detalle.</div>}
            {seleccionada && (
              <>
                <div className="mt-4 bg-slate-950 border border-slate-700 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><b>Número:</b> {seleccionada.numero}</div>
                  <div><b>Fecha:</b> {new Date(seleccionada.fecha).toLocaleDateString('es-PE')}</div>
                  <div className="md:col-span-2"><b>Cliente:</b> {seleccionada.cliente_razon_social || 'Sin cliente'}</div>
                  <div><b>RUC:</b> {seleccionada.cliente_ruc || '-'}</div>
                  <div><b>Condición:</b> {seleccionada.condicion_pago || 'Contado'}</div>
                  <div className="md:col-span-2"><b>Observaciones:</b> {seleccionada.observaciones || '-'}</div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <button onClick={exportarPdfDesdeHistorial} disabled={detalle.length === 0} className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold px-5 py-3 rounded-xl">Ver PDF</button>
                  <button onClick={exportarExcelDesdeHistorial} disabled={detalle.length === 0} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold px-5 py-3 rounded-xl">Descargar Excel</button>
                  <button onClick={duplicarCotizacion} className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-5 py-3 rounded-xl">Duplicar / Editar</button>
                </div>

                <div className="mt-4 overflow-auto max-h-[470px] border border-slate-700 rounded-xl">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead className="bg-slate-800 sticky top-0">
                      <tr>
                        <th className="p-3 text-left">Item</th>
                        <th className="p-3 text-left">Código</th>
                        <th className="p-3 text-left">Descripción</th>
                        <th className="p-3 text-right">Cant.</th>
                        <th className="p-3 text-right">P. Lista</th>
                        <th className="p-3 text-right">Dscto.</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.map((row) => (
                        <tr key={row.id} className="border-t border-slate-800">
                          <td className="p-3">{row.item}</td>
                          <td className="p-3 text-cyan-300">{row.codigo}</td>
                          <td className="p-3">{row.descripcion}</td>
                          <td className="p-3 text-right">{row.cantidad}</td>
                          <td className="p-3 text-right">{money(Number(row.precio_lista || 0))}</td>
                          <td className="p-3 text-right">{Number(row.descuento || 0).toFixed(2)}%</td>
                          <td className="p-3 text-right font-bold">{money(Number(row.total || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 bg-slate-950 border border-slate-700 rounded-xl p-6 text-right space-y-2">
                  <div>Subtotal: <b>{money(Number(seleccionada.subtotal || 0))}</b></div>
                  <div>IGV 18%: <b>{money(Number(seleccionada.igv || 0))}</b></div>
                  <div className="text-3xl font-bold">Total: {money(Number(seleccionada.total || 0))}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
