import { supabase } from '@/lib/supabase';
import { interpretarPedido } from '@/lib/mic/parser';
import { elegirProductoPreferido } from '@/lib/cotizador/prioridadProductos';
import { round2 } from '@/lib/utils/format';
import type { Producto, ResultadoCotizacion } from '@/types/comercial';

export async function generarCotizacionDesdeTexto(
  texto: string,
  descuentos: Record<string, number>
): Promise<ResultadoCotizacion[]> {
  const interpretados = interpretarPedido(texto);
  const claves = Array.from(new Set(interpretados.flatMap((i: any) => i.claves || [i.clave]).filter(Boolean)));

  let productos: Producto[] = [];
  if (claves.length > 0) {
    const { data, error } = await supabase
      .from('productos_catalogo')
      .select('codigo, descripcion, categoria, precio_usd_sin_igv, clave_busqueda')
      .in('clave_busqueda', claves);

    if (error) throw error;
    productos = (data || []) as Producto[];
  }

  const productosPorClave = new Map<string, Producto[]>();
  for (const producto of productos) {
    const lista = productosPorClave.get(producto.clave_busqueda) || [];
    lista.push(producto);
    productosPorClave.set(producto.clave_busqueda, lista);
  }

  return interpretados.map((item: any, index) => {
    const clavesItem: string[] = item.claves || [item.clave];
    const cantidad = Number(item.cantidad || 0);

    const coincidencias: Producto[] = [];
    const vistos = new Set<string>();
    for (const clave of clavesItem) {
      const encontrados = productosPorClave.get(clave) || [];
      for (const producto of encontrados) {
        if (!vistos.has(producto.codigo)) {
          coincidencias.push(producto);
          vistos.add(producto.codigo);
        }
      }
    }

    const coincidenciasPriorizadas = elegirProductoPreferido(item.linea || item.interpretado || '', coincidencias);

    if (coincidenciasPriorizadas.length === 0) {
      return {
        item: index + 1,
        estado: 'No encontrado',
        codigo: '-',
        descripcion: 'Producto no encontrado',
        categoria: item.contexto.familia || '',
        interpretado: item.interpretado,
        clave: clavesItem.join(' / '),
        cantidad,
        precioLista: 0,
        descuento: 0,
        precioFinal: 0,
        total: 0,
      } satisfies ResultadoCotizacion;
    }

    if (coincidenciasPriorizadas.length > 1) {
      return {
        item: index + 1,
        estado: 'Múltiples',
        codigo: coincidenciasPriorizadas.map((p) => p.codigo).join(' / '),
        descripcion: `Seleccione una opción para: ${item.linea || item.interpretado}`,
        categoria: coincidenciasPriorizadas[0]?.categoria || item.contexto.familia || '',
        interpretado: item.interpretado,
        clave: clavesItem.join(' / '),
        cantidad,
        precioLista: 0,
        descuento: 0,
        precioFinal: 0,
        total: 0,
        opciones: coincidenciasPriorizadas,
      } satisfies ResultadoCotizacion;
    }

    const producto = coincidenciasPriorizadas[0];
    const precioLista = Number(producto.precio_usd_sin_igv || 0);
    const descuento = Number(descuentos[producto.categoria] || 0);
    const precioFinal = Number((precioLista * (1 - descuento / 100)).toFixed(4));
    const total = round2(precioFinal * cantidad);

    return {
      item: index + 1,
      estado: 'Exacto',
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      categoria: producto.categoria,
      interpretado: item.interpretado,
      clave: producto.clave_busqueda,
      cantidad,
      precioLista,
      descuento,
      precioFinal,
      total,
    } satisfies ResultadoCotizacion;
  });
}
