# CP-005 — carrito y pedido DEMO

CP-005 recibió aprobación técnica independiente en LOCAL el 21 de noviembre de 2026. La implementación aprobada es `d0aeb99efd964775fe59164f7416d378ba24b01a` en `cp-005-cart-checkout`. El patch revisado conserva el rango desde `7488efe00959e233d25234c409eafe112ef7073d` hasta ese commit. Integración a main y publicación pendientes.

El commit inicial `ef8b3d4d207706bbbedb246cef823d88f5581a54` implementó el carrito y el pedido DEMO. La corrección posterior valida la cantidad mostrada antes de eliminar una línea. Su regresión con dos stores confirma que una eliminación obsoleta conserva la selección más reciente. También se corrigió el estado de aprobación local de CP-004 en PROJECT y ESTADO.

## Implementación

- El catálogo y la ficha aceptan una cantidad y agregan por SKU canónico. Las tarjetas de destacados estáticos del inicio enlazan a la ficha. El encabezado y las vistas se suscriben al mismo store con `useSyncExternalStore`.
- La clave `electroshop-cart` contiene la versión 1 y pares SKU/cantidad. La lectura verifica tamaño, forma, versión, cantidad entera y unicidad. Se aceptan hasta 50 SKU y se informa cuando se omiten entradas inválidas. Web Locks serializa cambios cuando está disponible, y los eventos de storage sincronizan pestañas. Las acciones que usan una selección revisada comprueban que siga vigente.
- `/carrito` consulta el catálogo configurado, muestra ilustraciones originales, precio actual, existencias, cantidad y subtotal por línea. Los productos ausentes o con stock insuficiente requieren ajuste o eliminación. Un error de catálogo conserva la selección y permite reintentar. Supabase nunca cambia a datos DEMO por un fallo.
- `/checkout` tiene tres pasos. Primero revisa el carrito. Luego elige recogida gratis o envío estándar ficticio de $99.00 MXN y valida datos de ejemplo en memoria. Por último presenta la selección, el destinatario de ejemplo, el método, el costo y el total antes de **Confirmar pedido DEMO**.
- La confirmación pide una lectura fresca al adaptador activo. Si cambió el precio, bajó el stock respecto a la revisión o cambió la selección, se vuelve a pedir revisión. Un fallo de red deja el carrito disponible. Los cálculos usan enteros `bigint` en centavos y muestran dos decimales en MXN.
- Un flujo confirmado vacía el carrito y muestra un comprobante temporal con referencia UUID criptográfica de navegador, fecha/hora, líneas, entrega y total. La referencia es DEMO. Al recargar o entrar directamente no se fabrica un comprobante.

## Privacidad y límites de la demostración

- Los formularios solicitan únicamente datos ficticios. La aplicación conserva contacto y domicilio en estado React, los descarta al salir o confirmar y nunca los usa en solicitudes de red, URLs o storage. El comprobante temporal excluye contacto y domicilio.
- El pedido y la entrega se simulan en pantalla. La referencia solo identifica el comprobante temporal de la demo. El flujo no crea pedidos reales, pagos ni registros de entrega. El único acceso a Supabase desde el flujo es la lectura anónima del catálogo. El panel Auth y su RLS, migraciones y RPC se mantienen en su alcance previo.
- La selección es por navegador y origen. Si el navegador bloquea storage, el carrito funciona en la página actual y puede perderse al navegar o recargar. Sin Web Locks se relee storage en cada mutación, pero dos escrituras realmente simultáneas pueden quedar en el orden en que las aplica el navegador. No se sincroniza entre dispositivos.
- El precio anterior a la carga no se guarda. La comparación de precios y stock histórico comienza con el resumen revisado. El catálogo puede cambiar después de la última lectura, ya que el flujo DEMO no reserva inventario.
- La comprobación visual y accesible usa Edge automatizado, 360 y 1440 px. Quedan revisión externa en dispositivo físico y lector de pantalla, y autorización separada para publicación.

## Archivos del cambio

| Rutas | Alcance |
| --- | --- |
| `PROJECT.md`, `README.md`, `docs/ESTADO.md`, `docs/CP005_HANDOFF.md` | Estado, instrucciones y evidencia |
| `web/src/pages/carrito.astro`, `web/src/pages/checkout.astro`, `web/src/pages/acerca.astro`, `web/src/layouts/Layout.astro` | Rutas, alcance de la demo y contador global |
| `web/src/components/Catalog.tsx`, `web/src/components/ProductCard.tsx`, `web/src/components/ProductDetail.tsx` | Alta integrada en catálogo y ficha |
| `web/src/components/cart/CartControls.tsx`, `CartContent.tsx`, `CartPage.tsx`, `Checkout.tsx` en el mismo directorio | Controles, líneas, resumen, carrito y simulación |
| `web/src/data/cart.ts`, `web/src/data/cart-store.ts`, `web/src/data/catalog-source.ts` | Validación, centavos, store y lecturas frescas |
| `web/src/styles/global.css`, `web/src/styles/shopping.css` | Estilos compartidos y del flujo |
| `web/src/components/catalog-ui.test.tsx`, `web/src/components/cart/checkout-ui.test.tsx`, `web/src/data/cart.test.ts` | Pruebas de catálogo, carrito y confirmación |
| `web/scripts/smoke.mjs`, `web/scripts/shopping-smoke.mjs` | Regresión Edge y recorrido de compra |

## Reproducción y publicación

Ejecutar desde `web` en una copia de prueba. El navegador Edge y el puerto 4322 se usan para el smoke. El modo Supabase requiere una instancia desechable local, migraciones existentes, 16 productos DEMO y las variables públicas del catálogo local inyectadas al build. Los smoke de Auth usan 4323 y 4324.

```powershell
npm.cmd run check
npm.cmd run lint
npm.cmd test
npm.cmd run seed:check
npm.cmd run build
npm.cmd run smoke
# Tras construir con las variables públicas del stack desechable en loopback:
npm.cmd run smoke -- --supabase-local
npm.cmd run test:db
npm.cmd run test:admin:local
npm.cmd run test:admin:browser
```

La publicación requiere aprobación separada, HTTPS y build estático de `web` a `dist` con Node compatible con el proyecto. Si se elige Supabase, usar la configuración pública existente con RLS vigente. Antes de una publicación que incluya administración, completar los prerrequisitos externos de CP-004. No se añaden variables de CP-005, tablas de pedidos, funciones ni ajustes de Netlify.

## Resultados locales de la implementación original

| Comando | Resultado |
| --- | --- |
| `npm.cmd run check` | PASS, 49 archivos con cero errores, warnings o hints |
| `npm.cmd run lint` | PASS |
| `npm.cmd test` | PASS, 79/79 en 10 archivos. Incluye las regresiones de CP-004 |
| `npm.cmd run seed:check` | PASS, 16 productos reproducibles |
| `npm.cmd run build` | PASS en DEMO y Supabase local, ocho rutas estáticas |
| `npm.cmd run smoke` | PASS, navegación previa y recorrido completo a 360/1440 px en Edge, modo DEMO |
| `npm.cmd run smoke -- --supabase-local` | PASS a 360/1440 px con consultas reales a PostgREST local |
| `npm.cmd run test:db` | PASS, 69/69 en pg_prove y TAP independiente |
| `npm.cmd run test:admin:local` | PASS, GoTrue, CRUD y REST/RLS reales, restauración de sesión, revocación y fixtures eliminados |
| `npm.cmd run test:admin:browser` | PASS, Edge y SDK real con API sintética, regresiones de sesión en dos pestañas |

El recorrido Edge cubrió agregar desde catálogo y ficha, doble clic, recarga, cambio en otra pestaña, ajuste de stock, incrementos, decrementos, cancelar el vaciado, entrega a 360 px y recogida a 1440 px. También comprobó validación, total, comprobante único y vaciado. Axe se ejecutó en el carrito, el formulario y el comprobante. Se verificaron consola, ausencia de datos de entrega en storage y red limitada a lectura de recursos y del catálogo. Vitest simuló cambios de precio y disponibilidad durante la confirmación.

Docker Desktop Linux 29.9.2 y Supabase CLI 3.0.0 usaron el stack desechable ya migrado. Los recuentos finales fueron 4 categorías, 16 productos y cero usuarios, identidades, membresías o sesiones. Se detuvo el stack y se conservó el volumen. Las capturas de la regresión pública se produjeron solo en la copia aislada. Los primeros smoke detectaron y permitieron corregir el nombre accesible del contador y la jerarquía de encabezados. Tras una falla intermedia de resolución de dependencias, se repusieron dos archivos auxiliares que faltaban en la copia temporal y se repitieron check, lint y Vitest sobre el mismo código.

## Verificación final de la corrección aprobada

Sobre `d0aeb99` pasaron `npm.cmd run check` con cero diagnósticos, `npm.cmd run lint`, `npm.cmd run test` con **80/80** pruebas en diez archivos, `npm.cmd run seed:check`, `npm.cmd run build` y `npm.cmd run smoke` en Edge DEMO a 360/1440 px. Supabase local, pgTAP y Auth quedaron respaldados por la ejecución anterior de la implementación original. El cierre documental reutiliza la evidencia y conserva el patch revisado. [Checkpoint de continuidad](CP005_CHECKPOINT.md)
