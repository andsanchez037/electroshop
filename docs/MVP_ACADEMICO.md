# MVP académico de Electro Shop — propuesta inicial

**Fecha:** 2026-10-26  
**Estado:** borrador para el equipo; no es requisito ya aprobado.

## Objetivo
Mostrar un catálogo electrónico tipo DIP Mecatrónica con búsqueda por nombre/SKU, categorías y carrito sin pagos reales, y demostrar una operación CRUD segura para administración. No clonar identidad ni contenidos de la página de referencia.

## Primera entrega (MVP)
- **Inicio:** navegación clara, buscador visible, acceso a catálogo y diseño responsive con paleta Electro Shop.
- **Catálogo:** 12–20 productos ficticios con SKU único, nombre, categoría, precio público de demostración, imagen o placeholder, disponibilidad y descripción.
- **Exploración:** búsqueda por nombre/SKU, filtros por categoría y disponibilidad, ficha de detalle.
- **Pedido simulado:** cantidades, carrito persistente durante la sesión y confirmación que indique explícitamente que no es compra real; guardar solicitud demo opcional en base de datos.
- **Administración:** un administrador de prueba autenticado, listado y CRUD de productos; permisos comprobados en la capa de datos, no solo en los botones.
- **Calidad:** diseño móvil/escritorio, accesibilidad básica, validación de formularios, estados de error/carga/vacío, README e instrucciones de ejecución.

## Segunda entrega (si hay tiempo)
- **Reparaciones:** tickets con folio, estado y consulta por usuario autenticado.
- **Usuarios:** registro/login de clientes demo, perfil e historial de solicitudes simuladas.

## Fuera de alcance académico
- Cobros/Stripe/Mercado Pago reales, datos de tarjetas, envíos, integración con proveedores, facturación, stock físico y WhatsApp productivo.
- Tarifas mayoristas y cuentas de distribuidores, salvo que el equipo decida explícitamente que son parte del objetivo.

## Stack propuesto
- Astro + React/TypeScript + Tailwind compilado para vistas públicas e interacción.
- Netlify para deploy desde GitHub (subdominio gratuito primero).
- Supabase PostgreSQL + Auth + Storage como opción preferida por relaciones entre productos, inventario, solicitudes y reparaciones.
- Firebase Auth + Firestore como alternativa si se prioriza NoSQL. **Cloud Storage for Firebase requiere Blaze (facturación) en 2026**, aunque tenga un tramo sin costo.

## Tablas iniciales orientativas (si se elige SQL)
- `categories (id, name, slug)`
- `products (id, sku UNIQUE, name, description, price_demo, stock_demo, category_id, is_active)`
- `profiles (user_id, role)`
- `quote_requests (id, requester_user_id, status, notes, created_at)`
- `quote_items (id, quote_id, product_id, quantity, unit_price_snapshot)`
- Fase 2: `repair_tickets (id, owner_user_id, folio, status, created_at)`

**Seguridad:** políticas RLS explícitas; solo admin escribe productos; visitantes pueden leer productos publicados; verificar que una cuenta normal no pueda acceder/escribir filas de otros. No confiar en `role` recibido del cliente. No subir service-role keys ni secretos al frontend.

## Criterios de aceptación
- Se puede buscar por SKU y filtrar sin refrescar toda la página.
- Un usuario visitante puede ver catálogo y crear un carrito de simulación.
- Un administrador autenticado puede crear, editar y desactivar productos.
- Un visitante o usuario sin privilegios no puede modificar productos mediante API/direct access.
- La información persiste entre navegadores si se conectó la base de datos (no solo variables JS).
- La demo funciona en escritorio y móvil y está desplegada desde la rama principal del repositorio.
- Ninguna acción presenta un pedido ficticio como compra real.

## Decisiones del equipo que todavía hacen falta
1. Alcance de entrega: ¿solo catálogo + admin o también reparaciones por folio?
2. ¿El catálogo público debe mostrar precio? (DIP sí muestra precio al público.)
3. ¿Es obligatorio tener cuentas de cliente en la entrega o bastará login de admin?
4. ¿Supabase PostgreSQL o Firebase Firestore? (preferencia técnica: Supabase.)
5. ¿Se usarán imágenes/logo autorizados para el proyecto?
