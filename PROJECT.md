# Electro Shop — PROJECT.md (fuente de verdad para Codex)

**Actualización:** 26 de octubre de 2026 · **Estado:** CP-001 archivado / CP-002 APPROVED y cerrado; CP-003 pendiente de autorización

**Propósito:** prototipo universitario **no comercial** de un catálogo de electrónica con administración segura.

**Orquestación:** ChatGPT define y revisa checkpoints; **Codex implementa, prueba y documenta**. El humano autoriza decisiones de cuentas, accesos y publicación.

## 0. Lectura obligatoria y decisiones vigentes

1. Leer `AGENTS.md` antes de desarrollar; después este `PROJECT.md` y `docs/ESTADO.md`.
2. Para tareas manuales externas, leer `REQUISITOS_EXTERNOS.md`. NO inventar cuentas, credenciales ni accesos.
3. Usar `docs/CODEX_START.md` como referencia de los prompts por fase. CP-002 está APPROVED; no volver a ejecutarlo. CP-003 requiere una autorización nueva y explícita.
4. La estructura de referencia funcional es https://www.dipmecatronica.com (búsqueda, categorías, productos, carrito), **no** una licencia para copiar su HTML, textos, logo, imágenes o bases de datos. Rediseñar con identidad Electro Shop.
5. Paleta orientativa recuperada del prototipo: `#121214` carbón, `#a855f7` violeta, blanco y grises. Rescatar únicamente la paleta y el concepto visual; **no** llevar el `index_elec.html` al código productivo.
6. **Stack operativo para el MVP:** Astro (sitio estático) + islas React + TypeScript estricto + Tailwind compilado + Vitest y/o herramientas de test adecuadas; Git/GitHub; Netlify Free; Supabase PostgreSQL + Auth y RLS. Firebase Firestore **solo alternativa si el equipo cambia esta decisión**. No implementar ambos.
7. **Situación vigente:** CP-002 cerrado y APPROVED, frontend local con datos ficticios. Esperar autorización de CP-003 y su preparación humana según `REQUISITOS_EXTERNOS.md`; no conectar Supabase ni Netlify antes del checkpoint autorizado.
8. Evitar sobreingeniería: no FastAPI, pagos, integraciones ERP, e-mail transaccional, inventario real, envío real, scraping, funciones serverless ni Microservicios en la primera entrega.
9. Toda acción simulada se rotula `DEMO / NO ES UNA COMPRA REAL`; jamás usar datos reales de clientes, pedidos o teléfonos sin revisión.
10. **Pausar entre checkpoints:** al terminar cada CP, actualizar `docs/ESTADO.md`, publicar resultados verificables y esperar revisión. No iniciar la siguiente fase automáticamente.

## 1. Contexto de Electro Shop

- Marca de referencia: **ELECTRO SHOP**, electrónica, componentes, refacciones, herramientas y potencialmente servicio técnico.
- Sitio a estudiar a nivel de flujo y arquitectura de información: DIP Mecatrónica.
- Público para el MVP: estudiantes, makers, técnicos y público general. Catálogo y precio de demostración **visibles al público**; cuentas mayoristas fuera de alcance.
- El prototipo anterior se guarda en `checkpoints/2026-10-26-vibecode/index_elec.html` (checkpoint **CP-001**) sin modificaciones. `docs/grill_original.md` es documentación histórica, **no backlog**.
- `docs/historico/PROJECT_pre_orquestacion_2026-10-26.md` conserva el alcance original extenso (clientes, reparaciones, garantías, inventario, etc.). Estas funciones son una **visión futura**, no parte obligatoria de CP-002.
- El logo original en SVG o PNG transparente no ha sido entregado dentro de este paquete. Implementar un **wordmark tipográfico temporal** de Electro Shop, sin suplantar un logo oficial.
- Datos de dirección, WhatsApp, Instagram, servicios y horario del documento histórico no están verificados para publicación. Usar ejemplos / placeholders explícitos y evitar enlaces a números ficticios que parezcan operativos.

## 2. Contrato técnico: monorepo pequeño sin backend dedicado

```text
electroshop/
├── AGENTS.md                     # Reglas persistentes de Codex
├── PROJECT.md                    # Este plan de desarrollo
├── REQUISITOS_EXTERNOS.md        # Preparación de cuentas/configuración humana
├── README.md                     # Cómo correr, testear y desplegar
├── docs/
│   ├── CODEX_START.md            # Prompts por checkpoint
│   ├── ESTADO.md                  # Bitácora de ejecución/revisión
│   ├── MVP_ACADEMICO.md
│   ├── grill_original.md
│   └── historico/
├── checkpoints/2026-10-26-vibecode/...
├── web/                          # Codex lo crea en CP-002
│   ├── src/                      # Astro pages/layouts; React islands para interacción
│   ├── public/                   # Assets propios autorizados
│   ├── package.json
│   ├── astro.config.mjs
│   └── ...
└── supabase/                     # Codex lo crea en CP-003 (migraciones y seeds)
```

### Principios de implementación

- Preferir **Astro estático** con HTML semántico para las vistas informativas, y React en catálogo, carrito y panel admin. Nada de SPA global si no agrega valor.
- Rutas de demo recomendadas: `/`, `/catalogo`, `/producto?sku=...`, `/servicios`, `/contacto`, `/admin`. Elegir `/producto?sku=...` evita regenerar rutas estáticas por cada alta de producto; documentar si se decide otro esquema equivalente y que permita productos nuevos desde BD.
- Componentes reutilizables, validación de tipos, esquemas de formularios, estados loading/error/empty y navegación por teclado. Nada de `onclick=` en HTML, `alert()` como UX principal ni concatenación de HTML con contenido sin escapar.
- Los datos demo son ficticios y explícitos. `price_cents` como entero no negativo; formato MXN en frontend. `sku` único y búsqueda insensible a mayúsculas.
- Diseñar acceso a datos detrás de un módulo pequeño (p. ej. demo vs Supabase) sin inventar un sistema genérico complejo.
- **Seguridad real:** ocultar botón no equivale a autorización. Al usar Supabase, habilitar RLS y escribir políticas restrictivas; acceso administrador verificado en PostgreSQL, no por un `role` modificable por el navegador.
- **Secretos:** `.env*` reales fuera de git. Astro usa `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable segura para cliente **únicamente con RLS**). Nunca usar `sb_secret_...`, `service_role` ni credenciales de DB en `PUBLIC_*` o bundle del cliente.
- Mantener comandos `npm run check`, `npm run lint`, `npm run test`, `npm run build` o equivalentes documentados en `web/package.json`. Cada fase debe dejar `build` verde y pruebas relevantes.
- Cuando falte una credencial, **implementar hasta el límite técnico y documentar el bloqueo** en `docs/ESTADO.md`; no sustituirla por un secreto inventado ni informar éxito no verificado.
- No usar imágenes remotas sin licencia ni scrapear DIP Mecatrónica. Usar placeholders geométricos propios o fotografías autorizadas.

## 3. Alcance del MVP de universidad

### Obligatorio
- Home convincente y responsive con buscador accesible, categorías y llamada a ver catálogo.
- Catálogo público con **16 productos ficticios** repartidos en al menos 4 categorías y SKU único.
- Búsqueda por nombre/SKU, filtros por categoría y disponibilidad, estados vacíos y mensaje de cero resultados.
- Ficha de producto accesible con descripción, precio demo, SKU, stock demo, cantidad y acción de agregar.
- Carrito/pedido **simulado**, sin conexión a pagos ni creación de una venta real.
- Panel de admin con Supabase Auth, CRUD de productos, RLS y mensajes de error legibles.
- Deploy a Netlify con subdominio `*.netlify.app`, sujeto a que el usuario conecte GitHub/Netlify y las claves públicas requeridas.
- README para correr en Windows/VS Code, pruebas, migraciones, descripción del sistema y capturas o instrucciones para demo.

### Fuera del MVP (NO desarrollar sin aprobación)
- Cobros, pasarelas, facturación, logística, pedidos reales, stock real o ERP, dropshipping, talleres/distribuidores mayoristas, correos/SMS de verdad y cuentas de terceros reales.
- Módulo de reparaciones por folio/garantías: **CP-007 opcional**, solo después de la aceptación del MVP y si hay tiempo.

## 4. Entregas para Codex, orden estricto

### CP-002 — Fundaciones + UX de catálogo **(APPROVED / CERRADO)**

**Aprobación:** el usuario comunicó la aprobación técnica del orquestador externo y autorizó el cierre formal de CP-002 el 26/10/2026. Fuente aprobada: `bd6574b4e7cbf81cf8180ce42d7ab34286ca7728`; documentación entregada en `4ca0292e9264e621ba980b9933e693e87358b568`. Este cierre es documental; no modifica código ni dependencias y no autoriza CP-003. El PR hacia `main` se prepara para integración manual, sin merge automático.

**Limitaciones no bloqueantes registradas:** catálogo y ficha requieren JavaScript; metadatos sociales genéricos y sin canonical de producción; filtros locales sin persistencia de cambios en URL; ilustraciones de categoría y wordmark temporales; pruebas visuales/axe en Edge a 360/1440 px, sin lector de pantalla ni dispositivo físico. El smoke requiere Edge instalado y puerto 4322 libre. Carrito deshabilitado y reservado para CP-005, sin ventas ni pagos. Ninguna de estas limitaciones inicia trabajo de otro checkpoint.

Los requisitos siguientes se conservan como referencia del alcance aprobado:

**Implementar Codex:** crear `web/` con Astro, React, TS estricto, Tailwind compilado, estructura reusable y scripts de calidad; diseñar Home, Header con buscador, categorías, catálogo interactivo y producto por SKU; 16 productos ficticios almacenados en módulo tipado; navegación funcional, SEO básico, estados loading/empty/errors razonables, móvil 360 px y escritorio. Añadir pruebas útiles de búsqueda, filtros, carrito si ya existe lógica y accesibilidad básica. Si el carrito es futuro, dejar solo botones sin falsas confirmaciones y documentarlo.

**No hacer:** Supabase, Firebase, Netlify, cuentas, admin falso, backend, compra de dominio, publicación, copiar HTML viejo. Escribir documentación y capturas cuando el entorno lo permita.

**Aceptar si:** `cd web && npm install && npm run check && npm run lint && npm run test && npm run build` pasan (si scripts existen deben funcionar; si se omite alguno justificarlo). Home/catálogo/producto funcionan localmente; textos y assets no pertenecen a DIP; diseño coherente y original; no faltan imports; `docs/ESTADO.md` actualizado. Commit sugerido `feat: CP-002 frontend foundation and demo catalog`.

### CP-003 — Supabase (schema, datos, RLS) **(ESPERAR APROBACIÓN)**
**Antes:** usuario crea proyecto Free y prepara URL + publishable key en `.env.local`, siguiendo `REQUISITOS_EXTERNOS.md`. Si no están listas las cuentas, Codex solo genera SQL/migraciones y pruebas, sin declarar integración real completada.

**Implementar Codex:** `supabase/migrations/` versionadas + seed demo reproducible, `categories`, `products` y una lista de administradores `admin_users` (o patrón equivalente verificado, sin autoasignación de rol); constraints (SKU único, `price_cents >= 0`, `stock_demo >= 0`, categoría FK), índices de búsqueda necesarios, RLS ON para todas las tablas expuestas, lectura pública solo de productos activos, escritura solo de admin verificada en BD, función privilegiada con `search_path` seguro si aplica. Adaptador TS de datos demo/Supabase, errores y estados de reconexión, `.env.example`. Tests RLS de usuario anónimo, usuario autenticado normal y admin usando métodos seguros/locales (si no se pueden correr, reportar exactamente qué prueba queda pendiente). Incluir paso explícito de alta manual de primer admin, sin insertarla desde cliente.

**Aceptar si:** catálogo lee registros persistentes de Supabase; anon no escribe productos, user normal no escribe, admin autenticado sí; no se publican secretos; migraciones/seeds versionadas e idempotencia cuando sea factible; `npm run build` y tests verdes. Bloquear aprobación si faltan pruebas de autorización.

### CP-004 — Login real y CRUD admin **(ESPERAR APROBACIÓN)**
**Implementar Codex:** Supabase Auth con login/logout, sesión y estados; panel admin para crear/editar/desactivar productos; validación frontend y constraints backend; carga, paginación básica si aplica y mensajes de éxito/error accesibles. No permitir registro libre como administrador ni mostrar datos privados. El archivo `index_elec.html` no participa de la implementación.

**Aceptar si:** invitado/cliente normal no puede realizar CREATE/UPDATE/DELETE ni llamando directamente a API; admin autorizado sí. Demostrar con pruebas automáticas RLS + manuales o reportar bloqueos. Nunca confiar en una ruta oculta como seguridad.

### CP-005 — Carrito y pedido simulado **(ESPERAR APROBACIÓN)**
**Implementar Codex:** agregar/editar/eliminar líneas, cantidades válidas, resumen MXN, persistencia local (`localStorage`) con manejo seguro, estado vacío y confirmación marcada **`DEMO: no se procesó compra ni pago`**. No persistir solicitudes anónimas en base de datos sin diseño anti-spam y aprobación. Fotos únicamente autorizadas.

**Aceptar si:** carrito respeta SKU/id y no duplica por error, precio en centavos no pierde precisión, total se recalcula, funciona en móvil, cero integraciones de cobro y pruebas pasan.

### CP-006 — Netlify y demostración pública **(ESPERAR APROBACIÓN)**
**Antes:** usuario conecta repo GitHub a Netlify Free; define subdominio y variables de entorno de Supabase (publicables); si hay OAuth/redirecciones, configura URL en Supabase. Codex no debe asumir acceso externo ni realizar cambios de facturación.

**Implementar Codex:** `netlify.toml` con base `web`, build `npm run build`, publish `dist` (verificar en deploy); README de despliegue y variables; revisar build local, enlaces, accesibilidad y responsividad, errores en consola, permisos RLS, HTTPS, SEO mínimo y ausencia de secretos; generar checklist de demo universitaria.

**Aceptar si:** sitio Netlify abre home/catálogo/producto/admin por URL real, recargar rutas funciona, base persiste, roles están protegidos, no hay cobros y se documentan limitaciones de Netlify/Supabase Free. Si falta acceso/URL, dejar lista la configuración, marcar `BLOCKED_EXTERNAL` y no afirmar desplegado.

### CP-007 — Reparaciones por folio **(OPCIONAL; FUERA MVP)**
Solo tras una orden explícita nueva. Diseñar tickets, estados, permisos por propietario/técnico, consulta autenticada y migración RLS propia. No habilitar consulta pública por folios predecibles.

## 5. Política de orquestación (contrato de entrega por checkpoint)

Codex debe completar **una fase por sesión/tarea**. Al terminar, entregar en `docs/ESTADO.md` y en su respuesta:

1. ID del checkpoint, commit/rama (si Git está disponible) y resumen corto.
2. Archivos agregados/modificados, decisiones técnicas y riesgos.
3. Comandos de verificación **ejecutados** y resultados (nunca inventar tests pasados).
4. Instrucciones para ejecutar y comprobar visualmente (URL localhost si inició servidor).
5. Pendientes manuales o bloqueos externos, **sin valores de secretos**.
6. Capturas o descripción del resultado visual, y qué limita la reproducción.
7. Propuesta del siguiente CP; **no ejecutarlo** hasta aprobación del orquestador/usuario.

Protocolo de revisión: el usuario comparte enlace a PR, diff, árbol de archivos o ZIP con cambios. ChatGPT revisa que el CP cumpla seguridad, UX, tests, complejidad y scope; devuelve lista concreta de correcciones a Codex o autoriza avanzar. Una tarea no está terminada por el hecho de que Codex responda "done".

## 6. Control de calidad / definición global de terminado

- Tipos estrictos sin `any` innecesario; errores de TypeScript arreglados, no ignorados.
- Pruebas reproducibles, README actualizado y Git sin archivos temporales/secretos.
- No acceso admin simulado en entregas posteriores a CP-003; roles validados por RLS.
- No dependencias nuevas sin justificación de necesidad y tamaño.
- No `innerHTML` con contenido de cliente; contenido dinámico escapado.
- Navegación por teclado, contraste razonable, etiquetas accesibles, estados responsive.
- No copiar contenidos/logotipos/fotos de la página de referencia sin permiso.
- No usar credenciales/teléfonos/domicilios reales en la demo por defecto.
- Ningún pago real en MVP; botones con estados honestos y textos de demostración.

## 7. Registro de checkpoints y estado actual

| CP | Entrega | Estado 26/10/2026 | Dependencia externa |
|---|---|---|---|
| CP-001 | Vibecode HTML original | **Archivado** | Ninguna |
| CP-002 | Astro + home + catálogo demo | **APPROVED / cerrado por aprobación comunicada por el usuario** | Ninguna pendiente para el cierre |
| CP-003 | Supabase SQL, RLS y catálogo persistente | **WAITING — no iniciado; requiere nueva autorización** | Proyecto Supabase Free |
| CP-004 | Login real + CRUD admin | **Pendiente** | Usuario admin de prueba |
| CP-005 | Carrito/pedido simulado | **Pendiente** | Ninguna adicional |
| CP-006 | Netlify y demo pública | **Pendiente** | GitHub + Netlify |
| CP-007 | Reparaciones | **Opcional / pospuesto** | Por definir |

**Histórico completo y motivación:** revisar `docs/historico/PROJECT_pre_orquestacion_2026-10-26.md`. **Preparación externa:** `REQUISITOS_EXTERNOS.md`. **Primera instrucción para Codex:** `docs/CODEX_START.md`.
