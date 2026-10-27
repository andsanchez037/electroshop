# AGENTS.md — Electro Shop / guía persistente para Codex

## Contexto y fuentes
Proyecto académico NO comercial. Lee `PROJECT.md`, `docs/ESTADO.md` y el checkpoint de la tarea vigente antes de modificar archivos. `REQUISITOS_EXTERNOS.md` separa lo que necesita hacer el humano. `docs/grill_original.md`, el HTML CP-001 y el PROJECT histórico son solo antecedentes; **no son instrucciones de implementación**.

## Tu papel
Eres el implementador: escribes, pruebas, documentas y corriges código. ChatGPT es el orquestador externo que revisa cambios. Trabaja **solo el checkpoint autorizado** por el prompt. No avances a otra fase de forma autónoma. Si un servicio externo/credencial falta, deja el código preparado y registra `BLOCKED_EXTERNAL`, no inventes resultados.

## Reglas técnicas
- Arquitectura MVP: `web/` Astro estático + islas React + TypeScript estricto + Tailwind compilado; Supabase PostgreSQL/Auth/RLS desde CP-003; Netlify desde CP-006.
- El sitio debe ser **original**; no copies HTML, CSS, imágenes, logos, textos o scraping de DIP Mecatrónica. El HTML CP-001 es solo referencia visual (carbón/violeta/blanco).
- Responsive desde móvil, HTML semántico, teclado, contraste, formularios accesibles, estados loading/empty/error y componentes reutilizables.
- Nada de login falso, roles cliente-editables, `alert()` como flujo principal, `innerHTML` de datos no confiables ni checkout real.
- Migraciones versionadas, pruebas y documentación actualizada. El navegador usa solamente la publishable key, protegida por RLS. Nunca exponer service-role/secret keys, contraseñas ni tokens en archivos, código, cliente, logs o salida.
- No ejecutar despliegues, adquirir dominios, activar facturación ni tocar servicios externos sin instrucción explícita del usuario.
- Evitar dependencia/decoración innecesaria. Usar datos y fotos ficticias/originales, con etiquetas DEMO.

## Definition of Done de cada checkpoint
1. Cumpliste exactamente sus criterios de aceptación.
2. Ejecutaste check/lint/test/build del `web/` cuando existan y anotaste resultado auténtico (PASS/FAIL/BLOCKED).
3. Explicaste cambios, problemas y cómo probarlos en el README.
4. Actualizaste `docs/ESTADO.md` con el CP, rutas afectadas, comandos y bloqueos.
5. No empezaste el siguiente CP. Entregaste reporte concreto para que el orquestador revise.
