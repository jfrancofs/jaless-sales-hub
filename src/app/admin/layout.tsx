'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  obtenerVendedorSesion,
  puedeVerAdministracion,
} from '@/lib/auth/vendedorSession';

type Props = {
  children: ReactNode;
};

export default function AdminLayout({ children }: Props) {
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    const vendedor = obtenerVendedorSesion();

    if (!vendedor) {
      window.location.replace('/login');
      return;
    }

    if (!puedeVerAdministracion(vendedor)) {
      window.location.replace('/cotizador');
      return;
    }

    setAutorizado(true);
  }, []);

  if (!autorizado) {
    return (
      <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-6">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 px-6 py-5 text-slate-300">
          Validando permisos de administración...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
