# JALESS ONE v5.5 — Pedidos desde imágenes

## Funciones

- Carga de una o varias imágenes desde PC o celular.
- Captura directa con la cámara trasera en dispositivos compatibles.
- OCR en el navegador con Tesseract.js en español.
- Vista previa de cada imagen.
- Revisión línea por línea con estados Confirmado, Revisar y No encontrado.
- Edición, eliminación y reclasificación manual de líneas.
- Reemplazo del pedido actual o agregado de líneas al pedido existente.

## Consideraciones

- La primera lectura puede tardar porque el navegador descarga el modelo OCR en español.
- Capturas de Excel y texto impreso suelen dar mejores resultados.
- Los manuscritos deben revisarse siempre antes de cotizar.
- La función no guarda imágenes en Supabase; se procesan temporalmente en el navegador.

## Instalación

Después de copiar la versión, ejecutar:

```cmd
npm install
npm run dev
```
