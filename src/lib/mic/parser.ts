import { normBillaMeasure, normBondedCode, normCordonMeasure, normMeasure, normPerno, normPinMeasure, upper } from './normalizadores';

export type Contexto = {
  familia?: string;
  material?: string;
  tipo?: string;
  fleje?: string;
  marca?: string;
  dureza?: string;
};

export type ItemInterpretado = {
  linea: string;
  cantidad: number;
  contexto: Contexto;
  medida: string;
  clave: string;
  claves: string[];
  interpretado: string;
};

const FAMILY_WORDS = /ORING|O'RING|O-RING|O\s+RING|JUNTA|ABRAZADERA|SEGURO|SEEGUER|SEEGER|PIN|PASADOR|HORQUILLA|CORDON|CORDÓN|BONDED|ARANDELA|SCR|ARJ|BS-|BILLA|BILLAS|BOLA/;

function hasMeasureAndQty(line: string): boolean {
  const u = upper(line);
  const endsQty = /(\d+(?:[.,]\d+)?)(?:\s*(?:MTS?|METROS?|UND|UNIDADES?))?\s*$/.test(u);
  if (!endsQty) return false;
  return /\b(?:2-\d{3}|[EIR]-?\d+|M?\d+(?:[.,]\d+)?\s*[X*×-]\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*MM|\d+\/\d+|SCR-?\d+|ARJ-?[\d\/".]+|BS-?\d+|PERNO\s*[\d\/".]+)\b/.test(u);
}

function isHeader(line: string): boolean {
  const u = upper(line);
  if (!FAMILY_WORDS.test(u)) return false;
  if (/^\s*(\d+(?:[.,]\d+)?\s*[X*×-]|2-\d{3}|[EIR][-]?\d+)/i.test(line)) return false;
  if (hasMeasureAndQty(line)) return false;
  return true;
}

function contextFromLine(line: string, previous: Contexto = {}): Contexto {
  const u = upper(line);

  if (/CORDON|CORDÓN|O\s*'?\s*RING\s*POR\s*METRO|ORING\s*POR\s*METRO|JEBE\s*POR\s*METRO/.test(u)) {
    const material = /VITON|VITÓN|MARRON|MARRÓN|VTN/.test(u) ? 'VITON' : /NITRILO|NBR|NTL/.test(u) ? 'NBR' : 'NBR';
    return { familia: 'CORDONES', material };
  }

  if (/ORING|O'RING|O-RING|O\s+RING|JUNTA\s*T[ÓO]RICA/.test(u)) {
    const material = /VITON|VITÓN|MARRON|MARRÓN/.test(u) ? 'VITON' : 'NBR';
    const dureza = /(?:D\s*90|DUREZA\s*90|SHORE\s*90|\b90\b)/.test(u) ? '90' : '70';
    return { familia: 'ORINGS', material, dureza };
  }

  if (/ABRAZADERA/.test(u)) {
    const material = /W4/.test(u) ? 'W4' : /W3/.test(u) ? 'W3' : 'W1';
    const marca = /POWER/.test(u) ? 'POWER' : 'JALESS';
    const tipo = /INDUSTRIAL/.test(u) ? 'INDUSTRIAL' : /RSGU/.test(u) ? 'RSGU' : 'CREMALLERA';
    const ctx: Contexto = { familia: 'ABRAZADERAS', material, marca, tipo };
    if (tipo === 'CREMALLERA') ctx.fleje = /F\s*12|12\s*MM/.test(u) ? '12' : /F\s*9|9\s*MM/.test(u) ? '9' : undefined;
    return ctx;
  }

  if (/SEGURO|SEEGUER|SEEGER/.test(u)) return { familia: 'SEGUROS' };
  if (/PIN/.test(u)) return { familia: 'PINES' };
  if (/PASADOR|HORQUILLA/.test(u)) return { familia: 'PASADORES' };
  if (/BONDED|ARANDELA|SCR|ARJ|BS-/.test(u)) return { familia: 'BONDED' };
  if (/BILLA|BILLAS|BOLA/.test(u)) return { familia: 'BILLAS' };

  return { ...previous };
}

function parseCantidad(line: string): number {
  const u = upper(line);

  // JALESS AI: permite mensajes libres de WhatsApp.
  // Ejemplos:
  // 20 orings 3x15
  // 100 abrazaderas 10-16
  // 25 metros cordón nitrilo 4 mm
  // 10 arandelas con jebe perno 8
  const inicio = u.match(/^\s*(\d+(?:[.,]\d+)?)\s*(?:MTS?|METROS?)?\s+(?=.*(?:ORING|O'RING|O-RING|O\s+RING|JUNTA|ABRAZADERA|SEGURO|SEEGUER|SEEGER|PIN|PASADOR|HORQUILLA|CORDON|CORDÓN|BONDED|ARANDELA|SCR|ARJ|BS-|BILLA|BILLAS|BOLA))/);
  if (inicio) return Number(inicio[1].replace(',', '.'));

  // Modo estructurado tradicional: medida + cantidad al final.
  const fin = u.match(/(\d+(?:[.,]\d+)?)(?:\s*(?:MTS?|METROS?|UND|UNIDADES?))?\s*$/);
  return fin ? Number(fin[1].replace(',', '.')) : 0;
}

function parseMedida(line: string, ctx: Contexto): string {
  const u = upper(line);
  let m: RegExpMatchArray | null;

  if (ctx.familia === 'ORINGS') {
    m = u.match(/\b2-\d{3}\b/); if (m) return normMeasure(m[0]);
    m = u.match(/\b\d+(?:[.,]\d+)?\s*[X*×]\s*\d+(?:[.,]\d+)?\b/); if (m) return normMeasure(m[0]);
  }

  if (ctx.familia === 'ABRAZADERAS') {
    m = u.match(/\b\d+(?:[.,]\d+)?\s*-\s*\d+(?:[.,]\d+)?\b/); if (m) return normMeasure(m[0]);
  }

  if (ctx.familia === 'SEGUROS') {
    m = u.match(/\b([EIR])[-]?(\d+)\b/); if (m) return normMeasure(`${m[1]}-${m[2]}`);
  }

  if (ctx.familia === 'PINES') {
    m = u.match(/\bM?\d+(?:[.,]\d+)?\s*[X*×]\s*\d+(?:[.,]\d+)?\b/); if (m) return normPinMeasure(m[0]);
  }

  if (ctx.familia === 'PASADORES') {
    m = u.match(/\b\d+\/\d+\s*"?\s*[X*×]\s*\d+(?:\/\d+)?\s*"?\b/); if (m) return normMeasure(m[0]);
  }

  if (ctx.familia === 'CORDONES') {
    m = u.match(/\b\d+(?:[.,]\d+)?\s*(?:MM|M\.M\.)\b/); if (m) return normCordonMeasure(m[0]);
    m = u.match(/\b\d+(?:[.,]\d+)?\b/); if (m) return normCordonMeasure(m[0]);
  }

  if (ctx.familia === 'BILLAS') {
    m = u.match(/\b\d+\/\d+\s*"?\b/); if (m) return normBillaMeasure(m[0]);
    m = u.match(/\b\d+(?:[.,]\d+)?\s*MM\b/); if (m) return normBillaMeasure(m[0]);
    m = u.match(/\b\d+(?:[.,]\d+)?\b/); if (m) return normBillaMeasure(m[0]);
  }

  if (ctx.familia === 'BONDED') {
    m = u.match(/\b(?:SCR|ARJ|BS)\s*-?\s*[\d\/".]+\b/); if (m) return normBondedCode(m[0]);
    m = u.match(/\bPERNO\s*(\d+(?:[.,]\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)\s*(?:MM|")?\b/); if (m) return `PERNO|${normPerno(m[1])}`;
  }

  m = u.match(/\b\d+(?:[.,]\d+)?\s*[X*×-]\s*\d+(?:[.,]\d+)?\b/);
  return m ? normMeasure(m[0]) : '';
}

function bondedAlternativas(medida: string): string[] {
  const base = [`BONDED|${medida}`];

  const code = medida.match(/^(SCR|ARJ|BS)-(.+)$/);
  if (code) {
    const num = code[2];
    base.push(`BONDED|SCR-${num}`, `BONDED|ARJ-${num}`, `BONDED|BS-${num}`);

    // En Jaless, varias formas comerciales pueden referirse a la misma arandela con jebe.
    // Ejemplo real: SCR-212 aparece en la descripción, pero el código comercial puede ser ARJ-212.
    if (num === '212') base.push('BONDED|ARJ-8', 'BONDED|SCR-212', 'BONDED|ARJ-212', 'BONDED|BS-212');
    if (num === '213') base.push('BONDED|ARJ-8', 'BONDED|SCR-213', 'BONDED|ARJ-213', 'BONDED|BS-213');
    return Array.from(new Set(base));
  }

  const perno = medida.match(/^PERNO\|(.+)$/);
  if (perno) {
    const p = perno[1];
    base.push(`BONDED|ARJ-${p}`);
    if (p === '8') base.push('BONDED|ARJ-8', 'BONDED|SCR-212', 'BONDED|SCR-213');
    if (p === '10') base.push('BONDED|ARJ-10');
    if (p === '12') base.push('BONDED|ARJ-12');
    return Array.from(new Set(base));
  }

  return Array.from(new Set(base));
}

function buildClaves(ctx: Contexto, medida: string): string[] {
  if (ctx.familia === 'ORINGS') return [`ORING|${ctx.material || 'NBR'}|${ctx.dureza || '70'}|${medida}`];

  if (ctx.familia === 'ABRAZADERAS' && ctx.tipo === 'CREMALLERA') {
    return [`ABR|CREMALLERA|${ctx.material || 'W1'}|${ctx.fleje || ''}|${medida}|${ctx.marca || 'JALESS'}`];
  }

  if (ctx.familia === 'ABRAZADERAS') return [`ABR|${ctx.tipo || ''}|${ctx.material || 'W1'}|${medida}|${ctx.marca || 'JALESS'}`];

  if (ctx.familia === 'SEGUROS') {
    const t = medida.startsWith('I-') ? 'INTERIOR' : medida.startsWith('E-') ? 'EXTERIOR' : medida.startsWith('R-') ? 'RADIAL' : '';
    return [`SEG|${t}|${medida}`];
  }

  if (ctx.familia === 'PINES') return [`PIN|${medida}`];
  if (ctx.familia === 'PASADORES') return [`PAS|${medida}`];
  if (ctx.familia === 'CORDONES') return [`CORDON|${ctx.material || 'NBR'}|${medida}`];
  if (ctx.familia === 'BONDED') return bondedAlternativas(medida);
  if (ctx.familia === 'BILLAS') return [`BILLA|${medida}`];

  return [`${ctx.familia || ''}|${medida}`];
}

export function interpretarPedido(texto: string): ItemInterpretado[] {
  const lines = texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let ctx: Contexto = {};
  const items: ItemInterpretado[] = [];

  for (const line of lines) {
    if (isHeader(line)) {
      ctx = contextFromLine(line, ctx);
      continue;
    }

    const possibleCtx = FAMILY_WORDS.test(upper(line)) ? contextFromLine(line, ctx) : ctx;
    const cantidad = parseCantidad(line);
    const medida = parseMedida(line, possibleCtx);
    if (!cantidad || !medida || !possibleCtx.familia) continue;

    ctx = possibleCtx;
    const claves = buildClaves(ctx, medida);
    const clave = claves[0];
    items.push({
      linea: line,
      cantidad,
      contexto: { ...ctx },
      medida,
      clave,
      claves,
      interpretado: clave,
    });
  }

  return items;
}
