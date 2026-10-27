# Electro Shop · demo universitaria

CP-002 aprobado: Astro estático + islas React + TypeScript estricto + Tailwind compilado. Inicio, catálogo con 16 productos ficticios en cuatro categorías y ficha por SKU. CP-003A prepara SQL/RLS, seed y adaptador de lectura, **pendiente de revisión de seguridad y pruebas PostgreSQL locales**. No se han aplicado migraciones remotas. **DEMO / NO ES UNA COMPRA REAL.**

## Ejecutar en Windows / VS Code

Requisitos: Node >=22.23.4 (verificado con 24.6.0), npm y Git. Abre la raíz del repositorio en VS Code:

```powershell
cd web
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1
```

Abre http://127.0.0.1:4321. `npm.cmd` evita el bloqueo de npm.ps1 sin cambiar la política de PowerShell. En otras terminales puedes usar npm. Para reproducir exactamente el lockfile usa `npm.cmd ci`. Para revisar salida estática usa `npm.cmd run build` y `npm.cmd run preview -- --host 127.0.0.1`.

## Prueba visual

| Ruta | Comprobar |
| --- | --- |
| `/` | Buscador, categorías y cuatro destacados con enlaces funcionales |
| `/catalogo` | 16 productos; búsqueda, categoría y disponibilidad combinables; limpiar |
| `/catalogo?q=es-d001` | Un resultado sin distinguir mayúsculas |
| `/catalogo?categoria=energia` | Cuatro productos de Energía |
| `/producto?sku=ES-D001` | Descripción, precio MXN, SKU, 8 unidades demo, cantidad |
| `/producto?sku=ES-C003` | Sin stock demo, cantidad deshabilitada |
| `/producto?sku=INVALIDO` | Producto no encontrado y enlace para volver |
| `/acerca` | Alcance y límites |
| `/no-existe` | Página 404 |

Prueba a 360 px y en escritorio. Usa Tab: el primer enlace permite saltar al contenido. Busca con Enter y recorre filtros y enlaces. Escribe `inexistente` para ver cero resultados y limpia filtros. Recarga una ficha para comprobar el SKU. Los filtros son locales a la vista; al recargar se inicializan desde la URL de entrada.

## Calidad y evidencia

Desde web:

```powershell
npm.cmd run check
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run smoke
npm.cmd audit --json
npm.cmd run seed:check
npm.cmd run test:db
```

Vitest prueba integridad del dataset, centavos, SKU, búsqueda normalizada, filtros combinados, carga, vacío, error/reintento y fichas. Testing Library comprueba interacción. Axe en jsdom valida reglas de accesibilidad salvo contraste, que requiere layout real.

El smoke adicional usa Playwright Core y **Microsoft Edge instalado**, sin descargar navegadores. Ejecuta primero el build. Inicia su servidor estático en 127.0.0.1:4322, revisa cuatro rutas a 360/1440 px, desbordamiento, axe con contraste, búsqueda desde header, filtros, recarga por SKU, salto por teclado, 404 y errores JS. Guarda ocho capturas en `docs/evidencia/CP-002/` y cierra navegador/servidor. Sin Edge, ese smoke requiere instalarlo o adaptar el canal; las pruebas unitarias no requieren navegador.

Resultados auténticos e incidencias: [docs/ESTADO.md](docs/ESTADO.md). Las pruebas automáticas no sustituyen revisión humana con teclado y lector de pantalla. `test:db` es independiente de los tests frontend: requiere Supabase CLI y Docker locales; si faltan informa BLOCKED_EXTERNAL, nunca PASS. En esta entrega no está validado PostgreSQL/RLS por falta de esos servicios; no confundir mocks HTTP con pruebas de autorización reales.

## Archivos y decisiones

- `web/src/pages/`: Astro estático; inicio, catálogo, producto por query SKU, acerca y 404.
- `web/src/layouts/Layout.astro`: HTML en español, metadatos, header con buscador GET, navegación, skip link y footer.
- `web/src/components/`: catálogo/detalle React hidratados, tarjetas e ilustraciones reutilizables; destacados del inicio renderizados estáticamente.
- `web/src/data/catalog.ts`: contrato tipado, 16 productos, cuatro categorías, precios enteros en centavos y adaptador local pequeño `loadProducts`.
- `web/src/styles/global.css`: Tailwind compilado mediante Vite y estilos originales responsive; sin CDN, fuentes ni imágenes remotas.
- `web/scripts/smoke.mjs`: navegador y evidencia reproducible.
- `web/*config*`, `web/package.json`, `web/package-lock.json`: configuración y dependencias reproducibles. Testing Library, jsdom, axe y Playwright Core se usan solo para verificación.

Carrito reservado para CP-005: botón deshabilitado con explicación; no guarda selección ni pedido. Cantidad únicamente de referencia. Sin login, admin simulado, Firebase ni despliegue. Sin datos personales, contactos operativos ni assets de DIP Mecatrónica. Wordmark temporal e ilustraciones SVG propias por categoría; no son fotografías de cada producto.

La ficha estática genérica resuelve el SKU al hidratar: requiere JavaScript y ofrece aviso si está desactivado. Actualiza el título en navegador; metadatos sociales genéricos, sin URL canónica hasta disponer de dominio autorizado. Catálogo con carga, vacío y error/reintento sin retrasos artificiales.

## Revisión

[PROJECT.md](PROJECT.md) es la especificación vigente. Lee también [AGENTS.md](AGENTS.md), [docs/CODEX_START.md](docs/CODEX_START.md) y [REQUISITOS_EXTERNOS.md](REQUISITOS_EXTERNOS.md). CP-001 queda intacto; su mención de preview no autoriza despliegue en CP-002.

Rama `cp-002-foundation`, repositorio `andsanchez037/electroshop`. Por autorización del usuario se prepara un commit documental y el push de esta rama para revisión: https://github.com/andsanchez037/electroshop/tree/cp-002-foundation. El resultado del envío se informa al terminar la operación; no equivale a aprobación del checkpoint ni a despliegue del sitio.

`AGENTS.md`, los documentos de `docs/`, los antecedentes CP-001 y `.env.example` con placeholders se incorporan a la entrega versionada. El informe `REVIEW_CP002.md` conserva la auditoría del commit de implementación `bd6574b`; el ZIP local de aquella entrega se excluye de Git y no representa commits posteriores. CP-003A está autorizado solo como fundación; aplicar SQL remoto o comenzar CP-004 requiere autorización posterior.

## CP-003A: base SQL y selección de origen

CP-002 ya fue integrado en main. Esta fase se desarrolla en `cp-003-supabase` desde el main actualizado; no autoriza ejecutar SQL remoto ni avanzar a CP-004. La guía de seguridad, matriz de permisos, procedimiento futuro de alta manual y reproducción de tests están en [supabase/README.md](supabase/README.md). El handoff está en [docs/CP003A_HANDOFF.md](docs/CP003A_HANDOFF.md).

- `supabase/migrations/20261026000100_catalog_security.sql`: tablas categories/products/admin_users, constraints, grants mínimos y RLS; helper sin parámetros en esquema privado, search_path vacío y membresía verificada en PostgreSQL. No crea usuarios.
- `supabase/seed.sql`: cuatro categorías y 16 productos CP-002; upsert reproducible. `npm.cmd run seed:generate` lo regenera; `seed:check` detecta divergencias. El seed sobrescribe los datos demo de los mismos SKU, sin borrar filas extra; solo aplicar en contexto demo revisado.
- `supabase/tests/database/catalog_rls.test.sql`: pgTAP local para anon/usuario normal/admin; también autoasignación, metadata falsificada, revocación, grants y constraints. No ejecutado aquí por falta de servicios locales.
- `web/src/data/catalog-source.ts`: adaptador tipado compatible con `loadProducts(): Promise<readonly Product[]>`; REST Supabase mediante fetch nativo, sin SDK/dependencias nuevas. Selección de columnas, paginación por Content-Range/count exacto, validación de datos y errores sin detalles sensibles. Catálogo y ficha usan el mismo origen.
- `web/scripts/public-env.mjs` y `astro.config.mjs`: validación de variables públicas antes del bundle y al elegir adaptador. No imprime claves ni URLs.

Para la demo local **no necesitas credenciales**. Se usa `PUBLIC_CATALOG_MODE=demo` por defecto; disponer de URL/key no activa Supabase automáticamente. Puedes copiar `web/.env.example` a `web/.env.local` si todavía no existe; no sobrescribas tu archivo local ni compartas su contenido. Esta entrega no modifica el .env.local existente.

Tras revisión de seguridad y autorización de la integración, el operador podrá seleccionar explícitamente `PUBLIC_CATALOG_MODE=supabase` junto con `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Solo acepta `sb_publishable_...`; rechaza secret/service_role/JWT legacy y PUBLIC_* no previstas antes de compilar. HTTPS obligatorio salvo localhost. Las claves públicas solo son seguras con grants/RLS correctos; nunca usar credenciales elevadas en PUBLIC_*. Las variables se incorporan al bundle estático: reiniciar dev/reconstruir después de cambiarlas.

**En modo Supabase no hay fallback:** error HTTP/red/timeout, esquema inválido o paginación inconsistente rechazan la lectura y activan error/reintento en la UI; cero filas devuelve vacío real; una ficha sin coincidencia muestra no encontrado. El modo demo se elige al configurar, nunca al fallar una llamada. No se consultó la API real durante esta tarea: pruebas de transporte inyectadas y UI en demo.

Límites CP-003A: el inicio/destacados y la taxonomía visual siguen estáticos con los datos DEMO aprobados. El adaptador admite las cuatro categorías actuales; una categoría desconocida provoca error de contrato, no sustitución. No hay Auth/CRUD de interfaz ni escrituras cliente. La integración remota, la verificación del gateway y las pruebas PostgreSQL ejecutadas siguen pendientes. Los tests frontend fijan modo demo para aislar credenciales locales; las pruebas específicas del adaptador usan respuestas simuladas explícitas.
