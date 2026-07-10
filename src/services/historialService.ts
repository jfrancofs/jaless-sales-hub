import { supabase } from '@/lib/supabase';
import type { Cliente, ResultadoCotizacion, TotalesCotizacion, CotizacionGuardada, CotizacionDetalleGuardada } from '@/types/comercial';

export type GuardarCotizacionParams = {
  numero: string;
  cliente: Cliente | null;
  resultados: ResultadoCotizacion[];
  totales: TotalesCotizacion;
  observaciones: string;
  pedidoOriginal: string;
  vendedor?: string;
};

export async function guardarCotizacion({ numero, cliente, resultados, totales, observaciones, pedidoOriginal, vendedor = 'JALESS' }: GuardarCotizacionParams) {
  const { data: cabecera, error: errorCabecera } = await supabase
    .from('cotizaciones_jaless')
    .upsert(
      {
        numero,
        cliente_id: cliente?.id || null,
        cliente_razon_social: cliente?.razon_social || 'Sin cliente',
        cliente_ruc: cliente?.ruc || '',
        cliente_direccion: cliente?.direccion || '',
        cliente_ciudad: cliente?.ciudad || '',
        condicion_pago: cliente?.condicion_pago || 'Contado',
        subtotal: totales.subtotal,
        igv: totales.igv,
        total: totales.total,
        observaciones,
        pedido_original: pedidoOriginal,
        estado: 'generada',
        vendedor,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'numero' }
    )
    .select('id')
    .single();

  if (errorCabecera) throw errorCabecera;
  const cotizacionId = cabecera.id as string;

  await supabase.from('cotizacion_detalle_jaless').delete().eq('cotizacion_id', cotizacionId);

  const detalle = resultados.map((row) => ({
    cotizacion_id: cotizacionId,
    item: row.item,
    estado: row.estado,
    codigo: row.codigo,
    descripcion: row.descripcion,
    categoria: row.categoria,
    clave_busqueda: row.clave,
    cantidad: row.cantidad,
    precio_lista: row.precioLista,
    descuento: row.descuento,
    precio_final: row.precioFinal,
    total: row.total,
  }));

  if (detalle.length > 0) {
    const { error: errorDetalle } = await supabase.from('cotizacion_detalle_jaless').insert(detalle);
    if (errorDetalle) throw errorDetalle;
  }

  return cotizacionId;
}

export async function listarCotizaciones(busqueda = ''): Promise<CotizacionGuardada[]> {
  let query = supabase
    .from('cotizaciones_jaless')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(100);

  const q = busqueda.trim();
  if (q) {
    query = query.or(`numero.ilike.%${q}%,cliente_razon_social.ilike.%${q}%,cliente_ruc.ilike.%${q}%,vendedor.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as CotizacionGuardada[];
}

export async function obtenerDetalleCotizacion(cotizacionId: string): Promise<CotizacionDetalleGuardada[]> {
  const { data, error } = await supabase
    .from('cotizacion_detalle_jaless')
    .select('*')
    .eq('cotizacion_id', cotizacionId)
    .order('item', { ascending: true });

  if (error) throw error;
  return (data || []) as CotizacionDetalleGuardada[];
}
