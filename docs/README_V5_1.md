# JALESS ONE v5.1 — Administración de vendedores

## Incluye

- Crear vendedores.
- Editar nombre, correo y teléfono.
- Cambiar rol: administrador, supervisor o vendedor.
- Cambiar PIN sin mostrar el PIN actual.
- Activar o desactivar accesos.
- Buscar vendedores.
- Login corregido contra `vendedores_jaless`.

## Instalación

1. Copiar la carpeta `src` sobre el proyecto actual.
2. No requiere SQL nuevo si ya ejecutaste `015_vendedores_jaless.sql`.
3. Reiniciar con `npm run dev`.
4. Abrir `/admin/vendedores`.

## Seguridad actual

El PIN sigue siendo una autenticación interna simple. No publicar en Internet hasta migrar a Supabase Auth y volver a activar RLS con políticas por usuario.
