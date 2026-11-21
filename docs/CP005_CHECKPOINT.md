# Electro Shop — checkpoint de continuidad CP-005

**Cierre del 21 de noviembre de 2026.** CP-005 tiene aprobación técnica independiente en LOCAL sobre `d0aeb99efd964775fe59164f7416d378ba24b01a` en `cp-005-cart-checkout`. La integración a `main` y la publicación están pendientes.

## Arquitectura y alcance actual

- Proyecto académico no comercial. `web/` usa Astro estático, islas React, TypeScript estricto y Tailwind compilado. Incluye inicio, catálogo con búsqueda y filtros, ficha por SKU, `/acerca`, `/admin`, `/carrito` y `/checkout`.
- `supabase/` contiene migraciones y seed DEMO versionados, con PostgreSQL, Auth y RLS. El catálogo elige explícitamente DEMO o Supabase sin fallback cuando falla la API. El panel usa Auth por pestaña, una RPC de membresía y CRUD sujeto a RLS.
- El carrito persiste SKU y cantidad en el navegador y revalida precios y existencias antes de confirmar. La recogida y el envío son ficticios. Contacto, domicilio y comprobante viven en memoria. No se crean pedidos reales, pagos ni registros de entrega.

## Estado y referencias

| CP | Estado | Referencia |
| --- | --- | --- |
| CP-002 | **APPROVED / cerrado**, integrado en main | `cp-002-foundation`, implementación aprobada `bd6574b4e7cbf81cf8180ce42d7ab34286ca7728` |
| CP-003A | **APPROVED**, integrado en main | `cp-003-supabase`, evidencia aprobada `47f04dc426d7083d86811a57dab7894876b8038a` |
| CP-003B | **APPROVED / cerrado**, integrado en main | `cp-003b-remote`, base `c557e146`, cierre `8e16ce7`. Se verificó históricamente el catálogo en Supabase remoto |
| CP-004 | **APPROVED técnicamente en LOCAL**, 2026-11-21 | `cp-004-admin`, base `7baab160`, implementación `bc52d90`, corrección aprobada `7488efe00959e233d25234c409eafe112ef7073d` |
| CP-005 | **APPROVED técnicamente en LOCAL**, 2026-11-21 | `cp-005-cart-checkout`, base `7488efe00959e233d25234c409eafe112ef7073d`, implementación `ef8b3d4d207706bbbedb246cef823d88f5581a54`, corrección aprobada `d0aeb99efd964775fe59164f7416d378ba24b01a` |
| CP-006 | Pendiente de autorización | Netlify, verificación pública y configuración de publicación |
| CP-007 | Opcional, fuera del MVP | Reparaciones por folio y garantía. Requiere una orden nueva |

Antes del cierre, `main` y la referencia local `origin/main` apuntaban a `7baab160b3b020d89c1d6dcb36126ae63b4c5390`, ancestro común. CP-005 desciende directamente del tip aprobado de CP-004. La referencia local de seguimiento refleja el último estado disponible en este repositorio. Los ajustes actuales de GitHub, Supabase y Netlify quedan sin verificación nueva.

La evidencia de CP-003B registra la migración remota `20261026000100`, cuatro categorías, 16 productos DEMO y cero admins en ese momento. La RPC `20261107000100_admin_access_probe.sql` de CP-004 se validó en la instancia desechable local. El estado de integración y publicación de CP-004 y CP-005 sigue pendiente. [Evidencia histórica CP-003B](CP003B_HANDOFF.md) · [Handoff CP-004](CP004_HANDOFF.md)

## Evidencia técnica y límites

- CP-005 original `ef8b3d4`. Frontend 79/79. Edge a 360/1440 px en DEMO y contra PostgREST local. 69/69 pgTAP, GoTrue/CRUD y REST/RLS reales en local y regresión de sesión con API sintética. Se comprobó la limpieza de fixtures.
- CP-005 final `d0aeb99`. Frontend 80/80, type check con cero diagnósticos, lint, seed, build y Edge DEMO a 360/1440 px **PASS**. La corrección bloquea una eliminación obsoleta entre pestañas y registra el estado correcto de CP-004. Los resultados de Supabase, SQL y Auth proceden de la ronda anterior. Este cierre solo verifica documentación. [Resultados y reproducción](CP005_HANDOFF.md)
- Sin Web Locks, las escrituras simultáneas del carrito son de mejor esfuerzo. Si el navegador bloquea storage, la selección puede perderse al navegar. La demo carece de reserva de inventario y de sincronización entre dispositivos. En CP-004, una copia de sesión restaurada tras cerrar la pestaña dueña puede ser indistinguible de una recarga. La cobertura automatizada de accesibilidad se hizo en Edge. Dispositivo físico y lector de pantalla quedan pendientes.
- El `CP005_REVIEW.patch` revisado sigue sin seguimiento y cubre la implementación aprobada desde `7488efe` hasta `d0aeb99`. Los archivos de entorno, artefactos previos y evidencia local sin stage de CP-004 se conservan. [ESTADO.md](ESTADO.md)

## Siguiente paso bajo autorización

1. Pedir autorización para integrar **CP-004 primero** en GitHub. Una vez otorgada, verificar el estado remoto de `main` y la automatización de publicación, y preparar el PR de `cp-004-admin` hacia `main` con la fuente aprobada `7488efe`. El merge requiere su propia autorización.
2. Tras integrar CP-004, verificar que el PR de CP-005 contra el nuevo `main` muestre solo CP-005 y su cierre documental. Si la integración de CP-004 cambia los hashes, verificar equivalencia del contenido antes de preparar la rama o el PR. Las mutaciones de GitHub dependen de la autorización del usuario.
3. Para publicar mediante CP-006, el usuario debe autorizar por separado Netlify y cualquier cambio de Supabase. Si se publicará administración, aplicar primero la RPC de CP-004 y preparar una identidad y membresía de demo autorizadas. La publicación usa HTTPS, base `web`, build `npm run build`, salida `dist` y las variables públicas de catálogo aprobadas. CP-005 comparte esa configuración y no requiere migración propia.

ChatGPT orquesta y revisa. Codex implementa, prueba y documenta. El usuario autoriza las operaciones externas. [AGENTS.md](../AGENTS.md) · [PROJECT.md](../PROJECT.md)
