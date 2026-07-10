'use client';

import { useEffect, useState } from 'react';
import { cerrarVendedorSesion, obtenerVendedorSesion, type VendedorSesion } from '@/lib/auth/vendedorSession';

export function VendedorBar() {
  const [vendedor, setVendedor] = useState<VendedorSesion | null>(null);

  useEffect(() => {
    setVendedor(obtenerVendedorSesion());
  }, []);

  if (!vendedor) {
    return (
      <div className="mt-4 rounded-xl border border-yellow-500/50 bg-yellow-950/30 text-yellow-200 px-4 py-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <span>No hay vendedor identificado. Las cotizaciones se guardarán como JALESS.</span>
        <a href="/login" className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 py-2 rounded-lg text-center">Ingresar vendedor</a>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <span className="text-slate-400">Vendedor activo: </span>
        <b className="text-cyan-300">{vendedor.nombre}</b>
        <span className="text-slate-500"> · {vendedor.rol}</span>
      </div>
      <button
        onClick={() => {
          cerrarVendedorSesion();
          window.location.href = '/login';
        }}
        className="bg-slate-800 hover:bg-slate-700 border border-slate-600 font-bold px-4 py-2 rounded-lg"
      >
        Cambiar vendedor
      </button>
    </div>
  );
}
