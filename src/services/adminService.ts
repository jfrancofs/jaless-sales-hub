import { supabase } from '@/lib/supabase';
import type { Cliente, CotizacionGuardada } from '@/types/comercial';
import { CATEGORIAS_DESCUENTO, type ClienteInput } from '@/services/clientesService';

export type ProductoAdmin = {
  id?: string;
  codigo: string;
  descripcion: string;
  categoria: string;
  material?: string | null;
  tipo?: string | null;
  medida?: string | null;
  precio_usd_sin_igv: number | string;
  clave_busqueda?: string | null;
};

export type ResumenClienteAdmin = {
  cotizaciones: number;
  monto_total: number;
  ultima_fecha: string | null;
  ultima_numero: string | null;
};

const CLIENTE_SELECT = 'id, razon_social, ruc, direccion, ciudad, contacto, telefono, correo, condicion_pago, estado';

export async function resumenAdmin() {
  const [clientes, productos, cotizaciones] = await Promise.all([
    supabase.from('clientes_comerciales').select('id', { count: 'exact', head: true }).eq('estado', 'activo'),
    supabase.from('productos_catalogo').select('codigo', { count: 'exact', head: true }),
    supabase.from('cotizaciones_jaless').select('id', { count: 'exact', head: true }),
  ]);

  return {
    clientes: clientes.count || 0,
    productos: productos.count || 0,
    cotizaciones: cotizaciones.count || 0,
  };
}

export async function buscarClientesAdmin(termino: string, incluirInactivos = false): Promise<Cliente[]> {
  const q = termino.trim();
  let query = supabase
    .from('clientes_comerciales')
    .select(CLIENTE_SELECT)
    .order('razon_social', { ascending: true })
    .limit(120);

  if (!incluirInactivos) {
    query = query.or('estado.eq.activo,estado.is.null');
  }

  if (q) {
    query = query.or(`razon_social.ilike.%${q}%,ruc.ilike.%${q}%,ciudad.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Cliente[];
}

function prepararClientePayload(cliente: Cliente | ClienteInput) {
  return {
    razon_social: (cliente.razon_social || '').trim().toUpperCase(),
    ruc: cliente.ruc?.trim() || null,
    direccion: cliente.direccion?.trim().toUpperCase() || null,
    ciudad: cliente.ciudad?.trim().toUpperCase() || null,
    contacto: cliente.contacto?.trim() || null,
    telefono: cliente.telefono?.trim() || null,
    correo: cliente.correo?.trim() || null,
    condicion_pago: cliente.condicion_pago?.trim() || 'Contado',
    estado: 'activo',
  };
}

export async function crearClienteAdmin(cliente: ClienteInput): Promise<Cliente> {
  const payload = prepararClientePayload(cliente);
  if (!payload.razon_social) throw new Error('La razón social es obligatoria.');
  if (payload.ruc && !/^\d{11}$/.test(payload.ruc)) throw new Error('El RUC debe tener 11 dígitos numéricos.');

  const { data, error } = await supabase
    .from('clientes_comerciales')
    .insert(payload)
    .select(CLIENTE_SELECT)
    .single();

  if (error) throw error;
  return data as Cliente;
}

export async function actualizarClienteAdmin(cliente: Cliente): Promise<Cliente> {
  if (!cliente.id) throw new Error('Cliente inválido.');
  const payload = prepararClientePayload(cliente);
  if (!payload.razon_social) throw new Error('La razón social es obligatoria.');
  if (payload.ruc && !/^\d{11}$/.test(payload.ruc)) throw new Error('El RUC debe tener 11 dígitos numéricos.');

  const { data, error } = await supabase
    .from('clientes_comerciales')
    .update(payload)
    .eq('id', cliente.id)
    .select(CLIENTE_SELECT)
    .single();

  if (error) throw error;
  return data as Cliente;
}

export async function desactivarClienteAdmin(clienteId: string): Promise<void> {
  const { error } = await supabase
    .from('clientes_comerciales')
    .update({ estado: 'inactivo' })
    .eq('id', clienteId);

  if (error) throw error;
}

export async function reactivarClienteAdmin(clienteId: string): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes_comerciales')
    .update({ estado: 'activo' })
    .eq('id', clienteId)
    .select(CLIENTE_SELECT)
    .single();

  if (error) throw error;
  return data as Cliente;
}

export async function resumenClienteAdmin(cliente: Cliente): Promise<ResumenClienteAdmin> {
  if (!cliente.id && !cliente.ruc) {
    return { cotizaciones: 0, monto_total: 0, ultima_fecha: null, ultima_numero: null };
  }

  let query = supabase
    .from('cotizaciones_jaless')
    .select('numero, fecha, total, cliente_id, cliente_ruc')
    .order('fecha', { ascending: false })
    .limit(100);

  if (cliente.id) {
    query = query.eq('cliente_id', cliente.id);
  } else if (cliente.ruc) {
    query = query.eq('cliente_ruc', cliente.ruc);
  }

  const { data, error } = await query;
  if (error) throw error;

  const cotizaciones = (data || []) as Pick<CotizacionGuardada, 'numero' | 'fecha' | 'total'>[];
  const monto_total = cotizaciones.reduce((acc, c) => acc + Number(c.total || 0), 0);
  const ultima = cotizaciones[0];

  return {
    cotizaciones: cotizaciones.length,
    monto_total,
    ultima_fecha: ultima?.fecha || null,
    ultima_numero: ultima?.numero || null,
  };
}

export async function buscarProductosAdmin(termino: string): Promise<ProductoAdmin[]> {
  const q = termino.trim();
  let query = supabase
    .from('productos_catalogo')
    .select('id, codigo, descripcion, categoria, material, tipo, medida, precio_usd_sin_igv, clave_busqueda')
    .order('codigo', { ascending: true })
    .limit(120);

  if (q) {
    query = query.or(`codigo.ilike.%${q}%,descripcion.ilike.%${q}%,categoria.ilike.%${q}%,clave_busqueda.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ProductoAdmin[];
}

export async function actualizarPrecioProducto(codigo: string, precio: number) {
  const { error } = await supabase
    .from('productos_catalogo')
    .update({ precio_usd_sin_igv: precio, actualizado_en: new Date().toISOString() })
    .eq('codigo', codigo);

  if (error) throw error;
}

export const DESCUENTOS_ESTANDAR: Record<string, number> = {
  "O'Rings": 20,
  Abrazaderas: 10,
  Seguros: 15,
  Cordones: 0,
  'Bonded Seal': 0,
  'Pines de Expansión': 15,
  'Billas de Acero': 15,
  'Pasadores de Horquilla': 15,
};

export { CATEGORIAS_DESCUENTO };
