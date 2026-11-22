# CP-006 — preparación local del release

Rama `cp-006-release-prep`, base exacta `8f4bda41a1b96218b8f26f17680228c4d9cfa427`. Esta entrega prepara el MVP para revisión independiente. La integración en GitHub, la publicación y el smoke público requieren autorización posterior.

**Preparación local PASS. Release público BLOCKED_EXTERNAL.** El SHA de revisión es el del commit que agrega este handoff. El patch se exporta desde la base indicada.

## Cambios

- `netlify.toml` fija base `web`, build `npm run build`, publicación de `dist` relativo a la base y Node 24. Las rutas se sirven como páginas Astro estáticas y conservan el 404.
- `web/scripts/smoke.mjs` comprueba carga y recarga de catálogo, ficha por SKU, carrito, checkout y admin a 360/1440 px. Comprueba query string, metadatos, favicon, noindex, consola, acceso cerrado sin autenticación y accesibilidad. `--no-screenshots` preserva evidencia anterior.
- `web/scripts/admin-session-browser.mjs` simula la ausencia de la RPC y verifica que el admin no haga lecturas privilegiadas hasta recuperar acceso mediante reintento. Usa Edge y el SDK real con transporte sintético.
- `README.md`, `PROJECT.md`, `docs/ESTADO.md`, este handoff y el checklist registran reproducción, alcance y puertas de release. El código de aplicación, SQL y dependencias mantienen la implementación aprobada de CP-004/005.

## Revisión frontend y de seguridad

- El smoke del artefacto estático cubre navegación, búsqueda, filtros, SKU válido e inválido, foco de teclado, contraste, carrito persistente, sincronización entre pestañas, ajuste por stock, envío y recolección ficticios y comprobante temporal. Vitest cubre además carga, vacío, error y reintento del catálogo y de la compra DEMO. La auditoría automatizada de accesibilidad usa Edge.
- Los únicos nombres públicos admitidos son `PUBLIC_CATALOG_MODE`, `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_PUBLISHABLE_KEY`. El validador exige un origen HTTPS excepto loopback y rechaza claves elevadas, JWT o variables públicas inesperadas. Los entornos de prueba se compilaron en una copia aislada. El control negativo rechazó un secreto sintético en compilación y omitió su valor del diagnóstico.
- El checkout mantiene los datos de entrega en memoria, persiste únicamente SKU y cantidad y conserva el comprobante durante la vista actual. La única red de compra en modo Supabase es la lectura anónima del catálogo. Las pruebas bloquearon tráfico fuera de los orígenes de prueba y confirmaron que no se envían pedidos, pagos o registros de entrega.
- Admin comprueba membresía mediante la RPC de CP-004 y RLS restringe escrituras. La configuración DEMO deja el admin cerrado, y el test 404 de RPC comprueba que tampoco se muestran productos ni controles privilegiados si falta la migración con un usuario autenticado. GoTrue local probó sesión, CRUD, revocación y rechazo de operaciones REST sin membresía.
- Sin Web Locks las escrituras simultáneas del carrito son de mejor esfuerzo. En admin, una copia restaurada tras desaparecer la pestaña dueña puede ser indistinguible de una recarga. El catálogo necesita JavaScript. Los metadatos de ficha son genéricos antes de hidratar. Las pruebas en lector de pantalla y dispositivo físico quedan pendientes.

## Resultados nuevos de CP-006

Node 24.6.0, npm 11.5.1, Edge y copia aislada sin `.env.local` de producción. Docker Desktop Linux 29.9.2 y Supabase CLI 3.0.0 para la base desechable.

| Comando o comprobación | Resultado |
| --- | --- |
| `npm.cmd run check` y `npm.cmd run lint` | **PASS**. Type check de 49 archivos, cero errores, warnings o hints |
| `npm.cmd run test` | **PASS**, 80/80 en 10 archivos |
| `npm.cmd run seed:check` | **PASS**, seed reproducible de 16 productos |
| `npm.cmd run build` | **PASS** en DEMO y Supabase local, ocho rutas en cada build |
| TOML y resolución de artefactos | **PASS**. Parseado con el parser del árbol de dependencias, valores confirmados con documentación de Netlify y salidas comprobadas bajo `web/dist` |
| Auditoría de ambos bundles | **PASS**. 25 archivos por build al escanear patrones de credenciales, valores configurados en el workspace, archivos de entorno y mapas de fuente. El build Supabase incluyó la clave publicable local esperada. Control negativo de build con clave elevada sintética **PASS** |
| `npm.cmd run smoke -- --no-screenshots` | **PASS**, Edge 360/1440 px en el build DEMO |
| `npm.cmd run smoke -- --supabase-local --no-screenshots` | **PASS**, Edge 360/1440 px y catálogo PostgREST real en loopback |
| `npm.cmd run test:db` | **PASS**, 53/53 CP-003A y 16/16 CP-004 en pg_prove y TAP independiente |
| `npm.cmd run test:admin:local` | **PASS**, GoTrue/CRUD/REST/RLS reales en local |
| `npm.cmd run test:admin:browser` | **PASS**, RPC ausente y reintento, aislamiento, renovación y revocación, con SDK real y API sintética |

Antes y después, la base desechable tenía cuatro categorías, 16 productos y cero usuarios, membresías, identidades y sesiones. Se detuvo el stack y se conservó su volumen. El smoke solo utilizó el build y orígenes de prueba. La primera comprobación auxiliar de TOML rechazó el prototipo del objeto devuelto por el parser. La comparación normalizada pasó y el archivo de configuración no requirió cambios. La evidencia histórica se conserva en los handoffs originales. [CP004_HANDOFF.md](CP004_HANDOFF.md) · [CP005_HANDOFF.md](CP005_HANDOFF.md)

## Puertas externas

**BLOCKED_EXTERNAL para release público.** CP-004 y CP-005 están en GitHub y pendientes de integrar en `main`. Según los ajustes reportados por el usuario, mergear CP-004 puede disparar a la vez el deploy Netlify y la aplicación de la RPC en Supabase. El historial remoto de la RPC, la identidad demo autorizada, los contextos de entorno efectivos, la disponibilidad Free y el smoke público siguen pendientes. Las instrucciones locales y el orden seguro están en el checklist. [Checklist CP-006](CP006_RELEASE_CHECKLIST.md)

## Revisión independiente

1. En una copia del commit base `8f4bda41a1b96218b8f26f17680228c4d9cfa427`, comprobar el patch con `git apply --check CP006_REVIEW.patch` y revisar `netlify.toml`, ambos scripts de smoke y la documentación.
2. Repetir el bloque PowerShell del README. Para reproducir la integración, usar un stack desechable local con las dos migraciones, construir en modo Supabase de loopback y ejecutar los comandos reales y sintéticos registrados arriba.
3. Revisar el checklist y emitir el dictamen local antes de autorizar cualquier cambio de integración o publicación. [Reproducción en README](../README.md) · [Checklist CP-006](CP006_RELEASE_CHECKLIST.md)
