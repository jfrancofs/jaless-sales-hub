'use client';

import { useEffect, useState } from 'react';
import { cambiarEstadoVendedor, crearVendedor, listarVendedores } from '@/services/vendedoresService';
import type { VendedorJaless } from '@/types/comercial';

const inicial = {
  nombre: '',
  correo: '',
  telefono: '',
  rol: 'vendedor' as const,
  pin_codigo: '',
};

export default function AdminVendedoresPage() {
  const [vendedores, setVendedores] = useState<VendedorJaless[]>([]);
  const [form, setForm] = useState(inicial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  async function cargar() {
    setLoading(true);
    setError('');
    try {
      setVendedores(await listarVendedores());
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error cargando vendedores');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function guardar() {
    setError('');
    setMensaje('');
    try {
      await crearVendedor(form);
      setForm(inicial);
      setMensaje('Vendedor creado correctamente.');
      await cargar();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error creando vendedor');
    }
  }

  async function cambiarEstado(id: string, estadoActual?: string | null) {
    setError('');
    try {
      await cambiarEstadoVendedor(id, estadoActual === 'activo' ? 'inactivo' : 'activo');
      await cargar();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error cambiando estado');
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white p-6 lg:p-10">
      <section className="max-w-6xl mx-auto">
        <p className="tracking-[0.5em] text-cyan-400 text-sm font-bold">JALESS ONE</p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-3">
          <div>
            <h1 className="text-4xl font-bold">Vendedores</h1>
            <p className="mt-2 text-slate-300">Administra accesos internos y roles comerciales.</p>
          </div>
          <a href="/admin" className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl px-5 py-3 font-bold">Volver</a>
        </div>

        {error && <div className="mt-5 border border-red-500 bg-red-950/40 text-red-200 rounded-xl p-4">{error}</div>}
        {mensaje && <div className="mt-5 border border-emerald-500 bg-emerald-950/40 text-emerald-200 rounded-xl p-4">{mensaje}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 mt-8">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-2xl font-bold">Nuevo vendedor</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Nombre</label>
                <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Correo</label>
                <input value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Teléfono</label>
                <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-2">Rol</label>
                  <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as any })} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3">
                    <option value="vendedor">Vendedor</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">PIN</label>
                  <input value={form.pin_codigo} onChange={(e) => setForm({ ...form, pin_codigo: e.target.value.replace(/\D/g, '').slice(0, 8) })} className="w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3" placeholder="4 dígitos" />
                </div>
              </div>
              <button onClick={guardar} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-5 py-4 rounded-xl">Crear vendedor</button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 overflow-hidden">
            <h2 className="text-2xl font-bold">Vendedores registrados</h2>
            <div className="mt-4 overflow-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="p-3 text-left">Nombre</th>
                    <th className="p-3 text-left">Correo</th>
                    <th className="p-3 text-left">Teléfono</th>
                    <th className="p-3 text-left">Rol</th>
                    <th className="p-3 text-left">Estado</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {vendedores.map((v) => (
                    <tr key={v.id} className="border-t border-slate-800">
                      <td className="p-3 font-bold text-cyan-300">{v.nombre}</td>
                      <td className="p-3">{v.correo || '-'}</td>
                      <td className="p-3">{v.telefono || '-'}</td>
                      <td className="p-3">{v.rol}</td>
                      <td className="p-3">{v.estado || 'activo'}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => cambiarEstado(v.id, v.estado)} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 rounded-lg font-bold">
                          {v.estado === 'activo' ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && vendedores.length === 0 && (
                    <tr><td colSpan={6} className="p-4 text-slate-400">No hay vendedores todavía.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
