# JALESS ONE v5.2 — Reportes por vendedor

## Incluye
- Reporte por rango de fechas.
- Filtro por vendedor.
- Monto cotizado, cantidad de cotizaciones, clientes y ticket promedio.
- Ranking de vendedores.
- Ranking de clientes cotizados.
- Tabla de cotizaciones del periodo.
- Acceso desde el Panel Administrativo.

## Instalación
Copiar `src` y `docs` sobre el proyecto actual y reiniciar `npm run dev`.

## Ruta
`/admin/reportes`

## Base de datos
No requiere SQL nuevo. Utiliza la columna `vendedor` de `cotizaciones_jaless`.
