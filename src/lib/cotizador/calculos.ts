import type { Producto, ResultadoCotizacion, TotalesCotizacion } from '@/types/comercial';
import { obtenerDescuentoCategoria } from '@/lib/cotizador/categorias';
import { round2 } from '@/lib/utils/format';

export function calcularTotales(resultados: ResultadoCotizacion[]): TotalesCotizacion {
  const subtotal = round2(resultados.reduce((acc, row) => acc + Number(row.total || 0), 0));
  const igv = round2(subtotal * 0.18);
  const total = round2(subtotal + igv);
  return { subtotal, igv, total };
}

export function construirFilaDesdeProducto(
  row: ResultadoCotizacion,
  producto: Producto,
  descuentos: Record<string, number>
): ResultadoCotizacion {
  const precioLista = Number(producto.precio_usd_sin_igv || 0);
  const descuento = obtenerDescuentoCategoria(producto.categoria, descuentos);
  const precioFinal = Number((precioLista * (1 - descuento / 100)).toFixed(4));
  const total = round2(precioFinal * row.cantidad);

  return {
    ...row,
    estado: 'Exacto',
    codigo: producto.codigo,
    descripcion: producto.descripcion,
    categoria: producto.categoria,
    clave: producto.clave_busqueda,
    precioLista,
    descuento,
    precioFinal,
    total,
    opciones: undefined,
  };
}
