-- JALESS ONE v1.1 - MIC familias faltantes
-- Ejecutar solo si deseas asegurar índices para búsqueda exacta.

create index if not exists idx_productos_catalogo_clave_busqueda_v11
on productos_catalogo (clave_busqueda);

create index if not exists idx_productos_catalogo_familia_norm_v11
on productos_catalogo (familia_norm);

-- Lectura para la app local.
alter table productos_catalogo disable row level security;
alter table clientes_comerciales disable row level security;

grant select on table productos_catalogo to anon;
grant select on table productos_catalogo to authenticated;
grant select on table clientes_comerciales to anon;
grant select on table clientes_comerciales to authenticated;
