const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function money(value: number) {
  return usd.format(Number.isFinite(value) ? value : 0);
}

export function round2(value: number) {
  return Number(value.toFixed(2));
}

export function fechaCorta() {
  return new Date().toLocaleDateString('es-PE');
}

export function fechaArchivo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}${m}${day}_${hh}${mm}`;
}

export function numeroTemporal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `COT-${y}${m}${day}-${hh}${mm}`;
}

export function upperLocal(value: unknown) {
  return String(value ?? '').toUpperCase();
}
