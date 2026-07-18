import { supabase } from '@/lib/supabase';
import { normalizarBusqueda, ordenarProductosBusqueda, type ProductoBusqueda } from '@/lib/search/productSearch';

const CAMPOS_PRODUCTO = 'codigo, descripcion, categoria, material, tipo, medida, marca, precio_usd_sin_igv, clave_busqueda, familia_norm, material_norm, tipo_norm, marca_norm, medida_norm, texto_busqueda';

function limpiarFiltro(valor: string): string {
  return valor.replace(/[(),'"]/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function buscarProductosInteligente(termino: string, limite = 12): Promise<ProductoBusqueda[]> {
  const consulta = normalizarBusqueda(termino);
  if (consulta.length < 2) return [];

  const tokens = consulta
    .split(' ')
    .map(limpiarFiltro)
    .filter((token) => token.length >= 2)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);

  const candidatos = new Map<string, ProductoBusqueda>();

  for (const token of tokens.length ? tokens : [consulta]) {
    const patron = `%${token}%`;
    const { data, error } = await supabase
      .from('productos_catalogo')
      .select(CAMPOS_PRODUCTO)
      .or([
        `codigo.ilike.${patron}`,
        `descripcion.ilike.${patron}`,
        `categoria.ilike.${patron}`,
        `material.ilike.${patron}`,
        `tipo.ilike.${patron}`,
        `medida.ilike.${patron}`,
        `marca.ilike.${patron}`,
        `clave_busqueda.ilike.${patron}`,
        `familia_norm.ilike.${patron}`,
        `material_norm.ilike.${patron}`,
        `tipo_norm.ilike.${patron}`,
        `marca_norm.ilike.${patron}`,
        `medida_norm.ilike.${patron}`,
        `texto_busqueda.ilike.${patron}`,
      ].join(','))
      .limit(100);

    if (error) throw error;
    for (const producto of (data || []) as ProductoBusqueda[]) candidatos.set(producto.codigo, producto);
  }

  if (candidatos.size === 0) {
    const compacto = limpiarFiltro(consulta.replace(/\s/g, ''));
    const prefijo = compacto.slice(0, Math.max(2, Math.min(5, compacto.length)));
    const patron = `%${prefijo}%`;
    const { data, error } = await supabase
      .from('productos_catalogo')
      .select(CAMPOS_PRODUCTO)
      .or(`codigo.ilike.${patron},descripcion.ilike.${patron},medida.ilike.${patron},medida_norm.ilike.${patron},clave_busqueda.ilike.${patron},texto_busqueda.ilike.${patron}`)
      .limit(180);

    if (error) throw error;
    for (const producto of (data || []) as ProductoBusqueda[]) candidatos.set(producto.codigo, producto);
  }

  return ordenarProductosBusqueda(Array.from(candidatos.values()), termino, limite);
}
