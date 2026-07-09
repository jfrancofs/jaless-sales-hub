-- Sprint 7 - Catálogo inteligente JALESS ONE
-- Ejecutar en Supabase SQL Editor.

alter table productos_catalogo add column if not exists familia_norm text;
alter table productos_catalogo add column if not exists material_norm text;
alter table productos_catalogo add column if not exists tipo_norm text;
alter table productos_catalogo add column if not exists fleje_norm text;
alter table productos_catalogo add column if not exists marca_norm text;
alter table productos_catalogo add column if not exists dureza_norm text;
alter table productos_catalogo add column if not exists medida_norm text;
alter table productos_catalogo add column if not exists clave_busqueda text;

create index if not exists idx_productos_clave_busqueda on productos_catalogo (clave_busqueda);
create index if not exists idx_productos_familia_medida on productos_catalogo (familia_norm, medida_norm);
create index if not exists idx_productos_codigo on productos_catalogo (codigo);
