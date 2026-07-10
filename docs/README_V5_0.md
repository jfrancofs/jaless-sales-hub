# JALESS ONE v5.0 - Vendedores y Login interno

## Incluye
- Nueva pantalla `/login`.
- Login interno por vendedor y PIN.
- Tabla `vendedores_jaless`.
- Administración de vendedores en `/admin/vendedores`.
- Las cotizaciones se guardan con el vendedor activo.
- Historial permite buscar también por vendedor.
- PDF y Excel muestran el vendedor.

## SQL requerido
Ejecutar en Supabase:

```sql
database/015_vendedores_jaless.sql
```

## PIN inicial
- Vendedor: Franco Flores
- PIN: 1234

Luego puedes crear más vendedores desde:

`/admin/vendedores`
