# Plan de respaldo JALESS ONE

## Respaldos mínimos

1. Código: GitHub.
2. Datos: CSV descargados desde Supabase.
3. Esquema: `database/schema.sql`.

## Tablas críticas

- productos_catalogo
- clientes_comerciales
- descuentos_categoria_cliente
- cotizaciones_comerciales
- cotizacion_detalle_comercial

## Frecuencia recomendada

- Código: después de cada versión estable.
- CSV de datos: cada vez que se actualice catálogo o clientes.
- Schema: cada vez que se agregue una tabla o columna importante.
