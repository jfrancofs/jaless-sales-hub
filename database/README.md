# JALESS ONE - Respaldo de Base de Datos

## Archivos

- `schema.sql`: reconstruye la estructura completa de la base de datos.
- `seed.sql`: inserta datos iniciales opcionales.

## Cómo restaurar en Supabase

1. Crear un proyecto nuevo en Supabase.
2. Ir a **SQL Editor → New query**.
3. Copiar y ejecutar todo el contenido de `schema.sql`.
4. Cargar los CSV respaldados si corresponde:
   - `productos_catalogo.csv`
   - `clientes_comerciales.csv`
   - `descuentos_categoria_cliente.csv`
5. Alternativamente, reimportar desde los archivos fuente:

```cmd
node scripts/reimportar-catalogo-inteligente.mjs data/lista-precios.xlsx
node scripts/importar-clientes-jaless.mjs data/clientes-jaless.xls
```

## Nota de seguridad

Este esquema tiene RLS desactivado para desarrollo local. Cuando JALESS ONE tenga login multiusuario, se deben activar políticas RLS por rol.
