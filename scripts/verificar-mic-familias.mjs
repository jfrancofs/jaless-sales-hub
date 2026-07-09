import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const pruebas = [
  ['Cordón NBR 4mm', 'CORDON|NBR|4'],
  ['Cordón Vitón 4mm', 'CORDON|VITON|4'],
  ['Billa 10mm', 'BILLA|10'],
  ['Billa 7/8', 'BILLA|7/8'],
  ['Arandela con jebe ARJ-8', 'BONDED|ARJ-8'],
  ['Arandela con jebe SCR-212', 'BONDED|SCR-212'],
];

for (const [nombre, clave] of pruebas) {
  const { data, error } = await supabase
    .from('productos_catalogo')
    .select('codigo, descripcion, precio_usd_sin_igv, clave_busqueda')
    .eq('clave_busqueda', clave)
    .limit(3);

  if (error) {
    console.log('ERROR', nombre, error.message);
    continue;
  }

  console.log('\n' + nombre);
  console.log('Clave:', clave);
  console.log('Encontrados:', data?.length || 0);
  console.table(data || []);
}
