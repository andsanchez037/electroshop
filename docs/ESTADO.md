# ESTADO.md — bitácora de ejecución y revisión

**Última actualización:** 2026-10-26

**Estado general:** CP-002 implementado y verificado localmente, **pendiente de revisión del orquestador**. CP-003 no iniciado.

**Bloqueos inmediatos:** ninguno para desarrollar localmente con los programas necesarios; credenciales Supabase/Netlify NO requeridas en CP-002.

| CP | Estado | Ejecutor | Resultado |
|---|---|---|---|
| CP-001 | Archivado | equipo | `index_elec.html` guardado sin uso en producción |
| CP-002 | **PASS técnico / REVIEW** | Codex | Astro local, 16 productos, catálogo/ficha; 14 tests y smoke en Edge |
| CP-003 | WAITING | Codex | Espera aprobación + Supabase |
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
