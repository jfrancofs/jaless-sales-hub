import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';
import path from 'path';
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

const filePath = process.argv[2] || 'data/lista-precios.xlsx';
if (!fs.existsSync(filePath)) {
  console.error(`No encontré el archivo: ${filePath}`);
  console.error('Coloca tu Excel en data/lista-precios.xlsx o pasa la ruta como argumento.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalize(value) {
  return cleanText(value).toUpperCase();
}

function parseCategoria(desc, codigo) {
  const d = normalize(desc);
  const c = normalize(codigo);
  if (d.includes('ABRAZADERA')) return 'Abrazaderas';
  if (d.includes('O RING') || d.includes('O-RING') || d.includes("O'RING") || d.includes('ORING')) return "O'Rings";
  if (d.includes('SEGURO') || d.includes('SEEGER') || d.includes('SEEGUER') || c.startsWith('SG')) return 'Seguros';
  if (d.includes('CORDON') || d.includes('CORDÓN')) return 'Cordones';
  if (d.includes('PIN') || d.includes('PINES')) return 'Pines de Expansión';
  if (d.includes('BONDED')) return 'Bonded Seal';
  if (d.includes('BILLA') || d.includes('BOLA')) return 'Billas de Acero';
  if (d.includes('PASADOR') || d.includes('HORQUILLA')) return 'Pasadores de Horquilla';
  return 'Sin categoría';
}

function parseMaterial(desc) {
  const d = normalize(desc);
  if (d.includes('W4')) return 'Inoxidable W4';
  if (d.includes('W3')) return 'Inoxidable W3';
  if (d.includes('W1')) return 'Acero Zincado W1';
  if (d.includes('VITON') || d.includes('VITÓN')) return 'Viton';
  if (d.includes('NITRILO') || d.includes('NBR')) return 'NBR';
  if (d.includes('ZINCADO')) return 'Zincado';
  if (d.includes('INOX')) return 'Inoxidable';
  if (d.includes('ACERO')) return 'Acero';
  return '';
}

function parseFleje(desc) {
  const d = cleanText(desc);
  const m = d.match(/(\d+(?:[.,]\d+)?)\s*mm/i);
  return m ? `${m[1].replace(',', '.')}mm` : '';
}

function parseTipo(desc) {
  const d = normalize(desc);
  if (d.includes('CREMALLERA')) return 'Cremallera';
  if (d.includes('INDUSTRIAL')) return 'Industrial';
  if (d.includes('RSGU')) return 'RSGU';
  if (d.includes('EXTERIOR')) return 'Exterior';
  if (d.includes('INTERIOR')) return 'Interior';
  if (d.includes('RADIAL')) return 'Radial';
  if (d.includes('MILIMETRICO') || d.includes('MILIMÉTRICO')) return 'Milimétrico';
  if (d.includes('PULGADA')) return 'Pulgadas';
  return '';
}

function parseMedida(desc, codigo) {
  const d = cleanText(desc);
  const c = cleanText(codigo);

  // Medidas tipo 100-120, 10-16, etc.
  let m = d.match(/\b\d+(?:[.,]\d+)?\s*-\s*\d+(?:[.,]\d+)?\b/);
  if (m) return m[0].replace(/\s+/g, '').replace(',', '.');

  // Medidas tipo 3x5, 2.5x10, 5 x 90, etc.
  m = d.match(/\b\d+(?:[.,]\d+)?\s*[xX]\s*\d+(?:[.,]\d+)?\b/);
  if (m) return m[0].replace(/\s+/g, '').replace(',', '.').toLowerCase();

  // Seguros E 13 / I 16 / R 24.
  m = d.match(/\b([EIR])\s*-?\s*(\d+(?:[.,]\d+)?)\b/i);
  if (m) return `${m[1].toUpperCase()}${m[2].replace(',', '.')}`;

  // Fallback por código.
  m = c.match(/\d+(?:-\d+)?/);
  return m ? m[0] : '';
}

function findHeaderRow(rows) {
  return rows.findIndex((row) => row.some((cell) => normalize(cell) === 'CODIGO'));
}

const workbook = XLSX.readFile(filePath, { cellDates: false });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
const headerIndex = findHeaderRow(rows);
if (headerIndex < 0) {
  console.error('No encontré la fila de encabezados. Debe existir una columna CODIGO.');
  process.exit(1);
}

const headers = rows[headerIndex].map(normalize);
const idxItem = headers.findIndex((h) => h === 'ITEM');
const idxCodigo = headers.findIndex((h) => h === 'CODIGO');
const idxDesc = headers.findIndex((h) => h === 'DESCRIPCION' || h === 'DESCRIPCIÓN');
const idxMarca = headers.findIndex((h) => h === 'MARCA');
const idxPrecio = headers.findIndex((h) => h.includes('PRECIO'));

if (idxCodigo < 0 || idxDesc < 0 || idxPrecio < 0) {
  console.error('Columnas requeridas: CODIGO, DESCRIPCION y Precio USD.');
  process.exit(1);
}

const productos = [];
for (const row of rows.slice(headerIndex + 1)) {
  const codigo = cleanText(row[idxCodigo]);
  const descripcion = cleanText(row[idxDesc]);
  const precio = Number(row[idxPrecio]);
  if (!codigo || !descripcion || Number.isNaN(precio)) continue;

  const categoria = parseCategoria(descripcion, codigo);
  const material = parseMaterial(descripcion);
  const fleje = parseFleje(descripcion);
  const tipo = parseTipo(descripcion);
  const medida = parseMedida(descripcion, codigo);
  const marca = cleanText(row[idxMarca]) || 'Jaless';

  const producto = {
    item: idxItem >= 0 ? Number(row[idxItem]) || null : null,
    codigo,
    descripcion,
    marca,
    categoria,
    material,
    fleje,
    tipo,
    medida,
    precio_usd_sin_igv: precio,
    texto_busqueda: normalize(`${codigo} ${descripcion} ${marca} ${categoria} ${material} ${fleje} ${tipo} ${medida}`),
    activo: true,
    actualizado_en: new Date().toISOString(),
  };
  productos.push(producto);
}

const productosUnicos = Array.from(
  new Map(productos.map((p) => [p.codigo, p])).values()
);

productos.length = 0;
productos.push(...productosUnicos);
console.log(`Productos detectados: ${productos.length}`);
if (productos.length === 0) process.exit(1);

// Upsert en lotes para evitar límites.
const batchSize = 500;
let imported = 0;
let errors = 0;
for (let i = 0; i < productos.length; i += batchSize) {
  const batch = productos.slice(i, i + batchSize);
  const { error } = await supabase
    .from('productos_catalogo')
    .upsert(batch, { onConflict: 'codigo' });

  if (error) {
    errors += batch.length;
    console.error('Error importando lote:', error.message);
  } else {
    imported += batch.length;
    console.log(`Importados ${imported}/${productos.length}`);
  }
}

await supabase.from('importaciones_catalogo').insert({
  archivo: path.basename(filePath),
  total_filas: productos.length,
  total_importadas: imported,
  total_errores: errors,
});

console.log('Importación terminada.');
console.log({ total: productos.length, imported, errors });
