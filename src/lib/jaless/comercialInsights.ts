import { normalizarCategoriaComercial, normalizarTextoComercial } from '@/lib/cotizador/categorias';
import type { ResultadoCotizacion } from '@/types/comercial';

export type InsightComercial = {
  tipo: 'alerta' | 'sugerencia' | 'bien';
  titulo: string;
  detalle: string;
};

const COMPLEMENTOS: Record<string, { titulo: string; detalle: string }> = {
  ORINGS: { titulo: 'Venta complementaria', detalle: 'El pedido contiene O-rings. Revisa si el cliente también necesita cordón de nitrilo/Vitón o Bonded Seal.' },
  ABRAZADERAS: { titulo: 'Confirma material y marca', detalle: 'Para abrazaderas, confirma W1/W3/W4 y marca Jaless o Power cuando el cliente lo indique.' },
  'PINES DE EXPANSION': { titulo: 'Producto relacionado', detalle: 'El pedido incluye pines de expansión. Verifica si también requiere pasadores de horquilla.' },
  SEGUROS: { titulo: 'Confirma acabado', detalle: 'En seguros, confirma si el cliente necesita acero estándar o inoxidable.' },
};

export function analizarCotizacionComercial(texto: string, resultados: ResultadoCotizacion[], descuentos: Record<string, number>): InsightComercial[] {
  const insights: InsightComercial[] = [];
  const exactos = resultados.filter((row) => row.estado === 'Exacto');
  const noEncontrados = resultados.filter((row) => row.estado === 'No encontrado');
  const multiples = resultados.filter((row) => row.estado === 'Múltiples');

  if (noEncontrados.length > 0) insights.push({ tipo: 'alerta', titulo: `${noEncontrados.length} producto(s) no encontrado(s)`, detalle: 'Usa el buscador inteligente para localizar una medida similar y agregarla manualmente al pedido.' });
  if (multiples.length > 0) insights.push({ tipo: 'alerta', titulo: `${multiples.length} línea(s) con varias opciones`, detalle: 'Selecciona el producto exacto antes de enviar la cotización.' });

  const codigos = new Map<string, number>();
  for (const row of exactos) codigos.set(row.codigo, (codigos.get(row.codigo) || 0) + 1);
  const repetidos = Array.from(codigos.entries()).filter(([, veces]) => veces > 1);
  if (repetidos.length > 0) insights.push({ tipo: 'alerta', titulo: 'Productos repetidos', detalle: `Revisa ${repetidos.map(([codigo]) => codigo).join(', ')}. Podrían consolidarse en una sola línea.` });

  const lineas = texto.split(/\r?\n/).map((linea) => normalizarTextoComercial(linea)).filter((linea) => linea.length > 3 && /\d/.test(linea));
  const conteoLineas = new Map<string, number>();
  for (const linea of lineas) conteoLineas.set(linea, (conteoLineas.get(linea) || 0) + 1);
  if (Array.from(conteoLineas.values()).some((veces) => veces > 1)) insights.push({ tipo: 'alerta', titulo: 'Líneas duplicadas en el pedido', detalle: 'Hay líneas idénticas en el texto original. Confirma que las cantidades no estén duplicadas por error.' });

  const categorias = new Set(exactos.map((row) => normalizarCategoriaComercial(row.categoria)));
  for (const categoria of categorias) {
    const complemento = COMPLEMENTOS[categoria];
    if (complemento) insights.push({ tipo: 'sugerencia', ...complemento });
  }

  const valoresDescuento = Object.values(descuentos || {}).map(Number);
  if (exactos.length > 0 && valoresDescuento.length > 0 && valoresDescuento.every((valor) => !valor)) insights.push({ tipo: 'sugerencia', titulo: 'Cliente sin descuentos configurados', detalle: 'La cotización se está calculando con precio de lista. Confirma si el cliente tiene condiciones especiales.' });

  const cantidadesAltas = exactos.filter((row) => row.cantidad >= 1000);
  if (cantidadesAltas.length > 0) insights.push({ tipo: 'sugerencia', titulo: 'Cantidad mayorista', detalle: `Hay ${cantidadesAltas.length} línea(s) con 1,000 unidades o más. Verifica precio especial antes de enviar.` });

  if (resultados.length > 0 && noEncontrados.length === 0 && multiples.length === 0 && repetidos.length === 0) insights.unshift({ tipo: 'bien', titulo: 'Cotización lista para revisión comercial', detalle: 'Todos los productos fueron identificados. Revisa cantidades, descuentos y condiciones antes de exportar.' });

  return insights.slice(0, 6);
}
