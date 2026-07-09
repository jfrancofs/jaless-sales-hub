export type CategoriaJaless =
  | "O'Rings"
  | 'Abrazaderas'
  | 'Seguros'
  | 'Cordones'
  | 'Pines de Expansión'
  | 'Billas de Acero'
  | 'Bonded Seal'
  | 'Pasadores de Horquilla';

export type ContextoMIC = {
  categoria?: CategoriaJaless;
  material?: string;
  fleje?: string;
  tipo?: string;
  marca?: string;
  dureza?: string;
  inoxidable?: boolean;
};

export type LineaInterpretada = {
  original: string;
  medida: string;
  medidaClave: string;
  cantidad: number;
  contexto: ContextoMIC;
};

export function normalizarTexto(texto: string) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function limpiarNumero(n: string) {
  const v = Number(String(n).replace(',', '.'));
  if (Number.isNaN(v)) return String(n).replace(',', '.');
  return String(v).replace(/\.0+$/, '');
}

export function claveMedida(valor: string) {
  let v = normalizarTexto(valor)
    .replace(/\s+/g, '')
    .replace(/MM\b/g, '')
    .replace(/[×*]/g, 'X')
    .replace(/,/g, '.')
    .replace(/[”]/g, '"');

  // Quitar guiones solo para seguros E-010, I-020, R-010.
  const seguro = v.match(/^([EIR])[- ]?0*(\d+(?:\.\d+)?)$/);
  if (seguro) return `${seguro[1]}${seguro[2]}`;

  // AS568 / códigos pulgadas: 2-203, AX-020, etc.
  const as568 = v.match(/^(AX|2)-0*(\d+)$/);
  if (as568) return `${as568[1]}-${as568[2].padStart(3, '0')}`;

  // Métrico y pines: 3x15, 3.00x15.00, 8*40.
  const metric = v.match(/^(\d+(?:\.\d+)?)X(\d+(?:\.\d+)?)$/);
  if (metric) return `${limpiarNumero(metric[1])}X${limpiarNumero(metric[2])}`;

  // Rangos de abrazadera: 10-16, 100-120.
  const rango = v.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (rango) return `${limpiarNumero(rango[1])}-${limpiarNumero(rango[2])}`;

  // Pasadores: 5/32"x1", 1/4x1 1/2, etc.
  v = v.replace(/"/g, '').replace(/\s+/g, '');
  const pasador = v.match(/^(\d+\/\d+)X(.+)$/);
  if (pasador) return `${pasador[1]}X${pasador[2]}`.replace(/\s+/g, '');

  return v;
}

function contieneEncabezado(linea: string) {
  const t = normalizarTexto(linea);
  return (
    t.includes('ORING') || t.includes('O RING') || t.includes("O'RING") ||
    t.includes('ABRAZADERA') ||
    t.includes('SEGURO') || t.includes('SEEGUER') || t.includes('SEEGER') ||
    t.includes('CORDON') || t.includes('CORDÓN') ||
    t.includes('PIN') || t.includes('PINES') ||
    t.includes('BILLA') || t.includes('BOLA') ||
    t.includes('BONDED') ||
    t.includes('PASADOR') || t.includes('HORQUILLA')
  );
}

export function detectarContexto(encabezado: string): ContextoMIC {
  const t = normalizarTexto(encabezado);
  const ctx: ContextoMIC = {};

  if (t.includes('ORING') || t.includes('O RING') || t.includes("O'RING")) {
    ctx.categoria = "O'Rings";
    ctx.material = t.includes('VITON') ? 'Viton' : 'NBR';
    ctx.dureza = /\b(D90|90|DUREZA 90|SHORE 90)\b/.test(t) ? '90' : '70';
    return ctx;
  }

  if (t.includes('ABRAZADERA')) {
    ctx.categoria = 'Abrazaderas';
    ctx.marca = t.includes('POWER') ? 'Power' : 'Jaless';
    if (t.includes('INDUSTRIAL')) ctx.tipo = 'Industrial';
    else if (t.includes('RSGU')) ctx.tipo = 'RSGU';
    else ctx.tipo = 'Cremallera';

    if (t.includes('W4')) ctx.material = 'W4';
    else if (t.includes('W3')) ctx.material = 'W3';
    else if (t.includes('W2')) ctx.material = 'W2';
    else if (t.includes('W1')) ctx.material = 'W1';

    if (ctx.tipo === 'Cremallera') {
      if (/\b(F9|9MM|9 MM)\b/.test(t)) ctx.fleje = '9mm';
      if (/\b(F12|12MM|12 MM)\b/.test(t)) ctx.fleje = '12mm';
    }
    return ctx;
  }

  if (t.includes('SEGURO') || t.includes('SEEGUER') || t.includes('SEEGER')) {
    ctx.categoria = 'Seguros';
    ctx.inoxidable = t.includes('INOX');
    return ctx;
  }

  if (t.includes('CORDON') || t.includes('CORDÓN')) {
    ctx.categoria = 'Cordones';
    if (t.includes('VITON')) ctx.material = 'Viton';
    if (t.includes('NBR') || t.includes('NITRILO')) ctx.material = 'NBR';
    return ctx;
  }

  if (t.includes('PIN') || t.includes('PINES')) {
    ctx.categoria = 'Pines de Expansión';
    return ctx;
  }

  if (t.includes('BILLA') || t.includes('BOLA')) {
    ctx.categoria = 'Billas de Acero';
    return ctx;
  }

  if (t.includes('BONDED')) {
    ctx.categoria = 'Bonded Seal';
    return ctx;
  }

  if (t.includes('PASADOR') || t.includes('HORQUILLA')) {
    ctx.categoria = 'Pasadores de Horquilla';
    return ctx;
  }

  return ctx;
}

function detectarTipoSeguro(medida: string) {
  const m = normalizarTexto(medida).replace(/\s+/g, '');
  if (/^I[-]?\d+/.test(m)) return 'Interior';
  if (/^E[-]?\d+/.test(m)) return 'Exterior';
  if (/^R[-]?\d+/.test(m)) return 'Radial';
  return undefined;
}

function extraerMedidaCantidad(linea: string) {
  const clean = linea.trim();
  const m = clean.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)$/);
  if (!m) return null;
  return { medida: m[1].trim(), cantidad: Number(m[2].replace(',', '.')) };
}

function aplicarContextoInline(linea: string, contexto: ContextoMIC) {
  const t = normalizarTexto(linea);
  const ctx = { ...contexto };

  if (ctx.categoria === "O'Rings") {
    if (t.includes('VITON')) ctx.material = 'Viton';
    if (t.includes('NITRILO') || t.includes('NBR')) ctx.material = 'NBR';
    if (/\b(D90|90|DUREZA 90|SHORE 90)\b/.test(t)) ctx.dureza = '90';
  }

  if (ctx.categoria === 'Abrazaderas') {
    if (t.includes('POWER')) ctx.marca = 'Power';
    if (t.includes('JAL')) ctx.marca = 'Jaless';
    if (t.includes('W4')) ctx.material = 'W4';
    if (t.includes('W3')) ctx.material = 'W3';
    if (t.includes('W2')) ctx.material = 'W2';
    if (t.includes('W1')) ctx.material = 'W1';
    if (/\b(F9|9MM|9 MM)\b/.test(t)) ctx.fleje = '9mm';
    if (/\b(F12|12MM|12 MM)\b/.test(t)) ctx.fleje = '12mm';
  }

  return ctx;
}

export function interpretarPedido(texto: string): LineaInterpretada[] {
  const lineas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let contexto: ContextoMIC = {};
  const resultado: LineaInterpretada[] = [];

  for (const linea of lineas) {
    const item = extraerMedidaCantidad(linea);

    if (contieneEncabezado(linea) && !item) {
      contexto = detectarContexto(linea);
      continue;
    }

    if (!item) continue;

    let ctx = aplicarContextoInline(linea, contexto);

    if (ctx.categoria === 'Seguros') {
      const tipoSeguro = detectarTipoSeguro(item.medida);
      if (tipoSeguro) ctx.tipo = tipoSeguro;
    }

    let medida = item.medida;
    // Quitar palabras de contexto que a veces vienen en la misma línea.
    medida = medida
      .replace(/ORING|O-RING|O RING|O'RING|NITRILO|NBR|VITON|DUREZA|SHORE|D90|90/gi, ' ')
      .replace(/ABRAZADERA|CREMALLERA|INDUSTRIAL|POWER|JALESS|W1|W2|W3|W4|F9|F12|9MM|12MM/gi, ' ')
      .replace(/SEGURO|SEEGUER|SEEGER|EXTERIOR|INTERIOR|RADIAL/gi, ' ')
      .trim();

    resultado.push({
      original: linea,
      medida,
      medidaClave: claveMedida(medida),
      cantidad: item.cantidad,
      contexto: ctx,
    });
  }

  return resultado;
}

export function clavesProducto(producto: { codigo?: string | null; descripcion?: string | null; medida?: string | null }) {
  const texto = normalizarTexto(`${producto.codigo ?? ''} ${producto.descripcion ?? ''} ${producto.medida ?? ''}`);
  const claves = new Set<string>();
  if (producto.medida) claves.add(claveMedida(producto.medida));

  const patrones = [
    /\b(\d+(?:[.,]\d+)?)\s*[X*]\s*(\d+(?:[.,]\d+)?)\b/g,
    /\b(\d+(?:[.,]\d+)?\s*-\s*\d+(?:[.,]\d+)?)\b/g,
    /\b((?:AX|2)-\d{3})\b/g,
    /\b([EIR])\(?[AJ]?\)?-?0*(\d+(?:\.\d+)?)\b/g,
    /\b(\d+\/\d+)\s*"?\s*[X*]\s*([\d\.\/ ]+)\b/g,
  ];

  for (const patron of patrones) {
    for (const m of texto.matchAll(patron)) {
      if (m[0]) claves.add(claveMedida(m[0]));
      if (m[1] && m[2] && /^[EIR]$/.test(m[1])) claves.add(`${m[1]}${m[2].replace(/^0+/, '')}`);
    }
  }
  return Array.from(claves).filter(Boolean);
}
