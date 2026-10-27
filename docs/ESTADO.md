# ESTADO.md — bitácora de ejecución y revisión

**Última actualización:** 2026-10-26

**Estado general:** CP-002 **APPROVED / integrado en main**. CP-003A implementado para revisión de seguridad; tests PostgreSQL/RLS **BLOCKED_EXTERNAL**. Sin SQL remoto ni CP-004.

**Bloqueos inmediatos CP-003A:** faltan Supabase CLI, Docker y PostgreSQL locales para ejecutar SQL/pgTAP. La integración remota espera revisión y nueva autorización; credenciales locales no se imprimen ni versionan.

| CP | Estado | Ejecutor | Resultado |
|---|---|---|---|
| CP-001 | Archivado | equipo | `index_elec.html` guardado sin uso en producción |
| CP-002 | **APPROVED / CERRADO** | Codex; aprobación del orquestador comunicada por usuario | Astro local, 16 productos, catálogo/ficha; 14 tests y smoke en Edge; cierre documental |
| CP-003 | CP-003A REVIEW / BLOCKED_EXTERNAL (DB) | Codex | Fundación SQL/adaptador preparados; RLS no ejecutado por falta de servicios locales; remoto sin aplicar |
| CP-004 | WAITING | Codex | Espera admin de prueba |
| CP-005 | WAITING | Codex | Espera aprobación |
| CP-006 | WAITING | Codex | Espera GitHub/Netlify |
| CP-007 | OPTIONAL | Codex | Reparaciones fuera del MVP |

## Bitácora (Codex debe agregar entradas sin borrar historial)

### 2026-10-26 — PRE-CODEX / preparación por orquestador
- Documentación operativa, instrucciones Codex y requisitos externos redactados.
- No hay Astro generado ni npm instalado para este proyecto.
- No hay Supabase/Netlify creados o conectados desde esta entrega.
- La referencia externa no autoriza copia de contenido de terceros.

### Plantilla de nueva entrada

```md
### YYYY-MM-DD — CP-0XX / [IN_PROGRESS | PASS | FAIL | BLOCKED_EXTERNAL]
- Rama/commit:
- Alcance exacto:
- Archivos principales:
- Decisiones técnicas:
- Comandos realizados (check/lint/test/build) con salida/resumen y PASS/FAIL:
- Evidencia visual o URL local/deploy:
- Tests manuales y de seguridad:
- Bloqueos, riesgos, deuda técnica:
- Estado de aceptación: pendiente de revisión / aceptado por humano.
- Próxima instrucción propuesta (sin ejecutarla):
```

### 2026-10-26 — CP-002 / PASS técnico; pendiente de revisión

- **Rama:** `cp-002-foundation`, creada desde `main` / `790e1be`. Commit de entrega: `feat: CP-002 frontend foundation and demo catalog`; consultar su hash con `git log -1 --oneline`. No se reescribió historial ni se contactó el remoto `origin` existente. No push, PR ni publicación.
- **Alcance:** exclusivamente CP-002, siguiendo íntegramente el primer prompt de `docs/CODEX_START.md`. Se leyeron AGENTS, PROJECT, ESTADO, MVP, CODEX_START, REQUISITOS_EXTERNOS y CHECKPOINT archivado antes de implementar. Se aplicó la habilidad Sites solo para trabajo local; sin registro ni hosting. La especificación vigente prevalece sobre la mención histórica de Netlify en CP-001.
- **Funciona:** inicio con buscador GET y categorías; catálogo con 16 productos ficticios, cuatro categorías, búsqueda por nombre/SKU normalizada (mayúsculas, acentos, espacios externos), filtros combinados y limpieza; ficha por query SKU, precio MXN en centavos, stock y cantidad de referencia; SKU inválido; página acerca y 404. Carga, catálogo vacío, cero coincidencias y error/reintento cubiertos. Sin retrasos artificiales ni falsas confirmaciones.
- **Archivos agregados:** `web/package.json`, `package-lock.json`, `astro.config.mjs`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`; `web/src/layouts/Layout.astro`; páginas `index.astro`, `catalogo.astro`, `producto.astro`, `acerca.astro`, `404.astro`; componentes `Catalog.tsx`, `ProductCard.tsx`, `ProductArt.tsx`, `ProductDetail.tsx`; `web/src/data/catalog.ts`; `web/src/styles/global.css`; `web/public/favicon.svg`; tests `web/src/data/catalog.test.ts` y `web/src/components/catalog-ui.test.tsx`; `web/scripts/smoke.mjs`; ocho PNG en `docs/evidencia/CP-002/`.
- **Documentación modificada:** README (ejecución Windows, comandos, rutas, pruebas y límites), PROJECT (estado CP-002), esta bitácora. Se incluye `.gitignore` preexistente para excluir dependencias, compilación y secretos. El resto de documentos/archivos preexistentes sin seguimiento no se incorporan al commit de implementación y se conservan en disco; al compartir ZIP, incluir también los documentos de instrucciones del repositorio, excluyendo dependencias, dist y .env reales.
- **Decisiones:** Astro 7.4.2 estático, integración React 7.1.1, React 19, TS estricto, Tailwind 4 compilado vía Vite; Vitest 5 y ESLint 10 con plugin Astro 1.7 compatible con Node local. Node 24.6.0/npm 11.5.1 usados; contrato Node >=22.23.4. Lockfile reproducible. Adaptador local pequeño `loadProducts`, sin SDK de BD. Ilustraciones geométricas SVG originales por categoría, wordmark temporal y textos propios; sin assets, scraping ni código de DIP o CP-001. Precios/stock ficticios visibles como DEMO.

#### Comandos ejecutados y resultados finales

Todos los comandos npm desde `web/`, con `npm.cmd` por la política PowerShell de Windows:

| Comando | Resultado auténtico |
| --- | --- |
| `npm.cmd install --include=optional` | PASS: instalación limpia final; 566 paquetes añadidos, 567 auditados; 0 vulnerabilidades |
| `npm.cmd run check` | PASS: 18 archivos, 0 errores, 0 advertencias, 0 hints |
| `npm.cmd run lint` | PASS: sin errores |
| `npm.cmd run test` | PASS: 2 archivos, 14 tests (dataset, filtros, SKU, centavos, interacción, error/reintento, accesibilidad y fichas) |
| `npm.cmd run build` | PASS: 5 páginas estáticas generadas en `web/dist/` |
| `npm.cmd run smoke` | PASS: Edge headless, inicio/catálogo/producto/acerca a 360 y 1440 px; sin desbordamiento; axe incluyendo contraste; búsqueda de header, filtros, cero resultados, limpieza, ficha y recarga, SKU inválido, salto de teclado, 404; sin errores JS; 8 capturas |
| `npm.cmd audit --json` | PASS: 0 vulnerabilidades de todas las severidades |
| `git diff --check` con excepción local safe.directory | PASS: sin errores de whitespace; aviso informativo LF/CRLF de Git en README |
| `Get-FileHash .../index_elec.html -Algorithm SHA256` | PASS: `f5cfb55e878d0a7d114b0a316cc9a0d53bababa30bcaea810d9f0b8588b8e0a2`, igual al CP-001 |

- **Incidencias iniciales, corregidas:** sandbox bloqueó registry npm, caché/telemetría Astro, esbuild y escrituras Git; se reintentó con permisos ampliados. Git detectó propietario distinto: se usó `git -c safe.directory=...` por comando, sin editar configuración global. `npm.ps1` bloqueado: se usó `npm.cmd`. Primera selección Astro 5/Vitest 3 tuvo 8 vulnerabilidades; se sustituyó por versiones estables corregidas. npm omitió un binario opcional de Rollup después de actualizar; se regeneraron únicamente node_modules y lockfile dentro de web y se completó instalación limpia. Se eliminó dependencia opcional de compilador React innecesaria y se fijó plugin Astro de lint compatible con Node. Advertencias no bloqueantes de dependencias: whatwg-encoding obsoleto y limpieza EPERM de una carpeta opcional wasm en instalación final; controles posteriores y auditoría pasan. Primer smoke encontró etiqueta accesible de marca y aviso DEMO fuera de landmark; ambos corregidos. Un selector ambiguo del smoke se corrigió con coincidencia exacta.
- **Evidencia visual:** `docs/evidencia/CP-002/{inicio,catalogo,producto,acerca}-{360,1440}.png`. Se inspeccionaron visualmente inicio móvil/escritorio: carbón, violeta, tarjetas con ilustración original, navegación y buscador adaptados. Capturas generadas desde build real, sin imágenes remotas. Smoke usa un servidor efímero en `http://127.0.0.1:4322`, navegador/servidor cerrados al terminar.
- **Cómo reproducir:** `cd web`, `npm.cmd install`, `npm.cmd run dev -- --host 127.0.0.1`, abrir `http://127.0.0.1:4321`; ver matriz de rutas y pasos visuales en README. Smoke requiere Edge instalado y build previo; no descarga navegadores.
- **Seguridad y límites:** revisión estática de src/public sin `innerHTML`, `alert()`, secretos, SDK ni conexiones a Supabase/Firebase/Netlify. Sin admin/login falso ni pagos. Carrito reservado a CP-005: botón deshabilitado y aviso explícito; cantidad solo de referencia, nada se guarda. Ficha resuelta en cliente y catálogo interactivo requieren JS, con avisos noscript; metadatos sociales genéricos y sin canonical hasta tener dominio autorizado. Filtros locales reinicializados desde URL al recargar. No se verificó lector de pantalla ni dispositivo físico; teclado y axe ejecutados en Edge, jsdom excluye contraste por limitación de layout. Revisión humana del orquestador sigue pendiente.
- **Bloqueos externos:** ninguno para CP-002. No se requieren credenciales y no se configuraron servicios externos. El usuario debe compartir el diff/archivos/capturas para revisión; no se afirma publicación remota.
- **Próxima instrucción propuesta, SIN EJECUTAR:** solicitar revisión de CP-002 al orquestador; corregir sus observaciones si las hay. Solo tras aceptación y nueva autorización iniciar CP-003 siguiendo requisitos externos de Supabase. CP-003/004/005/006/007 permanecen sin iniciar.

### 2026-10-26 — CP-002 / AUDITORÍA DE ENTREGA; NO APROBADO

- Orden del orquestador: auditar y empaquetar CP-002 sin cambios funcionales, borrados de archivos originales, push ni avance a CP-003.
- Rama/HEAD comprobados: `cp-002-foundation` / `bd6574b4e7cbf81cf8180ce42d7ab34286ca7728`. Al comenzar, sin cambios staged ni modificaciones versionadas; nueve archivos previos sin seguimiento detallados en `REVIEW_CP002.md`.
- `web/22.23.4` no existe ni está en Git: el registro de implementación confirma un artefacto vacío de redirección accidental al ejecutar npm pkg set con `>=22.23.4`, retirado antes del commit. Ningún archivo original se borró en esta auditoría.
- Los 22 archivos de web están versionados en bd6574b. AGENTS.md, REQUISITOS_EXTERNOS.md, docs/CODEX_START.md y docs/MVP_ACADEMICO.md estaban sin seguimiento: el ZIP los incluye. No se modifica el historial para incorporar documentos previos.
- Verificación NUEVA en extracción independiente de ZIP de fuentes, Node 24.6.0/npm 11.5.1: `npm.cmd ci --include=optional`, `npm.cmd run check`, `npm.cmd run lint`, `npm.cmd run test`, `npm.cmd run build`, `npm.cmd run smoke`, `npm.cmd audit --json`: todos PASS, código 0. Check: 18 archivos sin errores/warnings/hints; tests: 14/14; build: cinco páginas; smoke Edge: cuatro rutas a 360/1440, axe incluido contraste, navegación/interacción y ocho capturas en la extracción; audit: cero vulnerabilidades. El lockfile conserva SHA-256 `feaa6a0233298e61b07a786b59fdc52522ae3f0919a621ec55bf628a50548395`.
- Incidencia del auditor: PowerShell interrumpió inicialmente la captura de npm por una advertencia; se repitió con ejecutor Node que verifica códigos reales. Logs conservados fuera del repositorio en el directorio temporal de auditoría indicado en REVIEW_CP002.md.
- Entrega: `REVIEW_CP002.md` y `CP002_REVIEW.zip` (39 archivos de fuente/configuración/pruebas/documentación/capturas). ZIP construido con lista permitida, sin node_modules/dist/Git/cachés/temporales/.env/credenciales; búsquedas de patrones comunes de secretos sin coincidencias. Se comprueban entradas, extracción y hashes contra los archivos de entrega y el código de la copia probada. No se afirma una segunda ejecución de tests sobre el ZIP final: equivalencia del código comprobada por hashes.
- Pendientes: documentación obligatoria todavía sin versionar; revisión del orquestador; cobertura de accesibilidad no incluye lector de pantalla ni dispositivos físicos; smoke requiere Edge/puerto 4322. El resto de límites funcionales sigue documentado. No se detecta fuente CP-002 faltante ni implementación de CP-003.
- Únicos cambios sobre archivos versionados: esta entrada documental. Nuevos sin commit: REVIEW_CP002.md y CP002_REVIEW.zip; se conservan los nueve archivos sin seguimiento preexistentes. Sin cambios de código/dependencias, sin commit/push/despliegue. **CP-002 NO APROBADO; esperar dictamen explícito del orquestador.**

### 2026-10-26 — CP-002 / ENTREGA DOCUMENTAL PARA REVISIÓN EN GITHUB

- Nueva autorización explícita del usuario: preparar commit documental y enviar `cp-002-foundation` a `origin`, repositorio `andsanchez037/electroshop`. No autoriza merge, force push, despliegue ni CP-003.
- Estado inicial de esta tarea: HEAD `bd6574b4e7cbf81cf8180ce42d7ab34286ca7728`; docs/ESTADO.md modificado por la auditoría; 11 archivos sin seguimiento (nueve previos más REVIEW_CP002.md y CP002_REVIEW.zip), todos revisados.
- Se incorporan AGENTS.md, REQUISITOS_EXTERNOS.md, docs/CODEX_START.md, docs/MVP_ACADEMICO.md, docs/grill_original.md, docs/historico/PROJECT_pre_orquestacion_2026-10-26.md, REVIEW_CP002.md, .env.example y los dos archivos archivados CP-001. PROJECT y la evidencia ya están versionados. README actualizado para la revisión por rama; el informe de auditoría conserva los resultados originales y añade seguimiento.
- `.env.example`: solo placeholders, sin valores reales. `.gitignore`: exclusiones de entornos reales, credenciales/claves, node_modules, dist, cachés, temporales y ZIP de revisión. CP002_REVIEW.zip permanece local, sin modificar y fuera de Git.
- Verificación para este cambio documental: identidad de rama/origin; remoto consultado con ls-remote (main inicial `790e1be698c381978d917c8a6c2f5ab7acbab8dc`, cp-002-foundation ausente antes del envío); comparación de web contra bd6574b; reglas de ignore y revisión de archivos staged/patrones de secretos. Detalles y resultado efectivo del push se reportan al concluir, no se predeclara enviado.
- No se repiten check/lint/test/build/smoke: todo web permanece idéntico a la fuente ya probada durante la auditoría (14 tests y demás controles PASS); ningún resultado nuevo de npm se afirma para esta tarea.
- Rama de revisión prevista: https://github.com/andsanchez037/electroshop/tree/cp-002-foundation. Commit documental local creado antes del push, sin reescribir bd6574b. **CP-002 pendiente de aprobación; CP-003 no iniciado.**

### 2026-10-26 — CP-002 / APPROVED — CIERRE FORMAL

- Aprobación técnica del orquestador externo comunicada expresamente por el usuario en esta conversación; se registra el checkpoint como APPROVED y cerrado. El usuario autorizó commit/push documental y PR hacia main, sin merge automático. No se interpreta esta aprobación como autorización para iniciar CP-003.
- Rama inicial `cp-002-foundation`, HEAD `4ca0292e9264e621ba980b9933e693e87358b568`, árbol limpio e índice vacío. Fuente funcional aprobada `bd6574b4e7cbf81cf8180ce42d7ab34286ca7728`. El commit documental anterior ya se envió a origin satisfactoriamente y se verificó su SHA remoto.
- Archivos de este cierre: exclusivamente PROJECT.md y docs/ESTADO.md. Se actualizan estado, tabla y siguiente paso; se conserva la bitácora histórica de auditoría y entrega. REVIEW_CP002.md y el ZIP local documentan la entrega anterior y no se regeneran.
- Limitaciones no bloqueantes: catálogo/ficha requieren JS; SEO social genérico y canonical de producción pendiente; filtros editados sin persistencia en URL; wordmark e ilustraciones de categoría temporales; cobertura automática en Edge a 360/1440 px, sin lector de pantalla ni dispositivo físico; smoke necesita Edge y puerto 4322 libre. Carrito permanece deshabilitado hasta CP-005; no se procesan compras/pagos.
- Validación de este cierre documental: git status, revisión del índice y diff; solamente los dos documentos autorizados deben estar staged. Comparación de todo web con bd6574b para preservar código, pruebas, configuraciones y lockfile. Comprobación de exclusión del ZIP y entornos reales, búsqueda de patrones comunes de secretos en los documentos. No se repiten pruebas npm: no cambia la aplicación. Los resultados ejecutados en la auditoría siguen siendo instalación/check/lint/14 tests/build/smoke/audit PASS; no se afirma una ejecución nueva.
- Entrega prevista por esta orden: commit documental en cp-002-foundation y push normal a origin; PR dirigido a main (o URL exacta de comparación si el conector no permite crearlo). El resultado efectivo y el SHA final se reportan tras las operaciones, sin predeclararlos aquí. Sin force push ni merge automático.
- Preparación para la siguiente fase: documentación vigente actualizada; CP-003 continúa WAITING / NO INICIADO. Requiere nueva autorización y preparación humana según REQUISITOS_EXTERNOS.md. No se crean migraciones, SDK, credenciales ni conexiones externas de CP-003. Esperar la próxima instrucción del usuario/orquestador.

### 2026-10-26 — CP-003A / READY_FOR_REVIEW — BLOCKED_EXTERNAL (POSTGRESQL/RLS)

- Autorización: fundación de Supabase exclusivamente, sin ejecutar migraciones remotas, crear admins/cuentas reales, desplegar, fusionar main ni iniciar CP-004. Leídos AGENTS, PROJECT, REQUISITOS_EXTERNOS y ESTADO. CP-002 aprobado e integrado en main.
- Rama nueva: cp-003-supabase, creada después de fetch origin main y comprobación fast-forward desde `ddb22b954bfe391349475a2ad6b4476e03cc464f` (main más reciente). Entrega como commit local de esta rama; no se realiza push en esta tarea. SHA de entrega: consultar git log -1; base documentada y reporte final con SHA concreto.
- SQL preparado: `supabase/migrations/20261026000100_catalog_security.sql` (transacción, categories/products/admin_users, constraints SKU/precio/stock/FK, propietarios postgres, RLS en las tres tablas, grants mínimos, siete policies y helper SECURITY DEFINER sin parámetros, esquema privado no expuesto, search_path vacío). admin_users no concede grants/policies a clientes, ni siquiera a admins. No se crean roles/usuarios reales ni RPC de autoasignación.
- Seed: `supabase/seed.sql` generado desde los 16 productos/cuatro categorías de CP-002; upsert por SKU/id, sin usuarios. `web/scripts/generate-seed.mjs` genera y compara. Reejecutar seed sobrescribe esos datos DEMO; idempotencia ejecutada en DB sigue pendiente.
- Pruebas DB preparadas: `supabase/tests/database/catalog_rls.test.sql`, 53 aserciones pgTAP declaradas (NO superadas/no ejecutadas): anon, usuario normal, admin, metadata falsa, sub ausente, active/categorías, CRUD, grants, constraints, autoasignación, revocación. Fixtures locales sin emails/passwords, con rollback. `supabase/config.toml` solo local; `web/scripts/test-db.mjs` fija --local, no acepta destinos arbitrarios, exige evidencia TAP real y no expone salidas sensibles.
- Adaptador: `web/src/data/catalog-source.ts`, fetch REST solo lectura con publishable key, validación runtime del contrato Product, paginación/count exacto, timeout y mensajes genéricos. `loadProducts()` conserva interfaz; ficha y catálogo usan el mismo origen. Modo demo por defecto; modo supabase explícito propaga errores sin fallback a productos ficticios. Error de ficha separado de SKU no encontrado con reintento. No se consulta API real durante la tarea.
- Entornos: `web/.env.example` y plantilla raíz con placeholders; preflight `web/scripts/public-env.mjs` en astro.config y validación al seleccionar origen rechazan claves elevadas/JWT legacy, PUBLIC_* no previstas y URLs con credenciales aun en demo. `web/.env.local` permanece ignorado, no modificado ni impreso; validación de valores solo en proceso. No nuevas dependencias, package-lock intacto. `.gitignore` añade estado local Supabase .temp/.branches.
- Frontend PASS ejecutado: `npm.cmd run check` (24 archivos, cero errores/warnings/hints), `npm.cmd run lint`, `npm.cmd run test` (4 archivos, 27 pruebas: 14 originales intactas +13 nuevas), `npm.cmd run build` (cinco páginas), `npm.cmd run seed:check`. No fue necesaria instalación nueva y no se afirma una auditoría npm nueva. Los controles se repitieron tras reforzar el guard de URLs.
- Smoke PASS: build con PUBLIC_CATALOG_MODE=demo explícito y script smoke aprobado ejecutado sobre copia temporal de dist: cuatro rutas a 360/1440, axe con contraste, búsqueda/filtros/limpieza, ficha/recarga, SKU inválido, teclado skip link y 404; sin pageerror JS. Ocho capturas temporales fuera del repositorio; evidencia CP-002 sin sobrescribir. La suite frontend fija modo demo y usa transporte inyectado en tests Supabase.
- DB BLOCKED_EXTERNAL ejecutado: `npm.cmd run test:db`, salida explícita de herramientas faltantes, exit 2. No se detectaron Supabase CLI, Docker ni psql en PATH. No se ejecutó ni migración, seed, pgTAP o pruebas de grants/RLS/constraints en PostgreSQL. NO PASS de seguridad ni de integración persistente; mocks HTTP no sustituyen DB.
- Preservación: estilos/páginas/layouts/assets, dataset de 16 productos y tests originales CP-002 conservados; cambios de datos aislados y estado adicional de error en ficha. Portada/destacados y taxonomía visual siguen estáticos DEMO; el adaptador admite las cuatro categorías aprobadas, rechazando otras explícitamente. Login/CRUD UI, carrito, remoto y despliegue fuera de alcance.
- Documentación: README, PROJECT, esta entrada y `docs/CP003A_HANDOFF.md`; matriz de permisos, reproducción local y procedimiento futuro de primer admin en `supabase/README.md`. Historial CP-002 preservado, sin convertir sus resultados en pruebas de DB.
- Riesgos/bloqueos: ejecutar SQL/pgTAP en una instancia local desechable con herramientas disponibles antes de aceptación de seguridad; revisar gateway/schema privado antes de cualquier integración remota. Primer admin solo futuro operador SQL con usuario Auth revisado y autorización posterior. No ejecutar --linked/--db-url ni aplicar SQL en Dashboard durante esta subfase.
- Próxima acción: detenerse y esperar revisión de seguridad del orquestador. No aplicar remoto ni iniciar CP-004. CP-003 completo sigue sin aceptación.
