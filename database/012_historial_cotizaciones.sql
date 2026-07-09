-- JALESS ONE v2.2 - Historial de cotizaciones
-- Ejecutar en Supabase SQL Editor

create extension if not exists "pgcrypto";

create table if not exists cotizaciones_jaless (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  fecha timestamptz not null default now(),
  cliente_id uuid null references clientes_comerciales(id) on delete set null,
  cliente_razon_social text,
  cliente_ruc text,
  cliente_direccion text,
  cliente_ciudad text,
  condicion_pago text,
  subtotal numeric(12,2) not null default 0,
  igv numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  observaciones text,
  pedido_original text,
  estado text not null default 'generada',
  vendedor text default 'JALESS',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists cotizacion_detalle_jaless (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references cotizaciones_jaless(id) on delete cascade,
  item integer not null,
  estado text not null,
  codigo text,
  descripcion text,
  categoria text,
  clave_busqueda text,
  cantidad numeric(12,2) not null default 0,
  precio_lista numeric(12,4) not null default 0,
  descuento numeric(8,2) not null default 0,
  precio_final numeric(12,4) not null default 0,
  total numeric(12,2) not null default 0,
  creado_en timestamptz not null default now()
);

create index if not exists idx_cotizaciones_jaless_fecha on cotizaciones_jaless(fecha desc);
create index if not exists idx_cotizaciones_jaless_cliente on cotizaciones_jaless(cliente_id);
create index if not exists idx_cotizaciones_jaless_numero on cotizaciones_jaless(numero);
create index if not exists idx_cotizacion_detalle_jaless_cotizacion on cotizacion_detalle_jaless(cotizacion_id);
create index if not exists idx_cotizacion_detalle_jaless_codigo on cotizacion_detalle_jaless(codigo);

alter table cotizaciones_jaless disable row level security;
alter table cotizacion_detalle_jaless disable row level security;

grant all on table cotizaciones_jaless to anon;
grant all on table cotizaciones_jaless to authenticated;
grant all on table cotizaciones_jaless to service_role;

grant all on table cotizacion_detalle_jaless to anon;
grant all on table cotizacion_detalle_jaless to authenticated;
grant all on table cotizacion_detalle_jaless to service_role;
