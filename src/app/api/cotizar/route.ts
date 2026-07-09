import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type Producto = {
  id: string;
  codigo: string;
  descripcion: string;
  marca: string | null;
  categoria: string | null;
  material: string | null;
  fleje: string | null;
  tipo: string | null;
  medida: string | null;
  precio_usd_sin_igv: number;
  texto_busqueda?: string | null;
};

type Contexto = {
  categoria?: string;
  material?: string;
  tipo?: string;
  fleje?: string;
  marca?: string;
  dureza?: string;
};

type PedidoLinea = Contexto & {
  original: string;
  texto: string;
  cantidad: number;
  medida?: string;
  codigo?: string;
  esEncabezado?: boolean;
  contextoAplicado?: Contexto;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Faltan variables de Supabase en .env.local');
  return createClient(url, key, { auth: { persistSession: false } });
}

function norm(value: unknown) {
  return String(value ?? '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/["'`´]/g, '')
    .replace(/Ø/g, '')
    .replace(/,/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}

function compact(value: unknown) {
  return norm(value).replace(/[^A-Z0-9.]+/g, '');
}

function numberText(n: string | number) {
  const value = typeof n === 'number' ? n : Number(String(n).replace(',', '.'));
  if (Number.isNaN(value)) return String(n).trim();
  return String(value).replace(/\.0+$/, '');
}

function canonicalX(a: string, b: string) {
  return `${numberText(a)}X${numberText(b)}`;
}

function parseCategoria(text: string) {
  const t = norm(text);
  if (/\b(ORING|O RING|O-RING|ORINGS|O RINGS)\b/.test(t)) return "O'Rings";
  if (/\b(SEEGUER|SEEGER|SEGUER|SEGURO|SEGUROS)\b/.test(t)) return 'Seguros';
  if (/ABRAZADERA/.test(t)) return 'Abrazaderas';
  if (/CORDON|CORDONES/.test(t)) return 'Cordones';
  if (/PIN|PINES/.test(t)) return 'Pines de Expansión';
  if (/BONDED/.test(t)) return 'Bonded Seal';
  if (/BILLA|BOLA/.test(t)) return 'Billas de Acero';
  if (/PASADOR|HORQUILLA/.test(t)) return 'Pasadores de Horquilla';
  return undefined;
}

function parseMaterial(text: string) {
  const t = norm(text);
  if (/\b(W4|INOXIDABLE W4)\b/.test(t)) return 'Inoxidable W4';
  if (/\b(W3|INOXIDABLE W3)\b/.test(t)) return 'Inoxidable W3';
  if (/\b(W2|INOXIDABLE W2)\b/.test(t)) return 'Inoxidable W2';
  if (/\b(W1|ZINCADO W1)\b/.test(t)) return 'Acero Zincado W1';
  if (/VITON|VITÓN/.test(t)) return 'Viton';
  if (/NITRILO|\bNBR\b/.test(t)) return 'NBR';
  if (/INOX/.test(t)) return 'Inoxidable';
  if (/ZINCADO/.test(t)) return 'Zincado';
  if (/ACERO/.test(t)) return 'Acero';
  return undefined;
}

function parseTipo(text: string) {
  const t = norm(text);
  if (/CREMALLERA/.test(t)) return 'Cremallera';
  if (/INDUSTRIAL/.test(t)) return 'Industrial';
  if (/RSGU/.test(t)) return 'RSGU';
  if (/EXTERIOR|\bE\s*-?\s*0*\d/.test(t)) return 'Exterior';
  if (/INTERIOR|\bI\s*-?\s*0*\d/.test(t)) return 'Interior';
  if (/RADIAL|\bR\s*-?\s*0*\d/.test(t)) return 'Radial';
  if (/MILIMETRICO|MILIMETRICO/.test(t)) return 'Milimétrico';
  if (/PULGADA|PULGADAS/.test(t)) return 'Pulgadas';
  return undefined;
}

function parseFlejePedido(text: string) {
  const t = norm(text);
  const f = t.match(/\bF\s*(9|12|14|15|20|25|30)\b/);
  if (f) return `${f[1]}mm`;
  const m = t.match(/\b(9|12|14|15|20|25|30)\s*MM\b/);
  return m ? `${m[1]}mm` : undefined;
}

function parseMarca(text: string) {
  const t = norm(text);
  if (/\bPOWER\b/.test(t)) return 'POWER';
  if (/\bJALESS\b/.test(t)) return 'Jaless';
  return undefined;
}

function parseDureza(text: string) {
  const t = norm(text);
  if (/\b(DUREZA|DUREZ|SHORE|D)\s*90\b|\b90\s*(SHORE|SH)\b|\bNBR\s*90\b/.test(t)) return '90';
  if (/\b(DUREZA|DUREZ|SHORE|D)\s*70\b|\b70\s*(SHORE|SH)\b|\bNBR\s*70\b/.test(t)) return '70';
  return undefined;
}

function applyDefaults(ctx: Contexto): Contexto {
  const next = { ...ctx };
  if (next.categoria === "O'Rings" && !next.dureza) next.dureza = '70';
  if (next.categoria === 'Abrazaderas' && next.tipo === 'Cremallera' && !next.marca) next.marca = 'Jaless';
  return next;
}

function parseHeaderContext(text: string): Contexto {
  return applyDefaults({
    categoria: parseCategoria(text),
    material: parseMaterial(text),
    tipo: parseTipo(text),
    fleje: parseFlejePedido(text),
    marca: parseMarca(text),
    dureza: parseDureza(text),
  });
}

function mergeContext(base: Contexto, partial: Contexto): Contexto {
  return applyDefaults({
    categoria: partial.categoria ?? base.categoria,
    material: partial.material ?? base.material,
    tipo: partial.tipo ?? base.tipo,
    fleje: partial.fleje ?? base.fleje,
    marca: partial.marca ?? base.marca,
    dureza: partial.dureza ?? base.dureza,
  });
}

function hasContextSignal(text: string) {
  return Boolean(parseCategoria(text) || parseMaterial(text) || parseTipo(text) || parseFlejePedido(text) || parseMarca(text) || parseDureza(text));
}

function parseMedida(text: string, categoria?: string, tipo?: string) {
  const t = norm(text);

  if (categoria === "O'Rings") {
    const as568 = t.match(/\b\d\s*-\s*\d{3}\b/);
    if (as568) return as568[0].replace(/\s+/g, '');
  }

  const rango = t.match(/\b(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\b/);
  if (rango) return `${numberText(rango[1])}-${numberText(rango[2])}`;

  const x = t.match(/\b(\d+(?:\.\d+)?)\s*[X*]\s*(\d+(?:\.\d+)?)\b/);
  if (x) return canonicalX(x[1], x[2]);

  const seguroCompleto = t.match(/\b([EIR])\s*(?:\([A-Z]\))?\s*-?\s*0*(\d+(?:\.\d+)?)\b/);
  if (seguroCompleto) return `${seguroCompleto[1]}${numberText(seguroCompleto[2])}`;

  if (categoria === 'Seguros' && tipo) {
    const soloNumero = t.match(/\b0*(\d+(?:\.\d+)?)\b/);
    if (soloNumero) {
      const prefix = tipo === 'Exterior' ? 'E' : tipo === 'Interior' ? 'I' : tipo === 'Radial' ? 'R' : '';
      if (prefix) return `${prefix}${numberText(soloNumero[1])}`;
    }
  }

  if (categoria === 'Cordones') {
    const mm = t.match(/\b(\d+(?:\.\d+)?)\s*MM\b/);
    if (mm) return `${numberText(mm[1])}mm`;
  }

  return undefined;
}

function canonicalProductoMedida(producto: Producto) {
  const texto = `${producto.medida ?? ''} ${producto.descripcion ?? ''} ${producto.codigo ?? ''}`;
  const categoria = producto.categoria ?? undefined;
  const tipo = producto.tipo ?? parseTipo(texto);
  return parseMedida(texto, categoria, tipo);
}

function sameCategoria(p: Producto, categoria?: string) {
  if (!categoria) return true;
  return norm(p.categoria) === norm(categoria);
}

function sameTipo(p: Producto, tipo?: string) {
  if (!tipo) return true;
  return norm(p.tipo) === norm(tipo) || norm(p.descripcion).includes(norm(tipo));
}

function sameFleje(p: Producto, fleje?: string) {
  if (!fleje) return true;
  const pf = norm(`${p.fleje ?? ''} ${p.descripcion ?? ''}`);
  return pf.includes(norm(fleje));
}

function sameMaterial(p: Producto, material?: string) {
  if (!material) return true;
  const pm = norm(`${p.material ?? ''} ${p.descripcion ?? ''}`);
  const m = norm(material);
  if (m === 'NBR') return /NBR|NITRILO/.test(pm);
  if (m === 'VITON') return /VITON/.test(pm);
  return pm.includes(m);
}

function sameMarca(p: Producto, marca?: string) {
  if (!marca) return true;
  const pm = norm(`${p.marca ?? ''} ${p.descripcion ?? ''}`);
  const m = norm(marca);
  if (m === 'POWER') return /\bPOWER\b/.test(pm);
  if (m === 'JALESS') return !/\bPOWER\b/.test(pm) && (/\bJALESS\b/.test(pm) || norm(p.marca) === 'JALESS');
  return pm.includes(m);
}

function productoDureza(p: Producto) {
  const t = norm(`${p.codigo ?? ''} ${p.descripcion ?? ''}`);
  if (/\b(DUREZA|DUREZ|SHORE|D)\s*90\b|\bNBR\s*90\b|\bOVM\s*90\b/.test(t)) return '90';
  return '70';
}

function sameDureza(p: Producto, dureza?: string, categoria?: string) {
  if (categoria !== "O'Rings" || !dureza) return true;
  return productoDureza(p) === dureza;
}

function looksLikeHeader(line: string) {
  const t = norm(line);
  const hasQty = /(?:\s|\t)(\d+(?:[.,]\d+)?)\s*$/.test(line.trim());
  const hasMeasure = /\b\d+(?:[.,]\d+)?\s*(?:-|X|\*)\s*\d+(?:[.,]\d+)?\b/i.test(line) || /\b[IER]\s*-?\s*0*\d+\b/i.test(line);
  if (!hasContextSignal(line)) return false;
  if (!hasQty) return true;
  // Si dice claramente familia/tipo/material pero no medida, es encabezado aunque termine en número raro.
  return !hasMeasure && !/\b\d\s*-\s*\d{3}\b/.test(t);
}

function parseLinesWithContext(text: string): PedidoLinea[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^tipo\s+medida\s+cantidad/i.test(line))
    .filter((line) => !/^cantidad\s+/i.test(line));

  let contexto: Contexto = {};
  const parsed: PedidoLinea[] = [];

  for (const line of lines) {
    if (looksLikeHeader(line)) {
      contexto = mergeContext(contexto, parseHeaderContext(line));
      continue;
    }

    const qtyMatch = line.match(/(?:\s|\t)(\d+(?:[.,]\d+)?)\s*$/);
    const cantidad = qtyMatch ? Number(qtyMatch[1].replace(',', '.')) : 1;
    const texto = qtyMatch ? line.slice(0, qtyMatch.index).trim() : line;
    const lineContext = parseHeaderContext(texto);
    const aplicado = mergeContext(contexto, lineContext);
    const categoria = aplicado.categoria;
    const tipo = parseTipo(texto) ?? aplicado.tipo;
    const material = parseMaterial(texto) ?? aplicado.material;
    const fleje = parseFlejePedido(texto) ?? aplicado.fleje;
    const marca = parseMarca(texto) ?? aplicado.marca;
    const dureza = parseDureza(texto) ?? aplicado.dureza;
    const finalContext = applyDefaults({ categoria, tipo, material, fleje, marca, dureza });
    const medida = parseMedida(texto, finalContext.categoria, finalContext.tipo);
    const codigoMatch = texto.match(/\b[A-Z]{2,}[A-Z0-9()\- ./*]+\b/i);
    const codigo = codigoMatch ? compact(codigoMatch[0]) : undefined;

    parsed.push({
      original: line,
      texto,
      cantidad,
      categoria: finalContext.categoria,
      tipo: finalContext.tipo,
      material: finalContext.material,
      fleje: finalContext.fleje,
      marca: finalContext.marca,
      dureza: finalContext.dureza,
      medida,
      codigo,
      contextoAplicado: finalContext,
    });
  }

  return parsed;
}

let cache: Producto[] | null = null;
async function getProductos() {
  if (cache) return cache;
  const supabase = getSupabaseAdmin();
  const all: Producto[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('productos_catalogo')
      .select('id,codigo,descripcion,marca,categoria,material,fleje,tipo,medida,precio_usd_sin_igv,texto_busqueda')
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...(data as Producto[]));
    if (data.length < 1000) break;
  }
  cache = all;
  return all;
}

function findCandidates(linea: PedidoLinea, productos: Producto[]) {
  if (!linea.medida && linea.codigo) {
    return productos.filter((p) => compact(p.codigo) === linea.codigo);
  }

  if (!linea.medida) return [];

  return productos.filter((p) => {
    if (!sameCategoria(p, linea.categoria)) return false;
    if (!sameTipo(p, linea.tipo)) return false;
    if (!sameMaterial(p, linea.material)) return false;
    if (!sameFleje(p, linea.fleje)) return false;
    if (!sameMarca(p, linea.marca)) return false;
    if (!sameDureza(p, linea.dureza, linea.categoria)) return false;
    return canonicalProductoMedida(p) === linea.medida;
  });
}

function sortCandidates(linea: PedidoLinea, candidatos: Producto[]) {
  return candidatos.sort((a, b) => {
    const aCode = compact(a.codigo);
    const bCode = compact(b.codigo);
    const standardA = /^(ONM|OVM|SEA|SIJ|SER|ACF|AIND|ARSGU|BL|PIN|COR|ARJ)/.test(aCode) ? 1 : 0;
    const standardB = /^(ONM|OVM|SEA|SIJ|SER|ACF|AIND|ARSGU|BL|PIN|COR|ARJ)/.test(bCode) ? 1 : 0;
    if (standardA !== standardB) return standardB - standardA;
    if (linea.material) {
      const ma = sameMaterial(a, linea.material) ? 1 : 0;
      const mb = sameMaterial(b, linea.material) ? 1 : 0;
      if (ma !== mb) return mb - ma;
    }
    return norm(a.descripcion).length - norm(b.descripcion).length;
  });
}

function findProducto(linea: PedidoLinea, productos: Producto[]) {
  const candidatos = sortCandidates(linea, findCandidates(linea, productos));
  if (candidatos.length === 0) return { producto: null, ambiguo: false, sugerencias: sugerencias(linea, productos) };

  if (linea.categoria === 'Abrazaderas') {
    const opcionesFleje = new Set(candidatos.map((p) => norm(p.fleje)).filter(Boolean));
    const opcionesMaterial = new Set(candidatos.map((p) => norm(p.material)).filter(Boolean));
    if (!linea.fleje && opcionesFleje.size > 1) return { producto: null, ambiguo: true, sugerencias: candidatos.slice(0, 8) };
    if (!linea.material && opcionesMaterial.size > 1) return { producto: null, ambiguo: true, sugerencias: candidatos.slice(0, 8) };
  }

  if (linea.categoria === "O'Rings") {
    const opcionesMaterial = new Set(candidatos.map((p) => norm(p.material)).filter(Boolean));
    if (!linea.material && opcionesMaterial.size > 1) return { producto: null, ambiguo: true, sugerencias: candidatos.slice(0, 8) };
  }

  if (candidatos.length > 1) {
    const codigos = new Set(candidatos.map((p) => p.codigo));
    if (codigos.size > 1 && !linea.codigo) return { producto: null, ambiguo: true, sugerencias: candidatos.slice(0, 8) };
  }

  return { producto: candidatos[0], ambiguo: false, sugerencias: [] };
}

function sugerencias(linea: PedidoLinea, productos: Producto[]) {
  const medida = linea.medida;
  const candidates = productos
    .filter((p) => {
      if (!sameCategoria(p, linea.categoria)) return false;
      if (linea.tipo && !sameTipo(p, linea.tipo)) return false;
      if (linea.material && !sameMaterial(p, linea.material)) return false;
      if (linea.fleje && !sameFleje(p, linea.fleje)) return false;
      if (linea.marca && !sameMarca(p, linea.marca)) return false;
      if (linea.dureza && !sameDureza(p, linea.dureza, linea.categoria)) return false;
      if (!medida) return false;
      return norm(`${p.codigo} ${p.descripcion} ${p.medida}`).includes(norm(medida).replace(/X/g, '')) || canonicalProductoMedida(p) === medida;
    })
    .slice(0, 8);
  return candidates;
}

function money(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const texto = String(body.texto ?? '');
    const productos = await getProductos();
    const lineas = parseLinesWithContext(texto);

    const detalle = lineas.map((linea, index) => {
      const { producto, ambiguo, sugerencias } = findProducto(linea, productos);
      const cantidad = linea.cantidad || 1;
      const precio = producto ? Number(producto.precio_usd_sin_igv) : 0;
      const total = money(cantidad * precio);
      return {
        item: index + 1,
        original: linea.original,
        interpretado: {
          categoria: linea.categoria ?? '',
          material: linea.material ?? '',
          tipo: linea.tipo ?? '',
          fleje: linea.fleje ?? '',
          marca: linea.marca ?? '',
          dureza: linea.dureza ?? '',
          medida: linea.medida ?? '',
        },
        estado: producto ? 'Exacto' : ambiguo ? 'Ambiguo' : 'No encontrado',
        codigo: producto?.codigo ?? '',
        descripcion: producto?.descripcion ?? (ambiguo ? 'Varias opciones encontradas' : 'Producto no encontrado'),
        categoria: producto?.categoria ?? linea.categoria ?? '',
        medida: producto?.medida ?? linea.medida ?? '',
        cantidad,
        precio_unitario: precio,
        descuento_porcentaje: 0,
        total,
        encontrado: Boolean(producto),
        ambiguo,
        sugerencias: sugerencias.map((p, sIndex) => ({
          codigo: p.codigo,
          descripcion: p.descripcion,
          categoria: p.categoria ?? '',
          material: p.material ?? '',
          fleje: p.fleje ?? '',
          tipo: p.tipo ?? '',
          medida: p.medida ?? '',
          precio_unitario: Number(p.precio_usd_sin_igv),
          score: 100 - sIndex,
        })),
      };
    });

    const subtotal = money(detalle.reduce((acc, item) => acc + item.total, 0));
    const igv = money(subtotal * 0.18);
    const total = money(subtotal + igv);

    return NextResponse.json({ ok: true, detalle, subtotal, igv, total, moneda: 'USD' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 });
  }
}
