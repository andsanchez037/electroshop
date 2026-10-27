# Electro Shop — Documento base del proyecto web

**Estado:** proyecto académico en definición (sin despliegue; prototipo anterior archivado)  
**Última actualización:** 26 de octubre de 2026  
**Nombre comercial:** Electro Shop  
**Cuenta de Instagram:** [@electroshopmzt](https://www.instagram.com/electroshopmzt/)  
**Giro:** venta de componentes electrónicos, refacciones, herramientas y reparación de aparatos electrónicos y eléctricos / electrodomésticos.

> Este documento registra el contexto conocido, las propuestas de arquitectura y los checkpoints. Los puntos señalados como **por definir** no deben tratarse como decisiones ya tomadas. Al 26/10/2026, la finalidad confirmada por el equipo es **académica / universitaria, no comercial**. Las funciones comerciales descritas abajo son una visión ampliable, no una autorización para transaccionar con datos reales.

## 0. Actualización del proyecto — 26 de octubre de 2026

- **Propósito vigente:** proyecto universitario / demostración técnica. No comercial, sin cobros reales y con datos de prueba.
- **Sitio de referencia funcional:** https://www.dipmecatronica.com/ (inspiración de arquitectura de información y UX: buscador por nombre o clave, categorías, filtros, vista del pedido; **no** copiar código, imágenes, textos ni identidad de terceros).
- **Marca y paleta del prototipo:** Electro Shop; fondo carbón `#121214`, acento violeta `#a855f7`, texto blanco. La paleta es una referencia de estilo, no un diseño final aprobado.
- **Hosting preferido:** Netlify. Despliegue inicial posible con subdominio gratuito `*.netlify.app`; el dominio propio es opcional para comenzar.
- **Base de datos:** por definir entre Supabase PostgreSQL (recomendación técnica) y Firebase Firestore (alternativa). No se ha creado una base de datos.
- **Arquitectura frontend candidata:** Astro + React (solo donde haga falta) + TypeScript + Tailwind CSS compilado. Aún no hay aplicación reconstruida en este stack.
- **Alcance recomendado para MVP académico:** home, catálogo público de muestra, búsqueda y filtros, detalle de producto, carrito/solicitud simulada, panel admin con autenticación real y CRUD de productos. Reparaciones por folio como segunda entrega, sujeto a tiempo disponible.
- **Checkout real, pagos, proveedores/dropshipping, envíos y facturación:** fuera del MVP académico.
- **Situación del HTML recibido:** se conserva como *checkpoint del prototipo generado con IA (vibecode)*; **no se toma como base de código para producción ni como implementación de seguridad/autenticación**.

### Checkpoint CP-001 — prototipo vibecode (26/10/2026)

- **Archivo inalterado:** `checkpoints/2026-10-26-vibecode/index_elec.html`.
- **Análisis/cuestionario original:** `docs/grill_original.md` (insumo, no especificación aprobada).
- **Lo rescatable:** colores, tono de marca e idea de las vistas públicas/catálogo/admin.
- **Deuda detectada:** login/roles simulados, datos solo en memoria, exportación Excel no implementada, errores de carrito y edición de cantidades, interpolación insegura de HTML, ausencia de accesibilidad y estructura de componentes.
- **Decisión:** archivar el prototipo y construir un proyecto limpio con control de versiones; usar sus pantallas únicamente como referencia.
- **Integridad del HTML archivado (SHA-256):** `f5cfb55e878d0a7d114b0a316cc9a0d53bababa30bcaea810d9f0b8588b8e0a2`.
- **Próximo checkpoint:** CP-002, estructura de proyecto y primer despliegue de home/catálogo ficticio en Netlify.

## 1. Identidad e información del negocio

Información observada en las referencias visuales compartidas:

- **Marca:** ELECTRO SHOP (el logotipo incorpora un rayo en la composición tipográfica).
- **Instagram:** `electroshopmzt`.
- **Ubicación publicada:** Avenida del Delfín 302, Infonavit Playas, Mazatlán, Sinaloa, México, C. P. 82128. **Verificar dirección y CP antes de publicar en el sitio.**
- **WhatsApp que aparece en el perfil:** [wa.me/526692455483](https://wa.me/526692455483). **Confirmar número antes de producción.**
- **Horario anunciado:** lunes a viernes de 10:00 a. m. a 6:00 p. m. **Confirmar si aplica a la tienda física y actualizar en caso necesario.**
- **Servicios anunciados:** reparación de aparatos electrónicos y eléctricos; venta de componentes electrónicos; diseño y armado de tableros eléctricos; herramientas y refacciones. Se observan anuncios de proyectos escolares y electrónicos.
- **Público objetivo sugerido:** consumidores que necesitan refacciones o reparaciones, estudiantes, aficionados a la electrónica y pequeños talleres.

## 2. Referencia de identidad visual

![Referencia visual de Instagram de Electro Shop](./referencia-visual.png)

- **Paleta observada:** negro/gris muy oscuro como fondo, morado eléctrico/violeta como acento principal, blanco para titulares. Pueden añadirse gradientes y brillo violeta de manera controlada.
- **Estilo:** tecnológico, energético, contraste alto, composiciones oscuras, títulos fuertes y acentos tipo rayo/neón.
- **Logotipo:** texto `ELECTRO` en violeta y `SHOP` en blanco, sobre fondo oscuro; rayo integrado al nombre. **Requiere obtener archivo original del logo (idealmente SVG o PNG transparente) para uso web**. La imagen de referencia es una captura, no el archivo vectorial del logo.
- **Dirección UX:** conservar el carácter de marca, pero dar prioridad a accesibilidad, legibilidad, rapidez y claridad comercial. No saturar toda la interfaz con efectos luminosos.
- **Archivos visuales disponibles:** `referencia-visual.png` (captura del perfil, publicaciones y marca). El usuario también mostró un recorte del logo en el chat.

## 3. Objetivo del proyecto

Visión ampliada del producto (no comprometida para la entrega universitaria): construir una aplicación web para Electro Shop que integre:

1. Catálogo y venta de componentes electrónicos y refacciones.
2. Productos con existencia propia, bajo pedido y/o enviados por proveedores externos (modelo parcialmente similar al dropshipping; **modalidad exacta por definir**).
3. Solicitud y seguimiento de reparaciones mediante folios.
4. Registro de clientes con cuenta y acceso a historial de compras, reparaciones y garantías.
5. Panel administrativo para gestionar productos, inventario, clientes, órdenes y servicios.

**Estrategia actual:** comenzar desarrollando y probando localmente, con despliegue de demo en Netlify y uso de datos ficticios. Priorizar capas gratuitas y posponer todo flujo comercial real.

## 4. Alcance funcional sugerido

### 4.1 Sitio público
- Inicio: propuesta de valor, categorías, reparaciones, ubicación, WhatsApp y llamados a la acción.
- Catálogo: categorías, filtros, búsqueda por nombre, SKU/modelo y disponibilidad.
- Página de producto: precio, fotografías, especificaciones, compatibilidad, existencia o pedido especial.
- Servicios: tipos de equipos atendidos, proceso de diagnóstico, solicitud de reparación.
- Contacto: WhatsApp, ubicación, horarios y redes sociales.
- SEO local y diseño responsive.

### 4.2 Portal de clientes
- Registro, inicio de sesión y recuperación de cuenta.
- Perfil y domicilios de entrega (cuando aplique).
- Historial de pedidos, pagos y estados de envío.
- Aparatos registrados, solicitudes de reparación y seguimiento por folio.
- Diagnósticos, cotizaciones autorizadas y garantías visibles al cliente.

### 4.3 Operación interna
- Roles: cliente, técnico, administrador.
- Administración de catálogo, categorías, precio y proveedores.
- Inventario con movimientos (entrada, venta, reserva, ajuste y uso en reparación).
- Registro de servicio presencial incluso si el cliente aún no creó cuenta.
- Estados sugeridos para reparación: recibido → diagnóstico → cotización → autorizado → reparación → pruebas → entregado (con cancelación/rechazo como rutas alternas).
- Fotografías del equipo, piezas utilizadas y notas internas no visibles al cliente.
- Ventas, órdenes de proveedor, garantías y reportes básicos.

## 5. Arquitectura candidata (NO confirmada)

### Opción recomendada para el piloto

| Capa | Tecnología candidata | Motivo |
| --- | --- | --- |
| Frontend | Astro + React + TypeScript | Páginas públicas rápidas + experiencia interactiva |
| Estilos | Tailwind CSS | Componentes y diseño responsivo |
| Desarrollo local | Git, Node.js, Docker, Supabase CLI | Probar web, auth y PostgreSQL antes de pagar hosting |
| Base de datos | PostgreSQL, gestionado con Supabase al desplegar | Modelo relacional útil para clientes, ventas y servicios |
| Autenticación | Supabase Auth | Cuentas y sesiones, con permisos RLS |
| Backend | Supabase Edge Functions / funciones seguras | Webhooks e integraciones sensibles |
| Hosting del piloto | Netlify (preferencia actual) | Despliegue desde GitHub sin VM propia; validar cuotas vigentes |
| Almacenamiento | Supabase Storage | Imágenes de productos y evidencia de servicio |
| Pagos futuros | Mercado Pago Checkout Pro | Evitar procesar datos de tarjeta directamente |
| Dominio | Opcional por ahora; por comprar | **Nombre exacto por definir**, Netlify permite comenzar con subdominio gratuito |

### Alternativa si se prioriza aprender backend e infraestructura AWS

Astro/React + **FastAPI (Python)** + PostgreSQL + Docker; desplegar posteriormente backend en infraestructura administrada o en AWS (p. ej., Lightsail/ECS), y frontend por separado. Esta alternativa incrementa control y trabajo de mantenimiento. **AWS + Firebase** es otra combinación considerada inicialmente, pero no está decidida.

**Decisión pendiente importante:** confirmar Supabase PostgreSQL vs Firebase Firestore antes de implementar modelos, autenticación y APIs. Astro/React y Netlify son preferencias actuales, no un despliegue ya realizado.

## 6. Modelo de datos inicial sugerido

Entidades y relaciones que deben diseñarse con migraciones versionadas:

- `profiles` — usuarios y roles (vinculados a proveedor de identidad).
- `products`, `categories`, `product_images`, `product_compatibility` — catálogo y compatibilidad de repuestos.
- `suppliers`, `inventory_movements` — abastecimiento y trazabilidad de existencias.
- `orders`, `order_items`, `payments`, `shipments` — operaciones comerciales.
- `appliances`, `repair_tickets`, `repair_events`, `repair_parts` — equipos y reparación.
- `warranties`, `addresses` — garantías y domicilios.

**Principios:**
- Mantener precios históricos en cada partida de pedido.
- Registrar movimientos de stock y evitar ventas simultáneas por encima de existencias.
- Autorizar por usuario y rol en el backend; con Supabase, usar Row Level Security.
- Separar notas internas y fotos privadas del contenido autorizado al cliente.
- No marcar pagos como realizados solamente por un callback del navegador; verificar webhooks en el servidor.
- Definir respaldo, recuperación y política de conservación de datos desde el piloto.

## 7. Fases propuestas

| Fase | Entregable | Objetivo |
| --- | --- | --- |
| 0. Definición | Requisitos, marca, wireframes y modelo de datos preliminar | Delimitar MVP |
| 1. Web pública | Home, servicios, catálogo de consulta, contacto y WhatsApp | Presentar el negocio online |
| 2. Clientes y reparaciones | Login, perfiles, folios, panel técnico y estado de reparación | Validar servicio al cliente |
| 3. E-commerce | Carrito, pedidos, stock, pagos y envíos | Habilitar ventas online |
| 4. Escalamiento | Integraciones de proveedores, notificaciones, reportes y automatización | Optimizar operación |

Para el proyecto universitario se usará un catálogo pequeño y pedidos/reparaciones simulados con datos ficticios. No se contempla pasar a datos de clientes o pagos reales durante el MVP académico.

## 8. Estrategia de desarrollo y despliegue

1. Crear repositorio Git privado o público **sin secretos ni datos de clientes**.
2. Configurar Astro/React/TypeScript y convenciones de código.
3. Levantar PostgreSQL y servicios de backend de prueba con Docker/Supabase CLI, si se elige esa arquitectura.
4. Guardar esquemas y cambios de BD en migraciones SQL versionadas.
5. Separar `.env.local`, configuración de pruebas y credenciales de producción. Mantener `.env.example` sin secretos.
6. Construir y probar flujos end-to-end con datos ficticios en localhost.
7. Publicar una versión de staging en la nube antes de habilitar pedidos y usuarios reales.
8. Para la demo: verificar HTTPS, protección de roles, reglas RLS, respaldos/exportación, y uso de datos ficticios. Dominio y pagos reales solo si el proyecto evoluciona fuera del contexto académico.

## 9. Costos y restricciones

- **Objetivo inicial:** aprovechar planes gratuitos y desarrollo local; no asumir que una VM AWS se mantendrá gratis indefinidamente.
- **Costos potenciales:** dominio (renovable, opcional para la demo) y eventuales excesos de planes cloud. Comisiones de pago y correo transaccional solo en una hipotética versión comercial futura.
- **Pendiente:** investigar y confirmar precios/cuotas vigentes al momento de contratar; los planes gratuitos y sus límites cambian.

## 10. Seguridad, privacidad y cumplimiento

- HTTPS obligatorio en producción.
- Control de acceso por registro y rol; MFA para administradores.
- Políticas de acceso a fotos, direcciones, números telefónicos y órdenes.
- Datos de tarjeta **no** almacenados en la aplicación.
- Aviso de privacidad, condiciones de compra, envíos, garantías, cancelaciones y devoluciones adecuados para México.
- Copias de seguridad con pruebas de restauración.
- Bitácora de cambios sensibles de reparaciones y órdenes.

## 11. Preguntas abiertas

- ¿Cuál será el dominio y cuáles redes sociales se enlazarán oficialmente?
- ¿Cuántos productos iniciales y qué categorías exactas manejará la tienda?
- ¿Qué porcentaje será inventario propio, bajo pedido o entregado por terceros?
- ¿Habrá envíos nacionales, recolección en tienda o solamente ventas locales al inicio?
- ¿Cuáles electrodomésticos y tipos de reparación se aceptan?
- ¿Quiénes operarán el panel y qué permisos necesita cada rol?
- Para una versión comercial futura (no MVP): ¿qué métodos de pago, facturación y paquetería se utilizarían?
- ¿Se selecciona Supabase PostgreSQL o Firebase Firestore para la demostración? ¿Se desea FastAPI como objetivo de aprendizaje posterior?
- ¿Hay archivos editables del logo, manual de marca, tipografías e imágenes de productos?

## 12. Referencias entregadas

- Captura visual de Instagram de Electro Shop con publicaciones y datos del perfil.
- Imagen del logo compartida visualmente en el chat; solicitar original para incorporarlo como archivo independiente.
- Conversación de planificación: piloto comercial, cuentas y compras, historial de reparación, desarrollo local primero y despliegue posterior.

---

**Criterio de mantenimiento del documento:** actualizar fechas y decisiones cada vez que se confirme un requisito. Conservar propuestas y supuestos como tales, sin confundirlos con hechos confirmados del negocio. Cada checkpoint debe incluir fecha, alcance, limitaciones, archivos y siguiente paso.
