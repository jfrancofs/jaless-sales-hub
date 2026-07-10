import { supabase } from '@/lib/supabase';
import type { VendedorJaless } from '@/types/comercial';

const TABLA_VENDEDORES = 'vendedores_jaless';

export async function listarVendedores(): Promise<VendedorJaless[]> {
  const { data, error } = await supabase
    .from(TABLA_VENDEDORES)
    .select('id, nombre, correo, telefono, rol, pin_codigo, estado')
    .eq('estado', 'activo')
    .order('nombre', { ascending: true });

  if (error) {
    throw new Error(`Error cargando vendedores: ${error.message}`);
  }

  return (data ?? []) as VendedorJaless[];
}

export async function loginVendedor(
  vendedorId: string,
  pin: string
): Promise<VendedorJaless> {
  if (!vendedorId) {
    throw new Error('Selecciona un vendedor.');
  }

  if (!pin) {
    throw new Error('Ingresa el PIN.');
  }

  const { data, error } = await supabase
    .from(TABLA_VENDEDORES)
    .select('id, nombre, correo, telefono, rol, pin_codigo, estado')
    .eq('id', vendedorId)
    .eq('estado', 'activo')
    .single();

  if (error || !data) {
    throw new Error('No se encontró el vendedor.');
  }

  if (String(data.pin_codigo) !== String(pin)) {
    throw new Error('PIN incorrecto.');
  }

  return data as VendedorJaless;
}