export function normalizarTextoComercial(valor: string | null | undefined): string {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`´]/g, "'")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

export function normalizarCategoriaComercial(
  categoria: string | null | undefined
): string {
  const valor = normalizarTextoComercial(categoria);

  if (
    valor.includes('ORING') ||
    valor.includes("O'RING") ||
    valor.includes('JUNTA TORICA')
  ) return 'ORINGS';

  if (valor.includes('ABRAZADERA')) return 'ABRAZADERAS';
  if (valor.includes('SEGURO')) return 'SEGUROS';
  if (valor.includes('CORDON')) return 'CORDONES';
  if (valor.includes('BONDED') || valor.includes('ARANDELA CON JEBE')) return 'BONDED SEAL';
  if (valor.includes('PIN')) {
  return 'PINES DE EXPANSION';
}
  if (valor.includes('BILLA') || valor.includes('BOLA DE ACERO')) return 'BILLAS DE ACERO';
  if (valor.includes('PASADOR') || valor.includes('HORQUILLA')) return 'PASADORES DE HORQUILLA';

  return valor;
}

export function crearMapaDescuentosNormalizado(
  descuentos: Record<string, number>
): Record<string, number> {
  const mapa: Record<string, number> = {};
  Object.entries(descuentos || {}).forEach(([categoria, porcentaje]) => {
    mapa[normalizarCategoriaComercial(categoria)] = Number(porcentaje) || 0;
  });
  return mapa;
}

export function obtenerDescuentoCategoria(
  categoria: string | null | undefined,
  descuentos: Record<string, number>
): number {
  const mapa = crearMapaDescuentosNormalizado(descuentos);
  return Number(mapa[normalizarCategoriaComercial(categoria)] || 0);
}
