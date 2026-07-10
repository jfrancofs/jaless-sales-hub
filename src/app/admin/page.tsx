'use client';

import { useEffect, useMemo, useState } from 'react';
import { resumenAdmin } from '@/services/adminService';
import { listarCotizaciones } from '@/services/historialService';
import { money } from '@/lib/utils/format';
import type { CotizacionGuardada } from '@/types/comercial';

type Resumen = { clientes: number; productos: number; cotizaciones: number };

function esHoy(fecha: string) {
  const d = new Date(fecha);
  const hoy = new Date();
  return d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth() && d.getDate() === hoy.getDate();
}

function fechaCorta(fecha: string) {
  return new Date(fecha).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AdminPage() {
  const [resumen, setResumen] = useState<Resumen>({ clientes: 0, productos: 0, cotizaciones: 0 });
  const [cotizaciones, setCotizaciones] = useState<CotizacionGuardada[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      try {
        setLoading(true);
        const [r, cots] = await Promise.all([resumenAdmin(), listarCotizaciones('')]);
        setResumen(r);
        setCotizaciones(cots);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Error cargando administración');
      } finally {
        setLoading(false);
      }
    }
    cargar();
  }, []);

  const metricas = useMemo(() => {
    const hoy = cotizaciones.filter((c) => esHoy(c.fecha));
    const montoHoy = hoy.reduce((acc, c) => acc + Number(c.total || 0), 0);
    const montoTotal = cotizaciones.reduce((acc, c) => acc + Number(c.total || 0), 0);
    const clientesCotizados = new Set(cotizaciones.map((c) => c.cliente_ruc || c.cliente_razon_social).filter(Boolean)).size;
    return { hoy, montoHoy, montoTotal, clientesCotizados };
  }, [cotizaciones]);

  const cards = [
    { titulo: 'Clientes', valor: resumen.clientes.toLocaleString('es-PE'), href: '/admin/clientes', texto: 'Crear, editar y revisar datos comerciales.', icono: '👥' },
    { titulo: 'Productos', valor: resumen.productos.toLocaleString('es-PE'), href: '/admin/productos', texto: 'Buscar productos y actualizar precios.', icono: '📦' },
    { titulo: 'Cotizaciones', valor: resumen.cotizaciones.toLocaleString('es-PE'), href: '/historial', texto: 'Ver historial y detalles guardados.', icono: '📄' },
    { titulo: 'Descuentos', valor: 'Por cliente', href: '/admin/descuentos', texto: 'Configurar descuentos por categoría.', icono: '🏷️' },
    { titulo: 'Vendedores', valor: 'Accesos', href: '/admin/vendedores', texto: 'Usuarios internos, roles y PIN de ingreso.', icono: '🧑‍💼' },
  ];

  return (
    <main className="min-h-screen bg-[#020617] text-white p-6 lg:p-10">
      <section className="max-w-7xl mx-auto">
        <p className="tracking-[0.5em] text-cyan-400 text-sm font-bold">JALESS ONE</p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mt-3">
          <div>
            <h1 className="text-4xl font-bold">Panel administrativo</h1>
            <p className="mt-2 text-slate-300">Vista ejecutiva del cotizador, clientes, productos y descuentos.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/cotizador" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-5 py-3 rounded-xl">Ir al cotizador</a>
            <a href="/historial" className="bg-slate-800 hover:bg-slate-700 border border-slate-600 font-bold px-5 py-3 rounded-xl">Historial</a>
            <a href="/login" className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-5 py-3 rounded-xl">Ingresar vendedor</a>
          </div>
        </div>

        {error && <div className="mt-5 border border-red-500 bg-red-950/40 text-red-200 rounded-xl p-4">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-gradient-to-br from-cyan-500/20 to-slate-900 border border-cyan-500/30 rounded-2xl p-5">
            <div className="text-slate-300 text-sm">Monto cotizado hoy</div>
            <div className="text-3xl font-bold mt-2 text-cyan-300">{money(metricas.montoHoy)}</div>
            <div className="text-xs text-slate-400 mt-2">{metricas.hoy.length} cotización(es) de hoy</div>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
            <div className="text-slate-300 text-sm">Cotizaciones hoy</div>
            <div className="text-3xl font-bold mt-2 text-white">{metricas.hoy.length}</div>
            <div className="text-xs text-slate-400 mt-2">Registradas en historial</div>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
            <div className="text-slate-300 text-sm">Clientes cotizados</div>
            <div className="text-3xl font-bold mt-2 text-white">{metricas.clientesCotizados}</div>
            <div className="text-xs text-slate-400 mt-2">Según historial reciente</div>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
            <div className="text-slate-300 text-sm">Monto histórico</div>
            <div className="text-3xl font-bold mt-2 text-white">{money(metricas.montoTotal)}</div>
            <div className="text-xs text-slate-400 mt-2">Últimas 100 cotizaciones</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 mt-6">
          {cards.map((card) => (
            <a key={card.titulo} href={card.href} className="bg-slate-900 border border-slate-700 hover:border-cyan-400 rounded-2xl p-6 block transition">
              <div className="flex items-center justify-between gap-3">
                <div className="text-slate-400 text-sm">{card.titulo}</div>
                <div className="text-2xl">{card.icono}</div>
              </div>
              <div className="text-3xl font-bold mt-2 text-cyan-300">{loading ? '...' : card.valor}</div>
              <p className="mt-3 text-slate-300 text-sm">{card.texto}</p>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5 mt-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 overflow-hidden">
            <h2 className="text-2xl font-bold">Últimas cotizaciones</h2>
            <div className="mt-4 overflow-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-slate-800 text-slate-200">
                  <tr>
                    <th className="p-3 text-left">Número</th>
                    <th className="p-3 text-left">Cliente</th>
                    <th className="p-3 text-left">Fecha</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizaciones.slice(0, 8).map((cot) => (
                    <tr key={cot.id} className="border-t border-slate-800 hover:bg-slate-800/60">
                      <td className="p-3 text-cyan-300 font-bold">{cot.numero}</td>
                      <td className="p-3">{cot.cliente_razon_social || 'Sin cliente'}</td>
                      <td className="p-3 text-slate-300">{fechaCorta(cot.fecha)}</td>
                      <td className="p-3 text-right font-bold">{money(Number(cot.total || 0))}</td>
                    </tr>
                  ))}
                  {cotizaciones.length === 0 && <tr><td className="p-4 text-slate-400" colSpan={4}>Aún no hay cotizaciones guardadas.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-2xl font-bold">Acciones rápidas</h2>
            <div className="mt-4 grid gap-3">
              <a href="/cotizador" className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold p-4">Nueva cotización</a>
              <a href="/admin/clientes" className="rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 font-bold p-4">Administrar clientes</a>
              <a href="/admin/productos" className="rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 font-bold p-4">Actualizar precios</a>
              <a href="/admin/descuentos" className="rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 font-bold p-4">Configurar descuentos</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
