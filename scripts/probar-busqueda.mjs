import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local');
  process.exit(1);
}

const q = process.argv.slice(2).join(' ') || '100-120';
const supabase = createClient(SUPABASE_URL, ANON_KEY);

const { data, error } = await supabase
  .from('productos_catalogo')
  .select('codigo,descripcion,categoria,material,fleje,tipo,medida,precio_usd_sin_igv')
  .or(`codigo.ilike.%${q}%,descripcion.ilike.%${q}%,medida.ilike.%${q}%,texto_busqueda.ilike.%${q.toUpperCase()}%`)
  .limit(10);

if (error) {
  console.error(error.message);
  process.exit(1);
}
console.table(data);
