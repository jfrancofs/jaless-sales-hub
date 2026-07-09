'use client';

import { useEffect, useState } from 'react';
import { actualizarPrecioProducto, buscarProductosAdmin, type ProductoAdmin } from '@/services/adminService';

export default function AdminProductosPage() {
  const [termino, setTermino] = useState('');
  const [productos, setProductos] = useState<ProductoAdmin[]>([]);
  const [editando, setEditando] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function cargar() {
    setLoading(true);
    setError('');
    try {
      const data = await buscarProductosAdmin(termino);
      setProductos(data);
      const precios: Record<string, string> = {};
      data.forEach((p) => { precios[p.codigo] = String(p.precio_usd_sin_igv ?? 0); });
      setEditando(precios);
    } catch (err: any) {
      setError(err?.message || 'Error cargando productos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function guardarPrecio(producto: ProductoAdmin) {
    setMensaje('');
    setError('');
    const precio = Number(editando[producto.codigo]);
    if (!Number.isFinite(precio) || precio < 0) {
      setError('Precio inválido.');
      return;
    }

    try {
      await actualizarPrecioProducto(producto.codigo, precio);
      setProductos((actuales) => actuales.map((p) => p.codigo === producto.codigo ? { ...p, precio_usd_sin_igv: precio } : p));
      setMensaje(`Precio actualizado: ${producto.codigo}`);
    } catch (err: any) {
      setError(err?.message || 'Error actualizando precio');
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white p-6 lg:p-10">
      <section className="max-w-7xl mx-auto">
        <div className="flex justify-between gap-4 items-start">
          <div>
            <p className="tracking-[0.5em] text-cyan-400 text-sm font-bold">JALESS ONE</p>
            <h1 className="text-4xl font-bold mt-3">Administrar productos</h1>
            <p className="mt-2 text-slate-300">Consulta productos y actualiza precios unitarios sin IGV.</p>
          </div>
          <a href="/admin" className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl px-5 py-3 font-bold">Volver</a>
        </div>

        <div className="mt-6 bg-slate-900 border border-slate-700 rounded-2xl p-5 flex gap-3">
          <input value={termino} onChange={(e) => setTermino(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && cargar()} placeholder="Buscar por código, descripción, categoría o clave" className="flex-1 bg-slate-950 border border-slate-600 rounded-xl px-4 py-3" />
          <button onClick={cargar} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded-xl">{loading ? 'Buscando...' : 'Buscar'}</button>
        </div>

        {error && <div className="mt-4 border border-red-500 bg-red-950/40 text-red-200 rounded-xl p-3">{error}</div>}
        {mensaje && <div className="mt-4 border border-emerald-500 bg-emerald-950/40 text-emerald-200 rounded-xl p-3">{mensaje}</div>}

        <div className="mt-6 bg-slate-900 border border-slate-700 rounded-2xl p-5 overflow-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-slate-800 sticky top-0">
              <tr>
                <th className="p-3 text-left">Código</th>
                <th className="p-3 text-left">Descripción</th>
                <th className="p-3 text-left">Categoría</th>
                <th className="p-3 text-left">Medida</th>
                <th className="p-3 text-left">Clave</th>
                <th className="p-3 text-right">Precio USD sin IGV</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.codigo} className="border-t border-slate-800">
                  <td className="p-3 text-cyan-300 font-bold">{producto.codigo}</td>
                  <td className="p-3">{producto.descripcion}</td>
                  <td className="p-3">{producto.categoria}</td>
                  <td className="p-3">{producto.medida || '-'}</td>
                  <td className="p-3 text-xs text-slate-400">{producto.clave_busqueda}</td>
                  <td className="p-3 text-right"><input value={editando[producto.codigo] ?? ''} onChange={(e) => setEditando((actual) => ({ ...actual, [producto.codigo]: e.target.value }))} className="w-28 bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-right" /></td>
                  <td className="p-3 text-right"><button onClick={() => guardarPrecio(producto)} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 rounded-lg">Guardar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
