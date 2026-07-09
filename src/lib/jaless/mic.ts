export type Interpretado = {
  original: string;
  cantidad: number;
  categoria: string;
  clave: string;
  descripcionInterpretada: string;
  requiereRevision?: boolean;
  motivo?: string;
};

type Contexto = { categoria?: string; material?: string; dureza?: string; tipo?: string; fleje?: string; marca?: string };

export const DEFAULT_TEXT = `O'rings de Nitrilo
3x15 20
3x25 20
2.5x50 20
2-203 100
2-010 100

Abrazaderas de cremallera F9 W1
8-12 100
10-16 100
16-27 30

Abrazaderas industriales W1
40-43 50

seguros
I-020 20
E-010 20

Pin de expansion
8*40 10
10*60 10

Pasadores
5/32\"x1\" 100`;

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();
const upper = (value: string) => clean(value).toUpperCase();

function isHeader(line: string): boolean {
  const t = upper(line);
  return /ORING|O'RING|O-RING|O RING|O\s*RINGS|ABRAZADER|SEGURO|PIN|PASADOR|CORDON|CORDÓN|BONDED|BOND|BILLA|BOLA/.test(t);
}

function parseHeader(line: string): Contexto {
  const t = upper(line);
  if (/ORING|O'RING|O-RING|O RING|O\s*RINGS/.test(t)) return { categoria: "O'Rings", material: /VITON|VITÓN|MARRON|MARRÓN/.test(t) ? 'VITON' : 'NBR', dureza: /DUREZA\s*90|D90|SHORE\s*90|\b90\b/.test(t) ? '90' : '70' };
  if (/ABRAZADER/.test(t)) return { categoria: 'Abrazaderas', tipo: /INDUSTRIAL/.test(t) ? 'INDUSTRIAL' : /RSGU/.test(t) ? 'RSGU' : 'CREMALLERA', material: /W4/.test(t) ? 'W4' : /W3/.test(t) ? 'W3' : /W1/.test(t) ? 'W1' : undefined, marca: /POWER/.test(t) ? 'POWER' : 'JALESS', fleje: (t.match(/(?:F|FLEJE\s*)\s*(9|12)\b|\b(9|12)\s*MM\b/)?.[1] || t.match(/(?:F|FLEJE\s*)\s*(9|12)\b|\b(9|12)\s*MM\b/)?.[2]) };
  if (/SEGURO/.test(t)) return { categoria: 'Seguros' };
  if (/PIN/.test(t)) return { categoria: 'Pines de Expansión' };
  if (/PASADOR/.test(t)) return { categoria: 'Pasadores de Horquilla' };
  if (/CORDON|CORDÓN/.test(t)) return { categoria: 'Cordones', material: /VITON|VITÓN/.test(t) ? 'VITON' : /NBR|NITRILO/.test(t) ? 'NBR' : undefined };
  if (/BONDED|BOND/.test(t)) return { categoria: 'Bonded Seal' };
  if (/BILLA|BOLA/.test(t)) return { categoria: 'Billas de Acero' };
  return {};
}

function splitCantidad(line: string): { detalle: string; cantidad: number } | null {
  const m = clean(line).match(/^(.*?)[\s\t]+(\d+(?:[.,]\d+)?)$/);
  return m ? { detalle: clean(m[1]), cantidad: Number(m[2].replace(',', '.')) } : null;
}

function fmtNum(n: number): string { return Number.isInteger(n) ? String(n) : String(n).replace(/0+$/, '').replace(/\.$/, ''); }
function normMetric(v: string): string { const m = upper(v).replace(/,/g, '.').match(/^(\d+(?:\.\d+)?)\s*[X*]\s*(\d+(?:\.\d+)?)$/); return m ? `${fmtNum(Number(m[1]))}X${fmtNum(Number(m[2]))}` : upper(v); }
function normAs568(v: string): string { const t = upper(v).replace(/\s+/g, ''); const m = t.match(/^(\d)-?(\d{3})$/); return m ? `${m[1]}-${m[2]}` : t; }
function normClamp(v: string): string { return upper(v).replace(/\s+/g, '').replace(/[–—]/g, '-'); }
function normPin(v: string): string { const t = upper(v).replace(/\s+/g, '').replace(/X/g, '*'); const m = t.match(/^M?(\d+(?:\.\d+)?)\*(\d+(?:\.\d+)?)$/); return m ? `M${m[1]}*${m[2]}` : t; }
function normPasador(v: string): string { return upper(v).replace(/\s+/g, '').replace(/\"|”/g, ''); }
function normSeguro(v: string): { tipo: string; medida: string } | null { const m = upper(v).replace(/\s+/g, '').match(/^([EIR])\-?(\d{1,3})$/); if (!m) return null; return { tipo: m[1] === 'I' ? 'INTERIOR' : m[1] === 'E' ? 'EXTERIOR' : 'RADIAL', medida: `${m[1]}-${m[2].padStart(3, '0')}` }; }

function buildClave(ctx: Contexto, detalleRaw: string) {
  const detalle = upper(detalleRaw);
  if (ctx.categoria === "O'Rings") {
    const material = ctx.material || (/VITON|VITÓN|MARRON|MARRÓN/.test(detalle) ? 'VITON' : 'NBR');
    const dureza = /DUREZA\s*90|D90|SHORE\s*90|\b90\b/.test(detalle) ? '90' : (ctx.dureza || '70');
    const base = clean(detalleRaw).replace(/ORING|O'RING|O-RING|O RING|NITRILO|NBR|VITON|VITÓN|DUREZA|SHORE|D90|90/gi, '').trim();
    const medida = /^\d-?\d{3}$/i.test(base.replace(/\s+/g, '')) ? normAs568(base) : normMetric(base);
    return { clave: `JUNTA TÓRICA|${material}|${dureza}|${medida}`, categoria: "O'Rings", interpretado: `O'Rings ${material} D${dureza} ${medida}` };
  }
  if (ctx.categoria === 'Abrazaderas') {
    const tipo = ctx.tipo || (/INDUSTRIAL/.test(detalle) ? 'INDUSTRIAL' : 'CREMALLERA');
    const material = ctx.material || (/W4/.test(detalle) ? 'W4' : /W3/.test(detalle) ? 'W3' : /W1/.test(detalle) ? 'W1' : undefined);
    const marca = /POWER/.test(detalle) ? 'POWER' : (ctx.marca || 'JALESS');
    const medida = normClamp(detalle.match(/\b\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\b/)?.[0] || detalleRaw);
    if (tipo === 'CREMALLERA') {
      const fleje = (detalle.match(/(?:F|FLEJE\s*)\s*(9|12)\b|\b(9|12)\s*MM\b/)?.[1] || detalle.match(/(?:F|FLEJE\s*)\s*(9|12)\b|\b(9|12)\s*MM\b/)?.[2] || ctx.fleje);
      if (!fleje || !material) return { clave: '', categoria: 'Abrazaderas', interpretado: `Abrazaderas Cremallera ${medida}`, requiereRevision: true, motivo: 'Falta fleje o material' };
      return { clave: `ABR|CREMALLERA|${material}|${fleje}|${medida}|${marca}`, categoria: 'Abrazaderas', interpretado: `Abrazaderas ${material} Cremallera ${fleje}mm ${marca} ${medida}` };
    }
    if (!material) return { clave: '', categoria: 'Abrazaderas', interpretado: `Abrazaderas ${tipo} ${medida}`, requiereRevision: true, motivo: 'Falta material W1/W3/W4' };
    return { clave: `ABR|${tipo}|${material}|${medida}|${marca}`, categoria: 'Abrazaderas', interpretado: `Abrazaderas ${material} ${tipo} ${marca} ${medida}` };
  }
  if (ctx.categoria === 'Seguros') { const s = normSeguro(detalleRaw); return s ? { clave: `SEG|${s.tipo}|${s.medida}`, categoria: 'Seguros', interpretado: `Seguros ${s.tipo} ${s.medida}` } : { clave: '', categoria: 'Seguros', interpretado: `Seguros ${detalleRaw}`, requiereRevision: true, motivo: 'No se identificó tipo' }; }
  if (ctx.categoria === 'Pines de Expansión') { const m = normPin(detalleRaw); return { clave: `PIN|${m}`, categoria: 'Pines de Expansión', interpretado: `Pines de Expansión ${m}` }; }
  if (ctx.categoria === 'Pasadores de Horquilla') { const m = normPasador(detalleRaw); return { clave: `PAS|${m}`, categoria: 'Pasadores de Horquilla', interpretado: `Pasadores de Horquilla ${m}` }; }
  if (ctx.categoria === 'Cordones') { const material = ctx.material || (/VITON|VITÓN/.test(detalle) ? 'VITON' : /NBR|NITRILO/.test(detalle) ? 'NBR' : ''); const medida = upper(detalleRaw).replace(/MM/g, '').replace(/\s+/g, ''); return { clave: `CORDON|${material}|${medida}MM`, categoria: 'Cordones', interpretado: `Cordón ${material} ${medida}mm` }; }
  return { clave: '', categoria: 'Sin categoría', interpretado: detalleRaw, requiereRevision: true, motivo: 'Sin contexto de familia' };
}

export function interpretarPedido(texto: string): Interpretado[] {
  const lines = texto.split(/\r?\n/).map(clean).filter(Boolean);
  let ctx: Contexto = {};
  const result: Interpretado[] = [];
  for (const line of lines) {
    if (isHeader(line) && !splitCantidad(line)) { ctx = parseHeader(line); continue; }
    const parsed = splitCantidad(line);
    if (!parsed) continue;
    if (isHeader(parsed.detalle)) ctx = { ...parseHeader(parsed.detalle) };
    const built = buildClave(ctx, parsed.detalle);
    result.push({ original: line, cantidad: parsed.cantidad, categoria: built.categoria, clave: built.clave, descripcionInterpretada: built.interpretado, requiereRevision: built.requiereRevision, motivo: built.motivo });
  }
  return result;
}
