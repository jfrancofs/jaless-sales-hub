import type { Producto } from '@/types/comercial';
import { upperLocal } from '@/lib/utils/format';

function tieneInox(texto: string) {
  const t = upperLocal(texto);
  return /(INOX|INOXIDABLE|STAINLESS|\bSS\b|\b304\b|\b316\b)/.test(t);
}

function esInox(producto: Producto) {
  const t = upperLocal(`${producto.codigo} ${producto.descripcion} ${producto.clave_busqueda}`);
  return /(INOX|INOXIDABLE|STAINLESS|\bSS\b|\b304\b|\b316\b)/.test(t);
}

function normalizarMedidaPasador(value: unknown) {
  return upperLocal(value)
    .replace(/\s+/g, '')
    .replace(/[×*]/g, 'X')
    .replace(/"/g, '')
    .replace(/,/g, '.');
}

function extraerMedidaPasador(linea: string) {
  const u = upperLocal(linea);
  const m = u.match(/\b\d+\/\d+\s*"?\s*[X*×]\s*\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?\s*"?/);
  return m ? normalizarMedidaPasador(m[0]) : '';
}

function esBondedCarbonSteel(producto: Producto) {
  const t = upperLocal(`${producto.codigo} ${producto.descripcion} ${producto.clave_busqueda}`);
  return /CARBON\s*STEEL|ACERO|ZINCADO|NBR70/.test(t) && !esInox(producto);
}

function soloUnProducto(candidatos: Producto[], selector: (producto: Producto) => boolean): Producto[] {
  const filtrados = candidatos.filter(selector);
  return filtrados.length > 0 ? filtrados : candidatos;
}

export function elegirProductoPreferido(linea: string, productos: Producto[]): Producto[] {
  if (productos.length <= 1) return productos;

  const lineaU = upperLocal(linea);
  const quiereInox = tieneInox(linea);
  let candidatos = productos;

  if (!quiereInox) {
    const noInox = candidatos.filter((p) => !esInox(p));
    if (noInox.length > 0) candidatos = noInox;
  } else {
    const inox = candidatos.filter(esInox);
    if (inox.length > 0) candidatos = inox;
  }

  if (!quiereInox) {
    if (/SEG\||SEGURO|SEEGUER|SEEGER|\b[IE]\-?\d+/.test(lineaU) || candidatos.some((p) => upperLocal(p.clave_busqueda).startsWith('SEG|'))) {
      candidatos = soloUnProducto(candidatos, (p) => !esInox(p));
    }

    if (/PASADOR|HORQUILLA|\d+\/\d+/.test(lineaU) || candidatos.some((p) => upperLocal(p.clave_busqueda).startsWith('PAS|'))) {
      candidatos = soloUnProducto(candidatos, (p) => !esInox(p));

      const medidaPasador = extraerMedidaPasador(lineaU);
      if (medidaPasador) {
        const exactos = candidatos.filter((p) => {
          const codigo = normalizarMedidaPasador(p.codigo.replace(/^PHZ-?/i, ''));
          const descripcion = normalizarMedidaPasador(p.descripcion);
          return codigo === medidaPasador || descripcion.includes(` ${medidaPasador} `) || descripcion.endsWith(medidaPasador);
        });
        if (exactos.length > 0) candidatos = exactos;
      }
    }

    if (/BILLA|BILLAS|BOLA/.test(lineaU) || candidatos.some((p) => upperLocal(p.clave_busqueda).startsWith('BILLA|'))) {
      candidatos = soloUnProducto(candidatos, (p) => !esInox(p));
    }
  }

  if (/BONDED|ARANDELA|JEBE|SCR|ARJ|BS-|PERNO/.test(lineaU) || candidatos.some((p) => upperLocal(p.clave_busqueda).startsWith('BONDED|'))) {
    if (!quiereInox) candidatos = soloUnProducto(candidatos, esBondedCarbonSteel);

    const scr = lineaU.match(/SCR\s*-?\s*(\d+)/);
    if (scr) {
      const n = scr[1];
      const exactos = candidatos.filter((p) => upperLocal(`${p.codigo} ${p.descripcion}`).includes(`SCR-${n}`));
      if (exactos.length > 0) candidatos = exactos;
    }

    const arj = lineaU.match(/ARJ\s*-?\s*([\d\/".]+)/);
    if (arj) {
      const n = arj[1].replace(/"/g, '');
      const exactos = candidatos.filter((p) => upperLocal(p.codigo) === `ARJ-${n}`);
      if (exactos.length > 0) candidatos = exactos;
    }

    if (/PERNO\s*8\b/.test(lineaU)) {
      const preferido = candidatos.filter((p) => upperLocal(p.codigo) === 'ARJ-8' || upperLocal(p.descripcion).includes('SCR-212'));
      if (preferido.length > 0) candidatos = preferido;
    }
  }

  if (/BILLA|BILLAS|BOLA|\d+\/\d+/.test(lineaU) || candidatos.some((p) => upperLocal(p.clave_busqueda).startsWith('BILLA|'))) {
    const enPulgadas = candidatos.filter((p) => /P\b|"P|PULG/.test(upperLocal(`${p.codigo} ${p.descripcion}`)));
    if (/\d+\/\d+/.test(lineaU) && enPulgadas.length > 0) candidatos = enPulgadas;
  }

  if (candidatos.length === 1) return candidatos;

  const firma = new Set(candidatos.map((p) => `${upperLocal(p.descripcion).replace(/\s+/g, ' ')}|${Number(p.precio_usd_sin_igv || 0)}`));
  if (firma.size === 1) return [candidatos[0]];

  return candidatos;
}
