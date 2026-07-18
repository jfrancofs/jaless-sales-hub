import { supabase } from '@/lib/supabase';
import { interpretarPedido, type ItemInterpretado } from '@/lib/mic/parser';
import { elegirProductoPreferido } from '@/lib/cotizador/prioridadProductos';
import { obtenerDescuentoCategoria } from '@/lib/cotizador/categorias';
import { round2 } from '@/lib/utils/format';
import type { Producto, ResultadoCotizacion } from '@/types/comercial';

const MARCADOR_PRODUCTO = /^\[COD:([^\]]+)\]\s*x\s*(\d+(?:[.,]\d+)?)\s*-\s*(.+)$/i;

type ProductoManual = {
  codigo: string;
  cantidad: number;
  descripcion: string;
};

function extraerProductosManuales(texto: string): {
  textoParaInterpretar: string;
  productosManuales: ProductoManual[];
} {
  const productosManuales: ProductoManual[] = [];
  const lineasNormales: string[] = [];

  for (const linea of texto.split(/\r?\n/)) {
    const match = linea.trim().match(MARCADOR_PRODUCTO);
    if (!match) {
      lineasNormales.push(linea);
      continue;
    }

    productosManuales.push({
      codigo: match[1].trim(),
      cantidad: Number(match[2].replace(',', '.')) || 1,
      descripcion: match[3].trim(),
    });
  }

  return { textoParaInterpretar: lineasNormales.join('\n'), productosManuales };
}

function construirResultadoExacto(
  producto: Producto,
  cantidad: number,
  item: number,
  descuentos: Record<string, number>,
  interpretado?: string
): ResultadoCotizacion {
  const precioLista = Number(producto.precio_usd_sin_igv || 0);
  const descuento = obtenerDescuentoCategoria(producto.categoria, descuentos);
  const precioFinal = Number((precioLista * (1 - descuento / 100)).toFixed(4));
  const total = round2(precioFinal * cantidad);

  return {
    item,
    estado: 'Exacto',
    codigo: producto.codigo,
    descripcion: producto.descripcion,
    categoria: producto.categoria,
    interpretado: interpretado || producto.descripcion,
    clave: producto.clave_busqueda,
    cantidad,
    precioLista,
    descuento,
    precioFinal,
    total,
  };
}

export async function generarCotizacionDesdeTexto(
  texto: string,
  descuentos: Record<string, number>
): Promise<ResultadoCotizacion[]> {
  const { textoParaInterpretar, productosManuales } = extraerProductosManuales(texto);
  const interpretados = interpretarPedido(textoParaInterpretar);

  const claves = Array.from(
    new Set(
      interpretados
        .flatMap((item: ItemInterpretado) => item.claves || [item.clave])
        .filter(Boolean)
    )
  );

  const codigosManuales = Array.from(new Set(productosManuales.map((item) => item.codigo)));

  const [respuestaClaves, respuestaCodigos] = await Promise.all([
    claves.length > 0
      ? supabase
          .from('productos_catalogo')
          .select('codigo, descripcion, categoria, precio_usd_sin_igv, clave_busqueda')
          .in('clave_busqueda', claves)
      : Promise.resolve({ data: [], error: null }),
    codigosManuales.length > 0
      ? supabase
          .from('productos_catalogo')
          .select('codigo, descripcion, categoria, precio_usd_sin_igv, clave_busqueda')
          .in('codigo', codigosManuales)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (respuestaClaves.error) throw respuestaClaves.error;
  if (respuestaCodigos.error) throw respuestaCodigos.error;

  const productos = (respuestaClaves.data || []) as Producto[];
  const productosManualData = (respuestaCodigos.data || []) as Producto[];

  const productosPorClave = new Map<string, Producto[]>();
  for (const producto of productos) {
    const lista = productosPorClave.get(producto.clave_busqueda) || [];
    lista.push(producto);
    productosPorClave.set(producto.clave_busqueda, lista);
  }

  const porCodigo = new Map(productosManualData.map((producto) => [producto.codigo, producto]));
  const resultados: ResultadoCotizacion[] = [];

  for (const manual of productosManuales) {
    const producto = porCodigo.get(manual.codigo);
    const item = resultados.length + 1;

    if (!producto) {
      resultados.push({
        item,
        estado: 'No encontrado',
        codigo: manual.codigo,
        descripcion: manual.descripcion || 'Producto manual no encontrado',
        categoria: '',
        interpretado: manual.descripcion,
        clave: `COD:${manual.codigo}`,
        cantidad: manual.cantidad,
        precioLista: 0,
        descuento: 0,
        precioFinal: 0,
        total: 0,
      });
    } else {
      resultados.push(construirResultadoExacto(producto, manual.cantidad, item, descuentos, manual.descripcion));
    }
  }

  for (const item of interpretados) {
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

    const coincidenciasPriorizadas = elegirProductoPreferido(
      item.linea || item.interpretado || '',
      coincidencias
    );
    const numeroItem = resultados.length + 1;

    if (coincidenciasPriorizadas.length === 0) {
      resultados.push({
        item: numeroItem,
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
      });
      continue;
    }

    if (coincidenciasPriorizadas.length > 1) {
      resultados.push({
        item: numeroItem,
        estado: 'Múltiples',
        codigo: coincidenciasPriorizadas.map((producto) => producto.codigo).join(' / '),
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
      });
      continue;
    }

    resultados.push(
      construirResultadoExacto(
        coincidenciasPriorizadas[0],
        cantidad,
        numeroItem,
        descuentos,
        item.interpretado
      )
    );
  }

  return resultados;
}
