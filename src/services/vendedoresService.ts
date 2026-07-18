import { supabase } from '@/lib/supabase';
import type { VendedorJaless } from '@/types/comercial';

const TABLA_VENDEDORES = 'vendedores_jaless';

export type NuevoVendedor = {
  nombre: string;
  correo?: string;
  telefono?: string;
  rol: 'administrador' | 'supervisor' | 'vendedor';
  pin_codigo: string;
  estado?: 'activo' | 'inactivo';
};

export type ActualizarVendedor = {
  nombre: string;
  correo?: string;
  telefono?: string;
  rol: 'administrador' | 'supervisor' | 'vendedor';
  pin_codigo?: string;
  estado: 'activo' | 'inactivo';
};

async function leerRespuesta<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || `Error de comunicación (${response.status}).`);
  }
  return payload as T;
}

export async function listarVendedores(): Promise<VendedorJaless[]> {
  const response = await fetch('/api/vendedores', {
    method: 'GET',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  return leerRespuesta<VendedorJaless[]>(response);
}

export async function loginVendedor(
  vendedorId: string,
  pin: string
): Promise<VendedorJaless> {
  const response = await fetch('/api/vendedores', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ vendedorId, pin: String(pin || '').trim() }),
  });
  return leerRespuesta<VendedorJaless>(response);
}

export async function crearVendedor(vendedor: NuevoVendedor): Promise<VendedorJaless> {
  const nombre = vendedor.nombre.trim();
  const pin = vendedor.pin_codigo.trim();

  if (!nombre) throw new Error('El nombre del vendedor es obligatorio.');
  if (!/^\d{4,8}$/.test(pin)) throw new Error('El PIN debe tener entre 4 y 8 dígitos.');

  const { data, error } = await supabase
    .from(TABLA_VENDEDORES)
    .insert({
      nombre,
      correo: vendedor.correo?.trim() || null,
      telefono: vendedor.telefono?.trim() || null,
      rol: vendedor.rol,
      pin_codigo: pin,
      estado: vendedor.estado || 'activo',
      actualizado_en: new Date().toISOString(),
    })
    .select('id, nombre, correo, telefono, rol, estado, creado_en, actualizado_en')
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Ya existe un vendedor con ese nombre.');
    throw new Error(error.message);
  }

  return data as VendedorJaless;
}

export async function actualizarVendedor(
  id: string,
  cambios: ActualizarVendedor
): Promise<VendedorJaless> {
  const nombre = cambios.nombre.trim();
  const pin = cambios.pin_codigo?.trim();

  if (!id) throw new Error('Vendedor inválido.');
  if (!nombre) throw new Error('El nombre del vendedor es obligatorio.');
  if (pin && !/^\d{4,8}$/.test(pin)) throw new Error('El PIN debe tener entre 4 y 8 dígitos.');

  const payload: Record<string, unknown> = {
    nombre,
    correo: cambios.correo?.trim() || null,
    telefono: cambios.telefono?.trim() || null,
    rol: cambios.rol,
    estado: cambios.estado,
    actualizado_en: new Date().toISOString(),
  };

  if (pin) payload.pin_codigo = pin;

  const { data, error } = await supabase
    .from(TABLA_VENDEDORES)
    .update(payload)
    .eq('id', id)
    .select('id, nombre, correo, telefono, rol, estado, creado_en, actualizado_en')
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Ya existe un vendedor con ese nombre.');
    throw new Error(error.message);
  }

  return data as VendedorJaless;
}

export async function cambiarEstadoVendedor(
  id: string,
  estado: 'activo' | 'inactivo'
) {
  const { error } = await supabase
    .from(TABLA_VENDEDORES)
    .update({ estado, actualizado_en: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}
