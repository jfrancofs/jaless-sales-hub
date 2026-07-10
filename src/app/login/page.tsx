'use client';

import { useEffect, useState } from 'react';
import { guardarVendedorSesion } from '@/lib/auth/vendedorSession';
import {
  listarVendedores,
  loginVendedor,
} from '@/services/vendedoresService';
import type { VendedorJaless } from '@/types/comercial';

export default function LoginPage() {
  const [vendedores, setVendedores] = useState<VendedorJaless[]>([]);
  const [vendedorId, setVendedorId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargarVendedores() {
      try {
        setError('');

        const data = await listarVendedores();
        const activos = data.filter(
          (vendedor) => vendedor.estado !== 'inactivo'
        );

        setVendedores(activos);

        if (activos.length > 0) {
          setVendedorId(activos[0].id);
        }
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo cargar la lista de vendedores.'
        );
      }
    }

    cargarVendedores();
  }, []);

  async function ingresar() {
    if (!vendedorId) {
      setError('Selecciona un vendedor.');
      return;
    }

    if (!pin) {
      setError('Ingresa el PIN.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const vendedor = await loginVendedor(vendedorId, pin);

      guardarVendedorSesion({
        id: vendedor.id,
        nombre: vendedor.nombre,
        correo: vendedor.correo,
        telefono: vendedor.telefono,
        rol: vendedor.rol,
      });

      window.location.href = '/cotizador';
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] p-6 text-white lg:p-10 flex items-center justify-center">
      <section className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
        <p className="text-sm font-bold tracking-[0.5em] text-cyan-400">
          JALESS ONE
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Ingreso de vendedores
        </h1>

        <p className="mt-2 text-slate-300">
          Identifica al vendedor antes de generar cotizaciones.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-500 bg-red-950/40 p-4 text-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold">
              Vendedor
            </label>

            <select
              value={vendedorId}
              onChange={(event) => setVendedorId(event.target.value)}
              className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3"
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
            <label className="mb-2 block text-sm font-bold">
              PIN
            </label>

            <input
              value={pin}
              onChange={(event) =>
                setPin(
                  event.target.value
                    .replace(/\D/g, '')
                    .slice(0, 8)
                )
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  ingresar();
                }
              }}
              className="w-full rounded-xl border border-slate-600 bg-slate-950 px-4 py-3"
              type="password"
              inputMode="numeric"
              placeholder="PIN del vendedor"
            />
          </div>

          <button
            type="button"
            onClick={ingresar}
            disabled={loading || vendedores.length === 0}
            className="w-full rounded-xl bg-cyan-500 px-6 py-4 font-bold text-black hover:bg-cyan-400 disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>

        <div className="mt-5 text-xs text-slate-400">
          PIN inicial del administrador: <b>1234</b>.
        </div>
      </section>
    </main>
  );
}