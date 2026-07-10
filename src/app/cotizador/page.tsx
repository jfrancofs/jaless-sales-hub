'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClienteSelector, DatosCliente, PedidoPanel, ResultadoPanel, ResumenCotizacion, NuevoClienteModal, DescuentosClienteModal } from '@/components/cotizador';
import { VendedorBar } from '@/components/VendedorBar';
import { construirFilaDesdeProducto, calcularTotales } from '@/lib/cotizador/calculos';
import { exportarExcelCotizacion } from '@/lib/excel/exportarCotizacion';
import { abrirPdfCotizacion } from '@/lib/pdf/exportarPdfCotizacion';
import { numeroTemporal } from '@/lib/utils/format';
import { generarCotizacionDesdeTexto } from '@/services/cotizadorService';
import { guardarCotizacion } from '@/services/historialService';
import { useClientes } from '@/hooks/useClientes';
import { useDescuentosCliente } from '@/hooks/useDescuentosCliente';
import type { Producto, ResultadoCotizacion } from '@/types/comercial';
import { obtenerVendedorSesion, type VendedorSesion } from '@/lib/auth/vendedorSession';

const pedidoInicial = `Hola, necesito cotizar para hoy:

20 orings de nitrilo 3x15
20 orings nitrilo 3x25
20 oring nitrilo 2.5x50
100 oring nitrilo 2-203
100 oring nitrilo 2-010

100 abrazaderas de cremallera F9 W1 8-12
100 abrazaderas de cremallera F9 W1 10-16
30 abrazaderas de cremallera F9 W1 16-27

50 abrazaderas industriales W1 40-43
20 seguros I-020
20 seguros E-010
10 pin de expansion 8*40
10 pin de expansion 10*60
100 pasadores 5/32"x1"
25 metros cordón de nitrilo 4 mm
30 billas 10mm
10 billas 7/8"
20 arandela con jebe perno 8
5 arandela con jebe SCR-212`;

export default function CotizadorPage() {
  const { clientes, setClientes, recargarClientes } = useClientes();
  const [texto, setTexto] = useState(pedidoInicial);
  const [clienteId, setClienteId] = useState('');
  const { descuentos, setDescuentos, recargarDescuentos } = useDescuentosCliente(clienteId);
  const [resultados, setResultados] = useState<ResultadoCotizacion[]>([]);
  const [numeroCotizacion, setNumeroCotizacion] = useState(numeroTemporal());
  const [guardado, setGuardado] = useState('');
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState('');
  const [observaciones, setObservaciones] = useState('Precios expresados en dólares americanos. Validez de la cotización: 7 días.');
  const [modalCliente, setModalCliente] = useState(false);
  const [modalDescuentos, setModalDescuentos] = useState(false);
  const [vendedor, setVendedor] = useState<VendedorSesion | null>(null);

  useEffect(() => {
    setVendedor(obtenerVendedorSesion());
  }, []);

  const clienteSeleccionado = clientes.find((cliente) => cliente.id === clienteId) || null;
  const totales = useMemo(() => calcularTotales(resultados), [resultados]);
  const revisiones = resultados.filter((r) => r.estado !== 'Exacto').length;
  const numero = numeroCotizacion;

  useEffect(() => {
    const raw = localStorage.getItem('jaless_cotizacion_duplicar');
    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      if (data?.pedidoOriginal) setTexto(data.pedidoOriginal);
      if (data?.observaciones) setObservaciones(data.observaciones);
      if (data?.clienteId) setClienteId(data.clienteId);
      setNumeroCotizacion(numeroTemporal());
      setGuardado('Cotización duplicada. Revisa cambios y presiona Generar cotización.');
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem('jaless_cotizacion_duplicar');
    }
  }, []);

  function seleccionarOpcion(item: number, producto: Producto) {
    setResultados((actuales) =>
      actuales.map((row) => (row.item === item ? construirFilaDesdeProducto(row, producto, descuentos) : row))
    );
  }

  async function generar() {
    setLoading(true);
    setError('');
    setGuardado('');

    try {
      const filas = await generarCotizacionDesdeTexto(texto, descuentos);
      setResultados(filas);

      const totalesGenerados = calcularTotales(filas);
      const exactas = filas.filter((fila) => fila.estado === 'Exacto');
      if (exactas.length > 0) {
        await guardarCotizacion({
          numero: numeroCotizacion,
          cliente: clienteSeleccionado,
          resultados: exactas,
          totales: totalesGenerados,
          observaciones,
          pedidoOriginal: texto,
          vendedor: vendedor?.nombre || 'JALESS',
        });
        setGuardado(`Cotización ${numeroCotizacion} guardada en historial.`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error generando cotización');
    } finally {
      setLoading(false);
    }
  }

  function exportarPdfProfesional() {
    if (resultados.length === 0) {
      setError('Primero genera una cotización antes de exportar PDF.');
      return;
    }

    setError('');
    abrirPdfCotizacion({
      resultados,
      cliente: clienteSeleccionado,
      numero,
      observaciones,
      totales,
      vendedor: vendedor?.nombre || 'JALESS',
    });
  }

  async function exportarExcelProfesional() {
    if (resultados.length === 0) {
      setError('Primero genera una cotización antes de exportar.');
      return;
    }

    setExportando(true);
    setError('');
    setGuardado('');

    try {
      await exportarExcelCotizacion({
        resultados,
        cliente: clienteSeleccionado,
        numero,
        observaciones,
        totales,
        vendedor: vendedor?.nombre || 'JALESS',
      });
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error exportando Excel');
    } finally {
      setExportando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white p-6 lg:p-10">
      <section className="max-w-7xl mx-auto">
        <p className="tracking-[0.5em] text-cyan-400 text-sm font-bold">JALESS ONE</p>
        <h1 className="text-4xl font-bold mt-3">Cotización Profesional Jaless AI</h1>
        <p className="mt-2 text-slate-300">Clientes nuevos, descuentos por categoría, historial, Excel y PDF profesional.</p>
        <div className="mt-4 flex gap-3">
          <a href="/historial" className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-sm font-bold">Ver historial</a>
          <a href="/admin" className="bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl px-4 py-2 text-sm font-bold">Administración</a>
          <a href="/login" className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-sm font-bold">Vendedor</a>
          {guardado && <span className="text-emerald-300 text-sm py-2">{guardado}</span>}
        </div>

        <VendedorBar />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ClienteSelector
            clientes={clientes}
            clienteId={clienteId}
            onChange={setClienteId}
            onNuevoCliente={() => setModalCliente(true)}
            onEditarDescuentos={() => setModalDescuentos(true)}
          />
          <ResumenCotizacion numero={numero} />
        </div>

        <DatosCliente cliente={clienteSeleccionado} />

        <div className="grid grid-cols-1 lg:grid-cols-[430px_1fr] gap-6 mt-6">
          <PedidoPanel
            texto={texto}
            observaciones={observaciones}
            loading={loading}
            exportando={exportando}
            puedeExportar={resultados.length > 0}
            onTextoChange={setTexto}
            onObservacionesChange={setObservaciones}
            onGenerar={generar}
            onExportar={exportarExcelProfesional}
            onExportarPdf={exportarPdfProfesional}
          />

          <ResultadoPanel
            resultados={resultados}
            revisiones={revisiones}
            error={error}
            totales={totales}
            onSeleccionarOpcion={seleccionarOpcion}
          />
        </div>

        <NuevoClienteModal
          open={modalCliente}
          onClose={() => setModalCliente(false)}
          onGuardado={(cliente) => {
            setClientes((actuales) => [...actuales, cliente].sort((a, b) => a.razon_social.localeCompare(b.razon_social)));
            setClienteId(cliente.id);
            recargarClientes();
          }}
        />

        <DescuentosClienteModal
          open={modalDescuentos}
          cliente={clienteSeleccionado}
          descuentosActuales={descuentos}
          onClose={() => setModalDescuentos(false)}
          onGuardado={(nuevosDescuentos) => {
            setDescuentos(nuevosDescuentos);
            recargarDescuentos();
          }}
        />
      </section>
    </main>
  );
}
