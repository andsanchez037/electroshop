# CP-003A — handoff para revisión de seguridad

**Estado: READY_FOR_REVIEW / BLOCKED_EXTERNAL (PostgreSQL/RLS). No aprobado ni aplicado remotamente.**

## Alcance autorizado y punto de partida

El usuario autorizó fundación SQL y adaptador, sin aplicar migraciones remotas, crear administradores reales, desplegar, fusionar main ni iniciar CP-004. Se leyeron AGENTS, PROJECT, REQUISITOS_EXTERNOS y ESTADO antes de modificar archivos.

Se ejecutaron fetch de origin/main y actualización fast-forward (ya actualizado); se creó `cp-003-supabase` desde `ddb22b954bfe391349475a2ad6b4476e03cc464f` (merge de CP-002). No se alteró el historial de main. La entrega se prepara como commit local de esta rama; no se hace push ni PR en esta tarea. Consultar el SHA de entrega con `git log -1 --oneline`.

## Archivos entregados

| Ruta | Cambio |
| --- | --- |
| `supabase/migrations/20261026000100_catalog_security.sql` | Migración transaccional: esquema privado, categorías/productos/admin_users, constraints, índices, propietarios postgres, grants y siete políticas RLS |
| `supabase/seed.sql` | Seed local reproducible 16 productos/4 categorías de CP-002, sin usuarios |
| `supabase/tests/database/catalog_rls.test.sql` | Suite pgTAP con 53 aserciones declaradas; fixtures Auth locales transaccionales y rollback |
| `supabase/config.toml` | Configuración de desarrollo local; esquema privado fuera de la API |
| `supabase/README.md` | Modelo de seguridad, matriz de permisos, instrucciones locales, seed y procedimiento futuro de alta manual |
| `web/src/data/catalog-source.ts` | Adaptador REST tipado, validación runtime, paginación/count exacto, timeout y errores sin fallback |
| `web/src/data/catalog.ts` | Misma API `loadProducts()` delegada al selector de origen; dataset y helpers CP-002 intactos |
| `web/src/components/ProductDetail.tsx` | Ficha usa el mismo loader que catálogo; estado de error/reintento y distinción de SKU ausente |
| `web/scripts/public-env.mjs`, `web/astro.config.mjs` | Bloqueo de claves elevadas y URLs con credenciales antes de generar bundle; sin imprimir valores |
| `web/scripts/generate-seed.mjs`, `web/scripts/test-db.mjs` | Generación/comparación del seed y runner estrictamente local de pgTAP |
| `web/src/data/catalog-source.test.ts`, `web/src/components/catalog-source-ui.test.tsx` | 13 pruebas nuevas de contrato/transporte/configuración y ausencia de fallback en UI |
| `web/vitest.config.ts` | Aísla frontend de credenciales locales, fijando demo en tests; transporte Supabase se inyecta |
| `web/package.json` | Scripts seed:generate, seed:check y test:db; sin dependencias nuevas |
| `.env.example`, `web/.env.example` | Plantillas públicas con modo explícito y placeholders; no contienen claves reales |
| `.gitignore` | Ignora también estado local de Supabase (`.temp`, `.branches`) |
| `PROJECT.md`, `README.md`, `docs/ESTADO.md`, este informe | Estado, pasos verificables, riesgos y bloqueos |

El esquema tiene siete políticas: dos SELECT para categorías (activos/admin), dos SELECT para productos (activos de categorías activas/admin) y tres políticas admin de INSERT/UPDATE/DELETE. admin_users no tiene policies ni grants de cliente. Todas las tablas públicas de esta migración tienen RLS habilitado en SQL; esta declaración aún requiere ejecución real para verificarse.

## Seguridad que debe revisar el orquestador

1. **Grants y RLS combinados:** anon solo SELECT; authenticated tiene DML de productos, restringido por RLS. Categorías no admiten escritura de cliente. admin_users no admite lectura ni escritura de ningún cliente, incluido admin. Se revocan también grants automáticos de PUBLIC y service_role sobre estas tablas; nunca se usa su clave.
2. **Membresía verificada en PostgreSQL:** helper en `electroshop_private`, propietario postgres, SECURITY DEFINER/STABLE, sin parámetros, `search_path=''`, objetos cualificados. Devuelve membresía de auth.uid(), sin user_metadata ni rol cliente. EXECUTE solo authenticated; esquema no expuesto por config.toml. El operador deberá conservar esa exclusión en la configuración remota futura.
3. **Frontera de confianza:** propietario/operador postgres puede gestionar membresías fuera de RLS; el navegador no. No se crea RPC para conceder permisos. Primer admin solo mediante procedimiento SQL manual futuro con UUID Auth revisado, después de autorización, nunca desde seed.
4. **Constraints:** SKU único/canónico, integer no negativo en centavos/stock, FK de categoría con RESTRICT, límites de textos, flags NOT NULL; UUID único/FK a auth.users para membresías. Nuevas migraciones son de una sola aplicación; fallan ante objetos incompatibles en vez de ignorar conflictos.
5. **Anon vs error vs vacío:** el adaptador usa apikey publishable, sin Authorization de usuario, sin cookies ni escrituras. Un fallo rechaza, no devuelve demo; cero registros mantiene vacío; datos fuera de contrato fallan explícitamente. No se registran response body/headers/URL/errores crudos. Paginación por Content-Range exacto para evitar truncar al límite del servidor.
6. **Entornos:** demo es la selección inicial, aunque haya URL/key. Supabase requiere modo explícito y key publishable válida; claves elevadas, JWT legacy, nombres PUBLIC_* no previstos, interpolación en URL y credenciales/query/hash en URL se rechazan sin valores en mensajes. Vite mantiene su resolución normal de modo/precedencia; el preflight revisa archivos dotenv del directorio web (también modos personalizados) y entorno del proceso solo para prevenir exposición. Las tres variables públicas son deliberadamente públicas al compilar; no se ha inspeccionado ni modificado el contenido de .env.local para esta entrega fuera de su validación en proceso.

## Verificación ejecutada auténtica

Desde `web/` (PowerShell, Node 24.6.0, npm 11.5.1):

| Comando | Estado y evidencia |
| --- | --- |
| `node scripts/generate-seed.mjs` | PASS: generó archivo SQL local desde el dataset aprobado; no ejecutó SQL |
| `npm.cmd run seed:check` | PASS: seed coincide byte a byte (normalizando CRLF) con los 16 productos y las 4 categorías originales |
| `npm.cmd run check` | PASS: 24 archivos, 0 errores/advertencias/hints |
| `npm.cmd run lint` | PASS: sin errores |
| `npm.cmd run test` | PASS: 4 archivos, 27 pruebas, incluidos los 14 tests aprobados CP-002 sin cambios |
| `npm.cmd run build` | PASS: cinco páginas Astro estáticas; sin lectura de API remota en build |
| Build de QA con `PUBLIC_CATALOG_MODE=demo` explícito + smoke existente sobre copia temporal de dist | PASS: cuatro rutas a 360/1440 px, axe incluido contraste, teclado/skip link, búsquedas/filtros, ficha/recarga, SKU inválido y 404, sin pageerror JavaScript. Capturas en copia temporal, sin sobrescribir evidencia CP-002 |
| `npm.cmd run test:db` | **BLOCKED_EXTERNAL**, exit 2: Supabase CLI y Docker no disponibles. Ninguna aserción SQL ejecutada; no PASS de RLS ni constraints ni sintaxis PostgreSQL |
| Inspección Git de estilos, páginas, layouts, assets, lockfile y tests originales | Sin cambios en esos archivos respecto de main |

No se añadieron dependencias ni se modificó package-lock.json; no fue necesaria instalación nueva. La pasada inicial de controles se repitió tras reforzar validación de URLs públicas incluso en demo; los resultados finales de check/lint/27 tests/build/seed:check son PASS. El smoke se ejecutó en modo demo explícito; no valida una API Supabase ni RLS. No se afirma una nueva auditoría npm ni pruebas remotas que no se ejecutaron.

La suite pgTAP preparada cubre grants, RLS habilitado, helper/search_path, seed, unique/FK/checks, anon, authenticated normal, metadata falsificada, falta de sub, CRUD admin, autoasignación y revocación. **53 es el número de aserciones declaradas, no de tests SQL superados.**

## Bloqueos y riesgos abiertos

- **BLOCKED_EXTERNAL / alto para aceptación de seguridad:** no hay Supabase CLI/Docker/psql locales disponibles. No se ejecutaron ni migración ni seed ni pgTAP en PostgreSQL. La suite puede requerir correcciones cuando se ejecute contra la versión real de Supabase local; no debe tratarse como probada por inspección o mocks.
- **Pendiente por instrucción del usuario:** aplicar SQL remoto, verificar grants/RLS efectivos a través del gateway real y comprobar persistencia remota. CP-003 completo no satisface aún sus criterios de integración; esta entrega es CP-003A y espera revisión.
- **Seed demo:** reejecutarlo actualiza los 16 SKU; puede sobrescribir cambios demo. Repetibilidad del SQL y comparación de datos comprobadas por generación; idempotencia ejecutada en base sigue pendiente. No contiene administradores.
- **Taxonomía:** la base permite categorías por identificador; UI/adaptador admiten las cuatro categorías aprobadas. Una nueva categoría requerirá ampliar el contrato/UI con autorización; filas de categoría desconocida producen error, no fallback.
- **Inicio:** los destacados/categorías de portada siguen estáticos y explícitamente DEMO. Solo catálogo y ficha comparten el nuevo origen. No se afirma integración persistente global del sitio.
- **Operación:** el runner exige Supabase CLI/Docker locales, puerto/db local y salida TAP verificable; no interpreta herramientas ausentes o cero tests como éxito. No se implementan políticas de categorías editables ni administración de membresías cliente.
- **Accesibilidad/UX heredadas:** JS requerido, metadatos sociales genéricos, sin canonical público, pruebas en Edge a dos anchos sin lector de pantalla/dispositivo físico. Sin cambios de estilos ni assets.

## Cómo reproducir y qué no ejecutar todavía

1. Frontend local: `cd web`, `npm.cmd run dev -- --host 127.0.0.1`; modo demo por defecto. No copiar ni versionar claves reales. Reiniciar/reconstruir después de cambiar variables.
2. Tras revisar el SQL, en una instancia **local desechable** con herramientas disponibles: `supabase start`, `supabase db reset --local` y `cd web; npm.cmd run test:db`. El reset borra exclusivamente esa base local. Ver advertencias de claves de salida y pasos detallados en `supabase/README.md`. Este procedimiento no se ejecutó aquí.
3. Repetir seed en local para comprobar idempotencia y volver a ejecutar pgTAP. Si falla autorización, corregir y repetir revisión, no aplicar remoto.
4. El orquestador revisa SQL, grants, policies, helper, pruebas y bloqueo. Solo tras dictamen y nueva autorización se podrá considerar SQL remoto e integración. No usar --linked/--db-url ni crear admins reales durante CP-003A.

**Siguiente acción: esperar revisión de seguridad. Sin push, merge, despliegue ni CP-004.**
