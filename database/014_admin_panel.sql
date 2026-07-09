-- JALESS ONE v3.0 - Panel administrativo
-- Este script deja permisos básicos para administrar clientes, descuentos y precios desde la app interna.

alter table clientes_comerciales disable row level security;
alter table descuentos_categoria_cliente disable row level security;
alter table productos_catalogo disable row level security;

grant select, insert, update on table clientes_comerciales to anon, authenticated;
grant select, insert, update, delete on table descuentos_categoria_cliente to anon, authenticated;
grant select, update on table productos_catalogo to anon, authenticated;
grant select on table cotizaciones_jaless to anon, authenticated;
grant select on table cotizacion_detalle_jaless to anon, authenticated;

create index if not exists clientes_comerciales_razon_social_idx on clientes_comerciales (razon_social);
create index if not exists clientes_comerciales_ruc_idx on clientes_comerciales (ruc);
create index if not exists productos_catalogo_codigo_idx on productos_catalogo (codigo);
create index if not exists productos_catalogo_categoria_idx on productos_catalogo (categoria);
