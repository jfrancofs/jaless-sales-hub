import {
  normBillaMeasure,
  normBondedCode,
  normCordonMeasure,
  normMeasure,
  normPerno,
  normPinMeasure,
  upper,
} from './normalizadores';

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

const FAMILY_WORDS =
  /ORING|O'RING|O-RING|O\s+RING|JUNTA|ABRAZADERA|CREMALLERA|INDUSTRIAL|RSGU|SEGURO|SEEGUER|SEEGER|PIN|PASADOR|HORQUILLA|CORDON|CORDÓN|BONDED|ARANDELA|SCR|ARJ|BS-|BILLA|BILLAS|BOLA/;

type MedidaDetectada = {
  medida: string;
  inicio: number;
  fin: number;
};

type Pendiente = {
  cantidad?: number;
  medida?: string;
  lineaCantidad?: string;
  lineaMedida?: string;
  contexto?: Contexto;
};

function isOnlyQuantity(line: string): number | null {
  const u = upper(line);
  const m = u.match(
    /^\s*(\d+(?:[.,]\d+)?)\s*(?:MTS?|METROS?|UND|UNIDADES?)?\s*$/
  );
  if (!m) return null;
  const value = Number(m[1].replace(',', '.'));
  return value > 0 ? value : null;
}

function hasMeasureAndQty(line: string, ctx: Contexto): boolean {
  const medida = detectarMedida(line, ctx);
  if (!medida) return false;
  return parseCantidadSinMedida(line, medida) > 0;
}

function isHeader(line: string, previous: Contexto): boolean {
  const u = upper(line);
  if (!FAMILY_WORDS.test(u)) return false;

  const possibleCtx = contextFromLine(line, previous);
  if (detectarMedida(line, possibleCtx) && hasMeasureAndQty(line, possibleCtx)) {
    return false;
  }

  return !/^\s*\d+(?:[.,]\d+)?\s+(?=.*(?:ORING|O'RING|O-RING|ABRAZADERA|SEGURO|PIN|PASADOR|CORDON|CORDÓN|BONDED|ARANDELA|BILLA))/i.test(
    line
  );
}

function contextFromLine(line: string, previous: Contexto = {}): Contexto {
  const u = upper(line);

  if (
    /CORDON|CORDÓN|O\s*'?\s*RING\s*POR\s*METRO|ORING\s*POR\s*METRO|JEBE\s*POR\s*METRO/.test(
      u
    )
  ) {
    const material = /VITON|VITÓN|MARRON|MARRÓN|VTN/.test(u)
      ? 'VITON'
      : 'NBR';
    return { familia: 'CORDONES', material };
  }

  if (/ORING|O'RING|O-RING|O\s+RING|JUNTA\s*T[ÓO]RICA/.test(u)) {
    const material = /VITON|VITÓN|MARRON|MARRÓN/.test(u) ? 'VITON' : 'NBR';
    const dureza = /(?:D\s*90|DUREZA\s*90|SHORE\s*90|\b90\b)/.test(u)
      ? '90'
      : '70';
    return { familia: 'ORINGS', material, dureza };
  }

  if (/ABRAZADERA|CREMALLERA|INDUSTRIAL|RSGU/.test(u)) {
    const material = /W4/.test(u) ? 'W4' : /W3/.test(u) ? 'W3' : 'W1';
    const marca = /POWER/.test(u) ? 'POWER' : 'JALESS';
    const tipo = /INDUSTRIAL/.test(u)
      ? 'INDUSTRIAL'
      : /RSGU/.test(u)
        ? 'RSGU'
        : 'CREMALLERA';

    const ctx: Contexto = {
      familia: 'ABRAZADERAS',
      material,
      marca,
      tipo,
    };

    if (tipo === 'CREMALLERA') {
      // No se asume F9 si el cliente no lo indica.
      // Si existen F9 y F12, el cotizador mostrará ambas opciones.
      ctx.fleje = /(?:F\s*12|FLEJE\s*12|12\s*MM)/.test(u)
        ? '12'
        : /(?:F\s*9|FLEJE\s*9|9\s*MM)/.test(u)
          ? '9'
          : undefined;
    }

    return ctx;
  }

  if (/SEGURO|SEEGUER|SEEGER/.test(u)) return { familia: 'SEGUROS' };
  if (/\bPIN\b|PINES/.test(u)) return { familia: 'PINES' };
  if (/PASADOR|HORQUILLA/.test(u)) return { familia: 'PASADORES' };
  if (/BONDED|ARANDELA|SCR|ARJ|BS-/.test(u)) return { familia: 'BONDED' };
  if (/BILLA|BILLAS|BOLA/.test(u)) return { familia: 'BILLAS' };

  return { ...previous };
}

function aplicarModificadoresLinea(line: string, base: Contexto): Contexto {
  const u = upper(line);
  const ctx: Contexto = { ...base };

  if (ctx.familia === 'ABRAZADERAS') {
    if (/W4/.test(u)) ctx.material = 'W4';
    else if (/W3/.test(u)) ctx.material = 'W3';
    else if (/W1/.test(u)) ctx.material = 'W1';

    if (/POWER/.test(u)) ctx.marca = 'POWER';
    else if (/JALESS/.test(u)) ctx.marca = 'JALESS';

    if (/INDUSTRIAL/.test(u)) ctx.tipo = 'INDUSTRIAL';
    else if (/RSGU/.test(u)) ctx.tipo = 'RSGU';
    else if (/CREMALLERA/.test(u)) ctx.tipo = 'CREMALLERA';

    if (ctx.tipo === 'CREMALLERA') {
      if (/(?:F\s*12|FLEJE\s*12|12\s*MM)/.test(u)) ctx.fleje = '12';
      else if (/(?:F\s*9|FLEJE\s*9|9\s*MM)/.test(u)) ctx.fleje = '9';
    }
  }

  return ctx;
}

function detectarMedida(line: string, ctx: Contexto): MedidaDetectada | null {
  const u = upper(line);
  let m: RegExpMatchArray | null;

  const found = (match: RegExpMatchArray, medida: string): MedidaDetectada => ({
    medida,
    inicio: match.index ?? 0,
    fin: (match.index ?? 0) + match[0].length,
  });

  if (ctx.familia === 'ORINGS') {
    m = u.match(/\b2-\d{3}\b/);
    if (m) return found(m, normMeasure(m[0]));

    m = u.match(/\b\d+(?:[.,]\d+)?\s*[X*×]\s*\d+(?:[.,]\d+)?\b/);
    if (m) return found(m, normMeasure(m[0]));
  }

  if (ctx.familia === 'ABRAZADERAS') {
    m = u.match(/\b\d+(?:[.,]\d+)?\s*-\s*\d+(?:[.,]\d+)?\b/);
    if (m) return found(m, normMeasure(m[0]));
  }

  if (ctx.familia === 'SEGUROS') {
    m = u.match(/\b([EIR])[-]?(\d+)\b/);
    if (m) return found(m, normMeasure(`${m[1]}-${m[2]}`));
  }

  if (ctx.familia === 'PINES') {
    m = u.match(/\bM?\d+(?:[.,]\d+)?\s*[X*×]\s*\d+(?:[.,]\d+)?\b/);
    if (m) return found(m, normPinMeasure(m[0]));
  }

  if (ctx.familia === 'PASADORES') {
    m = u.match(/\b\d+\/\d+\s*"?\s*[X*×]\s*\d+(?:\/\d+)?\s*"?\b/);
    if (m) return found(m, normMeasure(m[0]));
  }

  if (ctx.familia === 'CORDONES') {
    m = u.match(/\b\d+(?:[.,]\d+)?\s*(?:MM|M\.M\.)\b/);
    if (m) return found(m, normCordonMeasure(m[0]));

    m = u.match(/\b\d+(?:[.,]\d+)?\b/);
    if (m) return found(m, normCordonMeasure(m[0]));
  }

  if (ctx.familia === 'BILLAS') {
    m = u.match(/\b\d+\/\d+\s*"?\b/);
    if (m) return found(m, normBillaMeasure(m[0]));

    m = u.match(/\b\d+(?:[.,]\d+)?\s*MM\b/);
    if (m) return found(m, normBillaMeasure(m[0]));

    m = u.match(/\b\d+(?:[.,]\d+)?\b/);
    if (m) return found(m, normBillaMeasure(m[0]));
  }

  if (ctx.familia === 'BONDED') {
    m = u.match(/\b(?:SCR|ARJ|BS)\s*-?\s*[\d\/".]+\b/);
    if (m) return found(m, normBondedCode(m[0]));

    m = u.match(
      /\bPERNO\s*(\d+(?:[.,]\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)\s*(?:MM|")?\b/
    );
    if (m) return found(m, `PERNO|${normPerno(m[1])}`);
  }

  m = u.match(/\b\d+(?:[.,]\d+)?\s*[X*×-]\s*\d+(?:[.,]\d+)?\b/);
  return m ? found(m, normMeasure(m[0])) : null;
}

function parseCantidadSinMedida(
  line: string,
  medidaDetectada: MedidaDetectada
): number {
  const u = upper(line);

  const sinMedida = `${u.slice(0, medidaDetectada.inicio)} ${u.slice(
    medidaDetectada.fin
  )}`
    .replace(FAMILY_WORDS, ' ')
    .replace(
      /\b(?:DE|DEL|LA|EL|LOS|LAS|TIPO|F9|F12|FLEJE|W1|W3|W4|NBR|VITON|VITÓN|NITRILO|MARRON|MARRÓN|JALESS|POWER)\b/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  const inicio = sinMedida.match(
    /^\s*(\d+(?:[.,]\d+)?)\s*(?:MTS?|METROS?|UND|UNIDADES?)?\b/
  );
  if (inicio) return Number(inicio[1].replace(',', '.'));

  const fin = sinMedida.match(
    /\b(\d+(?:[.,]\d+)?)\s*(?:MTS?|METROS?|UND|UNIDADES?)?\s*$/
  );
  return fin ? Number(fin[1].replace(',', '.')) : 0;
}

function bondedAlternativas(medida: string): string[] {
  const base = [`BONDED|${medida}`];

  const code = medida.match(/^(SCR|ARJ|BS)-(.+)$/);
  if (code) {
    const num = code[2];
    base.push(`BONDED|SCR-${num}`, `BONDED|ARJ-${num}`, `BONDED|BS-${num}`);

    if (num === '212') {
      base.push(
        'BONDED|ARJ-8',
        'BONDED|SCR-212',
        'BONDED|ARJ-212',
        'BONDED|BS-212'
      );
    }

    if (num === '213') {
      base.push(
        'BONDED|ARJ-8',
        'BONDED|SCR-213',
        'BONDED|ARJ-213',
        'BONDED|BS-213'
      );
    }

    return Array.from(new Set(base));
  }

  const perno = medida.match(/^PERNO\|(.+)$/);
  if (perno) {
    const p = perno[1];
    base.push(`BONDED|ARJ-${p}`);
    if (p === '8') {
      base.push('BONDED|ARJ-8', 'BONDED|SCR-212', 'BONDED|SCR-213');
    }
    if (p === '10') base.push('BONDED|ARJ-10');
    if (p === '12') base.push('BONDED|ARJ-12');
  }

  return Array.from(new Set(base));
}

function buildClaves(ctx: Contexto, medida: string): string[] {
  if (ctx.familia === 'ORINGS') {
    const material = ctx.material || 'NBR';

    if (material === 'VITON') {
      // Formato real de productos_catalogo:
      // ORING|VITON||MEDIDA
      // El doble separador representa la dureza vacía.
      return [`ORING|VITON||${medida}`];
    }

    return [`ORING|NBR|${ctx.dureza || '70'}|${medida}`];
  }

  if (ctx.familia === 'ABRAZADERAS' && ctx.tipo === 'CREMALLERA') {
    const material = ctx.material || 'W1';
    const marca = ctx.marca || 'JALESS';

    if (ctx.fleje) {
      return [`ABR|CREMALLERA|${material}|${ctx.fleje}|${medida}|${marca}`];
    }

    // Si no se indicó fleje, se consultan ambas claves.
    // Si solo existe una, se seleccionará automáticamente.
    // Si existen F9 y F12, el cotizador mostrará las dos opciones.
    return [
      `ABR|CREMALLERA|${material}|9|${medida}|${marca}`,
      `ABR|CREMALLERA|${material}|12|${medida}|${marca}`,
    ];
  }

  if (ctx.familia === 'ABRAZADERAS') {
    return [
      `ABR|${ctx.tipo || ''}|${ctx.material || 'W1'}|${medida}|${ctx.marca || 'JALESS'}`,
    ];
  }

  if (ctx.familia === 'SEGUROS') {
    const tipo = medida.startsWith('I-')
      ? 'INTERIOR'
      : medida.startsWith('E-')
        ? 'EXTERIOR'
        : medida.startsWith('R-')
          ? 'RADIAL'
          : '';

    return [`SEG|${tipo}|${medida}`];
  }

  if (ctx.familia === 'PINES') return [`PIN|${medida}`];
  if (ctx.familia === 'PASADORES') return [`PAS|${medida}`];
  if (ctx.familia === 'CORDONES') {
    return [`CORDON|${ctx.material || 'NBR'}|${medida}`];
  }
  if (ctx.familia === 'BONDED') return bondedAlternativas(medida);
  if (ctx.familia === 'BILLAS') return [`BILLA|${medida}`];

  return [`${ctx.familia || ''}|${medida}`];
}

function crearItem(
  linea: string,
  cantidad: number,
  medida: string,
  contexto: Contexto
): ItemInterpretado {
  const claves = buildClaves(contexto, medida);

  return {
    linea,
    cantidad,
    contexto: { ...contexto },
    medida,
    clave: claves[0],
    claves,
    interpretado: claves[0],
  };
}

export function interpretarPedido(texto: string): ItemInterpretado[] {
  const lines = texto
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean);

  let ctx: Contexto = {};
  let pendiente: Pendiente = {};
  const items: ItemInterpretado[] = [];

  const limpiarPendiente = () => {
    pendiente = {};
  };

  for (const line of lines) {
    if (isHeader(line, ctx)) {
      ctx = contextFromLine(line, ctx);
      limpiarPendiente();
      continue;
    }

    const tieneFamilia = FAMILY_WORDS.test(upper(line));
    const contextoBase = tieneFamilia ? contextFromLine(line, ctx) : ctx;
    const possibleCtx = aplicarModificadoresLinea(line, contextoBase);

    const cantidadSola = isOnlyQuantity(line);
    const medidaDetectada = possibleCtx.familia
      ? detectarMedida(line, possibleCtx)
      : null;

    if (medidaDetectada && possibleCtx.familia) {
      const cantidadEnLinea = parseCantidadSinMedida(line, medidaDetectada);
      const cantidad = cantidadEnLinea || pendiente.cantidad || 0;

      if (cantidad > 0) {
        ctx = possibleCtx;
        items.push(
          crearItem(
            pendiente.lineaCantidad
              ? `${pendiente.lineaCantidad} ${line}`
              : line,
            cantidad,
            medidaDetectada.medida,
            ctx
          )
        );
        limpiarPendiente();
        continue;
      }

      pendiente = {
        ...pendiente,
        medida: medidaDetectada.medida,
        lineaMedida: line,
        contexto: { ...possibleCtx },
      };
      ctx = possibleCtx;
      continue;
    }

    if (cantidadSola !== null) {
      if (pendiente.medida && (pendiente.contexto || ctx).familia) {
        const contexto = pendiente.contexto || ctx;
        items.push(
          crearItem(
            `${pendiente.lineaMedida || ''} ${line}`.trim(),
            cantidadSola,
            pendiente.medida,
            contexto
          )
        );
        ctx = contexto;
        limpiarPendiente();
      } else {
        pendiente = {
          cantidad: cantidadSola,
          lineaCantidad: line,
          contexto: { ...possibleCtx },
        };
      }
      continue;
    }

    if (tieneFamilia) {
      ctx = possibleCtx;
    }
  }

  return items;
}
