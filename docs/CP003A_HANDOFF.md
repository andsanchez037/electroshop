# CP-003A — handoff para revisión de seguridad

**Estado vigente (2026-11-06): APPROVED — implementación y validación local únicamente.** El usuario comunicó la aprobación del orquestador externo tras revisar CP003A_REVIEW.patch, correspondiente a la entrega `47f04dc426d7083d86811a57dab7894876b8038a`: 53/53 SQL/RLS sin fallos ni omisiones, REST anon 7/7 y seed idempotente. **Remoto sin aplicar; CP-003B/CP-004 no autorizados.** Los resultados/bloqueos y estados de revisión anteriores se conservan como historial.

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

## Intento de validación local — BLOCKED_EXTERNAL

El usuario comunicó que la revisión estática externa del commit `6387a5e6c7d7a6d142e5d995728553687675dc5b` no encontró escalación de privilegios confirmada, pero **no aprobó CP-003A**. Autorizó validar exclusivamente en Supabase local desechable, con parada explícita si faltan herramientas y sin instalar software del sistema sin aprobación.

Se releyeron AGENTS, PROJECT, este handoff, supabase/README y ESTADO. Rama comprobada: `cp-003-supabase`, HEAD inicial `6387a5e6c7d7a6d142e5d995728553687675dc5b`. La modificación previa de `.env.example` se conserva fuera del commit; no se leen ni muestran sus valores ni los de `.env.local` en este intento.

### Evidencia nueva de herramientas

| Inspección local ejecutada | Resultado |
| --- | --- |
| `Get-Command docker/docker.exe` | No disponibles en PATH |
| `Get-Command supabase/supabase.exe/supabase.cmd` | No disponibles en PATH |
| Docker Desktop y docker.exe bajo Program Files y rutas de instalación por usuario habituales | Ninguno de los candidatos existe |
| Registro de desinstalación HKLM, vistas 64/32 bits (segunda lectura mediante Microsoft.Win32.RegistryKey) | 0 entradas Docker Desktop; 0 errores de lectura |
| Procesos Docker Desktop, com.docker.backend y dockerd | 0 detectados |
| Servicio com.docker.service | 0 detectados |
| CLI Supabase en Scoop, enlace WinGet, npm de usuario y web/node_modules/.bin | No encontrada en rutas comprobadas |
| WSL launcher | wsl.exe disponible; esto NO demuestra que WSL2 o Docker estén configurados |
| Override DOCKER_HOST | Ausente; no se contactó ningún daemon remoto |

La primera consulta PowerShell de registros mediante wildcard produjo un error de conversión; por ello se repitió mediante RegistryKey, con cero errores. No se basa el bloqueo únicamente en PATH. Con estas comprobaciones, Docker Desktop/motor y CLI Supabase **no están disponibles para ejecutar esta validación**. No se instaló software ni se intentó reemplazar la prueba real con mocks o una base distinta.

### Resultado de esta ejecución

- **53/53 aserciones SQL/RLS: NOT EXECUTED (0 ejecutadas), BLOCKED_EXTERNAL.** No se inicia Supabase, no se aplican migraciones/seed, no se crean usuarios ni administradores, y no se ejecutan pgTAP ni pruebas REST.
- Seed: ejecución SQL e idempotencia **NOT EXECUTED**. Comprobar que el generador coincide con un archivo SQL no acredita idempotencia en PostgreSQL.
- Windows runner: compatibilidad efectiva con la CLI y rechazo de tests omitidos/parciales **pendientes**. La inspección del código actual muestra que valida un recuento mayor que cero, no exactamente 53; antes de aceptar una ejecución debe reforzarse esa comprobación y verificarse el TAP completo. No se ejecuta ni modifica el runner en este intento, por la instrucción de detenerse ante herramientas ausentes.
- Frontend check/lint/test/build: **NOT RUN en este intento**, por la parada solicitada. Los PASS anteriores de la tabla histórica corresponden a la implementación previa, no a esta validación.
- Cambios exclusivos de documentación de bloqueo en ESTADO y este handoff; código CP-002/CP-003A, dependencias, SQL y configuración intactos. Commit local documental, sin push. No se ejecutan Git fetch/ls-remote/push ni llamadas a Supabase u otros servicios externos.

### Acción humana exacta para desbloquear

1. Instalar Docker Desktop para Windows mediante su instalador oficial. Esta instalación de sistema no fue autorizada para ejecución por el agente y debe realizarla el usuario; si el instalador pide habilitar WSL2/virtualización o reiniciar, completar esos pasos.
2. Abrir Docker Desktop, seleccionar/usar el motor de contenedores Linux y esperar a que indique que está operativo.
3. Abrir una terminal PowerShell nueva en este equipo y comprobar `docker --version` y `docker version --format '{{.Server.Os}} {{.Server.Version}}'`. El segundo debe devolver `linux` y la versión del servidor, sin error de conexión. Si Docker ya está instalado en una ruta diferente, indicar la ruta y hacerlo accesible a esta sesión.
4. Solicitar reanudar la validación local. Con Docker disponible, podrá prepararse la CLI oficial mediante un método local soportado, dentro de la autorización dada. No se instaló CLI en este intento porque Docker ya bloquea toda la validación y el usuario pidió detenerse ante herramientas ausentes.

No se solicita compartir claves ni salidas de `supabase start/status`. CP-003A continúa **NO APROBADO**. Esperar disponibilidad de herramientas e instrucción de reanudación; ninguna operación remota ni CP-003B/CP-004 está autorizada.

## Validación local ejecutada — 2026-11-06 / LOCAL PASS

Esta sección reemplaza el bloqueo vigente de herramientas; las secciones anteriores conservan la evidencia histórica. CP-003A **sigue pendiente de aprobación independiente**. Rama `cp-003-supabase`; partida `047ea71e5e557f977b7d499d65e50a1f861bdd3b`, sin push de este trabajo.

### Entorno y frontera local

Docker Desktop Linux 29.9.2, contexto desktop-linux con endpoint npipe local; CLI Supabase 3.0.0 vía Scoop (manifest de release oficial supabase/cli); PostgreSQL 17.11. No se instaló software del sistema. Se añadieron las rutas existentes de Docker y Scoop al PATH del proceso. CLI necesita poder escribir configuración/telemetría local; la primera llamada restringida falló y se repitió con permisos de ejecución. No se mostraron credenciales.

La ayuda de CLI 3 confirma que `db reset` y `test db` son locales por defecto y ya no admiten `--local`; remoto requeriría `--remote`, que no se utilizó. El runner distingue CLI 2 (con --local) y 3 (local por defecto); solo CLI 3 fue ejecutada aquí. Rechaza argumentos externos y endpoints Docker remotos. No lee entornos web para conectarse a base ni API.

### Resultados auténticos

| Comando ejecutado | Resultado |
| --- | --- |
| `supabase start` (raíz) | PASS, exit 0; stack exclusivamente local, imágenes descargadas |
| `supabase db reset --yes` (raíz, CLI 3) | PASS, exit 0; migración versionada y seed aplicados a base local desechable |
| Primera ejecución `npm.cmd run test:db` | FAIL: 30/53 antes de error PostgreSQL de CTE modificador anidado; nunca aceptado como PASS parcial |
| `npm.cmd run test:db` después de corrección SQL | PASS: pg_prove 53/53 y TAP independiente 53/53; cero fallos, SKIP, TODO o aserciones faltantes |
| `node scripts/validate-db-local.mjs` (web) | PASS: seed dos veces idéntico en datos/UUIDs; REST anon 7/7; snapshots intactos; 0 usuarios y 0 admins |
| `npm.cmd run test:db` tras repetir seed | PASS otra vez: mismas 53 aserciones completas, verificadas tanto por pg_prove como por TAP |
| `npm.cmd run check` | PASS: 27 archivos, 0 errores/warnings/hints |
| `npm.cmd run lint` | PASS final; corregidos globales Node de scripts nuevos tras primer FAIL |
| `npm.cmd run test` | PASS: 31/31 en 5 archivos (27 existentes + 4 regresiones) |
| `npm.cmd run seed:check` | PASS: coincide con los 16 productos CP-002 |
| `npm.cmd run build` | PASS: cinco páginas estáticas |

El runner repite la transacción de tests con psql local porque pg_prove oculta normalmente las líneas TAP. Verifica plan 1..53 y números consecutivos, además del resumen exacto; no cuenta las repeticiones como nuevos casos. Regresiones comprueban suite vacía/parcial/extra, plan ausente, numeración duplicada, SKIP, TODO, bailout, not ok y endpoints Docker remotos. Ejecución Windows real satisfactoria con `supabase.exe`/Scoop y docker.exe; no se usa shell para lanzar comandos desde Node.

Cobertura SQL efectivamente ejecutada: RLS en las tres tablas; grants; helper SECURITY DEFINER/search_path; seed; SKU/precio/stock/FK; lectura anon activa; escritura anon denegada; usuario normal con metadata admin falsa; ausencia de sub; escritura normal denegada/cero filas; membresías privadas y autoasignación protegida; CRUD admin; revocación sin renovar JWT. Usuarios/admins son fixtures transaccionales sin contraseñas ni cuentas Auth reales; terminan en rollback.

REST utiliza únicamente URL loopback validada y credencial anon del stack local en memoria. Casos: GET products 200 con 16 filas, GET categories 200 con 4; POST/PATCH/DELETE products denegados (401/403), GET admin_users y POST de autoasignación denegados. Se compara snapshot final completo. Las pruebas HTTP no crean usuarios ni administradores. Seed: dos aplicaciones adicionales del mismo SQL, comparando todas las columnas y UUIDs ordenados; no solo los recuentos.

### Correcciones y límites restantes

- Solo cuatro CTE de la suite SQL y plan explícito; migración, políticas y seed sin cambios. Ejecutar CTE modificadores al nivel superior evita el error de PostgreSQL.
- Runner reforzado y nuevos scripts/regresiones de validación; ninguna dependencia nueva ni cambios de UI, estilos o funcionalidad CP-002.
- `.env.example` y `web/.env.example` eran cambios previos del usuario: conservados byte a byte, fuera del commit. `.env.local` ignorado/no versionado. No se imprimen claves ni salida completa de start/status.
- Taxonomía de cuatro categorías, destacados estáticos DEMO y límites heredados de accesibilidad permanecen. No se ejecutaron smoke ni audit nuevos.
- La validación local no acredita gateway/configuración del proyecto remoto ni aprobación del orquestador. Ningún SQL remoto, enlace, db push, cuenta real, despliegue, push GitHub, merge, CP-003B o CP-004.

Reproducción local con CLI 3: iniciar stack, `supabase db reset --yes` en copia desechable, y desde web ejecutar `npm.cmd run test:db`, `node scripts/validate-db-local.mjs`, otra vez `npm.cmd run test:db` y controles frontend. Nunca añadir --remote ni URLs externas. Consultar supabase/README para CLI 2 y seguridad de salidas.

Cierre operativo: supabase stop ejecutado con exit 0; ningún contenedor activo después de detener el stack. Volúmenes locales conservados, sin operaciones remotas. Check final: 27 archivos sin diagnósticos.

## Aprobación formal y publicación — 2026-11-06

El usuario comunicó que el orquestador externo revisó `CP003A_REVIEW.patch` y **APPROVED CP-003A: implementación y validación de seguridad local únicamente**, sobre `47f04dc426d7083d86811a57dab7894876b8038a`. Los estados anteriores de pendiente/no aprobado son históricos. CP-003 completo y la integración remota no quedan aprobados por este dictamen.

Se conservan los resultados auténticos anteriores (53/53 SQL/RLS sin omisiones, REST 7/7, seed idempotente, check/lint/31 tests/seed:check/build PASS); no se ejecutan nuevamente en este cambio documental. Permanecen los límites de taxonomía/portada DEMO, accesibilidad heredada y compatibilidad CLI 2 no ejecutada. Ningún resultado local acredita configuración remota.

La autorización actual permite commit de ESTADO y este handoff, push normal de cp-003-supabase y PR hacia main sin merge. Ambos `.env.example` premodificados se preservan exactamente y no se versionan sus cambios; tampoco se incorpora `CP003A_REVIEW.patch`, entornos reales ni secretos. Se comprueba el diff antes de publicar; SHA/PR efectivos se reportan al finalizar. No se modifica aplicación, migración, seed, dependencias ni pruebas.

**No autoriza SQL/migraciones Supabase remotos, operaciones linked, cuentas/admins reales, despliegue, CP-003B ni CP-004. Detenerse tras publicación y esperar al orquestador.**
