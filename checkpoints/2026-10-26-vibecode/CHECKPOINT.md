# CP-001 — prototipo vibecode

**Fecha:** 2026-10-26  
**Estado:** archivado, no funcional como web pública real.  
**Origen:** `index_elec.html` recibido del equipo, guardado sin modificaciones.  
**SHA-256:** `f5cfb55e878d0a7d114b0a316cc9a0d53bababa30bcaea810d9f0b8588b8e0a2`  

## Qué representa
Una maqueta HTML/JavaScript con paleta carbón/morado, pantallas de inicio, catálogo, cotizaciones e inventario. Sirve para recordar la iteración y las ideas de interfaz.

## Hallazgos comprobados
- `simulateAdminLogin` otorga rol desde el navegador sin contraseña ni autorización.
- `products` y `savedQuotes` son arrays de JavaScript y se pierden tras recargar.
- `addToCart` crea elementos sin `id`, lo que hace que al añadir el mismo producto no siempre se incremente la línea correcta.
- El control de cantidad de cotizaciones edita `items[index].value`, aunque el total lee `qty`.
- El botón de Excel ejecuta un `alert`, no exporta datos.
- Se emplea el script `@tailwindcss/browser@4` y `innerHTML` con contenido interpolado.

## Decisión
**No usar este HTML como la aplicación base**. Conservarlo como referencia de la paleta y de algunos flujos, construir estructura limpia versionada desde cero.

## Próximo checkpoint
CP-002: repositorio nuevo, proyecto Astro, home y catálogo público responsivos, primer preview en Netlify.
