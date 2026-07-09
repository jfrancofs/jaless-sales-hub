-- JALESS ONE v2.5
-- Clientes nuevos y descuentos por categoría.

-- Asegura que el cliente pueda ser consultado y creado desde la app interna.
alter table if exists clientes_comerciales disable row level security;
alter table if exists descuentos_categoria_cliente disable row level security;

grant select, insert, update on table clientes_comerciales to anon, authenticated;
grant select, insert, update on table descuentos_categoria_cliente to anon, authenticated;

-- Evita duplicados por RUC cuando exista RUC.
create unique index if not exists clientes_comerciales_ruc_unique
on clientes_comerciales (ruc)
where ruc is not null and trim(ruc) <> '';

-- Permite actualizar descuentos por cliente/categoría con upsert.
create unique index if not exists descuentos_categoria_cliente_cliente_categoria_unique
on descuentos_categoria_cliente (cliente_id, categoria);
