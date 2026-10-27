# Electro Shop · demo universitaria

CP-002: Astro estático + islas React + TypeScript estricto + Tailwind compilado. Inicio, catálogo con 16 productos ficticios en cuatro categorías y ficha por SKU. **DEMO / NO ES UNA COMPRA REAL.**

## Ejecutar en Windows / VS Code

Requisitos: Node >=22.23.4 (verificado con 24.6.0), npm y Git. Abre la raíz del repositorio en VS Code:

```powershell
cd web
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1
```

Abre http://127.0.0.1:4321. `npm.cmd` evita el bloqueo de npm.ps1 sin cambiar la política de PowerShell. En otras terminales puedes usar npm. Para reproducir exactamente el lockfile usa `npm.cmd ci`. Para revisar salida estática usa `npm.cmd run build` y `npm.cmd run preview -- --host 127.0.0.1`.

## Prueba visual

| Ruta | Comprobar |
| --- | --- |
| `/` | Buscador, categorías y cuatro destacados con enlaces funcionales |
| `/catalogo` | 16 productos; búsqueda, categoría y disponibilidad combinables; limpiar |
| `/catalogo?q=es-d001` | Un resultado sin distinguir mayúsculas |
| `/catalogo?categoria=energia` | Cuatro productos de Energía |
| `/producto?sku=ES-D001` | Descripción, precio MXN, SKU, 8 unidades demo, cantidad |
| `/producto?sku=ES-C003` | Sin stock demo, cantidad deshabilitada |
| `/producto?sku=INVALIDO` | Producto no encontrado y enlace para volver |
| `/acerca` | Alcance y límites |
| `/no-existe` | Página 404 |

Prueba a 360 px y en escritorio. Usa Tab: el primer enlace permite saltar al contenido. Busca con Enter y recorre filtros y enlaces. Escribe `inexistente` para ver cero resultados y limpia filtros. Recarga una ficha para comprobar el SKU. Los filtros son locales a la vista; al recargar se inicializan desde la URL de entrada.

## Calidad y evidencia

Desde web:

```powershell
npm.cmd run check
npm.cmd run lint
npm.cmd run test
npm.cmd run build
npm.cmd run smoke
npm.cmd audit --json
```

Vitest prueba integridad del dataset, centavos, SKU, búsqueda normalizada, filtros combinados, carga, vacío, error/reintento y fichas. Testing Library comprueba interacción. Axe en jsdom valida reglas de accesibilidad salvo contraste, que requiere layout real.

El smoke adicional usa Playwright Core y **Microsoft Edge instalado**, sin descargar navegadores. Ejecuta primero el build. Inicia su servidor estático en 127.0.0.1:4322, revisa cuatro rutas a 360/1440 px, desbordamiento, axe con contraste, búsqueda desde header, filtros, recarga por SKU, salto por teclado, 404 y errores JS. Guarda ocho capturas en `docs/evidencia/CP-002/` y cierra navegador/servidor. Sin Edge, ese smoke requiere instalarlo o adaptar el canal; las pruebas unitarias no requieren navegador.

Resultados auténticos e incidencias: [docs/ESTADO.md](docs/ESTADO.md). Las pruebas automáticas no sustituyen revisión humana con teclado y lector de pantalla.

## Archivos y decisiones

- `web/src/pages/`: Astro estático; inicio, catálogo, producto por query SKU, acerca y 404.
- `web/src/layouts/Layout.astro`: HTML en español, metadatos, header con buscador GET, navegación, skip link y footer.
- `web/src/components/`: catálogo/detalle React hidratados, tarjetas e ilustraciones reutilizables; destacados del inicio renderizados estáticamente.
- `web/src/data/catalog.ts`: contrato tipado, 16 productos, cuatro categorías, precios enteros en centavos y adaptador local pequeño `loadProducts`.
- `web/src/styles/global.css`: Tailwind compilado mediante Vite y estilos originales responsive; sin CDN, fuentes ni imágenes remotas.
- `web/scripts/smoke.mjs`: navegador y evidencia reproducible.
- `web/*config*`, `web/package.json`, `web/package-lock.json`: configuración y dependencias reproducibles. Testing Library, jsdom, axe y Playwright Core se usan solo para verificación.

Carrito reservado para CP-005: botón deshabilitado con explicación; no guarda selección ni pedido. Cantidad únicamente de referencia. Sin persistencia, login, admin simulado, Supabase, Firebase ni despliegue. CP-002 no necesita variables de entorno. Sin datos personales, contactos operativos ni assets de DIP Mecatrónica. Wordmark temporal e ilustraciones SVG propias por categoría; no son fotografías de cada producto.

La ficha estática genérica resuelve el SKU al hidratar: requiere JavaScript y ofrece aviso si está desactivado. Actualiza el título en navegador; metadatos sociales genéricos, sin URL canónica hasta disponer de dominio autorizado. Catálogo con carga, vacío y error/reintento sin retrasos artificiales.

## Revisión

[PROJECT.md](PROJECT.md) es la especificación vigente. Lee también [AGENTS.md](AGENTS.md), [docs/CODEX_START.md](docs/CODEX_START.md) y [REQUISITOS_EXTERNOS.md](REQUISITOS_EXTERNOS.md). CP-001 queda intacto; su mención de preview no autoriza despliegue en CP-002.

Rama `cp-002-foundation`. No se hace push, PR ni publicación. Remoto existente sin contactar. Comparte la rama/diff/capturas con el orquestador. CP-003 requiere aprobación explícita antes de iniciar Supabase.
