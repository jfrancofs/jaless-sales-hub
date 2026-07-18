import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function crearSupabaseServidor() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Faltan las variables de Supabase en .env.local.');
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function GET() {
  try {
    const supabase = crearSupabaseServidor();
    const { data, error } = await supabase
      .from('vendedores_jaless')
      .select('id, nombre, correo, telefono, rol, estado, creado_en, actualizado_en')
      .eq('estado', 'activo')
      .order('nombre', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: `Error cargando vendedores: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? [], {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo cargar vendedores.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const vendedorId = String(body?.vendedorId || '').trim();
    const pin = String(body?.pin || '').trim();

    if (!vendedorId) {
      return NextResponse.json({ error: 'Selecciona un vendedor.' }, { status: 400 });
    }
    if (!pin) {
      return NextResponse.json({ error: 'Ingresa el PIN.' }, { status: 400 });
    }

    const supabase = crearSupabaseServidor();
    const { data, error } = await supabase
      .from('vendedores_jaless')
      .select('id, nombre, correo, telefono, rol, estado')
      .eq('id', vendedorId)
      .eq('pin_codigo', pin)
      .eq('estado', 'activo')
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: `No se pudo validar el acceso: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: 'Vendedor o PIN incorrecto.' }, { status: 401 });
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo iniciar sesión.' },
      { status: 500 }
    );
  }
}
