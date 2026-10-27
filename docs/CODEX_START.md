# CODEX_START.md — Órdenes listas para pegar en Codex

**Configuración recomendada en Codex:** GPT-6.1 Sol **Medium** si está disponible; en caso contrario GPT-6 Sol **Medium**. Inicia sesión con ChatGPT Plus, no con una clave de API. El selector disponible puede variar según despliegue. **Carpeta a abrir:** raíz donde están `PROJECT.md` y `AGENTS.md`, no carpeta del checkpoint.

## 1. Primer prompt: ejecutar CP-002 (copiar íntegro)

```text
Actúa como implementador técnico del proyecto Electro Shop. Yo tengo un orquestador externo que aprobará cada checkpoint.

LEE PRIMERO estos archivos del repositorio: AGENTS.md, PROJECT.md, docs/ESTADO.md y docs/MVP_ACADEMICO.md. Usa PROJECT.md como especificación vigente; los archivos docs/grill_original.md, docs/historico/* y checkpoints/* son referencias archivadas NO reutilizables como código.

TU TAREA ÚNICA: implementar CP-002 descrito en PROJECT.md, de principio a fin, en esta misma sesión.

EJECUCIÓN:
1) Inspecciona el árbol actual y el estado Git. No borres documentación ni el checkpoint del prototipo.
2) Crea web/ usando Astro + React islands + TypeScript estricto + Tailwind compilado. Selecciona versiones estables compatibles y genera scripts check/lint/test/build razonables.
3) Diseña y desarrolla un sitio ORIGINAL para Electro Shop con paleta carbón/violeta/blanco: inicio, navegación, búsqueda visible, categorías, catálogo responsive con 16 productos ficticios, filtro por categoría/disponibilidad, detalle consultable por SKU y estados vacíos; SEO y accesibilidad básica.
4) Deja datos de prueba tipados en un módulo, sin Supabase/Firebase/Netlify/login/pagos reales. Usa wordmark temporal y placeholders propios; nada de copiar DIP Mecatrónica ni usar su código/assets.
5) Añade pruebas útiles de búsqueda, filtros y tratamiento de SKU; maneja errores y evita dependencias superfluas.
6) Ejecuta npm install, npm run check, npm run lint, npm run test y npm run build dentro de web/ (si alguno no aplica, justifica). Soluciona fallos. Ejecuta vista local o un smoke test cuando sea posible.
7) Actualiza README.md y docs/ESTADO.md con lista de archivos, decisiones, comandos reales y resultados, pasos para abrir el sitio local, limitaciones y bloqueos. No pongas secretos.
8) Si Git está inicializado, usa rama/commit cp-002-foundation o crea uno de acuerdo con convenciones sin alterar historial previo. Si no hay repo remoto, documenta el paso humano en vez de afirmar que lo publicaste.

NO avances a CP-003, NO configures servicios externos, NO habilites pagos, NO inventes que algo pasó las pruebas si no pudiste ejecutarlas. Al terminar dame: resumen, archivos, comandos y resultados verificables, pasos de prueba visual, riesgos y reporte de estado para que el orquestador lo revise.
```

## 2. Prompt de corrección tras revisión

```text
Corrige EXCLUSIVAMENTE las observaciones de revisión de CP-002 que adjunto después de este mensaje. Respeta AGENTS.md y PROJECT.md. No cambies alcance ni inicies CP-003. Incluye tests de regresión, ejecuta check/lint/test/build y actualiza docs/ESTADO.md. Devuelve tabla breve: observación -> archivo corregido -> prueba que la demuestra.

OBSERVACIONES DEL ORQUESTADOR:
[PEGAR AQUÍ EL REPORTE DE REVISIÓN]
```

## 3. Plantilla de inicio de cualquier CP posterior

```text
LEE AGENTS.md, PROJECT.md, docs/ESTADO.md y REQUISITOS_EXTERNOS.md.
Ejecuta solo el checkpoint [CP-003 | CP-004 | CP-005 | CP-006] tal como se describe en PROJECT.md, con el mismo contrato de verificación y reporte de CP-002. Conserva comportamiento aprobado, añade pruebas de regresión y no publiques secretos. Si faltan cuentas/permisos, marca BLOCKED_EXTERNAL y termina con instrucciones humanas concretas; no simules integraciones realizadas. Al cerrar la tarea actualiza docs/ESTADO.md y detente.
```

## 4. Prompt de auditoría de seguridad antes de CP-006

```text
Realiza una auditoría de lectura y pruebas, sin desplegar y sin refactorizar a ciegas. Revisa RLS, clave publishable vs secret, protección admin desde Postgres, variables PUBLIC_ en Astro, sanitización de contenido, exposición de datos, tests de permisos, consola/red y acciones etiquetadas DEMO. Ejecuta comandos del proyecto, aporta evidencias y clasifica hallazgos CRITICAL/HIGH/MEDIUM/LOW con archivos y líneas. No declares seguro algo que no has podido probar. No pases a CP-006 hasta que el orquestador apruebe.
```

## 5. Formato de handoff que debes traer al orquestador

Comparte **URL de PR** si GitHub ya está conectado, o ZIP/archivos/diff si desarrollas solo localmente. También comparte esta síntesis sin secretos:

```text
Checkpoint: CP-002
Rama/commit:
Archivos principales:
Qué funciona realmente:
Comandos ejecutados y PASS/FAIL:
Cómo abrir y verificar:
BLOQUEOS externos:
Problemas conocidos y decisiones:
Estado de docs/ESTADO.md:
```

**Regla:** Una confirmación de Codex no sustituye la revisión del código y pruebas. ChatGPT evaluará entregables y autorizará el siguiente CP.
