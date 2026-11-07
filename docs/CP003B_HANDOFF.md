# CP-003B — APPROVED / cierre de integración de catálogo

Fecha: 2026-11-07. El usuario comunica la aprobación del orquestador externo de la verificación frontend local contra Supabase real. CP-003A está aprobado e integrado en main; CP-003B queda cerrado técnicamente. No autoriza CP-004 ni publicación en Netlify.

## Código y relación con main

Rama `cp-003b-remote`, base `c557e146a6501a54b3cf06ce175a944fded766c6`. Al comenzar el cierre, main local, origin/main actualizado y HEAD son idénticos: cero commits exclusivos, cero cambios de aplicación. Se reutilizó íntegramente el adaptador CP-003A. No hay PR funcional necesario: los cambios de infraestructura remota y del entorno local no son cambios de código para fusionar.

Este cierre genera un cambio documental real: este handoff y la actualización de PROJECT, README y ESTADO. Se prepara un commit y PR exclusivamente documentales. Su integración es manual; el cierre técnico no depende de inventar cambios de aplicación. SHA y resultado de publicación se reportan al terminar.

## Evidencia aprobada

| Validación efectivamente ejecutada durante CP-003B | Resultado |
| --- | --- |
| Proyecto remoto exacto y migración `20261026000100` | PASS; historial remoto coincide con local |
| Inspección remota SELECT de seguridad | PASS: tres tablas con RLS, siete policies con roles/USING/WITH CHECK, grants mínimos, helper privado SECURITY DEFINER/STABLE de postgres con search_path vacío, 14 constraints y cinco índices válidos |
| Data API | PASS: public accesible; esquema privado rechazado con 406/PGRST106; condiciones Dashboard confirmadas por humano |
| Seed remoto ejecutado por el humano | PASS verificado después: 4 categorías, 16 productos, 0 administradores; comparación agregada contra seed.sql sin diferencias ni filas inesperadas; todos activos |
| REST anónimo | PASS: categorías 200/4, productos 200/16, admin_users 401 denegado |
| Frontend Astro local / Edge real | PASS: 16 productos coherentes con el catálogo aprobado, cuatro categorías, búsqueda/filtros, precios y 16 fichas; 3 agotados y 13 disponibles; responsive 360/1440 px |
| Credenciales navegador y errores | PASS: solo publishable key, sin sesión/cookies; cero errores normales de consola/JS; fallo de transporte inducido solo en navegador muestra error sin fallback |
| `npm.cmd run check`, lint, test, build | PASS: check 27 archivos sin diagnósticos, 31/31 tests en cinco archivos y cinco páginas estáticas |

Los tests unitarios fijan demo y simulan transporte; la integración real se comprobó separadamente con navegador y REST. Las 53/53 aserciones pgTAP aprobadas pertenecen a CP-003A local; no se ejecutaron fixtures ni pruebas de escritura en producción.

El primer intento de seed asistido terminó con exit 1, sin salida original conservada. La consulta posterior encontró 0/0/0; no se identificó la clase del error ni se reintentó automáticamente. El humano ejecutó después el seed y su contenido final fue verificado en lectura. No atribuir al intento fallido una ejecución exitosa.

Se creó un respaldo privado fuera de Git y se ensayó recuperación en PostgreSQL 17.11 local aislado: propietario, ACL y privilegios predeterminados coincidieron con la línea base vacía. Excluye schemas/servicios administrados, Auth, Storage y secretos; no acredita recuperación integral de Supabase ni PITR. La identidad de una futura conexión de escritura sigue sin verificarse y no se necesita para este cierre de lectura.

## Configuración local y límites

Solo se cambió `PUBLIC_CATALOG_MODE=supabase` en `web/.env.local`, ignorado y no versionado; URL/key permanecieron intactas. Ambas plantillas .env.example y CP003A_REVIEW.patch eran cambios del usuario y permanecen fuera del commit. No se publican claves, registros personales, respaldos ni logs crudos.

Categorías visuales y destacados de portada siguen estáticos DEMO; catálogo y ficha usan el origen Supabase. La taxonomía admite cuatro categorías. JS requerido y límites de accesibilidad CP-002 permanecen. No hay login/CRUD de interfaz ni administradores reales. No se modifica arquitectura, código, estilos, SQL ni dependencias.

## Netlify: inspección y configuración requerida, todavía NO aplicada

No se encontró netlify.toml ni estado .netlify en raíz/web. Tampoco hay CLI Netlify disponible, credencial/identificador Netlify en el proceso ni conector Netlify utilizable. Por tanto: sitio enlazado, rama productiva, variables y automatismos remotos UNKNOWN. No se deduce que no exista un sitio externo. No se creó configuración Netlify ni se modificaron ajustes remotos.

Configuración futura para Astro estático, manteniendo el modelo de base `web`:

- Base directory: `web`.
- Build command: `npm run build`.
- Publish directory: `dist` (relativo a base; resultado web/dist).
- Runtime Node compatible con package.json (>=22.23.4; Node 24.6.0 usado en la validación actual).
- Rama de producción prevista: `main`, pendiente de confirmar en Dashboard.

| Variable exacta | Valor a configurar sin publicarlo aquí | Scope | Deploy context |
| --- | --- | --- | --- |
| `PUBLIC_CATALOG_MODE` | `supabase` | Builds | Production |
| `PUBLIC_SUPABASE_URL` | Origen HTTPS del proyecto verificado | Builds | Production |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key de ese proyecto, prefijo sb_publishable_ | Builds | Production |

Las tres variables se incorporan al bundle Astro al compilar. No necesitan scopes Functions, Runtime ni Post-processing para este sitio estático. Si el plan/UI no permite restringir scopes, deben estar disponibles al menos en Builds. Cambiar variables no cambia un artefacto ya publicado: hace falta un nuevo build/deploy, autorizado por separado. .env.local no se sube a Netlify. Una variable marcada secret en el panel no vuelve secreta una PUBLIC_* incluida en JavaScript.

Para Deploy Previews y Branch deploys, mantener contexto explícito demo y sin credenciales productivas, salvo aprobación específica para usar el catálogo real. No heredar automáticamente las credenciales de Production. No se necesitan contraseñas DB, tokens CLI, JWT privados ni service-role/secret keys en el navegador o build de este catálogo.

Fuentes oficiales consultadas: [variables para frameworks y scope Builds](https://docs.netlify.com/build/frameworks/use-environment-variables-with-frameworks/), [scopes/contextos](https://docs.netlify.com/build/environment-variables/overview/), [omitir deploys automáticos](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/). El commit y título de PR documental usan `[skip netlify]` para evitar branch deploy/Deploy Preview sin cambiar ajustes del sitio.

## Aprobaciones pendientes

Solo una autorización futura puede permitir cambiar variables Netlify, construir/publicar producción o fusionar el PR documental. CP-004 no está autorizado. Este cierre no ejecuta SQL remoto, migraciones, seed, cuentas, cambios de Netlify ni despliegues. Ver ESTADO para controles finales ejecutados durante el cierre documental.
