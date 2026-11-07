# CP-003A — fundación SQL, pendiente de revisión de seguridad

**Validación vigente (2026-11-06): LOCAL PASS.** Docker Linux 29.9.2, CLI oficial 3.0.0 y PostgreSQL 17.11: 53/53 pgTAP sin fallos/omisiones, REST anon 7/7 e idempotencia del seed ejecutados. CP-003A no está aprobado automáticamente. Evidencia completa, fallo inicial y correcciones: [handoff](../docs/CP003A_HANDOFF.md), última sección.

**No se ha aplicado ninguna migración remota. No se han creado cuentas ni administradores reales.** No ejecutar `db push`, `--linked`, `--db-url` ni SQL en el Dashboard como parte de esta entrega. Las instrucciones locales siguientes solo se usan en una instancia de desarrollo desechable.

## Archivos

- `migrations/20261026000100_catalog_security.sql`: transacción de creación de tablas, constraints, índices, grants, helper y políticas RLS.
- `seed.sql`: cuatro categorías y exactamente los 16 productos originales CP-002. Generado por `web/scripts/generate-seed.mjs`; no contiene usuarios ni membresías.
- `tests/database/catalog_rls.test.sql`: pruebas pgTAP con roles anon/authenticated y fixtures locales transaccionales, terminadas con ROLLBACK.
- `config.toml`: Supabase local; solo public/graphql_public expuestos, esquema del helper excluido. Studio deshabilitado y registro Auth deshabilitado.

## Contrato de permisos

| Objeto/operación | anon | authenticated normal | authenticated + membresía admin |
| --- | --- | --- | --- |
| SELECT categorías | Solo activas | Solo activas | Todas |
| SELECT productos | Activos en categoría activa | Activos en categoría activa | Todos |
| INSERT productos | Sin grant | RLS deniega | Permitido con constraints |
| UPDATE/DELETE productos | Sin grant | Cero filas modificables por RLS | Permitido con constraints |
| INSERT/UPDATE/DELETE categorías | Sin grant | Sin grant | Sin grant |
| admin_users: lectura o escritura | Sin grants/policies | Sin grants/policies | Sin grants/policies |
| TRUNCATE/REFERENCES/TRIGGER productos | Sin grant | Sin grant | Sin grant |

PostgreSQL comprueba grants antes de RLS: UPDATE/DELETE de un usuario normal no necesariamente arroja error; puede afectar cero filas. Las pruebas comprueban el recuento y que el precio original no cambie. No se usa ocultación de botones como autorización.

`electroshop_private.is_admin()` es SECURITY DEFINER/STABLE, propietario postgres, sin parámetros, `search_path=''`, nombres cualificados y EXECUTE solo para authenticated. Consulta únicamente la membresía de `auth.uid()`. No acepta roles recibidos del cliente ni user_metadata. Su esquema no está expuesto en config.toml y debe seguir fuera de la lista de schemas de la API en una eventual configuración remota.

admin_users tiene RLS habilitado pero ninguna política ni grant de cliente. Tampoco un administrador puede conceder permisos desde el navegador. PostgreSQL/postgres, dueño de objetos y operador privilegiado, es parte de la frontera de confianza; no se pretende restringir al superusuario. También se revocan los grants automáticos de estas tablas al rol service_role; CP-003A no necesita ese rol ni su clave.

## Constraints e índices

- UUID de producto generado por PostgreSQL; identidad comercial por SKU único, canónico en mayúsculas y sin espacios, 1–50 caracteres alfanuméricos/guiones.
- Precio y stock integer NOT NULL, >= 0; precio siempre en centavos. No representa stock real.
- FK de producto a categoría con RESTRICT; no permite huérfanos ni borrar categorías usadas.
- Nombre/descripción no vacíos y con límites de longitud; active NOT NULL.
- Membresía por UUID único/FK a auth.users; borrado del usuario elimina su membresía.
- Índice de category_id y UNIQUE SKU. No hay buscador SQL ni índices de texto innecesarios para 16 filas: la búsqueda existente se conserva en frontend.

Las migraciones se aplican una vez mediante su historial versionado; no son scripts para reejecutar arbitrariamente sobre tablas existentes. Si ya existen objetos incompatibles, deben fallar y revisarse, sin ocultarlo con CREATE TABLE IF NOT EXISTS. El seed es idempotente por id/SKU: un segundo uso actualiza los mismos datos ficticios y conserva UUIDs; no borra filas extra. **Sobrescribe precio/stock/nombre de esos SKU**: solo usar como semilla de demo revisada, no como importación de inventario real.

## Reproducir en Supabase LOCAL

Requisitos: Docker operativo, Supabase CLI oficial y Node >=22.23.4. No se instalan ni levantan servicios automáticamente. Desde la raíz de una copia de desarrollo:

```powershell
supabase start
# CLI 3: local por defecto; NO añadir --remote.
supabase db reset --yes
cd web
npm.cmd run seed:check
npm.cmd run test:db
node scripts/validate-db-local.mjs
npm.cmd run test:db
```

CLI 3 eliminó `--local`: reset/test son locales por defecto según su ayuda instalada. CLI 2 requiere `supabase db reset --local`; el runner de tests elige el argumento según versión. El reset borra el contenido local previo: utilizar una instancia desechable; nunca añadir `--remote`, `--linked` o URL de base. No copiar a chats/logs/commits la salida de start/status, que puede mostrar claves. El wrapper fija destino local, no acepta argumentos, verifica endpoint Docker local y exige un archivo/53 tests PASS más plan TAP 1..53 con cada resultado numerado, cero SKIP/TODO/fallos. Reejecuta la misma transacción por psql dentro del contenedor local para inspeccionar TAP; no aplica migraciones ni imprime salida arbitraria. Requiere ejecutables supabase y docker en PATH (Windows probado con Scoop supabase.exe). CLI 2 no fue ejecutada en esta validación.

Si faltan herramientas, el runner informa BLOCKED_EXTERNAL con código no cero. En la ejecución 2026-11-06 las herramientas están disponibles y las 53 aserciones completas pasaron sobre PostgreSQL local, también después de repetir el seed. Los tests de transporte HTTP del frontend no sustituyen pgTAP, y la validación local no acredita configuración remota ni aprobación del checkpoint.

La suite SQL comprueba seed 16/4, RLS habilitado, grants, helper/search_path, unique/FK/checks, lectura pública activa, escritura anónima denegada, usuario normal con role admin en metadata, falta de sub, CRUD admin, denegación de autoasignación tanto a usuario como a admin, y revocación sin renovar JWT. Las identidades constantes son fixtures transaccionales locales sin email, contraseña ni llamadas a Auth; terminan en rollback.

`node scripts/validate-db-local.mjs` repite seed.sql dos veces, compara todas las columnas y UUIDs con el snapshot inicial y exige 16 productos/4 categorías/0 usuarios/0 admins. También comprueba 7 casos REST con credencial anon exclusivamente local en memoria: dos lecturas y cinco operaciones denegadas, sin alteración de datos. Ejecutado PASS; ninguna migración remota. Este script sobrescribe los mismos SKU DEMO: solo instancia desechable.

## Alta manual del primer administrador — solo procedimiento futuro

No se incluye en el seed, en el navegador ni en una RPC. Tras la revisión de seguridad y autorización posterior, el operador deberá verificar un usuario de prueba existente en Auth y conceder su membresía mediante consola SQL privilegiada. No crear cuentas ni ejecutar este ejemplo ahora:

```sql
-- Plantilla deliberadamente inválida hasta sustituir el UUID por uno verificado.
insert into public.admin_users (user_id)
values ('UUID_AUTH_EXISTENTE_VERIFICADO'::uuid)
on conflict (user_id) do nothing;

-- Revocación por el mismo operador, cuando corresponda:
delete from public.admin_users
where user_id = 'UUID_AUTH_EXISTENTE_VERIFICADO'::uuid;
```

Nunca conceder INSERT/UPDATE/DELETE de admin_users a authenticated, ni crear un endpoint público de autoasignación. Los login/CRUD de interfaz pertenecen a CP-004 y no se implementan aquí.

## Fuentes de diseño

Se consultaron las fuentes oficiales: [RLS y helper en esquema privado](https://supabase.com/docs/guides/database/postgres/row-level-security), [grants y exposición de API](https://supabase.com/docs/guides/api/securing-your-api), [publishable keys](https://supabase.com/docs/guides/getting-started/api-keys), [pgTAP](https://supabase.com/docs/guides/database/testing) y [CLI test db](https://supabase.com/docs/reference/cli/supabase-test-db). La configuración remota real y su gateway aún requieren revisión/verificación posteriores.
