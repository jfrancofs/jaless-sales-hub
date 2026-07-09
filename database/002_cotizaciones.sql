create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null unique,
  ruc text,
  contacto text,
  telefono text,
  correo text,
  ciudad text,
  activo boolean default true,
  creado_en timestamp default now()
);

create table if not exists descuentos_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  categoria text not null,
  porcentaje numeric(5,2) not null default 0,
  unique(cliente_id, categoria)
);

create table if not exists cotizaciones (
  id uuid primary key default gen_random_uuid(),
  numero text unique,
  cliente_id uuid references clientes(id),
  cliente_nombre text,
  subtotal numeric(12,2) not null default 0,
  igv numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  moneda text not null default 'USD',
  estado text not null default 'borrador',
  creado_en timestamp default now()
);

create table if not exists cotizacion_detalle (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid references cotizaciones(id) on delete cascade,
  producto_id uuid,
  codigo text,
  descripcion text not null,
  categoria text,
  medida text,
  cantidad numeric(12,2) not null default 0,
  precio_unitario numeric(12,4) not null default 0,
  descuento_porcentaje numeric(5,2) not null default 0,
  total numeric(12,2) not null default 0,
  encontrado boolean not null default true
);

alter table clientes disable row level security;
alter table descuentos_cliente disable row level security;
alter table cotizaciones disable row level security;
alter table cotizacion_detalle disable row level security;

grant all on table clientes to anon, authenticated, service_role;
grant all on table descuentos_cliente to anon, authenticated, service_role;
grant all on table cotizaciones to anon, authenticated, service_role;
grant all on table cotizacion_detalle to anon, authenticated, service_role;

insert into clientes (razon_social) values ('Cliente General')
on conflict (razon_social) do nothing;
