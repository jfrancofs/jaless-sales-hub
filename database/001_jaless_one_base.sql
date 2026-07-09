-- JALESS ONE - Sprint 1
-- Base inicial para catálogo de productos y precios.
-- Ejecutar en Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Reinicio seguro SOLO para etapa inicial del proyecto.
-- Si ya tienes datos reales en producción, NO ejecutar estas líneas.
drop table if exists productos_catalogo cascade;
drop table if exists importaciones_catalogo cascade;

create table productos_catalogo (
  id uuid primary key default gen_random_uuid(),
  item integer,
  codigo text not null unique,
  descripcion text not null,
  marca text default 'Jaless',
  categoria text not null,
  material text,
  fleje text,
  tipo text,
  medida text,
  precio_usd_sin_igv numeric(12,4) not null default 0,
  texto_busqueda text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table importaciones_catalogo (
  id uuid primary key default gen_random_uuid(),
  archivo text not null,
  total_filas integer not null default 0,
  total_importadas integer not null default 0,
  total_errores integer not null default 0,
  creado_en timestamptz not null default now()
);

create index idx_productos_catalogo_codigo on productos_catalogo (codigo);
create index idx_productos_catalogo_categoria on productos_catalogo (categoria);
create index idx_productos_catalogo_medida on productos_catalogo (medida);
create index idx_productos_catalogo_texto on productos_catalogo using gin (to_tsvector('simple', coalesce(texto_busqueda,'')));

alter table productos_catalogo enable row level security;
alter table importaciones_catalogo enable row level security;

-- Durante Sprint 1 permitimos lectura para probar.
-- En sprint de login cambiaremos estas políticas por permisos por usuario.
create policy "lectura_catalogo_publica_sprint1"
on productos_catalogo
for select
using (true);

create policy "lectura_importaciones_admin_sprint1"
on importaciones_catalogo
for select
using (true);
