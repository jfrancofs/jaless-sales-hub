-- ============================================================
-- JALESS ONE - ESQUEMA MAESTRO DE BASE DE DATOS
-- Versión: 2026-07-08
-- Uso: ejecutar en Supabase SQL Editor para reconstruir la base.
-- Nota: este archivo crea estructura, índices y permisos. No inserta catálogo ni clientes masivamente.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1) CATÁLOGO INTELIGENTE DE PRODUCTOS
-- ============================================================
create table if not exists productos_catalogo (
  id uuid primary key default gen_random_uuid(),
  item integer,
  codigo text not null,
  descripcion text not null,
  marca text default 'Jaless',
  categoria text,
  material text,
  fleje text,
  tipo text,
  medida text,
  precio_usd_sin_igv numeric(14,4) not null default 0,
  texto_busqueda text,
  activo boolean not null default true,

  -- Campos inteligentes generados por el importador
  familia_norm text,
  material_norm text,
  tipo_norm text,
  fleje_norm text,
  marca_norm text,
  dureza_norm text,
  medida_norm text,
  clave_busqueda text,

  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index if not exists productos_catalogo_codigo_unique
on productos_catalogo (codigo);

create index if not exists idx_productos_catalogo_codigo
on productos_catalogo (codigo);

create index if not exists idx_productos_catalogo_categoria
on productos_catalogo (categoria);

create index if not exists idx_productos_catalogo_clave_busqueda
on productos_catalogo (clave_busqueda);

create index if not exists idx_productos_catalogo_familia_medida
on productos_catalogo (familia_norm, medida_norm);

create index if not exists idx_productos_catalogo_familia_norm
on productos_catalogo (familia_norm);

create index if not exists idx_productos_catalogo_activo
on productos_catalogo (activo);

-- ============================================================
-- 2) HISTORIAL DE IMPORTACIONES DEL CATÁLOGO
-- ============================================================
create table if not exists importaciones_catalogo (
  id uuid primary key default gen_random_uuid(),
  archivo text,
  total_filas integer not null default 0,
  total_importadas integer not null default 0,
  total_errores integer not null default 0,
  observaciones text,
  creado_en timestamptz not null default now()
);

-- Tabla auxiliar usada en primeras importaciones. Se conserva por compatibilidad.
create table if not exists productos_importacion (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);

-- ============================================================
-- 3) CLIENTES COMERCIALES
-- ============================================================
create table if not exists clientes_comerciales (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null,
  ruc text,
  direccion text,
  ciudad text,
  contacto text,
  telefono text,
  correo text,
  condicion_pago text default 'Contado',
  vendedor text,
  estado text not null default 'activo',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create unique index if not exists clientes_comerciales_ruc_unique
on clientes_comerciales (ruc)
where ruc is not null and ruc <> '';

create index if not exists idx_clientes_comerciales_razon_social
on clientes_comerciales (razon_social);

create index if not exists idx_clientes_comerciales_estado
on clientes_comerciales (estado);

create index if not exists idx_clientes_comerciales_ruc
on clientes_comerciales (ruc);

-- ============================================================
-- 4) DESCUENTOS POR CLIENTE Y CATEGORÍA
-- ============================================================
create table if not exists descuentos_categoria_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes_comerciales(id) on delete cascade,
  categoria text not null,
  porcentaje numeric(5,2) not null default 0 check (porcentaje >= 0 and porcentaje <= 100),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique(cliente_id, categoria)
);

create index if not exists idx_descuentos_categoria_cliente_cliente
on descuentos_categoria_cliente (cliente_id);

create index if not exists idx_descuentos_categoria_cliente_categoria
on descuentos_categoria_cliente (categoria);

-- ============================================================
-- 5) COTIZACIONES PROFESIONALES
-- ============================================================
create table if not exists cotizaciones_comerciales (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  cliente_id uuid references clientes_comerciales(id) on delete set null,
  cliente_nombre text,
  cliente_ruc text,
  cliente_direccion text,
  cliente_ciudad text,
  vendedor text,
  moneda text not null default 'USD',
  subtotal numeric(14,2) not null default 0,
  igv numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  estado text not null default 'borrador',
  observaciones text,
  pedido_original text,
  detalle jsonb not null default '[]'::jsonb,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_cotizaciones_comerciales_numero
on cotizaciones_comerciales (numero);

create index if not exists idx_cotizaciones_comerciales_cliente_fecha
on cotizaciones_comerciales (cliente_id, creado_en desc);

create index if not exists idx_cotizaciones_comerciales_estado_fecha
on cotizaciones_comerciales (estado, creado_en desc);

-- Detalle normalizado para futuras búsquedas, duplicados y reportes.
create table if not exists cotizacion_detalle_comercial (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references cotizaciones_comerciales(id) on delete cascade,
  item integer not null,
  producto_id uuid references productos_catalogo(id) on delete set null,
  codigo text,
  descripcion text not null,
  categoria text,
  clave_busqueda text,
  cantidad numeric(14,2) not null default 0,
  precio_lista numeric(14,4) not null default 0,
  descuento_porcentaje numeric(5,2) not null default 0,
  precio_final numeric(14,4) not null default 0,
  total numeric(14,2) not null default 0,
  estado text not null default 'Exacto',
  creado_en timestamptz not null default now()
);

create index if not exists idx_cotizacion_detalle_cotizacion
on cotizacion_detalle_comercial (cotizacion_id);

create index if not exists idx_cotizacion_detalle_codigo
on cotizacion_detalle_comercial (codigo);

-- ============================================================
-- 6) CONFIGURACIÓN COMERCIAL / DICCIONARIO
-- ============================================================
create table if not exists diccionario_comercial (
  id uuid primary key default gen_random_uuid(),
  termino text not null,
  interpreta_como text not null,
  familia text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  unique(termino, interpreta_como)
);

create index if not exists idx_diccionario_comercial_termino
on diccionario_comercial (termino);

-- ============================================================
-- 7) PERMISOS PARA DESARROLLO LOCAL
-- IMPORTANTE: Para producción multiusuario, reemplazar por políticas RLS.
-- ============================================================
alter table productos_catalogo disable row level security;
alter table importaciones_catalogo disable row level security;
alter table productos_importacion disable row level security;
alter table clientes_comerciales disable row level security;
alter table descuentos_categoria_cliente disable row level security;
alter table cotizaciones_comerciales disable row level security;
alter table cotizacion_detalle_comercial disable row level security;
alter table diccionario_comercial disable row level security;

grant all on table productos_catalogo to anon, authenticated, service_role;
grant all on table importaciones_catalogo to anon, authenticated, service_role;
grant all on table productos_importacion to anon, authenticated, service_role;
grant all on table clientes_comerciales to anon, authenticated, service_role;
grant all on table descuentos_categoria_cliente to anon, authenticated, service_role;
grant all on table cotizaciones_comerciales to anon, authenticated, service_role;
grant all on table cotizacion_detalle_comercial to anon, authenticated, service_role;
grant all on table diccionario_comercial to anon, authenticated, service_role;

-- ============================================================
-- 8) DATOS INICIALES OPCIONALES
-- ============================================================
insert into clientes_comerciales (razon_social, ruc, direccion, ciudad, condicion_pago, estado)
values ('Cliente demo descuentos', '00000000000', 'Dirección demo', 'Lima', 'Contado', 'activo')
on conflict do nothing;

insert into descuentos_categoria_cliente (cliente_id, categoria, porcentaje)
select c.id, v.categoria, v.porcentaje
from clientes_comerciales c
cross join (values
  ('O''Rings', 25.00::numeric),
  ('Abrazaderas', 15.00::numeric),
  ('Seguros', 10.00::numeric),
  ('Pines de Expansión', 15.00::numeric),
  ('Pasadores de Horquilla', 15.00::numeric),
  ('Cordones', 20.00::numeric),
  ('Bonded Seal', 15.00::numeric),
  ('Billas de Acero', 15.00::numeric)
) as v(categoria, porcentaje)
where c.ruc = '00000000000'
on conflict (cliente_id, categoria) do update set porcentaje = excluded.porcentaje;

insert into diccionario_comercial (termino, interpreta_como, familia)
values
  ('oring', 'O''Rings', 'O''Rings'),
  ('o-ring', 'O''Rings', 'O''Rings'),
  ('o ring', 'O''Rings', 'O''Rings'),
  ('junta torica', 'O''Rings', 'O''Rings'),
  ('junta tórica', 'O''Rings', 'O''Rings'),
  ('seeger', 'Seguros', 'Seguros'),
  ('seguro', 'Seguros', 'Seguros'),
  ('cordon', 'Cordones', 'Cordones'),
  ('cordón', 'Cordones', 'Cordones'),
  ('oring por metro', 'Cordones', 'Cordones'),
  ('billa', 'Billas de Acero', 'Billas de Acero'),
  ('billas cromadas', 'Billas de Acero', 'Billas de Acero'),
  ('arandela con jebe', 'Bonded Seal', 'Bonded Seal'),
  ('bonded seal', 'Bonded Seal', 'Bonded Seal'),
  ('pin de expansion', 'Pines de Expansión', 'Pines de Expansión'),
  ('pasador', 'Pasadores de Horquilla', 'Pasadores de Horquilla')
on conflict do nothing;
