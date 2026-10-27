export const categories = [
  { id: 'componentes', name: 'Componentes', mark: '01', description: 'Pequeñas piezas, grandes posibilidades.' },
  { id: 'desarrollo', name: 'Desarrollo', mark: '02', description: 'Del primer circuito al siguiente prototipo.' },
  { id: 'herramientas', name: 'Herramientas', mark: '03', description: 'Mide, conecta y construye con precisión.' },
  { id: 'energia', name: 'Energía', mark: '04', description: 'El punto de partida de tus proyectos.' },
] as const;

export type CategoryId = typeof categories[number]['id'];
export interface Product {
  readonly sku: string;
  readonly name: string;
  readonly category: CategoryId;
  readonly description: string;
  readonly price_cents: number;
  readonly stock_demo: number;
}

export const products: readonly Product[] = [
  { sku: 'ES-C001', name: 'Kit de resistencias 220 Ω', category: 'componentes', description: 'Un conjunto ficticio de 20 resistencias para explorar divisores de voltaje en prácticas académicas.', price_cents: 3500, stock_demo: 24 },
  { sku: 'ES-C002', name: 'LED violeta · 10 piezas', category: 'componentes', description: 'Indicadores de 5 mm para experimentar con señales luminosas. Especificaciones ilustrativas.', price_cents: 2800, stock_demo: 18 },
  { sku: 'ES-C003', name: 'Capacitor cerámico · kit', category: 'componentes', description: 'Selección demo de capacitores para estudiar filtrado y temporización en circuitos sencillos.', price_cents: 4200, stock_demo: 0 },
  { sku: 'ES-C004', name: 'Pulsadores de práctica', category: 'componentes', description: 'Diez pulsadores ficticios de montaje para ejercicios de entradas digitales.', price_cents: 3200, stock_demo: 12 },
  { sku: 'ES-D001', name: 'Placa de desarrollo Nova', category: 'desarrollo', description: 'Placa ficticia para imaginar proyectos con entradas y salidas digitales. No representa un modelo comercial.', price_cents: 24900, stock_demo: 8 },
  { sku: 'ES-D002', name: 'Protoboard de laboratorio', category: 'desarrollo', description: 'Base demo de 400 puntos para planear conexiones sin soldadura en el aula.', price_cents: 7900, stock_demo: 20 },
  { sku: 'ES-D003', name: 'Cables puente · 40 piezas', category: 'desarrollo', description: 'Juego ficticio de cables para distribuir conexiones en montajes de aprendizaje.', price_cents: 5900, stock_demo: 15 },
  { sku: 'ES-D004', name: 'Sensor de luz Aurora', category: 'desarrollo', description: 'Módulo conceptual para explorar lecturas de iluminación y automatización educativa.', price_cents: 8900, stock_demo: 0 },
  { sku: 'ES-H001', name: 'Multímetro de práctica', category: 'herramientas', description: 'Instrumento ficticio para presentar mediciones básicas. No usar estos datos como guía de seguridad eléctrica.', price_cents: 31900, stock_demo: 6 },
  { sku: 'ES-H002', name: 'Pinza de corte fino', category: 'herramientas', description: 'Herramienta demo para ilustrar el equipamiento de una mesa de prototipado.', price_cents: 11900, stock_demo: 9 },
  { sku: 'ES-H003', name: 'Soporte de soldadura', category: 'herramientas', description: 'Soporte conceptual de banco para organizar prácticas supervisadas de montaje.', price_cents: 15900, stock_demo: 4 },
  { sku: 'ES-H004', name: 'Destornilladores de precisión', category: 'herramientas', description: 'Estuche ficticio de seis puntas para proyectos de electrónica educativa.', price_cents: 17900, stock_demo: 0 },
  { sku: 'ES-E001', name: 'Fuente de banco Mini', category: 'energia', description: 'Fuente conceptual para maquetas de laboratorio. Datos de demostración, sin certificación ni uso real.', price_cents: 64900, stock_demo: 3 },
  { sku: 'ES-E002', name: 'Portapilas de práctica', category: 'energia', description: 'Soporte ficticio para dos pilas AA destinado a ejemplos de alimentación portátil.', price_cents: 2500, stock_demo: 30 },
  { sku: 'ES-E003', name: 'Módulo regulador Delta', category: 'energia', description: 'Módulo conceptual para estudiar regulación de tensión en proyectos de clase.', price_cents: 6900, stock_demo: 11 },
  { sku: 'ES-E004', name: 'Cable de alimentación USB', category: 'energia', description: 'Cable demo de un metro para representar conexiones de alimentación de baja tensión.', price_cents: 4900, stock_demo: 16 },
];

export const normalize = (value: string) => value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-MX');
export const findProduct = (sku: string | null) => products.find(product => normalize(product.sku) === normalize(sku ?? ''));
export function filterProducts(source: readonly Product[], query = '', category = '', available = false) {
  const search = normalize(query);
  return source.filter(product => (!search || normalize(`${product.name} ${product.sku}`).includes(search))
    && (!category || product.category === category) && (!available || product.stock_demo > 0));
}
export const formatPrice = (cents: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);
export const productUrl = (sku: string) => `/producto?sku=${encodeURIComponent(sku)}`;

// CP-002: acceso local aislado para poder sustituirlo en un checkpoint posterior.
export async function loadProducts(): Promise<readonly Product[]> { return products; }
