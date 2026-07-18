'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  actualizarVendedor,
  cambiarEstadoVendedor,
  crearVendedor,
  listarVendedores,
} from '@/services/vendedoresService';
import type { VendedorJaless } from '@/types/comercial';

type Rol = 'administrador' | 'supervisor' | 'vendedor';
type Estado = 'activo' | 'inactivo';

type FormVendedor = {
  nombre: string;
  correo: string;
  telefono: string;
  rol: Rol;
  pin_codigo: string;
  estado: Estado;
};

const formularioInicial: FormVendedor = {
  nombre: '',
  correo: '',
  telefono: '',
  rol: 'vendedor',
  pin_codigo: '',
  estado: 'activo',
};

function fechaLegible(fecha?: string | null) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-PE');
}

export default function AdminVendedoresPage() {
  const [vendedores, setVendedores] = useState<VendedorJaless[]>([]);
  const [seleccionadoId, setSeleccionadoId] = useState('');
  const [form, setForm] = useState<FormVendedor>(formularioInicial);
  const [busqueda, setBusqueda] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  async function cargar(preseleccionarId?: string) {
    setLoading(true);
    setError('');
    try {
      const data = await listarVendedores();
      setVendedores(data);
      if (preseleccionarId) setSeleccionadoId(preseleccionarId);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error cargando vendedores.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const vendedoresFiltrados = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase('es');
    if (!q) return vendedores;
    return vendedores.filter((v) =>
      [v.nombre, v.correo, v.telefono, v.rol, v.estado]
        .filter(Boolean)
        .some((valor) => String(valor).toLocaleLowerCase('es').includes(q))
    );
  }, [busqueda, vendedores]);

  const seleccionado = vendedores.find((v) => v.id === seleccionadoId) ?? null;

  function limpiarFormulario() {
    setSeleccionadoId('');
    setModoEdicion(false);
    setForm(formularioInicial);
    setError('');
    setMensaje('');
  }

  function seleccionar(vendedor: VendedorJaless) {
    setSeleccionadoId(vendedor.id);
    setModoEdicion(true);
    setForm({
      nombre: vendedor.nombre,
      correo: vendedor.correo || '',
      telefono: vendedor.telefono || '',
      rol: vendedor.rol,
      pin_codigo: '',
      estado: (vendedor.estado === 'inactivo' ? 'inactivo' : 'activo') as Estado,
    });
    setError('');
    setMensaje('');
  }

  async function guardar() {
    setGuardando(true);
    setError('');
    setMensaje('');

    try {
      if (modoEdicion && seleccionadoId) {
        const actualizado = await actualizarVendedor(seleccionadoId, form);
        setMensaje('Vendedor actualizado correctamente.');
        setForm((actual) => ({ ...actual, pin_codigo: '' }));
        await cargar(actualizado.id);
      } else {
        const creado = await crearVendedor(form);
        setMensaje('Vendedor creado correctamente.');
        setModoEdicion(true);
        setForm((actual) => ({ ...actual, pin_codigo: '' }));
        await cargar(creado.id);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'No se pudo guardar el vendedor.');
    } finally {
      setGuardando(false);
    }
  }

  async function alternarEstado(vendedor: VendedorJaless) {
    const nuevoEstado: Estado = vendedor.estado === 'activo' ? 'inactivo' : 'activo';
    setError('');
    setMensaje('');
    try {
      await cambiarEstadoVendedor(vendedor.id, nuevoEstado);
      setMensaje(`Vendedor ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} correctamente.`);
      await cargar(vendedor.id);
      if (seleccionadoId === vendedor.id) {
        setForm((actual) => ({ ...actual, estado: nuevoEstado }));
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado.');
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] p-6 text-white lg:p-10">
      <section className="mx-auto max-w-7xl">
        <p className="text-sm font-bold tracking-[0.5em] text-cyan-400">JALESS ONE</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Administrar vendedores</h1>
            <p className="mt-2 text-slate-300">Crea accesos, cambia roles, PIN y estado de cada vendedor.</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={limpiarFormulario}
              className="rounded-xl bg-cyan-500 px-5 py-3 font-bold text-black hover:bg-cyan-400"
            >
              + Nuevo vendedor
            </button>
            <a href="/admin" className="rounded-xl border border-slate-600 bg-slate-800 px-5 py-3 font-bold hover:bg-slate-700">
              Volver
            </a>
          </div>
        </div>

        {error && <div className="mt-5 rounded-xl border border-red-500 bg-red-950/40 p-4 text-red-200">{error}</div>}
        {mensaje && <div className="mt-5 rounded-xl border border-emerald-500 bg-emerald-950/40 p-4 text-emerald-200">{mensaje}</div>}

        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-5">
          <label className="mb-2 block text-sm font-bold">Buscar vendedor</label>
          <input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Nombre, correo, teléfono, rol o estado"
            className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[430px_1fr]">
          <aside className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Vendedores</h2>
              <span className="text-sm text-slate-400">{vendedoresFiltrados.length}</span>
            </div>

            <div className="mt-4 max-h-[650px] space-y-3 overflow-auto pr-1">
              {vendedoresFiltrados.map((vendedor) => {
                const activo = vendedor.estado !== 'inactivo';
                const seleccionadoActual = vendedor.id === seleccionadoId;
                return (
                  <button
                    key={vendedor.id}
                    type="button"
                    onClick={() => seleccionar(vendedor)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      seleccionadoActual
                        ? 'border-cyan-400 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-950 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-cyan-300">{vendedor.nombre}</div>
                        <div className="mt-1 text-sm text-slate-300">{vendedor.rol}</div>
                        <div className="mt-1 text-xs text-slate-500">{vendedor.correo || 'Sin correo'}</div>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${activo ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                        {activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </button>
                );
              })}

              {!loading && vendedoresFiltrados.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-700 p-5 text-slate-400">No se encontraron vendedores.</div>
              )}
              {loading && <div className="text-slate-400">Cargando vendedores...</div>}
            </div>
          </aside>

          <section className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">{modoEdicion ? 'Editar vendedor' : 'Nuevo vendedor'}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {modoEdicion ? 'Deja el PIN vacío para conservar el actual.' : 'El PIN debe tener entre 4 y 8 dígitos.'}
                </p>
              </div>
              {seleccionado && (
                <button
                  type="button"
                  onClick={() => alternarEstado(seleccionado)}
                  className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 font-bold hover:bg-slate-700"
                >
                  {seleccionado.estado === 'activo' ? 'Desactivar' : 'Activar'}
                </button>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">Nombre completo</label>
                <input
                  value={form.nombre}
                  onChange={(event) => setForm({ ...form, nombre: event.target.value })}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Correo</label>
                <input
                  type="email"
                  value={form.correo}
                  onChange={(event) => setForm({ ...form, correo: event.target.value })}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Teléfono</label>
                <input
                  value={form.telefono}
                  onChange={(event) => setForm({ ...form, telefono: event.target.value })}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Rol</label>
                <select
                  value={form.rol}
                  onChange={(event) => setForm({ ...form, rol: event.target.value as Rol })}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3"
                >
                  <option value="vendedor">Vendedor</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Estado</label>
                <select
                  value={form.estado}
                  onChange={(event) => setForm({ ...form, estado: event.target.value as Estado })}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold">{modoEdicion ? 'Nuevo PIN (opcional)' : 'PIN'}</label>
                <input
                  value={form.pin_codigo}
                  onChange={(event) =>
                    setForm({ ...form, pin_codigo: event.target.value.replace(/\D/g, '').slice(0, 8) })
                  }
                  type="password"
                  inputMode="numeric"
                  placeholder={modoEdicion ? 'Déjalo vacío para no cambiarlo' : '4 a 8 dígitos'}
                  className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3"
                />
              </div>
            </div>

            {seleccionado && (
              <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300 sm:grid-cols-2">
                <div><b>Creado:</b> {fechaLegible(seleccionado.creado_en)}</div>
                <div><b>Actualizado:</b> {fechaLegible(seleccionado.actualizado_en)}</div>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="rounded-xl bg-emerald-500 px-6 py-4 font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Crear vendedor'}
              </button>
              <button
                type="button"
                onClick={limpiarFormulario}
                className="rounded-xl border border-slate-600 bg-slate-800 px-6 py-4 font-bold hover:bg-slate-700"
              >
                Limpiar
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
