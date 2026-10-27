# 📊 Análisis de Referencia y Grill-Me Técnico: Electro Shop

## Part I: Análisis de Referencia — DIP Mecatrónica (`dipmecatronica.com`)

### 1. Idea General del Negocio
DIP Mecatrónica es un e-commerce especializado B2C/B2B de componentes electrónicos, semiconductores, robótica, sensores y herramientas. Se orienta a estudiantes, makers, ingenieros y talleres de reparación.
* **Modelos de Venta:** Catálogo directo con existencias en tiempo real, desglose de claves/SKUs, precios con IVA incluido y aviso explícito de próximos arribos de mercancía (*"Próximo arribo: X fecha / Y piezas"*).
* **Propuesta de Valor:** Claridad de stock inmediato, precios accesibles, búsqueda directa por número de parte o clave interna, y atención prioritaria vía WhatsApp para cotizaciones o dudas.

### 2. Estilo Visual y Layout
* **Estructura Dinámica:** Header con buscador omnipresente, menú desplegable multitarea por categorías (Componentes, Módulos, Sensores, etc.) y panel lateral o emergente de "Mi Pedido".
* **Fichas de Producto Claras:** Presentación limpia en rejilla (Grid) que resalta:
  - Fotografía técnica del componente.
  - Nombre exacto + Clave interna de almacén.
  - Precio ($MXN) y estado de existencias (*Stock exacto* vs *Últimas piezas* vs *Próximo arribo*).
  - Selector de cantidad rápido con botón directo `+ Agregar`.
* **Identidad Visual:** Tonos limpios y neutros para no distraer la lectura de códigos de parte técnicos, combinados con badges informativos de colores (verde para disponibilidad, amarillo para pocas piezas, púrpura/azul para acciones).

---

## Part II: Grill-Me (Cuestionario de Definición Técnica para el Desarrollador)

El objetivo de este *Grill-Me* es definir el alcance exacto con tu desarrollador antes de escribir más código, asegurando que la arquitectura, el backend y el frontend queden alineados a tus necesidades de negocio.

### 1. Arquitectura y Stack Tecnológico
* **A1.** ¿Mantendremos la solución en una estructura ligera (HTML5 + Tailwind CSS + JS Vanilla) o migraremos a un framework como React/Vue o un CMS e-commerce (WooCommerce, Shopify, Strapi)?
* **A2.** ¿En qué servidor o servicio de Hosting planeas alojar la plataforma (Vercel, Netlify, Hostinger, AWS)?
* **A3.** ¿Cómo sincronizaremos las imágenes del logotipo (`logo.png`) y los productos para asegurar carga rápida en dispositivos móviles?

### 2. Gestión de Precios, Perfiles y Roles (Público vs. Taller/Proveedor)
* **B1.** En el simulador actual usamos un botón para alternar entre *Modo Público* y *Modo Taller*. ¿Cómo autenticaremos formalmente a los talleres? (¿Login con usuario/contraseña, validación de RFC/Cédula, o token asignado manualmente desde Admin?).
* **B2.** ¿Los precios de taller serán un porcentaje fijo de descuento (ej. 15% general) o cada producto tendrá su precio lista y precio taller asignado manualmente en la base de datos?
* **B3.** ¿El cliente público podrá ver los precios de taller tachados como incentivo de registro o deben permanecer 100% ocultos?

### 3. Manejo de Inventario y Almacén
* **C1.** ¿Los datos de existencia provendrán de un sistema ERP/Punto de Venta existente (Aspel, CONTPAQi, Elephant, etc.) o construiremos un panel de control propio para modificar existencias?
* **C2.** ¿Qué sucede si un usuario solicita más piezas de las disponibles en el stock? (¿Permitir cotizar sobre pedido como en DIP Mecatrónica o bloquear el botón agregador?).
* **C3.** ¿Deseamos implementar la alerta de *"Próximo Arribo"* cuando un producto se agote?

### 4. Flujo de Cotizaciones, Pedidos y WhatsApp
* **D1.** Al momento de enviar la cotización por WhatsApp, ¿el sistema debe guardar el pedido en una Base de Datos SQL/NoSQL o basta con almacenarlo en el `localStorage` / Panel Admin local por ahora?
* **D2.** ¿Se requerirá generación automática de archivos PDF o Excel con el desglose formal de la cotización para el cliente final?
* **D3.** ¿Cuáles son los números de atención de WhatsApp oficial para configurar los enlaces automáticos?

### 5. Estética, Experiencia de Usuario (UX) y Móvil
* **E1.** Tomando en cuenta que adaptamos la paleta de colores oficial de **Electro Shop** (Negro carbón `#121214` + Morado eléctrico `#a855f7` + Blanco), ¿el logotipo `logo.png` transparente requiere un contenedor especial o banner en la versión móvil?
* **E2.** ¿Es prioritario agregar un filtro de búsqueda por categorías (Módulos, Capacitores, Herramientas) idéntico al de DIP Mecatrónica?
* **E3.** ¿Involucraremos pasarela de pago directa (Stripe/MercadoPago) a futuro o nos mantendremos 100% como canal de cotización y venta asistida por WhatsApp?

---

### 📝 Instrucciones de uso para el desarrollador
1. Revisa los puntos de la **Parte I** para tomar como referencia el acomodo del catálogo de DIP Mecatrónica.
2. Contesta las preguntas de la **Parte II** en conjunto con el dueño del proyecto para definir el alcance de la versión 1.0 (MVP) y las versiones futuras.