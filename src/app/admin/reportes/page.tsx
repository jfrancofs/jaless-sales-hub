'use client';

import { useEffect, useMemo, useState } from 'react';
import { listarCotizaciones } from '@/services/historialService';
import { money } from '@/lib/utils/format';
import type { CotizacionGuardada } from '@/types/comercial';

function inicioMesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function hoyIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fechaDentro(fecha: string, desde: string, hasta: string) {
  const valor = new Date(fecha).getTime();
  const inicio = desde ? new Date(`${desde}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const fin = hasta ? new Date(`${hasta}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
  return valor >= inicio && valor <= fin;
}

function fechaLegible(fecha: string) {
  return new Date(fecha).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

type Ranking = { nombre: string; cantidad: number; monto: number };

export default function ReportesVendedoresPage() {
  const [cotizaciones, setCotizaciones] = useState<CotizacionGuardada[]>([]);
  const [desde, setDesde] = useState(inicioMesActual());
  const [hasta, setHasta] = useState(hoyIso());
  const [vendedorFiltro, setVendedorFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        setError('');
        setCotizaciones(await listarCotizaciones(''));
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los reportes.');
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  const vendedores = useMemo(
    () => Array.from(new Set(cotizaciones.map((c) => c.vendedor || 'JALESS').filter(Boolean))).sort(),
    [cotizaciones]
  );

  const filtradas = useMemo(
    () => cotizaciones.filter((c) => fechaDentro(c.fecha, desde, hasta) && (!vendedorFiltro || (c.vendedor || 'JALESS') === vendedorFiltro)),
    [cotizaciones, desde, hasta, vendedorFiltro]
  );

  const metricas = useMemo(() => {
    const monto = filtradas.reduce((acc, c) => acc + Number(c.total || 0), 0);
    const clientes = new Set(filtradas.map((c) => c.cliente_ruc || c.cliente_razon_social).filter(Boolean)).size;
    return { monto, clientes, ticket: filtradas.length ? monto / filtradas.length : 0, cantidad: filtradas.length };
  }, [filtradas]);

  const rankingVendedores = useMemo<Ranking[]>(() => {
    const mapa = new Map<string, Ranking>();
    filtradas.forEach((c) => {
      const nombre = c.vendedor || 'JALESS';
      const actual = mapa.get(nombre) || { nombre, cantidad: 0, monto: 0 };
      actual.cantidad += 1;
      actual.monto += Number(c.total || 0);
      mapa.set(nombre, actual);
    });
    return Array.from(mapa.values()).sort((a, b) => b.monto - a.monto);
  }, [filtradas]);

  const rankingClientes = useMemo<Ranking[]>(() => {
    const mapa = new Map<string, Ranking>();
    filtradas.forEach((c) => {
      const nombre = c.cliente_razon_social || 'Sin cliente';
      const actual = mapa.get(nombre) || { nombre, cantidad: 0, monto: 0 };
      actual.cantidad += 1;
      actual.monto += Number(c.total || 0);
      mapa.set(nombre, actual);
    });
    return Array.from(mapa.values()).sort((a, b) => b.monto - a.monto).slice(0, 10);
  }, [filtradas]);

  const maxMontoVendedor = Math.max(...rankingVendedores.map((r) => r.monto), 1);
  const maxMontoCliente = Math.max(...rankingClientes.map((r) => r.monto), 1);

  return (
    <main className="min-h-screen bg-[#020617] text-white p-6 lg:p-10">
      <section className="max-w-7xl mx-auto">
        <p className="tracking-[0.5em] text-cyan-400 text-sm font-bold">JALESS ONE</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Reportes por vendedor</h1>
            <p className="mt-2 text-slate-300">Cotizaciones, montos, clientes y rendimiento comercial.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/admin" className="rounded-xl border border-slate-600 bg-slate-800 px-5 py-3 font-bold hover:bg-slate-700">Volver</a>
            <a href="/cotizador" className="rounded-xl bg-cyan-500 px-5 py-3 font-bold text-black hover:bg-cyan-400">Nueva cotización</a>
          </div>
        </div>

        {error && <div className="mt-5 rounded-xl border border-red-500 bg-red-950/40 p-4 text-red-200">{error}</div>}

        <div className="mt-7 grid grid-cols-1 gap-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 md:grid-cols-3">
          <div><label className="mb-2 block text-sm font-bold">Desde</label><input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3" /></div>
          <div><label className="mb-2 block text-sm font-bold">Hasta</label><input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3" /></div>
          <div><label className="mb-2 block text-sm font-bold">Vendedor</label><select value={vendedorFiltro} onChange={(e) => setVendedorFiltro(e.target.value)} className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3"><option value="">Todos los vendedores</option>{vendedores.map((v) => <option key={v} value={v}>{v}</option>)}</select></div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-slate-900 p-5"><div className="text-sm text-slate-300">Monto cotizado</div><div className="mt-2 text-3xl font-bold text-cyan-300">{loading ? '...' : money(metricas.monto)}</div></div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><div className="text-sm text-slate-300">Cotizaciones</div><div className="mt-2 text-3xl font-bold">{loading ? '...' : metricas.cantidad}</div></div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><div className="text-sm text-slate-300">Clientes cotizados</div><div className="mt-2 text-3xl font-bold">{loading ? '...' : metricas.clientes}</div></div>
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><div className="text-sm text-slate-300">Ticket promedio</div><div className="mt-2 text-3xl font-bold">{loading ? '...' : money(metricas.ticket)}</div></div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-2xl font-bold">Ranking de vendedores</h2>
            <div className="mt-5 space-y-4">
              {rankingVendedores.map((row, index) => <div key={row.nombre}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><div><span className="mr-2 text-cyan-300 font-bold">#{index + 1}</span>{row.nombre}</div><div className="font-bold">{money(row.monto)} · {row.cantidad} cot.</div></div><div className="h-3 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.max((row.monto / maxMontoVendedor) * 100, 3)}%` }} /></div></div>)}
              {!loading && rankingVendedores.length === 0 && <p className="text-slate-400">No hay cotizaciones en el periodo seleccionado.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-2xl font-bold">Clientes más cotizados</h2>
            <div className="mt-5 space-y-4">
              {rankingClientes.map((row, index) => <div key={row.nombre}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><div className="truncate"><span className="mr-2 text-yellow-300 font-bold">#{index + 1}</span>{row.nombre}</div><div className="whitespace-nowrap font-bold">{money(row.monto)}</div></div><div className="h-3 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-yellow-400" style={{ width: `${Math.max((row.monto / maxMontoCliente) * 100, 3)}%` }} /></div></div>)}
              {!loading && rankingClientes.length === 0 && <p className="text-slate-400">No hay clientes en el periodo seleccionado.</p>}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-900 p-6 overflow-hidden">
          <h2 className="text-2xl font-bold">Cotizaciones del periodo</h2>
          <div className="mt-4 overflow-auto max-h-[520px]">
            <table className="w-full min-w-[900px] text-sm"><thead className="sticky top-0 bg-slate-800"><tr><th className="p-3 text-left">Número</th><th className="p-3 text-left">Fecha</th><th className="p-3 text-left">Vendedor</th><th className="p-3 text-left">Cliente</th><th className="p-3 text-right">Total</th></tr></thead><tbody>{filtradas.map((cot) => <tr key={cot.id} className="border-t border-slate-800 hover:bg-slate-800/60"><td className="p-3 font-bold text-cyan-300">{cot.numero}</td><td className="p-3 text-slate-300">{fechaLegible(cot.fecha)}</td><td className="p-3">{cot.vendedor || 'JALESS'}</td><td className="p-3">{cot.cliente_razon_social || 'Sin cliente'}</td><td className="p-3 text-right font-bold">{money(Number(cot.total || 0))}</td></tr>)}{!loading && filtradas.length === 0 && <tr><td colSpan={5} className="p-5 text-slate-400">No hay cotizaciones para los filtros seleccionados.</td></tr>}</tbody></table>
          </div>
        </div>
      </section>
    </main>
  );
}
