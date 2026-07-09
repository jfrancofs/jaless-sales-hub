'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Cliente } from '@/types/comercial';
import { buscarClientesAdmin, CATEGORIAS_DESCUENTO, DESCUENTOS_ESTANDAR } from '@/services/adminService';
import { guardarDescuentosCliente, obtenerDescuentosCliente } from '@/services/clientesService';

export default function AdminDescuentosPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [termino, setTermino] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [descuentos, setDescuentos] = useState<Record<string, number>>({});
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cliente = useMemo(() => clientes.find((c) => c.id === clienteId) || null, [clientes, clienteId]);

  async function cargarClientes(q = '') {
    try {
      setClientes(await buscarClientesAdmin(q));
    } catch (err: any) {
      setError(err?.message || 'Error cargando clientes');
    }
  }

  useEffect(() => {
    cargarClientes();
    const params = new URLSearchParams(window.location.search);
    const clienteParam = params.get('cliente');
    if (clienteParam) setClienteId(clienteParam);
  }, []);

  useEffect(() => {
    if (!clienteId) {
      setDescuentos({});
      return;
    }
    obtenerDescuentosCliente(clienteId).then(setDescuentos).catch((err) => setError(err?.message || 'Error cargando descuentos'));
  }, [clienteId]);

  function cambiar(categoria: string, valor: string) {
    const numero = Math.max(0, Math.min(100, Number(valor) || 0));
    setDescuentos((actual) => ({ ...actual, [categoria]: numero }));
  }

  async function guardar() {
    if (!clienteId) return;
    setMensaje('');
    setError('');
    try {
      await guardarDescuentosCliente(clienteId, descuentos);
      setMensaje('Descuentos guardados correctamente.');
    } catch (err: any) {
      setError(err?.message || 'Error guardando descuentos');
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white p-6 lg:p-10">
      <section className="max-w-5xl mx-auto">
        <div className="flex justify-between gap-4 items-start">
          <div>
            <p className="tracking-[0.5em] text-cyan-400 text-sm font-bold">JALESS ONE</p>
            <h1 className="text-4xl font-bold mt-3">Descuentos por cliente</h1>
            <p className="mt-2 text-slate-300">Administra descuentos comerciales por categoría.</p>
          </div>
          <a href="/admin" className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl px-5 py-3 font-bold">Volver</a>
        </div>

        <div className="mt-6 bg-slate-900 border border-slate-700 rounded-2xl p-5">
          <label className="block text-sm font-bold mb-2">Buscar cliente</label>
          <div className="flex gap-3">
            <input value={termino} onChange={(e) => setTermino(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && cargarClientes(termino)} placeholder="Razón social o RUC" className="flex-1 bg-slate-950 border border-slate-600 rounded-xl px-4 py-3" />
            <button onClick={() => cargarClientes(termino)} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded-xl">Buscar</button>
          </div>

          <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="mt-4 w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3">
            <option value="">Selecciona un cliente</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.razon_social} {c.ruc ? `- ${c.ruc}` : ''}</option>)}
          </select>
        </div>

        {error && <div className="mt-4 border border-red-500 bg-red-950/40 text-red-200 rounded-xl p-3">{error}</div>}
        {mensaje && <div className="mt-4 border border-emerald-500 bg-emerald-950/40 text-emerald-200 rounded-xl p-3">{mensaje}</div>}

        {cliente && (
          <div className="mt-6 bg-slate-900 border border-slate-700 rounded-2xl p-5">
            <h2 className="text-2xl font-bold">{cliente.razon_social}</h2>
            <div className="text-sm text-slate-400 mt-1">RUC: {cliente.ruc || '-'}</div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => setDescuentos(DESCUENTOS_ESTANDAR)} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl">Aplicar descuentos Jaless</button>
              <button onClick={() => setDescuentos({})} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 font-bold px-5 py-3 rounded-xl">Limpiar</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {CATEGORIAS_DESCUENTO.map((categoria) => (
                <label key={categoria} className="bg-slate-950 border border-slate-700 rounded-xl p-4 font-bold">
                  {categoria}
                  <div className="flex items-center gap-3 mt-3">
                    <input type="number" min="0" max="100" value={descuentos[categoria] ?? 0} onChange={(e) => cambiar(categoria, e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-right" />
                    <span>%</span>
                  </div>
                </label>
              ))}
            </div>

            <button onClick={guardar} className="mt-6 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-7 py-4 rounded-xl">Guardar descuentos</button>
          </div>
        )}
      </section>
    </main>
  );
}
