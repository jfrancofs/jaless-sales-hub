import { createClient } from '@supabase/supabase-js';
import LoginForm from './LoginForm';
import type { VendedorJaless } from '@/types/comercial';

export const dynamic = 'force-dynamic';

async function obtenerVendedoresActivos(): Promise<VendedorJaless[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Faltan las variables de Supabase en .env.local.');
  }

  const supabase = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await supabase
    .from('vendedores_jaless')
    .select('id, nombre, correo, telefono, rol, estado')
    .eq('estado', 'activo')
    .order('nombre', { ascending: true });

  if (error) {
    throw new Error(`Error cargando vendedores: ${error.message}`);
  }

  return (data ?? []) as VendedorJaless[];
}

export default async function LoginPage() {
  let vendedores: VendedorJaless[] = [];
  let errorInicial = '';

  try {
    vendedores = await obtenerVendedoresActivos();
  } catch (error) {
    errorInicial =
      error instanceof Error
        ? error.message
        : 'No se pudo cargar la lista de vendedores.';
  }

  return (
    <LoginForm
      vendedoresIniciales={vendedores}
      errorInicial={errorInicial}
    />
  );
}
