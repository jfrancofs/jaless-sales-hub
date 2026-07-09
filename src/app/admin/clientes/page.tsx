'use client';

import { useEffect, useState } from 'react';
import type { Cliente } from '@/types/comercial';
import {
  actualizarClienteAdmin,
  buscarClientesAdmin,
  crearClienteAdmin,
  desactivarClienteAdmin,
  reactivarClienteAdmin,
  resumenClienteAdmin,
  type ResumenClienteAdmin,
} from '@/services/adminService';
import { money } from '@/lib/utils/format';

const clienteVacio: Cliente = {
  id: '',
  razon_social: '',
  ruc: '',
  direccion: '',
  ciudad: '',
  contacto: '',
  telefono: '',
  correo: '',
  condicion_pago: 'Contado',
  estado: 'activo',
};

const resumenVacio: ResumenClienteAdmin = {
  cotizaciones: 0,
  monto_total: 0,
  ultima_fecha: null,
  ultima_numero: null,
};

function fechaCorta(fecha?: string | null) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminClientesPage() {
  const [termino, setTermino] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [seleccionado, setSeleccionado] = useState<Cliente | null>(null);
  const [resumen, setResumen] = useState<ResumenClienteAdmin>(resumenVacio);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [incluirInactivos, setIncluirInactivos] = useState(false);

  async function cargar() {
    setLoading(true);
    setError('');
    try {
      setClientes(await buscarClientesAdmin(termino, incluirInactivos));
    } catch (err: any) {
      setError(err?.message || 'Error cargando clientes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incluirInactivos]);

  async function seleccionar(cliente: Cliente) {
    setSeleccionado(cliente);
    setMensaje('');
    setError('');
    try {
      setResumen(await resumenClienteAdmin(cliente));
    } catch (err) {
      console.error(err);
      setResumen(resumenVacio);
    }
  }

  function nuevoCliente() {
    setSeleccionado({ ...clienteVacio });
    setResumen(resumenVacio);
    setMensaje('');
    setError('');
  }

  function cambiar<K extends keyof Cliente>(campo: K, valor: Cliente[K]) {
    setSeleccionado((actual) => (actual ? { ...actual, [campo]: valor } : actual));
  }

  async function guardar() {
    if (!seleccionado) return;
    setMensaje('');
    setError('');

    const ruc = (seleccionado.ruc || '').trim();
    if (ruc && !/^\d{11}$/.test(ruc)) {
      setError('El RUC debe tener 11 dígitos numéricos.');
      return;
    }

    setGuardando(true);
    try {
      const actualizado = seleccionado.id
        ? await actualizarClienteAdmin(seleccionado)
        : await crearClienteAdmin(seleccionado);

      setSeleccionado(actualizado);
      setResumen(await resumenClienteAdmin(actualizado));
      setClientes((actuales) => {
        const existe = actuales.some((c) => c.id === actualizado.id);
        if (existe) return actuales.map((c) => (c.id === actualizado.id ? actualizado : c));
        return [actualizado, ...actuales];
      });
      setMensaje(seleccionado.id ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.');
    } catch (err: any) {
      setError(err?.message || 'Error guardando cliente');
    } finally {
      setGuardando(false);
    }
  }

  async function desactivar() {
    if (!seleccionado?.id) return;
    if (!confirm('¿Deseas desactivar este cliente? No se eliminará, solo quedará oculto para uso normal.')) return;

    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      await desactivarClienteAdmin(seleccionado.id);
      const actualizado = { ...seleccionado, estado: 'inactivo' };
      setSeleccionado(actualizado);
      setClientes((actuales) => (incluirInactivos ? actuales.map((c) => (c.id === actualizado.id ? actualizado : c)) : actuales.filter((c) => c.id !== actualizado.id)));
      setMensaje('Cliente desactivado correctamente.');
    } catch (err: any) {
      setError(err?.message || 'Error desactivando cliente');
    } finally {
      setGuardando(false);
    }
  }

  async function reactivar() {
    if (!seleccionado?.id) return;
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      const actualizado = await reactivarClienteAdmin(seleccionado.id);
      setSeleccionado(actualizado);
      setClientes((actuales) => actuales.map((c) => (c.id === actualizado.id ? actualizado : c)));
      setMensaje('Cliente reactivado correctamente.');
    } catch (err: any) {
      setError(err?.message || 'Error reactivando cliente');
    } finally {
      setGuardando(false);
    }
  }

  const esNuevo = seleccionado && !seleccionado.id;
  const estaInactivo = seleccionado?.estado === 'inactivo';

  return (
    <main className="min-h-screen bg-[#020617] text-white p-6 lg:p-10">
      <section className="max-w-7xl mx-auto">
        <div className="flex justify-between gap-4 items-start">
          <div>
            <p className="tracking-[0.5em] text-cyan-400 text-sm font-bold">JALESS ONE</p>
            <h1 className="text-4xl font-bold mt-3">Administrar clientes</h1>
            <p className="mt-2 text-slate-300">Crear, editar, desactivar y revisar información comercial de clientes.</p>
          </div>
          <a href="/admin" className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl px-5 py-3 font-bold">Volver</a>
        </div>

        <div className="mt-6 bg-slate-900 border border-slate-700 rounded-2xl p-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <input value={termino} onChange={(e) => setTermino(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && cargar()} placeholder="Buscar por razón social, RUC o ciudad" className="flex-1 bg-slate-950 border border-slate-600 rounded-xl px-4 py-3" />
            <button onClick={cargar} className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-3 rounded-xl">{loading ? 'Buscando...' : 'Buscar'}</button>
            <button onClick={nuevoCliente} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-xl">+ Nuevo cliente</button>
          </div>
          <label className="mt-4 inline-flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={incluirInactivos} onChange={(e) => setIncluirInactivos(e.target.checked)} />
            Mostrar clientes inactivos
          </label>
        </div>

        {error && <div className="mt-4 border border-red-500 bg-red-950/40 text-red-200 rounded-xl p-3">{error}</div>}
        {mensaje && <div className="mt-4 border border-emerald-500 bg-emerald-950/40 text-emerald-200 rounded-xl p-3">{mensaje}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 mt-6">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-h-[740px] overflow-auto">
            <h2 className="text-2xl font-bold">Clientes</h2>
            <div className="text-sm text-slate-400 mt-1">{clientes.length} registros mostrados</div>
            <div className="space-y-3 mt-4">
              {clientes.map((cliente) => (
                <button key={cliente.id} onClick={() => seleccionar(cliente)} className={`w-full text-left rounded-xl border p-4 ${seleccionado?.id === cliente.id ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-700 bg-slate-950 hover:border-slate-500'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-bold text-cyan-300">{cliente.razon_social}</div>
                    {cliente.estado === 'inactivo' && <span className="text-[10px] rounded-full bg-red-900/50 border border-red-500 px-2 py-1 text-red-200">INACTIVO</span>}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">RUC: {cliente.ruc || '-'}</div>
                  <div className="text-xs text-slate-400">{cliente.ciudad || ''}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Detalle</h2>
                {seleccionado && <p className="text-sm text-slate-400 mt-1">{esNuevo ? 'Nuevo cliente comercial' : 'Ficha comercial del cliente'}</p>}
              </div>
              {seleccionado && (
                <span className={`text-xs rounded-full px-3 py-2 border ${estaInactivo ? 'bg-red-950/40 border-red-500 text-red-200' : 'bg-emerald-950/40 border-emerald-500 text-emerald-200'}`}>
                  {estaInactivo ? 'Inactivo' : 'Activo'}
                </span>
              )}
            </div>

            {!seleccionado && <p className="text-slate-400 mt-4">Selecciona un cliente para editarlo o presiona “Nuevo cliente”.</p>}

            {seleccionado && (
              <>
                {!esNuevo && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
                    <div className="bg-slate-950 border border-slate-700 rounded-xl p-4">
                      <div className="text-xs text-slate-400">Cotizaciones</div>
                      <div className="text-2xl font-bold text-cyan-300 mt-1">{resumen.cotizaciones}</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-700 rounded-xl p-4">
                      <div className="text-xs text-slate-400">Monto cotizado</div>
                      <div className="text-2xl font-bold text-cyan-300 mt-1">{money(resumen.monto_total)}</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-700 rounded-xl p-4">
                      <div className="text-xs text-slate-400">Última cotización</div>
                      <div className="text-sm font-bold text-cyan-300 mt-1">{resumen.ultima_numero || '-'}</div>
                      <div className="text-xs text-slate-400 mt-1">{fechaCorta(resumen.ultima_fecha)}</div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <label className="md:col-span-2 text-sm font-bold">Razón social<input value={seleccionado.razon_social} onChange={(e) => cambiar('razon_social', e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3" /></label>
                  <label className="text-sm font-bold">RUC<input value={seleccionado.ruc || ''} maxLength={11} onChange={(e) => cambiar('ruc', e.target.value.replace(/\D/g, ''))} placeholder="11 dígitos" className="mt-2 w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3" /></label>
                  <label className="text-sm font-bold">Ciudad<input value={seleccionado.ciudad || ''} onChange={(e) => cambiar('ciudad', e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3" /></label>
                  <label className="md:col-span-2 text-sm font-bold">Dirección<input value={seleccionado.direccion || ''} onChange={(e) => cambiar('direccion', e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3" /></label>
                  <label className="text-sm font-bold">Contacto<input value={seleccionado.contacto || ''} onChange={(e) => cambiar('contacto', e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3" /></label>
                  <label className="text-sm font-bold">Teléfono<input value={seleccionado.telefono || ''} onChange={(e) => cambiar('telefono', e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3" /></label>
                  <label className="text-sm font-bold">Correo<input value={seleccionado.correo || ''} onChange={(e) => cambiar('correo', e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3" /></label>
                  <label className="text-sm font-bold">Condición de pago<input value={seleccionado.condicion_pago || 'Contado'} onChange={(e) => cambiar('condicion_pago', e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3" /></label>
                  <div className="md:col-span-2 flex flex-wrap gap-3 mt-3">
                    <button onClick={guardar} disabled={guardando} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-bold px-6 py-3 rounded-xl">{guardando ? 'Guardando...' : esNuevo ? 'Crear cliente' : 'Guardar cambios'}</button>
                    {!esNuevo && <a href={`/admin/descuentos?cliente=${seleccionado.id}`} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-xl">Editar descuentos</a>}
                    {!esNuevo && !estaInactivo && <button onClick={desactivar} disabled={guardando} className="bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl">Desactivar</button>}
                    {!esNuevo && estaInactivo && <button onClick={reactivar} disabled={guardando} className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-black font-bold px-6 py-3 rounded-xl">Reactivar</button>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
