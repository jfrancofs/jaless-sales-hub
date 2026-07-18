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

export type ProductoFrecuenteCliente = {
  codigo: string;
  descripcion: string;
  categoria: string;
  cantidad_total: number;
  monto_total: number;
  veces_cotizado: number;
};

export type FichaClienteAdmin = {
  resumen: ResumenClienteAdmin;
  descuentos: Record<string, number>;
  cotizaciones: CotizacionGuardada[];
  productosFrecuentes: ProductoFrecuenteCliente[];
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

async function listarCotizacionesCliente(cliente: Cliente, limite = 30): Promise<CotizacionGuardada[]> {
  const resultados = new Map<string, CotizacionGuardada>();

  if (cliente.id) {
    const { data, error } = await supabase
      .from('cotizaciones_jaless')
      .select('*')
      .eq('cliente_id', cliente.id)
      .order('fecha', { ascending: false })
      .limit(limite);

    if (error) throw error;
    for (const row of (data || []) as CotizacionGuardada[]) resultados.set(row.id, row);
  }

  if (cliente.ruc) {
    const { data, error } = await supabase
      .from('cotizaciones_jaless')
      .select('*')
      .eq('cliente_ruc', cliente.ruc)
      .order('fecha', { ascending: false })
      .limit(limite);

    if (error) throw error;
    for (const row of (data || []) as CotizacionGuardada[]) resultados.set(row.id, row);
  }

  return Array.from(resultados.values())
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, limite);
}

export async function resumenClienteAdmin(cliente: Cliente): Promise<ResumenClienteAdmin> {
  if (!cliente.id && !cliente.ruc) {
    return { cotizaciones: 0, monto_total: 0, ultima_fecha: null, ultima_numero: null };
  }

  const cotizaciones = await listarCotizacionesCliente(cliente, 100);
  const monto_total = cotizaciones.reduce((acc, c) => acc + Number(c.total || 0), 0);
  const ultima = cotizaciones[0];

  return {
    cotizaciones: cotizaciones.length,
    monto_total,
    ultima_fecha: ultima?.fecha || null,
    ultima_numero: ultima?.numero || null,
  };
}

export async function obtenerFichaClienteAdmin(cliente: Cliente): Promise<FichaClienteAdmin> {
  const cotizaciones = await listarCotizacionesCliente(cliente, 30);
  const resumen: ResumenClienteAdmin = {
    cotizaciones: cotizaciones.length,
    monto_total: cotizaciones.reduce((acc, c) => acc + Number(c.total || 0), 0),
    ultima_fecha: cotizaciones[0]?.fecha || null,
    ultima_numero: cotizaciones[0]?.numero || null,
  };

  const descuentos: Record<string, number> = {};
  for (const categoria of CATEGORIAS_DESCUENTO) descuentos[categoria] = 0;

  if (cliente.id) {
    const { data, error } = await supabase
      .from('descuentos_categoria_cliente')
      .select('categoria, porcentaje')
      .eq('cliente_id', cliente.id);

    if (error) throw error;
    for (const row of data || []) descuentos[row.categoria] = Number(row.porcentaje) || 0;
  }

  const productosFrecuentes: ProductoFrecuenteCliente[] = [];
  const idsCotizaciones = cotizaciones.map((c) => c.id).filter(Boolean);

  if (idsCotizaciones.length > 0) {
    const { data, error } = await supabase
      .from('cotizacion_detalle_jaless')
      .select('cotizacion_id, codigo, descripcion, categoria, cantidad, total')
      .in('cotizacion_id', idsCotizaciones);

    if (error) throw error;

    const acumulado = new Map<string, ProductoFrecuenteCliente & { cotizaciones: Set<string> }>();
    for (const row of data || []) {
      const key = String(row.codigo || row.descripcion || '').trim();
      if (!key) continue;
      const actual = acumulado.get(key) || {
        codigo: row.codigo || '-',
        descripcion: row.descripcion || 'Sin descripción',
        categoria: row.categoria || '',
        cantidad_total: 0,
        monto_total: 0,
        veces_cotizado: 0,
        cotizaciones: new Set<string>(),
      };
      actual.cantidad_total += Number(row.cantidad || 0);
      actual.monto_total += Number(row.total || 0);
      actual.cotizaciones.add(String(row.cotizacion_id));
      actual.veces_cotizado = actual.cotizaciones.size;
      acumulado.set(key, actual);
    }

    productosFrecuentes.push(
      ...Array.from(acumulado.values())
        .sort((a, b) => b.veces_cotizado - a.veces_cotizado || b.monto_total - a.monto_total)
        .slice(0, 10)
        .map(({ cotizaciones: _cotizaciones, ...item }) => item)
    );
  }

  return { resumen, descuentos, cotizaciones, productosFrecuentes };
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
