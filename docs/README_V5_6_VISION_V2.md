# JALESS ONE v5.6 — Vision V2

## Cambios

- Reconstrucción de filas para capturas de tablas.
- Emparejamiento de `cantidad + producto` por posición visual.
- Separación automática de O-Rings NBR, O-Rings Vitón y Cordones.
- Corrección OCR básica de `O/0`, guiones, `x` y espacios.
- Indicador de confianza por línea.
- Conserva el lector tradicional como respaldo para manuscritos y listas simples.

## Prueba recomendada

Usar la captura de Excel con columnas CANTIDAD / ORING / ORING VITON / CORDON.
El resultado debe aparecer como:

```text
O'rings de Nitrilo
2-010 300
2-017 200
...

O'rings de Vitón
2-015 30
...

Cordón
3.0mm 30
...
```

Revisar las líneas marcadas en amarillo antes de usar el pedido.
