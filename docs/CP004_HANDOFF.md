# CP-004 — administración local / entrega para revisión

Estado: correcciones de sesión locales pendientes de segunda revisión. Rama `cp-004-admin`, base main `7baab160b3b020d89c1d6dcb36126ae63b4c5390` (CP-003B integrado). El commit revisado inicialmente fue `bc52d90f1d46c59fd5d21120eb408dd81e88057d`. La aplicación remota de la RPC y la publicación están pendientes.

## Implementación

- `/admin`: isla React client-only, página estática sin datos privados incrustados, noindex/nofollow y entrada en navegación. Login real por email/contraseña y logout con Supabase Auth. Sin registro, recuperación de contraseña ni alta de administradores desde navegador.
- `admin-source.ts`: pequeño gateway tipado sobre el SDK oficial @supabase/supabase-js 2.119.0, añadido exclusivamente para ciclo Auth/CRUD. El fetch anónimo aprobado de catálogo/ficha permanece intacto y nunca recibe el JWT del administrador. Misma configuración URL/publishable key; sin credenciales nuevas.
- El SDK administra expiración y renovación en memoria con `persistSession: false`, lo que evita que la versión fijada abra el canal Auth. La aplicación conserva solo el par de tokens, vinculado al origen de Supabase, en `sessionStorage` cuando puede reclamar un Web Lock para esa sesión de pestaña. Al recargar, restaura mediante la API pública `setSession`. Una sesión previa al cambio de formato requiere iniciar sesión de nuevo.
- Los callbacks de Auth son síncronos. La interfaz compara la identidad y conserva el borrador y la confirmación al renovar el token o recibir eventos repetidos del mismo usuario. Logout, identidad distinta o sesión ausente limpian la UI e invalidan respuestas en curso. El logout borra la copia persistida antes de solicitar revocación al servidor.
- Autorización por PostgreSQL mediante RPC booleana de membresía propia. Usuario no admin no carga productos administrativos. La UI revalida al enfocar la ventana y cada 30 segundos. Cada operación del gateway vuelve a verificar membresía y RLS decide sobre la consulta o escritura. La revocación en BD bloquea DML en nuevas solicitudes, aunque la UI todavía esté entre verificaciones.
- Listado paginado de productos activos/ocultos, búsqueda nombre/SKU, filtro de visibilidad, contadores y categorías existentes. Alta/edición de SKU, nombre, descripción, categoría, precio en centavos integer, stock demo y visibilidad. Validación alineada con límites PostgreSQL (incluye Unicode, btrim, int32); constraints siguen siendo autoridad. Se verifica representación de exactamente una fila antes de comunicar éxito.
- Eliminación con confirmación explícita y cancelación; no alert()/confirm() de navegador. Errores/loading/éxito/vacío accesibles, validación por campo con foco, controles deshabilitados durante operaciones. Estilos carbón/violeta coherentes, formularios y listado móviles. Navegación pública ajustada únicamente para envolver el enlace adicional en móvil.

## Migración nueva: necesaria y SOLO LOCAL

`supabase/migrations/20261107000100_admin_access_probe.sql` crea únicamente `public.current_user_is_admin()`.

La API no puede consultar el helper privado CP-003A sin exponer su esquema. Leer productos visibles tampoco prueba membresía admin, y probar permisos escribiendo sería incorrecto. La RPC resuelve ese requisito: SQL STABLE SECURITY INVOKER, search_path vacío, sin parámetros, propietario postgres y EXECUTE exclusivamente authenticated (además del propietario). Delega en el helper privado ya aprobado, que verifica auth.uid() contra admin_users. No concede privilegios nuevos de tabla ni permite leer/modificar membresías; no confía en user_metadata, roles de UI ni un UUID del cliente.

Esquema privado continúa fuera de Data API. Migración, grants/RLS/tablas/seed CP-003A intactos. La nueva RPC requiere revisión y aplicación remota separada antes de que la administración funcione en producción. Su ausencia remota produce error y bloqueo de acceso, jamás un admin ficticio. No se ejecutó ninguna migración remota en esta tarea.

## Verificación y reproducción

Desde web, con Node >=22.23.4 y npm.cmd en PowerShell:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd run lint
npm.cmd run test
npm.cmd run seed:check
npm.cmd run build
npm.cmd run test:admin:browser
```

Usar Docker Linux y Supabase CLI oficial 3.0.0 en PATH. En una copia LOCAL DESECHABLE, desde raíz, `supabase start` y `supabase db reset --yes` aplican migraciones/seed al stack local (CLI 3 usa local por defecto). Nunca añadir --remote, --linked o una URL remota. Capturar start/status de manera privada porque muestran claves. Después, desde web:

```powershell
npm.cmd run test:db
npm.cmd run test:admin:local
```

La prueba de navegador usa Edge, el puerto 4324 y una API sintética interceptada. Ejercita el SDK real, dos pestañas, una copia creada mediante opener, renovación y persistencia. La integración GoTrue/PostgreSQL local usa Edge y el puerto 4323. El reset local borra datos locales. Astro solo permite un dev server por proyecto. Para detener el frontend local propio, ejecutar `node node_modules/astro/bin/astro.mjs dev stop` desde web. El runner requiere un stack local iniciado y migrado.

El smoke lee únicamente status LOCAL; exige endpoint Docker local y API loopback fija. Inicia Astro con variables de proceso locales sin editar .env.local. Crea dos identidades .invalid efímeras en la base local para autenticar realmente contra GoTrue; contraseña aleatoria solo en memoria. No son cuentas remotas/reales. Todas las peticiones de navegador externas a localhost se bloquean. Al finalizar elimina sus productos/identidades y comprueba recuentos iniciales; detiene navegador y su Astro.

Los resultados de cada ejecución se registran en docs/ESTADO.md. Las cifras y resultados de la entrega original corresponden a `bc52d90`. Cobertura:

| Suite | Qué acredita |
| --- | --- |
| Frontend, Vitest | Validación, gateway SDK con transporte inyectado, visitante/no admin, fallo/login/logout, expiración, carreras de sesión, revocación, rechazo RLS, CRUD/confirmación, errores y accesibilidad jsdom. Desde la corrección también prueba borrador durante eventos repetidos, cambio de identidad y logout/login agrupados |
| Edge con API sintética | Dos pestañas y copia de storage, ausencia de canal del SDK, login/logout independientes, renovación con borrador, recarga, revocación y expiración |
| pgTAP CP-003A | 53/53 conservados, roles/grants/constraints/RLS/CRUD y revocación |
| pgTAP CP-004 | 16/16, RPC INVOKER, propietario, search_path, grants, ausencia de parámetros, metadata falsa, membresía, revocación y protección de autoasignación |
| Smoke administrativo local | Auth y CRUD reales contra localhost, no admin con metadata falsa, escritura REST rechazada, publicación/ocultación, logout, refresh rechazado, revocación y catálogo público. Ahora también comprueba una pestaña con storage copiado, recarga y PATCH/DELETE directos de un no admin |
| Smoke público existente | Cuatro rutas a 360/1440 px, axe/teclado/búsqueda/filtros/ficha/404, sobre build DEMO temporal, sin sobrescribir capturas CP-002 |

Runner SQL exige archivos y recuentos fijos (53 + 16), cero fallos/SKIP/TODO/omisiones y segunda comprobación independiente del TAP numerado; nunca acepta PASS parcial. Ajuste de cwd permite invocarlo desde web en Windows. Las aserciones repetidas no se cuentan como casos nuevos.

Incidencias corregidas: timestamps requeridos de fixtures GoTrue; carrera real de SIGNED_OUT tardío que dejaba UI verificando; encabezado h2 del listado para jerarquía accesible; rutas del runner Windows; tipos estrictos y hints React SubmitEvent. Los intentos fallidos se repitieron únicamente en local y limpiaron sus fixtures. No se corrigieron mediante cambios en producción.

## Seguridad, dependencias y límites

- Auditoría productiva `npm.cmd audit --omit=dev --json`: 0 vulnerabilidades. Auditoría completa: 10 moderadas en cadena de lint/minimatch; versiones afectadas ya presentes en main, no introducidas por el SDK. No se aplicó audit fix --force ni downgrade/refactor del toolchain. Riesgo de tooling local pendiente de mantenimiento separado; no afirmar auditoría total limpia.
- No se ha validado login/admin CRUD en producción ni creado administrador real. El storefront productivo reportado operativo por el usuario no fue desplegado ni modificado aquí. Tests UI simulados se distinguen del smoke Auth/DB local real y del PostgreSQL local.
- El Web Lock distingue una copia de `sessionStorage` mientras el documento dueño mantiene el bloqueo. Si el dueño ya desapareció antes de que la copia intente reclamarlo, o el navegador restaura una sesión copiada, una copia puede ser indistinguible de una recarga y recuperar la misma sesión. El SDK no transmite tokens por BroadcastChannel. Si la persistencia local no está disponible, Auth permanece en memoria y una recarga requiere login. Cuando se requiere aislamiento estricto incluso tras restaurar pestañas, la alternativa soportada es usar el SDK en memoria con `persistSession: false` y prescindir de guardar los tokens para recarga.
- Los tokens guardados son accesibles a scripts del mismo origen, por lo que la protección contra XSS sigue siendo necesaria. Logout local solicita revocación del refresh token y un JWT ya emitido puede durar hasta su expiración. Revocar la membresía en PostgreSQL bloquea DML en nuevas solicitudes.
- Taxonomía de cuatro categorías y portada DEMO estática se conservan. Una categoría nueva fuera del contrato falla de forma explícita. Sin fallback de datos administrativos o de catálogo en modo Supabase.
- Precio en centavos, no importe decimal; validación cliente no sustituye constraints. RLS/grants remotos existentes no se alteraron. admin_users no aparece como recurso accesible en el código del gateway.
- Ambas plantillas .env.example y CP003A_REVIEW.patch se preservan sin stage. .env.local real sigue ignorado/no versionado y no se modificó para las pruebas. Ninguna contraseña, JWT o clave real va en documentación/logs/commit.

## Procedimiento futuro: primer administrador, NO ejecutado

Requiere aprobación independiente del orquestador para: aplicar la nueva migración remota, crear/invitar una identidad Auth controlada si falta y asignarle membresía, y posteriormente publicar frontend. Ninguno está autorizado por el commit local.

1. Revisar la migración/RLS y comprobar destino/historial con procedimiento de respaldo aprobado antes de cualquier escritura remota.
2. Un operador humano verifica en Auth el UUID de la cuenta controlada y su identidad. No aceptar un rol enviado por navegador ni publicar su email/UUID en reportes. Crear/invitar esa cuenta solo con autorización específica; mantener registros públicos deshabilitados si no se necesitan.
3. Operador PostgreSQL autorizado, nunca cliente browser, concede/revoca membresía. Plantillas deliberadamente inválidas hasta sustituir por UUID verificado:

```sql
insert into public.admin_users(user_id)
values ('UUID_AUTH_VERIFICADO'::uuid)
on conflict (user_id) do nothing;

-- Revocación por el mismo operador:
delete from public.admin_users
where user_id = 'UUID_AUTH_VERIFICADO'::uuid;
```

4. Solo después de aprobar la publicación se podrá comprobar login con cuenta controlada, RPC true y CRUD DEMO bajo RLS. Pruebas remotas de escritura, cuentas no admin y sesiones requieren autorización expresa; no reutilizar el smoke local contra producción.
5. Sin nuevas variables públicas: mismas PUBLIC_CATALOG_MODE, PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_PUBLISHABLE_KEY. Jamás usar service_role/secret keys o contraseñas DB en frontend/Netlify PUBLIC_*.

Fuentes oficiales: [SDK Auth](https://supabase.com/docs/reference/javascript/auth), [eventos síncronos y limpieza](https://supabase.com/docs/reference/javascript/auth-onauthstatechange), [signOut](https://supabase.com/docs/reference/javascript/auth-signout), [advertencia sobre callbacks async](https://supabase.com/kb/troubleshooting/why-is-my-supabase-api-call-not-returning-PGzXw0). Commit exclusivamente local; esperar dictamen del orquestador.
