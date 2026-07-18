# JALESS ONE v5.4 — Búsqueda inteligente y asistente comercial

## Incluye

- Buscador tolerante a formatos distintos: `3x15`, `3 x 15`, `3*15`, códigos, medidas, material, tipo y marca.
- Ranking de coincidencias por exactitud y similitud.
- Autocompletado en el cotizador con cantidad y agregado directo al pedido.
- Marcador interno `[COD:...]` para asegurar que el producto elegido manualmente se cotice por código exacto.
- Jaless AI comercial con alertas de productos no encontrados, opciones múltiples, duplicados, cantidades mayoristas y sugerencias complementarias.
- Normalización única de categorías para conservar correctamente los descuentos.

## Instalación

1. Copiar `src` y `docs` sobre el proyecto actual.
2. No requiere SQL nuevo.
3. Reiniciar con `npm run dev`.
4. Abrir `/cotizador`.

## Pruebas recomendadas

Buscar en el nuevo campo:

- `3 x 15`
- `2-203`
- `F9 8-12`
- `cordon 4 mm`
- `pin 8*40`
- `5/32 x 1`

Seleccionar un resultado, indicar cantidad y pulsarlo. El sistema agrega una línea exacta al pedido. Después presionar **Generar cotización**.

## Validación técnica

- `npx tsc --noEmit`: aprobado.
- No modifica tablas ni datos de Supabase.
- Conserva clientes, descuentos, historial, vendedores, reportes, PDF y Excel.
