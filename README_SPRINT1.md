# JALESS ONE - Sprint 1

Objetivo: dejar listo el catálogo de productos de Jaless en Supabase e importar la lista de precios desde Excel.

## 1. Copiar archivos
Copia el contenido de esta carpeta dentro de tu proyecto:

`C:\Proyectos\Jaless\jaless-sales-hub`

Acepta reemplazar `src/app/page.tsx` si Windows lo pregunta.

## 2. Instalar dependencias
En CMD, dentro del proyecto:

```cmd
cd C:\Proyectos\Jaless\jaless-sales-hub
npm install @supabase/supabase-js xlsx dotenv
```

## 3. Crear .env.local
Copia `.env.local.example` como `.env.local` y completa:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Los encuentras en Supabase > Project Settings > API.

IMPORTANTE: `SUPABASE_SERVICE_ROLE_KEY` es privada. No la compartas ni la subas a GitHub.

## 4. Crear tablas
En Supabase > SQL Editor, abre `database/001_jaless_one_base.sql`, copia todo y ejecútalo.

## 5. Colocar Excel
Crea/copia el archivo de precios en:

`data/lista-precios.xlsx`

## 6. Importar productos
En CMD:

```cmd
npm run dev
```

En otra ventana de CMD:

```cmd
cd C:\Proyectos\Jaless\jaless-sales-hub
node scripts/importar-lista-precios.mjs data/lista-precios.xlsx
```

Resultado esperado: cerca de 6,928 productos importados.

## 7. Probar búsqueda

```cmd
node scripts/probar-busqueda.mjs 100-120
```

También puedes probar:

```cmd
node scripts/probar-busqueda.mjs 3x5
node scripts/probar-busqueda.mjs ACF12100-120W1
```

## Entrega lograda
- Base de catálogo creada.
- Excel importado a Supabase.
- Búsqueda básica por código, descripción, medida y texto.
