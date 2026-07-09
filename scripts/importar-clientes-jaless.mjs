import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';
import { createRequire } from 'module';
import { createClient } from '@supabase/supabase-js';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const filePath = process.argv[2] || 'data/clientes-jaless.xls';
if (!fs.existsSync(filePath)) {
  console.error(`No encontré el archivo: ${filePath}`);
  console.error('Copia tu archivo de clientes en data/clientes-jaless.xls o pasa la ruta como argumento.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function norm(value) {
  return clean(value).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function extractCiudad(direccion) {
  const d = clean(direccion);
  const parts = d.split(' - ').map((x) => clean(x)).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 2] || parts[parts.length - 1] || '';
  return '';
}

const workbook = XLSX.readFile(filePath, { cellDates: false });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

const headerIndex = rows.findIndex((row) => row.some((cell) => norm(cell) === 'RAZON SOCIAL'));
if (headerIndex < 0) {
  console.error('No encontré la fila de encabezados con RAZÓN SOCIAL.');
  process.exit(1);
}

const headers = rows[headerIndex].map(norm);
const idxItem = headers.findIndex((h) => h === 'ITEM');
const idxRazon = headers.findIndex((h) => h === 'RAZON SOCIAL');
const idxRuc = headers.findIndex((h) => h === 'RUC');
const idxDireccion = headers.findIndex((h) => h === 'DIRECCION');

const clientes = [];
for (const row of rows.slice(headerIndex + 1)) {
  const razon_social = clean(row[idxRazon]);
  const ruc = clean(row[idxRuc]);
  const direccion = clean(row[idxDireccion]);
  if (!razon_social || !ruc) continue;

  clientes.push({
    razon_social,
    ruc,
    direccion,
    ciudad: extractCiudad(direccion),
    estado: 'activo',
    condicion_pago: 'Contado',
    actualizado_en: new Date().toISOString(),
  });
}

const unicos = Array.from(new Map(clientes.map((c) => [c.ruc, c])).values());
console.log(`Clientes detectados: ${clientes.length}`);
console.log(`Clientes únicos por RUC: ${unicos.length}`);

const batchSize = 500;
let imported = 0;
let errors = 0;
for (let i = 0; i < unicos.length; i += batchSize) {
  const batch = unicos.slice(i, i + batchSize);
  const { error } = await supabase
    .from('clientes_comerciales')
    .upsert(batch, { onConflict: 'ruc' });

  if (error) {
    errors += batch.length;
    console.error('Error importando lote:', error.message);
  } else {
    imported += batch.length;
    console.log(`Importados ${imported}/${unicos.length}`);
  }
}

console.log('Importación de clientes terminada.');
console.log({ total: unicos.length, imported, errors });
