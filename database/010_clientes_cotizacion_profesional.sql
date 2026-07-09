-- JALESS ONE v1.0 Beta
-- Clientes, descuentos y base para cotizaciones profesionales.

create extension if not exists pgcrypto;

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
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

alter table clientes_comerciales add column if not exists ruc text;
alter table clientes_comerciales add column if not exists direccion text;
alter table clientes_comerciales add column if not exists ciudad text;
alter table clientes_comerciales add column if not exists contacto text;
alter table clientes_comerciales add column if not exists telefono text;
alter table clientes_comerciales add column if not exists correo text;
alter table clientes_comerciales add column if not exists condicion_pago text default 'Contado';
alter table clientes_comerciales add column if not exists vendedor text;
alter table clientes_comerciales add column if not exists actualizado_en timestamptz default now();

create unique index if not exists idx_clientes_comerciales_ruc_unique
on clientes_comerciales (ruc)
where ruc is not null and ruc <> '';

create index if not exists idx_clientes_comerciales_razon_social
on clientes_comerciales using gin (to_tsvector('spanish', coalesce(razon_social,'')));

create table if not exists descuentos_categoria_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes_comerciales(id) on delete cascade,
  categoria text not null,
  porcentaje numeric(5,2) not null default 0,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now(),
  unique(cliente_id, categoria)
);

create index if not exists idx_descuentos_cliente_categoria
on descuentos_categoria_cliente (cliente_id, categoria);

create table if not exists cotizaciones_comerciales (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  cliente_id uuid references clientes_comerciales(id),
  cliente_nombre text,
  vendedor text,
  moneda text not null default 'USD',
  subtotal numeric(12,2) not null default 0,
  igv numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  estado text not null default 'borrador',
  observaciones text,
  detalle jsonb not null default '[]'::jsonb,
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

create index if not exists idx_cotizaciones_cliente_fecha
on cotizaciones_comerciales (cliente_id, creado_en desc);

-- Demo opcional de descuentos. Si ya existe, no duplica.
insert into clientes_comerciales (razon_social, ruc, direccion, ciudad, condicion_pago)
values ('Cliente demo descuentos', '00000000000', 'Dirección demo', 'Lima', 'Contado')
on conflict do nothing;

insert into descuentos_categoria_cliente (cliente_id, categoria, porcentaje)
select id, 'O''Rings', 25 from clientes_comerciales where ruc = '00000000000'
on conflict (cliente_id, categoria) do update set porcentaje = excluded.porcentaje;

insert into descuentos_categoria_cliente (cliente_id, categoria, porcentaje)
select id, 'Abrazaderas', 15 from clientes_comerciales where ruc = '00000000000'
on conflict (cliente_id, categoria) do update set porcentaje = excluded.porcentaje;

insert into descuentos_categoria_cliente (cliente_id, categoria, porcentaje)
select id, 'Seguros', 10 from clientes_comerciales where ruc = '00000000000'
on conflict (cliente_id, categoria) do update set porcentaje = excluded.porcentaje;
