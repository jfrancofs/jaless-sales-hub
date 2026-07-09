-- Sprint 6: índices para búsqueda exacta por catálogo.
create index if not exists idx_productos_catalogo_categoria_s6 on productos_catalogo (categoria);
create index if not exists idx_productos_catalogo_codigo_s6 on productos_catalogo (codigo);
create index if not exists idx_productos_catalogo_medida_s6 on productos_catalogo (medida);
create index if not exists idx_productos_catalogo_marca_s6 on productos_catalogo (marca);
