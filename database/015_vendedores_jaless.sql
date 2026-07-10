-- JALESS ONE v5.0
-- Usuarios vendedores internos con PIN simple para identificar cotizaciones.
-- Esta es una autenticación interna inicial. Más adelante puede migrarse a Supabase Auth.

create table if not exists public.vendedores_jaless (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  correo text,
  telefono text,
  rol text not null default 'vendedor' check (rol in ('administrador', 'supervisor', 'vendedor')),
  pin_codigo text not null,
  estado text not null default 'activo' check (estado in ('activo', 'inactivo')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index if not exists vendedores_jaless_nombre_unique
on public.vendedores_jaless (upper(nombre));

insert into public.vendedores_jaless (nombre, correo, telefono, rol, pin_codigo, estado)
select 'Franco Flores', 'jean.franco.fs@gmail.com', '', 'administrador', '1234', 'activo'
where not exists (
  select 1 from public.vendedores_jaless where upper(nombre) = upper('Franco Flores')
);

alter table public.vendedores_jaless disable row level security;
grant select, insert, update on table public.vendedores_jaless to anon;
grant select, insert, update on table public.vendedores_jaless to authenticated;

-- Si la columna vendedor no existe en el historial, se agrega.
alter table public.cotizaciones_jaless
add column if not exists vendedor text default 'JALESS';

create index if not exists cotizaciones_jaless_vendedor_idx
on public.cotizaciones_jaless (vendedor);
