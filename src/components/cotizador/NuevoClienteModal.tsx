'use client';

import { useState } from 'react';
import type { Cliente } from '@/types/comercial';
import { guardarCliente } from '@/services/clientesService';

type Props = {
  open: boolean;
  onClose: () => void;
  onGuardado: (cliente: Cliente) => void;
};

export function NuevoClienteModal({ open, onClose, onGuardado }: Props) {
  const [form, setForm] = useState({
    razon_social: '',
    ruc: '',
    direccion: '',
    ciudad: '',
    contacto: '',
    telefono: '',
    correo: '',
    condicion_pago: 'Contado',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  function setField(field: keyof typeof form, value: string) {
    setForm((actual) => ({ ...actual, [field]: value }));
  }

  async function guardar() {
    setLoading(true);
    setError('');
    try {
      const cliente = await guardarCliente(form);
      onGuardado(cliente);
      setForm({ razon_social: '', ruc: '', direccion: '', ciudad: '', contacto: '', telefono: '', correo: '', condicion_pago: 'Contado' });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'No se pudo guardar el cliente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Nuevo cliente</h2>
          <button onClick={onClose} className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2">Cerrar</button>
        </div>
        <p className="text-sm text-slate-300 mt-2">Guarda un cliente nuevo para usarlo inmediatamente en la cotización.</p>
        {error && <div className="mt-4 rounded-xl border border-red-500 bg-red-950/40 p-3 text-red-200">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <label className="md:col-span-2 text-sm font-bold">Razón social
            <input value={form.razon_social} onChange={(e) => setField('razon_social', e.target.value)} className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-600 px-3 py-3" />
          </label>
          <label className="text-sm font-bold">RUC
            <input value={form.ruc} onChange={(e) => setField('ruc', e.target.value)} className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-600 px-3 py-3" />
          </label>
          <label className="text-sm font-bold">Ciudad
            <input value={form.ciudad} onChange={(e) => setField('ciudad', e.target.value)} className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-600 px-3 py-3" />
          </label>
          <label className="md:col-span-2 text-sm font-bold">Dirección
            <input value={form.direccion} onChange={(e) => setField('direccion', e.target.value)} className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-600 px-3 py-3" />
          </label>
          <label className="text-sm font-bold">Contacto
            <input value={form.contacto} onChange={(e) => setField('contacto', e.target.value)} className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-600 px-3 py-3" />
          </label>
          <label className="text-sm font-bold">Teléfono
            <input value={form.telefono} onChange={(e) => setField('telefono', e.target.value)} className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-600 px-3 py-3" />
          </label>
          <label className="text-sm font-bold">Correo
            <input value={form.correo} onChange={(e) => setField('correo', e.target.value)} className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-600 px-3 py-3" />
          </label>
          <label className="text-sm font-bold">Condición de pago
            <input value={form.condicion_pago} onChange={(e) => setField('condicion_pago', e.target.value)} className="mt-2 w-full rounded-lg bg-slate-950 border border-slate-600 px-3 py-3" />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl bg-slate-800 hover:bg-slate-700 px-5 py-3 font-bold">Cancelar</button>
          <button onClick={guardar} disabled={loading} className="rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-black px-5 py-3 font-bold">
            {loading ? 'Guardando...' : 'Guardar cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}
