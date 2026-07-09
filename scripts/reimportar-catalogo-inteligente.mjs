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
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function clean(v){ return String(v ?? '').replace(/\s+/g,' ').trim(); }
function upper(v){ return clean(v).toUpperCase(); }
function ntext(n){ return Number.isInteger(n) ? String(n) : String(n).replace(/\.0+$/, ''); }
function normMeasure(v){
  let s = upper(v).replace(/\s+/g,'').replace(/,/g,'.').replace(/[×*]/g,'X').replace(/MM$/,'').replace(/"/g,'');
  const mx = s.match(/^(\d+(?:\.\d+)?)X(\d+(?:\.\d+)?)$/);
  if (mx) return `${ntext(Number(mx[1]))}X${ntext(Number(mx[2]))}`;
  const mDash = s.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (mDash) return `${mDash[1]}-${mDash[2]}`;
  const mSeg = s.match(/^([EIR])[-]?(\d+)$/);
  if (mSeg) return `${mSeg[1]}-${mSeg[2].padStart(3,'0')}`;
  const mAs = s.match(/^2-\d{3}$/);
  if (mAs) return s;
  return s.toUpperCase();
}
function normPinMeasure(v){
  const raw = upper(v).replace(/\s+/g,'').replace(/,/g,'.').replace(/[×X]/g,'*');
  const m = raw.match(/^M?(\d+(?:\.\d+)?)\*(\d+(?:\.\d+)?)$/);
  if(!m) return raw;
  return `M${ntext(Number(m[1]))}*${ntext(Number(m[2]))}`;
}
function normCordonMeasure(v){
  const raw = upper(v).replace(/\s+/g,'').replace(/,/g,'.').replace(/MM$/,'');
  const mx = raw.match(/^(\d+(?:\.\d+)?)X(\d+(?:\.\d+)?)$/);
  if (mx) return `${ntext(Number(mx[1]))}X${ntext(Number(mx[2]))}`;
  const m = raw.match(/^(\d+(?:\.\d+)?)/);
  return m ? ntext(Number(m[1])) : raw;
}
function normBillaMeasure(v){
  let raw = upper(v).replace(/\s+/g,'').replace(/,/g,'.').replace(/MM$/,'').replace(/P$/,'').replace(/"/g,'');
  const frac = raw.match(/^(\d+\/\d+)$/); if (frac) return frac[1];
  const num = raw.match(/^(\d+(?:\.\d+)?)$/); if (num) return ntext(Number(num[1]));
  return raw;
}
function normBondedCode(v){
  let raw = upper(v).replace(/\s+/g,'').replace(/_/g,'-');
  raw = raw.replace(/^BSPSCR/, 'SCR');
  raw = raw.replace(/^SCR-?/, 'SCR-').replace(/^ARJ-?/, 'ARJ-').replace(/^BS-?/, 'BS-');
  raw = raw.replace(/BONDEDSEAL/g, '');
  return raw;
}
function normPerno(v){
  const raw = upper(v).replace(/\s+/g,'').replace(/,/g,'.').replace(/MM$/,'').replace(/"/g,'');
  const frac = raw.match(/^(\d+\/\d+)$/); if (frac) return frac[1];
  const num = raw.match(/^(\d+(?:\.\d+)?)$/); if (num) return ntext(Number(num[1]));
  return raw;
}
function parseCategoria(desc,codigo){
  const d=upper(desc), c=upper(codigo);
  if(d.includes('ABRAZADERA')) return 'ABRAZADERAS';
  if(d.includes('O RING')||d.includes('O-RING')||d.includes("O'RING")||d.includes('ORING')) return 'ORINGS';
  if(d.includes('SEGURO')||d.includes('SEEGER')||d.includes('SEEGUER')||c.startsWith('SEA')||c.startsWith('SEI')||c.startsWith('SER')) return 'SEGUROS';
  if(d.includes('CORDON')||d.includes('CORDÓN')||c.startsWith('COR')) return 'CORDONES';
  if(d.includes('PIN')||d.includes('PINES')||c.startsWith('PINEX')) return 'PINES';
  if(d.includes('BONDED')||d.includes('ARANDELA')||c.startsWith('ARJ')||c.startsWith('SCR')||c.startsWith('BS-')) return 'BONDED';
  if(d.includes('BILLA')||d.includes('BOLA')||c.replace(/\s+/g,'').startsWith('BL')) return 'BILLAS';
  if(d.includes('PASADOR')||d.includes('HORQUILLA')||c.startsWith('PHZ')) return 'PASADORES';
  return 'OTROS';
}
function parseMaterial(desc,codigo,categoria){
  const d=upper(desc), c=upper(codigo);
  if(categoria==='CORDONES') {
    if(d.includes('VITON')||d.includes('VITÓN')||c.includes('VTN')) return 'VITON';
    return 'NBR';
  }
  if(categoria==='BILLAS') return 'ACERO CROMADO';
  if(categoria==='BONDED') return 'NBR70+CARBON STEEL';
  if(d.includes('W4')) return 'W4';
  if(d.includes('W3')) return 'W3';
  if(d.includes('W1')) return 'W1';
  if(d.includes('VITON')||d.includes('VITÓN')) return 'VITON';
  if(d.includes('NITRILO')||d.includes('NBR')) return 'NBR';
  if(d.includes('INOX')) return 'INOXIDABLE';
  if(d.includes('ZINC')) return 'ZINCADO';
  if(d.includes('ACERO')) return 'ACERO';
  return '';
}
function parseTipo(desc,codigo){
  const d=upper(desc), c=upper(codigo);
  if(d.includes('CREMALLERA') || c.startsWith('ACF')) return 'CREMALLERA';
  if(d.includes('INDUSTRIAL') || c.startsWith('AIND')) return 'INDUSTRIAL';
  if(d.includes('RSGU') || c.startsWith('ARSGU')) return 'RSGU';
  if(d.includes('EXTERIOR')||c.startsWith('SEA')) return 'EXTERIOR';
  if(d.includes('INTERIOR')||c.startsWith('SEI')) return 'INTERIOR';
  if(d.includes('RADIAL')||c.startsWith('SER')) return 'RADIAL';
  return '';
}
function parseFleje(desc){ const m=upper(desc).match(/(9|12)\s*MM/); return m ? m[1] : ''; }
function parseDureza(desc,categoria,material){
  const d=upper(desc);
  if(categoria==='ORINGS') {
    if(d.includes('90') || d.includes('D90') || d.includes('SHORE 90')) return '90';
    if(material==='NBR') return '70';
    return '';
  }
  return '';
}
function parseMedida(desc,codigo,categoria){
  const d=clean(desc), c=clean(codigo); let m;
  if(categoria==='ORINGS'){
    m=d.match(/\b(2-\d{3})\b/i); if(m) return normMeasure(m[1]);
    m=d.match(/\b\d+(?:[.,]\d+)?\s*[xX*×]\s*\d+(?:[.,]\d+)?\b/); if(m) return normMeasure(m[0]);
    m=c.match(/\d+(?:[.,]\d+)?[xX]\d+(?:[.,]\d+)?/); if(m) return normMeasure(m[0]);
  }
  if(categoria==='ABRAZADERAS'){
    m=d.match(/\b\d+(?:[.,]\d+)?\s*-\s*\d+(?:[.,]\d+)?\b/); if(m) return normMeasure(m[0]);
  }
  if(categoria==='SEGUROS'){
    m=d.match(/\b([EIR])\s*\(?[A-Z]?\)?\s*-?\s*(\d+)\b/i); if(m) return normMeasure(`${m[1]}-${m[2]}`);
    m=c.match(/SE([AIR])[-]?(\d+)/i); if(m) return normMeasure(`${m[1]}-${m[2]}`);
  }
  if(categoria==='PINES'){
    m=d.match(/\bM?\d+(?:[.,]\d+)?\s*[xX*×]\s*\d+(?:[.,]\d+)?\b/); if(m) return normPinMeasure(m[0]);
    m=c.match(/PINEXM?(\d+(?:[.,]\d+)?)[X*×](\d+(?:[.,]\d+)?)/i); if(m) return normPinMeasure(`${m[1]}*${m[2]}`);
  }
  if(categoria==='PASADORES'){
    m=d.match(/\b\d+\/\d+\s*"?\s*[xX*×]\s*\d+(?:\/\d+)?\s*"?\b/); if(m) return normMeasure(m[0]);
  }
  if(categoria==='CORDONES'){
    m=d.match(/\b\d+(?:[.,]\d+)?\s*(?:MM|M\.M\.)\b/i); if(m) return normCordonMeasure(m[0]);
    m=c.match(/COR\s*(\d+(?:[.,]\d+)?)(?:NTL|VTN|\s*MM)?/i); if(m) return normCordonMeasure(m[1]);
  }
  if(categoria==='BILLAS'){
    m=d.match(/\b\d+\/\d+\s*"?\b/); if(m) return normBillaMeasure(m[0]);
    m=d.match(/\b\d+(?:[.,]\d+)?\s*MM\b/i); if(m) return normBillaMeasure(m[0]);
    m=c.match(/BL\s*-?\s*(\d+\/\d+|\d+(?:[.,]\d+)?)/i); if(m) return normBillaMeasure(m[1]);
  }
  if(categoria==='BONDED'){
    m=c.match(/(?:ARJ|SCR|BS)\s*-?\s*[\d\/".]+/i); if(m) return normBondedCode(m[0]);
    m=d.match(/\b(?:SCR|ARJ|BS)\s*-?\s*[\d\/".]+\b/i); if(m) return normBondedCode(m[0]);
    m=d.match(/PERNO\s*(\d+(?:[.,]\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)\s*(?:MM|")?/i); if(m) return `PERNO|${normPerno(m[1])}`;
  }
  m=d.match(/\b\d+(?:[.,]\d+)?\s*[xX*×-]\s*\d+(?:[.,]\d+)?\b/); if(m) return normMeasure(m[0]);
  return '';
}
function parseMarca(desc,marca,categoria,tipo){
  const d=upper(desc), m=upper(marca);
  if(categoria==='ABRAZADERAS' && tipo==='CREMALLERA'){
    if(d.includes('POWER') || m.includes('POWER')) return 'POWER';
    return 'JALESS';
  }
  return m || 'JALESS';
}
function clave(p){
  if(p.familia_norm==='ORINGS') return `ORING|${p.material_norm}|${p.dureza_norm}|${p.medida_norm}`;
  if(p.familia_norm==='ABRAZADERAS' && p.tipo_norm==='CREMALLERA') return `ABR|CREMALLERA|${p.material_norm}|${p.fleje_norm}|${p.medida_norm}|${p.marca_norm}`;
  if(p.familia_norm==='ABRAZADERAS') return `ABR|${p.tipo_norm}|${p.material_norm}|${p.medida_norm}|${p.marca_norm}`;
  if(p.familia_norm==='SEGUROS') return `SEG|${p.tipo_norm}|${p.medida_norm}`;
  if(p.familia_norm==='PINES') return `PIN|${p.medida_norm}`;
  if(p.familia_norm==='PASADORES') return `PAS|${p.medida_norm}`;
  if(p.familia_norm==='CORDONES') return `CORDON|${p.material_norm}|${p.medida_norm}`;
  if(p.familia_norm==='BONDED') return `BONDED|${p.medida_norm}`;
  if(p.familia_norm==='BILLAS') return `BILLA|${p.medida_norm}`;
  return `${p.familia_norm}|${p.medida_norm}`;
}
function findHeaderRow(rows){ return rows.findIndex(row => row.some(cell => upper(cell)==='CODIGO')); }

const wb=XLSX.readFile(filePath,{cellDates:false});
const sheet=wb.Sheets[wb.SheetNames[0]];
const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:''});
const headerIndex=findHeaderRow(rows);
const headers=rows[headerIndex].map(upper);
const idxItem=headers.findIndex(h=>h==='ITEM');
const idxCodigo=headers.findIndex(h=>h==='CODIGO');
const idxDesc=headers.findIndex(h=>h==='DESCRIPCION'||h==='DESCRIPCIÓN');
const idxMarca=headers.findIndex(h=>h==='MARCA');
const idxPrecio=headers.findIndex(h=>h.includes('PRECIO'));
const productos=[];
for(const row of rows.slice(headerIndex+1)){
  const codigo=clean(row[idxCodigo]); const descripcion=clean(row[idxDesc]); const precio=Number(row[idxPrecio]);
  if(!codigo||!descripcion||Number.isNaN(precio)) continue;
  const categoria=parseCategoria(descripcion,codigo);
  const material=parseMaterial(descripcion,codigo,categoria);
  const tipo=parseTipo(descripcion,codigo);
  const fleje=parseFleje(descripcion);
  const medida=parseMedida(descripcion,codigo,categoria);
  const dureza=parseDureza(descripcion,categoria,material);
  const marca=parseMarca(descripcion,clean(row[idxMarca])||'Jaless',categoria,tipo);
  const p={
    item: idxItem>=0 ? Number(row[idxItem])||null : null,
    codigo, descripcion, marca: clean(row[idxMarca])||'Jaless', categoria, material, fleje, tipo, medida,
    precio_usd_sin_igv: precio,
    familia_norm: categoria, material_norm: material, tipo_norm: tipo, fleje_norm: fleje, marca_norm: marca,
    dureza_norm: dureza, medida_norm: medida,
    clave_busqueda: '',
    texto_busqueda: upper(`${codigo} ${descripcion} ${marca} ${categoria} ${material} ${fleje} ${tipo} ${medida}`),
    activo:true, actualizado_en:new Date().toISOString()
  };
  p.clave_busqueda=clave(p);
  productos.push(p);
}
const unicos=Array.from(new Map(productos.map(p=>[p.codigo,p])).values());
console.log(`Productos inteligentes detectados: ${unicos.length}`);
const resumen = unicos.reduce((acc,p)=>{ acc[p.familia_norm]=(acc[p.familia_norm]||0)+1; return acc; },{});
console.log('Resumen por familia:', resumen);
const batchSize=500; let imported=0, errors=0;
for(let i=0;i<unicos.length;i+=batchSize){
  const batch=unicos.slice(i,i+batchSize);
  const {error}=await supabase.from('productos_catalogo').upsert(batch,{onConflict:'codigo'});
  if(error){ errors+=batch.length; console.error('Error importando lote:', error.message); }
  else { imported+=batch.length; console.log(`Importados ${imported}/${unicos.length}`); }
}
await supabase.from('importaciones_catalogo').insert({archivo:path.basename(filePath),total_filas:unicos.length,total_importadas:imported,total_errores:errors});
console.log('Reingeniería de catálogo terminada.');
console.log({total:unicos.length, imported, errors});
