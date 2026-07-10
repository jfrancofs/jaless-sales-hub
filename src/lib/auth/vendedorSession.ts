import type { VendedorJaless } from '@/types/comercial';

const STORAGE_KEY = 'jaless_vendedor_activo';

export type VendedorSesion = Pick<VendedorJaless, 'id' | 'nombre' | 'correo' | 'telefono' | 'rol'>;

export function obtenerVendedorSesion(): VendedorSesion | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VendedorSesion) : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function guardarVendedorSesion(vendedor: VendedorSesion) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vendedor));
}

export function cerrarVendedorSesion() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
