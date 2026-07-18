import type { Producto } from '@/types/comercial';

export type ProductoBusqueda = Producto & {
  material?: string | null;
  tipo?: string | null;
  medida?: string | null;
  marca?: string | null;
  familia_norm?: string | null;
  material_norm?: string | null;
  tipo_norm?: string | null;
  marca_norm?: string | null;
  medida_norm?: string | null;
  texto_busqueda?: string | null;
  puntaje?: number;
};

export function normalizarBusqueda(valor: string | null | undefined): string {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[×*]/g, 'X')
    .replace(/[“”]/g, '"')
    .replace(/[’‘`´]/g, "'")
    .replace(/\s*[X]\s*/g, 'X')
    .replace(/\s*-\s*/g, '-')
    .replace(/[^A-Z0-9\/\.\-\'\"X ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function distanciaLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  const actual = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    actual[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      actual[j] = Math.min(actual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + costo);
    }
    for (let j = 0; j <= b.length; j++) anterior[j] = actual[j];
  }

  return anterior[b.length];
}

function similitud(a: string, b: string): number {
  if (!a || !b) return 0;
  const distancia = distanciaLevenshtein(a, b);
  return 1 - distancia / Math.max(a.length, b.length);
}

export function puntuarProducto(producto: ProductoBusqueda, consulta: string): number {
  const q = normalizarBusqueda(consulta);
  if (!q) return 0;

  const codigo = normalizarBusqueda(producto.codigo);
  const descripcion = normalizarBusqueda(producto.descripcion);
  const categoria = normalizarBusqueda(producto.categoria);
  const material = normalizarBusqueda(producto.material);
  const tipo = normalizarBusqueda(producto.tipo);
  const medida = normalizarBusqueda(producto.medida);
  const marca = normalizarBusqueda(producto.marca);
  const clave = normalizarBusqueda(producto.clave_busqueda);
  const familiaNorm = normalizarBusqueda(producto.familia_norm);
  const materialNorm = normalizarBusqueda(producto.material_norm);
  const tipoNorm = normalizarBusqueda(producto.tipo_norm);
  const marcaNorm = normalizarBusqueda(producto.marca_norm);
  const medidaNorm = normalizarBusqueda(producto.medida_norm);
  const textoBusqueda = normalizarBusqueda(producto.texto_busqueda);
  const combinado = [codigo, descripcion, categoria, material, tipo, medida, marca, clave, familiaNorm, materialNorm, tipoNorm, marcaNorm, medidaNorm, textoBusqueda].join(' ');

  let puntaje = 0;
  if (codigo === q) puntaje += 160;
  if (medida === q || medidaNorm === q) puntaje += 150;
  if (clave === q) puntaje += 145;
  if (codigo.startsWith(q)) puntaje += 110;
  if (medida.startsWith(q) || medidaNorm.startsWith(q)) puntaje += 105;
  if (descripcion.startsWith(q)) puntaje += 90;
  if (codigo.includes(q)) puntaje += 85;
  if (medida.includes(q) || medidaNorm.includes(q)) puntaje += 80;
  if (descripcion.includes(q)) puntaje += 70;
  if (clave.includes(q)) puntaje += 65;

  const tokens = q.split(' ').filter(Boolean);
  for (const token of tokens) {
    if (codigo === token || medida === token || medidaNorm === token) puntaje += 45;
    else if (combinado.includes(token)) puntaje += 22;
    else {
      const mejor = Math.max(...[codigo, medida, medidaNorm, categoria, familiaNorm, material, materialNorm, tipo, tipoNorm, marca, marcaNorm].map((campo) => similitud(token, campo)));
      if (mejor >= 0.84) puntaje += 18;
      else if (mejor >= 0.72) puntaje += 8;
    }
  }

  const similitudCodigo = similitud(q, codigo);
  const similitudMedida = Math.max(similitud(q, medida), similitud(q, medidaNorm));
  if (similitudCodigo >= 0.82) puntaje += Math.round(similitudCodigo * 55);
  if (similitudMedida >= 0.82) puntaje += Math.round(similitudMedida * 60);

  return puntaje;
}

export function ordenarProductosBusqueda(productos: ProductoBusqueda[], consulta: string, limite = 12): ProductoBusqueda[] {
  return productos
    .map((producto) => ({ ...producto, puntaje: puntuarProducto(producto, consulta) }))
    .filter((producto) => Number(producto.puntaje || 0) > 0)
    .sort((a, b) => Number(b.puntaje || 0) - Number(a.puntaje || 0) || a.descripcion.localeCompare(b.descripcion))
    .slice(0, limite);
}
