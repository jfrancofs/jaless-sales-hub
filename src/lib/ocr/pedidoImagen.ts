export type EstadoLineaImagen = 'Confirmado' | 'Revisar' | 'No encontrado';

export type LineaPedidoImagen = {
  id: string;
  original: string;
  texto: string;
  estado: EstadoLineaImagen;
  confianza?: number;
  fuente?: 'tabla' | 'texto';
};

export type PalabraOCR = {
  texto: string;
  confianza: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

type CeldaDetectada = {
  cantidad: string;
  producto: string;
  xProducto: number;
  confianza: number;
  original: string;
};

type EncabezadoColumna = {
  x: number;
  familia: 'ORING_NBR' | 'ORING_VITON' | 'CORDON' | 'DESCONOCIDA';
};

const PALABRAS_FAMILIA = [
  'ORING', "O'RING", 'ORINGS', 'VITON', 'NITRILO', 'ABRAZADERA', 'ABRAZADERAS',
  'CORDON', 'CORDONES', 'SEGURO', 'SEGUROS', 'PIN', 'PINES', 'PASADOR', 'PASADORES',
  'BILLA', 'BILLAS', 'BONDED', 'ARANDELA', 'JEBE',
];

function sinAcentos(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function limpiarCaracteres(valor: string): string {
  return valor
    .replace(/[|¦]/g, ' ')
    .replace(/[×✕]/g, 'x')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizarTokenOCR(valor: string): string {
  return limpiarCaracteres(valor)
    .replace(/(?<=\d)[Oo](?=\d|\b)/g, '0')
    .replace(/(?<=\d)[Il](?=\d|\b)/g, '1')
    .replace(/(?<=\d)\s*[xX*]\s*(?=\d)/g, 'x')
    .replace(/(?<=\d)\s*-\s*(?=\d)/g, '-');
}

function pareceEncabezado(linea: string): boolean {
  const upper = sinAcentos(linea).toUpperCase();
  return PALABRAS_FAMILIA.some((palabra) => upper.includes(palabra)) && !/\d/.test(linea);
}

function contieneMedida(linea: string): boolean {
  return (
    /\d+(?:[.,]\d+)?\s*[x*]\s*\d+(?:[.,]\d+)?/i.test(linea) ||
    /\d+\s*-\s*\d+/.test(linea) ||
    /\b\d-\d{3}\b/.test(linea) ||
    /\b[IE]-?\d{2,3}\b/i.test(linea) ||
    /\b\d+(?:\/\d+)?\s*"?\b/.test(linea) ||
    /\b(?:SCR|ARJ|BS)-?\d+\b/i.test(linea)
  );
}

function contieneCantidad(linea: string): boolean {
  const numeros = linea.match(/\d+(?:[.,]\d+)?/g) || [];
  return numeros.length >= 2 || /^\s*\d+(?:[.,]\d+)?\s+/.test(linea);
}

function normalizarLineaComercial(linea: string): string {
  return limpiarCaracteres(linea)
    .replace(/(\d)\s*[xX*]\s*(\d)/g, '$1x$2')
    .replace(/(\d)\s*-\s*(\d)/g, '$1-$2')
    .replace(/\bO\s*RINGS?\b/gi, "O'Rings")
    .replace(/\bVIT[OÓ]N\b/gi, 'Vitón')
    .replace(/\bNITRILO\b/gi, 'Nitrilo')
    .replace(/\bMM\.?\b/gi, 'mm')
    .replace(/\bMTS?\.?\b/gi, 'metros')
    .trim();
}

function mediana(valores: number[]): number {
  if (valores.length === 0) return 12;
  const ordenados = [...valores].sort((a, b) => a - b);
  const mitad = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 === 0
    ? (ordenados[mitad - 1] + ordenados[mitad]) / 2
    : ordenados[mitad];
}

export function parsearTSV(tsv: string): PalabraOCR[] {
  if (!tsv?.trim()) return [];
  const lineas = tsv.split(/\r?\n/);
  const cabecera = lineas[0]?.split('\t') || [];
  const pos = (nombre: string) => cabecera.indexOf(nombre);
  const iLevel = pos('level');
  const iLeft = pos('left');
  const iTop = pos('top');
  const iWidth = pos('width');
  const iHeight = pos('height');
  const iConf = pos('conf');
  const iText = pos('text');

  if ([iLeft, iTop, iWidth, iHeight, iText].some((i) => i < 0)) return [];

  return lineas.slice(1).flatMap((linea) => {
    const campos = linea.split('\t');
    if (iLevel >= 0 && Number(campos[iLevel]) !== 5) return [];
    const texto = normalizarTokenOCR(campos[iText] || '');
    if (!texto) return [];
    const x0 = Number(campos[iLeft] || 0);
    const y0 = Number(campos[iTop] || 0);
    const width = Number(campos[iWidth] || 0);
    const height = Number(campos[iHeight] || 0);
    const confianza = Math.max(0, Number(campos[iConf] || 0));
    return [{ texto, confianza, x0, y0, x1: x0 + width, y1: y0 + height }];
  });
}

export function extraerPalabrasDesdeBlocks(blocks: unknown): PalabraOCR[] {
  const resultado: PalabraOCR[] = [];

  function visitar(nodo: any): void {
    if (!nodo || typeof nodo !== 'object') return;

    if (Array.isArray(nodo.words)) {
      for (const palabra of nodo.words) visitar(palabra);
    } else {
      const texto = normalizarTokenOCR(String(nodo.text || ''));
      const bbox = nodo.bbox || nodo.boundingBox;
      const confianza = Number(nodo.confidence ?? nodo.conf ?? 0);

      if (
        texto &&
        bbox &&
        Number.isFinite(Number(bbox.x0)) &&
        Number.isFinite(Number(bbox.y0)) &&
        Number.isFinite(Number(bbox.x1)) &&
        Number.isFinite(Number(bbox.y1))
      ) {
        resultado.push({
          texto,
          confianza: Math.max(0, confianza),
          x0: Number(bbox.x0),
          y0: Number(bbox.y0),
          x1: Number(bbox.x1),
          y1: Number(bbox.y1),
        });
      }
    }

    for (const clave of ['blocks', 'paragraphs', 'lines', 'symbols']) {
      const hijos = nodo[clave];
      if (Array.isArray(hijos)) {
        for (const hijo of hijos) visitar(hijo);
      }
    }
  }

  if (Array.isArray(blocks)) {
    for (const bloque of blocks) visitar(bloque);
  } else {
    visitar(blocks);
  }

  const unicas = new Map<string, PalabraOCR>();
  for (const palabra of resultado) {
    const clave = `${palabra.texto}|${Math.round(palabra.x0)}|${Math.round(palabra.y0)}|${Math.round(palabra.x1)}|${Math.round(palabra.y1)}`;
    if (!unicas.has(clave)) unicas.set(clave, palabra);
  }

  return Array.from(unicas.values());
}

function agruparPorFila(palabras: PalabraOCR[]): PalabraOCR[][] {
  if (palabras.length === 0) return [];
  const alturaMedia = mediana(palabras.map((p) => p.y1 - p.y0).filter((h) => h > 0));
  const tolerancia = Math.max(5, alturaMedia * 0.65);
  const ordenadas = [...palabras].sort((a, b) => ((a.y0 + a.y1) / 2) - ((b.y0 + b.y1) / 2) || a.x0 - b.x0);
  const filas: { centroY: number; palabras: PalabraOCR[] }[] = [];

  for (const palabra of ordenadas) {
    const centro = (palabra.y0 + palabra.y1) / 2;
    let fila = filas.find((f) => Math.abs(f.centroY - centro) <= tolerancia);
    if (!fila) {
      fila = { centroY: centro, palabras: [] };
      filas.push(fila);
    }
    fila.palabras.push(palabra);
    fila.centroY = fila.palabras.reduce((s, p) => s + (p.y0 + p.y1) / 2, 0) / fila.palabras.length;
  }

  return filas
    .sort((a, b) => a.centroY - b.centroY)
    .map((f) => f.palabras.sort((a, b) => a.x0 - b.x0));
}

function esCantidad(valor: string): boolean {
  return /^\d{1,5}(?:[.,]\d+)?$/.test(valor) && Number(valor.replace(',', '.')) > 0;
}

function esProductoTabla(valor: string): boolean {
  const v = normalizarTokenOCR(valor).replace(/\s/g, '');
  return (
    /^\d-\d{2,3}$/i.test(v) ||
    /^\d+(?:[.,]\d+)?(?:MM)?$/i.test(v) ||
    /^\d+(?:[.,]\d+)?[xX*]\d+(?:[.,]\d+)?$/i.test(v) ||
    /^[IE]-?\d{2,3}$/i.test(v) ||
    /^(?:SCR|ARJ|BS)-?\d+$/i.test(v) ||
    /^\d+\/\d+"?$/i.test(v)
  );
}

function detectarEncabezados(filas: PalabraOCR[][]): EncabezadoColumna[] {
  const encabezados: EncabezadoColumna[] = [];

  for (const fila of filas.slice(0, 8)) {
    const textoFila = sinAcentos(fila.map((p) => p.texto).join(' ')).toUpperCase();
    if (!/(ORING|CORDON|VITON|CANTIDAD)/.test(textoFila)) continue;

    for (let i = 0; i < fila.length; i += 1) {
      const palabra = sinAcentos(fila[i].texto).toUpperCase();
      if (palabra.includes('CORDON')) {
        encabezados.push({ x: (fila[i].x0 + fila[i].x1) / 2, familia: 'CORDON' });
      }
      if (palabra.includes('ORING') || palabra === 'RING') {
        const cercanas = fila
          .filter((p) => Math.abs(((p.x0 + p.x1) / 2) - ((fila[i].x0 + fila[i].x1) / 2)) < 540)
          .map((p) => sinAcentos(p.texto).toUpperCase())
          .join(' ');
        encabezados.push({
          x: (fila[i].x0 + fila[i].x1) / 2,
          familia: cercanas.includes('VITON') ? 'ORING_VITON' : 'ORING_NBR',
        });
      }
    }
  }

  return encabezados.sort((a, b) => a.x - b.x);
}

function familiaPorPosicion(x: number, encabezados: EncabezadoColumna[]): EncabezadoColumna['familia'] {
  if (encabezados.length === 0) return 'DESCONOCIDA';
  return encabezados.reduce((mejor, actual) =>
    Math.abs(actual.x - x) < Math.abs(mejor.x - x) ? actual : mejor
  ).familia;
}

function extraerCeldas(fila: PalabraOCR[]): CeldaDetectada[] {
  const celdas: CeldaDetectada[] = [];
  const tokens = fila.map((p) => ({ ...p, texto: normalizarTokenOCR(p.texto) }));

  for (let i = 0; i < tokens.length - 1; i += 1) {
    const cantidad = tokens[i];
    if (!esCantidad(cantidad.texto)) continue;

    // El producto suele estar en la celda inmediata a la derecha. Permitimos unir
    // dos fragmentos cuando Tesseract separa "2-" y "010".
    for (let j = i + 1; j <= Math.min(i + 3, tokens.length - 1); j += 1) {
      const candidato = tokens[j];
      if (candidato.x0 < cantidad.x1) continue;
      if (candidato.x0 - cantidad.x1 > 800) break;

      const simples = [candidato.texto];
      if (j + 1 < tokens.length && tokens[j + 1].x0 - candidato.x1 < 140) {
        simples.push(`${candidato.texto}${tokens[j + 1].texto}`);
      }

      const producto = simples.find(esProductoTabla);
      if (!producto) continue;

      const confianza = Math.round((cantidad.confianza + candidato.confianza) / 2);
      celdas.push({
        cantidad: cantidad.texto.replace(',', '.'),
        producto: normalizarLineaComercial(producto),
        xProducto: (candidato.x0 + candidato.x1) / 2,
        confianza,
        original: `${cantidad.texto} ${producto}`,
      });
      i = j;
      break;
    }
  }

  return celdas;
}

function encabezadoFamilia(familia: EncabezadoColumna['familia']): string {
  if (familia === 'ORING_VITON') return "O'rings de Vitón";
  if (familia === 'ORING_NBR') return "O'rings de Nitrilo";
  if (familia === 'CORDON') return 'Cordón';
  return 'Productos';
}

export function construirLineasPedidoImagenDesdePalabras(palabrasEntrada: PalabraOCR[], textoOCR = ''): LineaPedidoImagen[] {
  const palabras = palabrasEntrada.filter((p) => p.confianza >= 5 || /\d/.test(p.texto));
  const filas = agruparPorFila(palabras);
  const encabezados = detectarEncabezados(filas);
  const detectadas: { familia: EncabezadoColumna['familia']; celda: CeldaDetectada }[] = [];

  for (const fila of filas) {
    const texto = sinAcentos(fila.map((p) => p.texto).join(' ')).toUpperCase();
    if (/(CANTIDAD|ORING|VITON|CORDON)/.test(texto) && !/\d-\d{2,3}/.test(texto)) continue;
    for (const celda of extraerCeldas(fila)) {
      detectadas.push({ familia: familiaPorPosicion(celda.xProducto, encabezados), celda });
    }
  }

  if (detectadas.length < 3) return construirLineasPedidoImagen(textoOCR);

  const ordenFamilias: EncabezadoColumna['familia'][] = ['ORING_NBR', 'ORING_VITON', 'CORDON', 'DESCONOCIDA'];
  const resultado: LineaPedidoImagen[] = [];
  let indice = 0;

  for (const familia of ordenFamilias) {
    const items = detectadas.filter((d) => d.familia === familia);
    if (items.length === 0) continue;

    resultado.push({
      id: `ocr-tabla-${Date.now()}-${indice++}`,
      original: encabezadoFamilia(familia),
      texto: encabezadoFamilia(familia),
      estado: familia === 'DESCONOCIDA' ? 'Revisar' : 'Confirmado',
      confianza: familia === 'DESCONOCIDA' ? 60 : 99,
      fuente: 'tabla',
    });

    for (const { celda } of items) {
      const estado: EstadoLineaImagen = celda.confianza >= 70 ? 'Confirmado' : 'Revisar';
      resultado.push({
        id: `ocr-tabla-${Date.now()}-${indice++}`,
        original: celda.original,
        texto: `${celda.producto} ${celda.cantidad}`,
        estado,
        confianza: celda.confianza,
        fuente: 'tabla',
      });
    }
  }

  return resultado;
}

export function construirLineasPedidoImagenDesdeTSV(
  tsv: string,
  textoOCR = ''
): LineaPedidoImagen[] {
  return construirLineasPedidoImagenDesdePalabras(parsearTSV(tsv), textoOCR);
}


export function construirLineasPedidoImagen(textoOCR: string): LineaPedidoImagen[] {
  return textoOCR
    .split(/\r?\n/)
    .map(limpiarCaracteres)
    .filter((linea) => linea.length >= 2)
    .map((linea, index) => {
      const texto = normalizarLineaComercial(linea);
      let estado: EstadoLineaImagen = 'No encontrado';

      if (pareceEncabezado(texto)) estado = 'Confirmado';
      else if (contieneMedida(texto) && contieneCantidad(texto)) estado = 'Confirmado';
      else if (contieneMedida(texto) || /\d/.test(texto)) estado = 'Revisar';

      return {
        id: `ocr-${Date.now()}-${index}`,
        original: linea,
        texto,
        estado,
        confianza: estado === 'Confirmado' ? 90 : estado === 'Revisar' ? 55 : 20,
        fuente: 'texto',
      };
    });
}

export function convertirLineasATexto(lineas: LineaPedidoImagen[]): string {
  return lineas
    .filter((linea) => linea.texto.trim().length > 0)
    .map((linea) => linea.texto.trim())
    .join('\n');
}
