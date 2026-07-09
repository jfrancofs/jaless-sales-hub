# JALESS ONE – Documento Maestro del Proyecto

## Versión actual
v1.0 Beta – Cotización profesional, clientes e importación de clientes.

## Visión
JALESS ONE será el sistema comercial de Jaless Import SAC. El objetivo inicial es que los vendedores generen cotizaciones rápidas y precisas a partir de pedidos escritos, usando el catálogo oficial y aplicando descuentos por cliente y categoría.

## Familias comerciales
1. O'Rings: unidad, NBR/Vitón, NBR dureza 70 por defecto, D90 solo explícito.
2. Abrazaderas: Cremallera, Industrial, RSGU. Jaless por defecto. Power solo explícito. Industrial no usa fleje.
3. Seguros: Interior, Exterior, Radial.
4. Cordones: se venden por metro. NBR o Vitón. Sinónimo: O'ring por metro.
5. Bonded Seal / Arandela con Jebe: acepta BS, SCR, ARJ y pedidos tipo “perno 8”.
6. Pines de Expansión: acepta 8*40, 8x40, M8*40, M8x40.
7. Billas de Acero: milimétricas y pulgadas.
8. Pasadores de Horquilla: acepta formatos en pulgadas.

## Descuentos
Los descuentos son por cliente y por categoría. Si una categoría no tiene descuento configurado para el cliente, el descuento aplicado es 0%.

## Cotización
La cotización debe mostrar precios sin IGV, descuento por línea, subtotal, IGV 18% y total general en USD.

## Siguientes módulos
- Guardar cotizaciones en historial.
- Numeración persistente en Supabase.
- PDF profesional.
- Administración de clientes y descuentos desde web.
- OCR para imágenes y PDFs.
