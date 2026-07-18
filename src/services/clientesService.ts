import { supabase } from '@/lib/supabase';
import type { Cliente } from '@/types/comercial';

export type ClienteInput = {
  razon_social: string;
  ruc?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  correo?: string | null;
  condicion_pago?: string | null;
};

export const CATEGORIAS_DESCUENTO = [
  "O'Rings",
  'Abrazaderas',
  'Seguros',
  'Cordones',
  'Bonded Seal',
  'Pines de Expansión',
  'Billas de Acero',
  'Pasadores de Horquilla',
];

export async function listarClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes_comerciales')
    .select('id, razon_social, ruc, direccion, ciudad, contacto, telefono, correo, condicion_pago')
    .order('razon_social', { ascending: true });

  if (error) throw error;
  return (data || []) as Cliente[];
}

export async function guardarCliente(input: ClienteInput): Promise<Cliente> {
  const razon_social = input.razon_social.trim().toUpperCase();
  if (!razon_social) throw new Error('La razón social es obligatoria.');

  const payload = {
    razon_social,
    ruc: input.ruc?.trim() || null,
    direccion: input.direccion?.trim().toUpperCase() || null,
    ciudad: input.ciudad?.trim().toUpperCase() || null,
    contacto: input.contacto?.trim() || null,
    telefono: input.telefono?.trim() || null,
    correo: input.correo?.trim() || null,
    condicion_pago: input.condicion_pago?.trim() || 'Contado',
    estado: 'activo',
  };

  const { data, error } = await supabase
    .from('clientes_comerciales')
    .insert(payload)
    .select('id, razon_social, ruc, direccion, ciudad, contacto, telefono, correo, condicion_pago')
    .single();

  if (error) throw error;
  return data as Cliente;
}

export async function obtenerDescuentosCliente(clienteId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('descuentos_categoria_cliente')
    .select('categoria, porcentaje')
    .eq('cliente_id', clienteId);

  if (error) throw error;

  const map: Record<string, number> = {};
  (data || []).forEach((row: any) => {
    map[row.categoria] = Number(row.porcentaje) || 0;
  });
  return map;
}

export async function guardarDescuentosCliente(clienteId: string, descuentos: Record<string, number>) {
  const filas = CATEGORIAS_DESCUENTO.map((categoria) => ({
    cliente_id: clienteId,
    categoria,
    porcentaje: Number(descuentos[categoria] || 0),
  }));

  const { error } = await supabase
    .from('descuentos_categoria_cliente')
    .upsert(filas, { onConflict: 'cliente_id,categoria' });

  if (error) throw error;
}
