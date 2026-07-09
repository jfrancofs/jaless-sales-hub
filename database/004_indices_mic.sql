-- Sprint 4: índices opcionales para mejorar búsquedas del MIC.
create index if not exists idx_productos_catalogo_categoria on productos_catalogo (categoria);
create index if not exists idx_productos_catalogo_material on productos_catalogo (material);
create index if not exists idx_productos_catalogo_tipo on productos_catalogo (tipo);
create index if not exists idx_productos_catalogo_fleje on productos_catalogo (fleje);
create index if not exists idx_productos_catalogo_medida on productos_catalogo (medida);
create index if not exists idx_productos_catalogo_codigo on productos_catalogo (codigo);
