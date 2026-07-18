'use client';

import { useMemo, useState } from 'react';
import { guardarVendedorSesion } from '@/lib/auth/vendedorSession';
import type { VendedorJaless } from '@/types/comercial';

type Props = {
  vendedoresIniciales: VendedorJaless[];
  errorInicial?: string;
};

type ApiError = {
  error?: string;
};

async function leerJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & ApiError;

  if (!response.ok) {
    throw new Error(payload.error || `Error del servidor (${response.status}).`);
  }

  return payload as T;
}

export default function LoginForm({
  vendedoresIniciales,
  errorInicial = '',
}: Props) {
  const vendedores = useMemo(
    () =>
      (vendedoresIniciales || []).filter(
        (vendedor) => vendedor.estado !== 'inactivo'
      ),
    [vendedoresIniciales]
  );

  const [vendedorId, setVendedorId] = useState(vendedores[0]?.id || '');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(errorInicial);

  async function ingresar() {
    if (!vendedorId) {
      setError('Selecciona un vendedor.');
      return;
    }

    if (!pin.trim()) {
      setError('Ingresa el PIN.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);

      const response = await fetch('/api/vendedores', {
        method: 'POST',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          vendedorId,
          pin: pin.trim(),
        }),
      });

      window.clearTimeout(timeout);

      const vendedor = await leerJson<VendedorJaless>(response);

      guardarVendedorSesion({
        id: vendedor.id,
        nombre: vendedor.nombre,
        correo: vendedor.correo,
        telefono: vendedor.telefono,
        rol: vendedor.rol,
      });

      window.location.replace('/cotizador');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setError('La validación demoró demasiado. Intenta nuevamente.');
      } else {
        setError(
          error instanceof Error ? error.message : 'No se pudo iniciar sesión.'
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white p-6 lg:p-10 flex items-center justify-center">
      <section className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl">
        <p className="tracking-[0.5em] text-cyan-400 text-sm font-bold">
          JALESS ONE
        </p>

        <h1 className="text-4xl font-bold mt-3">Ingreso de vendedores</h1>

        <p className="text-slate-300 mt-2">
          Identifica al vendedor antes de generar cotizaciones.
        </p>

        {error && (
          <div className="mt-5 border border-red-500 bg-red-950/40 text-red-200 rounded-xl p-4">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Vendedor</label>

            <select
              value={vendedorId}
              onChange={(event) => setVendedorId(event.target.value)}
              disabled={vendedores.length === 0}
              className="w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3 disabled:opacity-60"
            >
              {vendedores.length === 0 && (
                <option value="">No hay vendedores disponibles</option>
              )}

              {vendedores.map((vendedor) => (
                <option key={vendedor.id} value={vendedor.id}>
                  {vendedor.nombre} — {vendedor.rol}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">PIN</label>

            <input
              value={pin}
              onChange={(event) =>
                setPin(event.target.value.replace(/\D/g, '').slice(0, 8))
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') ingresar();
              }}
              disabled={vendedores.length === 0}
              className="w-full bg-slate-950 border border-slate-600 rounded-xl px-4 py-3 disabled:opacity-60"
              type="password"
              placeholder="PIN del vendedor"
            />
          </div>

          <button
            type="button"
            onClick={ingresar}
            disabled={loading || vendedores.length === 0 || !vendedorId}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold px-6 py-4 rounded-xl"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>
      </section>
    </main>
  );
}
