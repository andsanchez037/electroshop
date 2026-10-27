# CP-002 — Auditoría de entrega para el orquestador

**Estado: NO APROBADO; revisión pendiente.** Esta auditoría no autoriza CP-003.

## Identidad y alcance de la auditoría

- Rama actual: `cp-002-foundation`.
- HEAD / commit solicitado: `bd6574b4e7cbf81cf8180ce42d7ab34286ca7728` (`bd6574b`).
- Asunto: `feat: CP-002 frontend foundation and demo catalog`.
- Commit base: `790e1be`. El commit auditado contiene 34 archivos: código/configuración, documentación y ocho PNG.
- Estado al comenzar: ningún archivo versionado modificado, ningún cambio staged; nueve archivos sin seguimiento enumerados más abajo. `git diff HEAD --exit-code` y `git diff --check HEAD` sin diferencias/errores.
- Auditoría de lectura, documentación, empaquetado y reproducción. Sin cambios funcionales, refactor, nuevas dependencias, borrado de archivos originales del repositorio, commit, push, despliegue ni inicio de CP-003. No se contacta el remoto.

## Archivo inesperado `web/22.23.4`

Actualmente **no existe**, no está en el árbol de `bd6574b` y `git log --all -- web/22.23.4` no registra commits para esa ruta.

El registro de herramientas de la implementación, disponible en esta misma conversación, permite establecer su origen: la invocación `npm.cmd pkg set engines.node=">=22.23.4" scripts.smoke="node scripts/smoke.mjs"` falló con EUSAGE y produjo un archivo llamado `22.23.4`. La inspección posterior mostró longitud **0 bytes**. Fue un artefacto de redirección `>` al pasar el argumento por las capas de shell de Windows; no una dependencia, configuración o salida legítima de Astro. El package.json definitivo se corrigió mediante edición de archivo.

El registro también confirma que el archivo vacío se eliminó **durante la implementación, antes de crear bd6574b**. En esta auditoría no se ha borrado ningún archivo. La evidencia de su origen es el registro de ejecución, no el historial Git (nunca estuvo versionado). No se ha recreado el comando defectuoso.

## Arquitectura verificada en los archivos

| Parte | Implementación |
| --- | --- |
| Sitio | Astro 7.4.2, salida `static`; páginas y layout compartido con HTML semántico |
| Interacción | Islas React `Catalog` y `ProductDetail` con `client:load`; tarjetas del inicio renderizadas estáticamente |
| Tipos | TypeScript con `astro/tsconfigs/strict` y `noUncheckedIndexedAccess` |
| Estilos | Tailwind 4 compilado mediante `@tailwindcss/vite`; CSS original responsive |
| Datos | `web/src/data/catalog.ts`: 16 productos, cuatro categorías, SKU único, precio en centavos enteros, stock demo y adaptador local pequeño |
| Rutas | `/`, `/catalogo`, `/producto?sku=...`, `/acerca`, 404 |
| Tests | Vitest 5, Testing Library, jsdom, axe-core; smoke con Playwright Core y Edge instalado |
| Backend y servicios | Ninguno; sin Supabase, Firebase, Netlify, Auth, pagos o almacenamiento de pedidos |

Versiones exactas transitivas fijadas por `web/package-lock.json`; no se ha modificado durante esta auditoría. Entorno de reproducción: Windows, Node 24.6.0, npm 11.5.1. `package.json` exige Node >=22.23.4.

## Funciones implementadas

- Inicio original carbón/violeta/blanco, wordmark temporal, ilustración SVG propia, búsqueda GET y enlaces a categorías/destacados.
- Catálogo público con 16 productos ficticios (cuatro por categoría), búsqueda por nombre/SKU sin distinguir mayúsculas y acentos, filtros combinados de categoría/disponibilidad, recuento y limpieza.
- Carga, vacío, cero coincidencias y error con reintento; el adaptador local normalmente resuelve de inmediato, y error/vacío se ejercitan mediante inyección en tests.
- Ficha por SKU con nombre, descripción, precio MXN, stock demo, cantidad de referencia; SKU ausente/desconocido muestra mensaje y enlace para volver.
- Botón de carrito deshabilitado con aviso honesto. Sin selección persistida, pedidos ni confirmaciones falsas.
- Metadatos básicos, favicon propio, página acerca y 404. Avisos DEMO y noscript.

## Verificación ejecutada

Resultados **ejecutados de nuevo durante esta auditoría**, sobre una extracción independiente de un ZIP de fuentes, sin copiar `node_modules`, `.astro`, `dist`, `.env` ni configuración Git del repositorio:

| Comando en la copia extraída (`web/`) | Código | Resultado |
| --- | --- | --- |
| `npm.cmd ci --include=optional` | 0 | PASS: 566 paquetes añadidos, 567 auditados; lockfile sin cambios |
| `npm.cmd run check` | 0 | PASS: 18 archivos, 0 errores, 0 warnings, 0 hints |
| `npm.cmd run lint` | 0 | PASS: sin errores |
| `npm.cmd run test` | 0 | PASS: 2 archivos de pruebas, 14 tests |
| `npm.cmd run build` | 0 | PASS: cinco páginas estáticas |
| `npm.cmd run smoke` | 0 | PASS: 360/1440 px, cuatro rutas, axe incluido contraste, filtros, búsqueda, recarga, SKU inválido, skip link y 404; ocho capturas generadas en la copia; sin pageerror JavaScript |
| `npm.cmd audit --json` | 0 | PASS: 0 vulnerabilidades reportadas |

Directorio de trabajo aislado: `%TEMP%/ElectroShop-CP002-Audit-22ef6eeb716444ba98b344c0a330d8cf/source-extracted/web`. Los logs y `verification-results.json` se conservan en el directorio padre temporal; no se empaquetan. Las capturas regeneradas no sustituyen las del repositorio original.

La primera captura de `npm ci` se interrumpió porque `ErrorActionPreference=Stop` en PowerShell trató la advertencia de obsolescencia de `whatwg-encoding` como `NativeCommandError`. Se repitió mediante Node/child_process con captura directa y comprobación de códigos reales. La ejecución completa anterior terminó con código 0 en los siete comandos; la advertencia de obsolescencia sigue siendo no bloqueante.

SHA-256 de `web/package-lock.json`, idéntico en origen y copia probada: `feaa6a0233298e61b07a786b59fdc52522ae3f0919a621ec55bf628a50548395`.

El ZIP final contiene **39 archivos**: los 38 archivos del paquete de fuentes auditado y este informe; `docs/ESTADO.md` incorpora únicamente la entrada de auditoría posterior a las pruebas. Se verifica por extracción, lista de entradas, lectura de bytes y SHA-256: todo `web/` coincide con la copia probada, y todos los archivos del ZIP coinciden con los originales de la entrega. Las pruebas se ejecutaron en la extracción del paquete de fuentes; la verificación del ZIP final comprueba la equivalencia del código mediante hashes, sin afirmar una segunda ejecución redundante de las pruebas.

## Accesibilidad y límites de cobertura

Inspección: idioma `es-MX`, landmarks, enlace para saltar al contenido, foco visible, labels de búsqueda/filtros/cantidad, `role=status`, `role=alert`, `aria-busy`, enlaces nativos y SVG decorativos ocultos al árbol accesible.

Los tests jsdom excluyen contraste porque no realizan layout real. El smoke existente comprueba axe completo (incluido contraste) en cuatro páginas a 360/1440 px, desbordamiento horizontal y salto por teclado. No comprueba lector de pantalla, navegación completa de todos los controles exclusivamente por teclado, dispositivo físico, todos los navegadores o conformidad WCAG completa. Tampoco analiza automáticamente cada estado de error en navegador.

## Inventario Git y archivos excluidos del commit

Estado inicial sin seguimiento, exhaustivo según `git status --short --untracked-files=all`:

| Archivo | Clasificación | Entrega ZIP |
| --- | --- | --- |
| `.env.example` | Plantilla preexistente; no requerida para CP-002 | Excluida por política de empaquetado: ningún `.env*` |
| `AGENTS.md` | Instrucciones obligatorias ausentes del commit | Incluida |
| `REQUISITOS_EXTERNOS.md` | Guía humana enlazada desde README/PROJECT | Incluida |
| `docs/CODEX_START.md` | Prompts y contrato de entrega | Incluida |
| `docs/MVP_ACADEMICO.md` | Documento de lectura obligatoria, subordinado a PROJECT | Incluida |
| `docs/grill_original.md` | Antecedente, sin uso en aplicación | Excluida; permanece en repositorio local |
| `docs/historico/PROJECT_pre_orquestacion_2026-10-26.md` | Alcance histórico fuera de CP-002 | Excluida; permanece en repositorio local |
| `checkpoints/2026-10-26-vibecode/CHECKPOINT.md` | Archivo CP-001, antecedente | Excluida; permanece en repositorio local |
| `checkpoints/2026-10-26-vibecode/index_elec.html` | Prototipo archivado, no fuente CP-002 | Excluida; permanece intacto en repositorio local |

Los 22 archivos de fuente, assets, configuración, manifiestos y pruebas no ignorados de `web/` están en bd6574b. No se detectó código requerido ausente del commit. La omisión es documental: un checkout de ese commit no contiene AGENTS ni las otras tres guías vigentes; el ZIP suple esa falta. No se incorporan silenciosamente documentos previos al historial Git.

Cambios de esta auditoría en la entrega: `docs/ESTADO.md` (solo nueva entrada; modificado sin staged), `REVIEW_CP002.md` y `CP002_REVIEW.zip` (nuevos sin seguimiento). Permanecen sin commit para revisión; HEAD sigue siendo bd6574b. Sumados a los nueve archivos originales, hay 11 archivos sin seguimiento. Los artefactos de instalación, logs de herramientas y extracciones están en un directorio temporal independiente, fuera del ZIP y del repositorio. No se alteran `.gitignore`, código, dependencias ni configuraciones.

## Riesgos, pendientes y diferencias respecto a PROJECT/AGENTS

| Nivel | Hallazgo y evaluación |
| --- | --- |
| Medio — entrega | Documentos obligatorios no versionados: Git por sí solo no entrega todas las instrucciones. ZIP los incluye; queda pendiente decidir su incorporación a Git tras revisión. |
| Bajo — reproducción | Smoke requiere Edge instalado y puerto local 4322 libre. Playwright Core no descarga navegadores. Solo se valida el entorno Windows/Node indicado; no se afirma compatibilidad comprobada en otros sistemas o toda versión admitida por engines. |
| Bajo — UX/SEO | Catálogo/ficha requieren JavaScript. La ficha utiliza título actualizado en cliente y metadatos genéricos; sin canonical de producción. Limitación documentada, sin incumplimiento obligatorio de CP-002 identificado. |
| Bajo — filtros | Filtros editados no se escriben en URL ni persisten; recarga vuelve a los parámetros de entrada. No requerido en CP-002. |
| Bajo — pruebas | Axe/skip link no sustituyen auditoría manual completa ni lector de pantalla. Las ocho capturas prueban dos anchos concretos. |
| Informativo — alcance | `/acerca` y 404 son páginas auxiliares; `/servicios`, `/contacto`, `/admin` son rutas recomendadas globalmente, no criterios obligatorios de CP-002. No hay admin falso. |
| Informativo — carrito | Sin carrito funcional; PROJECT permite posponerlo explícitamente en CP-002. Botón deshabilitado y cantidad de referencia documentados. CP-005 no iniciado. |
| Informativo — documentación histórica | CP-001 menciona preview Netlify y MVP inicial cubre fases futuras. Se sigue PROJECT vigente: sin despliegue ni backend. |
| Informativo — artefacto | `web/22.23.4` fue accidental y ya estaba ausente al comenzar; nunca formó parte del checkpoint. |

No se detectaron cambios funcionales de CP-003 ni violaciones de alcance en el código auditado. La revisión estática no encontró APIs inseguras de inserción HTML, login simulado ni conexiones de datos externas en src/public. La búsqueda de patrones de secretos se limita a los archivos incluidos y patrones comunes; no constituye garantía universal de ausencia de secretos. El prototipo CP-001 conserva SHA-256 `f5cfb55e878d0a7d114b0a316cc9a0d53bababa30bcaea810d9f0b8588b8e0a2`.

## Paquete y reproducción para otro desarrollador

Archivo de entrega: `C:\Users\Andres\OneDrive\Escritorio\electroshop\CP002_REVIEW.zip`.

Incluye toda la fuente CP-002 versionada, ocho capturas de la implementación, `.gitignore`, README, AGENTS, PROJECT, REQUISITOS_EXTERNOS, docs/CODEX_START, docs/MVP_ACADEMICO, docs/ESTADO y este informe. Sin Git, node_modules, dist, cachés, temporales, logs de instalación, historial archivado, `.env*`, credenciales ni archivos de claves. El paquete es una entrega de fuentes y documentos, no un repositorio Git ni un despliegue.

Extraer en una carpeta nueva. En PowerShell:

```powershell
cd <carpeta-extraida>\web
node --version
npm.cmd ci --include=optional
npm.cmd run check
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run smoke
npm.cmd run dev -- --host 127.0.0.1
```

Abrir `http://127.0.0.1:4321`; comprobar también `/catalogo?q=es-d001`, `/producto?sku=ES-D001` y `/producto?sku=INVALIDO`. El smoke requiere Edge y genera sus capturas en la copia extraída. No necesita `.env` ni credenciales. npm necesita acceso al registro para instalar; en este entorno las pruebas requieren ejecución ampliada porque el sandbox bloquea accesos de herramientas/dependencias.

**Decisión pendiente del orquestador:** aprobar CP-002 o emitir correcciones concretas. Esta entrega no aprueba el checkpoint y no inicia CP-003.

## Seguimiento — entrega documental a GitHub autorizada por el usuario

Esta sección corresponde a una orden posterior a la auditoría anterior. Su inventario de archivos sin seguimiento describe el estado de aquel momento; no el estado después del commit documental.

El usuario autorizó incorporar las instrucciones y antecedentes a Git y enviar únicamente `cp-002-foundation` a `origin` (`andsanchez037/electroshop`). El commit documental incorpora AGENTS, REQUISITOS_EXTERNOS, docs, este informe, `.env.example` verificado con placeholders y los antecedentes CP-001 sin modificar. PROJECT y las capturas ya estaban versionados. Se actualizan README, ESTADO y las exclusiones de `.gitignore`.

El código, las pruebas, las dependencias y las configuraciones de `web/` permanecen iguales a `bd6574b`. La verificación de instalación/check/lint/14 tests/build/smoke/audit descrita arriba sigue correspondiendo a esa fuente; no se afirma haber repetido las pruebas por cambios documentales. El ZIP local anterior permanece intacto y se excluye del commit; no se regenera para esta tarea.

Se verificó el remoto con `git ls-remote`: antes de preparar el envío, `main` estaba en `790e1be698c381978d917c8a6c2f5ab7acbab8dc` y la rama de destino todavía no existía. El resultado del push se comunica después de ejecutarlo, sin predeclararlo en este documento. No se solicita ni realiza merge, force push, despliegue o avance a CP-003.
