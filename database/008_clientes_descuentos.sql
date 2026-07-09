create table if not exists clientes_comerciales (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null unique,
  ruc text,
  contacto text,
  telefono text,
  correo text,
  estado text not null default 'activo',
  creado_en timestamp with time zone default now()
);

create table if not exists descuentos_categoria_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes_comerciales(id) on delete cascade,
  categoria text not null,
  porcentaje numeric(5,2) not null default 0,
  creado_en timestamp with time zone default now(),
  unique(cliente_id, categoria)
);

alter table clientes_comerciales disable row level security;
alter table descuentos_categoria_cliente disable row level security;

grant all on table clientes_comerciales to anon, authenticated, service_role;
grant all on table descuentos_categoria_cliente to anon, authenticated, service_role;

insert into clientes_comerciales (razon_social, ruc, contacto)
values
  ('Cliente sin descuento', null, null),
  ('Cliente demo descuentos', null, null)
on conflict (razon_social) do nothing;

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
where c.razon_social = 'Cliente demo descuentos'
on conflict (cliente_id, categoria) do update set porcentaje = excluded.porcentaje;
