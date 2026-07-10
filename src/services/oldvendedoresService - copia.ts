import { supabase } from '@/lib/supabase';
import type { VendedorJaless } from '@/types/comercial';

export type NuevoVendedor = {
  nombre: string;
  correo?: string;
  telefono?: string;
  rol: 'administrador' | 'supervisor' | 'vendedor';
  pin_codigo: string;
  estado?: string;
};

export async function listarVendedores(): Promise<VendedorJaless[]> {
  const { data, error } = await supabase
    .from('vendedores_jaless')
    .select('id, nombre, correo, telefono, rol, estado, creado_en')
    .order('nombre', { ascending: true });

  if (error) throw error;
  return (data || []) as VendedorJaless[];
}

export async function loginVendedor(vendedorId: string, pin: string): Promise<VendedorJaless> {
  const pinLimpio = String(pin || '').trim();
  if (!vendedorId) throw new Error('Selecciona un vendedor.');
  if (!pinLimpio) throw new Error('Ingresa el PIN.');

  const { data, error } = await supabase
    .from('vendedores_jaless')
    .select('id, nombre, correo, telefono, rol, estado')
    .eq('id', vendedorId)
    .eq('pin_codigo', pinLimpio)
    .eq('estado', 'activo')
    .single();

  if (error || !data) throw new Error('Vendedor o PIN incorrecto.');
  return data as VendedorJaless;
}

export async function crearVendedor(vendedor: NuevoVendedor): Promise<VendedorJaless> {
  const nombre = vendedor.nombre.trim();
  const pin = vendedor.pin_codigo.trim();
  if (!nombre) throw new Error('El nombre del vendedor es obligatorio.');
  if (pin.length < 4) throw new Error('El PIN debe tener al menos 4 dígitos.');

  const { data, error } = await supabase
    .from('vendedores_jaless')
    .insert({
      nombre,
      correo: vendedor.correo?.trim() || null,
      telefono: vendedor.telefono?.trim() || null,
      rol: vendedor.rol,
      pin_codigo: pin,
      estado: vendedor.estado || 'activo',
    })
    .select('id, nombre, correo, telefono, rol, estado, creado_en')
    .single();

  if (error) throw error;
  return data as VendedorJaless;
}

export async function cambiarEstadoVendedor(id: string, estado: 'activo' | 'inactivo') {
  const { error } = await supabase.from('vendedores_jaless').update({ estado }).eq('id', id);
  if (error) throw error;
}
