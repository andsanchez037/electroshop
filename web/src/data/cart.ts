import type { Product } from './catalog';

export interface CartLine { sku: string; quantity: number }
export type CartIssue = 'missing' | 'stock';
export type ReviewedLine = CartLine & (
  { product: undefined; issue: 'missing' } | { product: Product; issue?: 'stock' }
);
export const CART_KEY = 'electroshop-cart';
export const CART_LIMIT = 50;
const MAX_QUANTITY = 2147483647;
const validSku = (sku: unknown): sku is string => typeof sku === 'string' && /^[A-Z0-9][A-Z0-9-]{0,49}$/.test(sku);
export const validQuantity = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= MAX_QUANTITY;
export const parseQuantity = (value: string) => /^\d+$/.test(value) ? Number(value) : NaN;

export function readCart(raw: string | null): { lines: readonly CartLine[]; repaired: boolean } {
  if (raw === null) return { lines: [], repaired: false };
  // The largest supported payload fits easily within 8 KiB.
  if (raw.length > 8192) return { lines: [], repaired: true };
  try {
    const saved: { version?: unknown; lines?: unknown } = JSON.parse(raw);
    if (saved?.version !== 1 || !Array.isArray(saved.lines)) return { lines: [], repaired: true };
    const lines: CartLine[] = [];
    const used = new Set<string>();
    for (const line of saved.lines) {
      if (lines.length >= CART_LIMIT) break;
      if (!validSku(line?.sku) || !validQuantity(line?.quantity) || used.has(line.sku)) continue;
      used.add(line.sku);
      lines.push({ sku: line.sku, quantity: line.quantity });
    }
    return { lines, repaired: lines.length !== saved.lines.length };
  } catch {
    return { lines: [], repaired: true };
  }
}

export const cartSignature = (lines: readonly CartLine[]) => JSON.stringify(lines);
export const itemCount = (lines: readonly CartLine[]) => lines.reduce((total, line) => total + line.quantity, 0);
export const encodeCart = (lines: readonly CartLine[]) => JSON.stringify({ version: 1, lines });

export function changeCart(lines: readonly CartLine[], product: Product, quantity: number, increment = false) {
  const current = lines.find(line => line.sku === product.sku);
  if (!validSku(product.sku) || !validQuantity(quantity)) return { error: 'Elige una cantidad entera válida.' } as const;
  if (!product.stock_demo) return { error: 'Este producto está agotado.' } as const;
  const next = quantity + (increment ? current?.quantity ?? 0 : 0);
  if (next > product.stock_demo) return { error: `Solo hay ${product.stock_demo} unidades disponibles en la demo.` } as const;
  if (!current && lines.length >= CART_LIMIT) return { error: `Tu carrito admite hasta ${CART_LIMIT} productos distintos.` } as const;
  return { lines: current
    ? lines.map(line => line.sku === product.sku ? { sku: product.sku, quantity: next } : line)
    : [...lines, { sku: product.sku, quantity: next }] } as const;
}

export function reconcileCart(lines: readonly CartLine[], products: readonly Product[]): ReviewedLine[] {
  const catalog = new Map(products.map(product => [product.sku, product]));
  return lines.map(line => {
    const product = catalog.get(line.sku);
    if (!product) return { ...line, product, issue: 'missing' };
    return { ...line, product, issue: line.quantity > product.stock_demo ? 'stock' : undefined };
  });
}

export const STANDARD_DELIVERY = 9900n;
export const lineTotal = (price: number, quantity: number) => BigInt(price) * BigInt(quantity);
export const subtotal = (lines: readonly ReviewedLine[]) => lines.reduce(
  (sum, line) => sum + (line.product ? lineTotal(line.product.price_cents, line.quantity) : 0n), 0n);
const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatCents = (cents: bigint | number) => {
  const amount = BigInt(cents);
  return mxn.formatToParts(amount / 100n).map(part =>
    part.type === 'fraction' ? String(amount % 100n).padStart(2, '0') : part.value).join('');
};
export const quoteSignature = (lines: readonly ReviewedLine[]) =>
  JSON.stringify(lines.map(({ sku, quantity, product }) => [sku, quantity, product?.price_cents]));

export type Delivery = 'shipping' | 'pickup';
export const deliveryLabel = (method: Delivery) => method === 'shipping' ? 'Envío estándar · DEMO' : 'Recoger en tienda · DEMO';
export const shippingCost = (method: Delivery) => method === 'shipping' ? STANDARD_DELIVERY : 0n;
export const contactFields = { name: 'Nombre de quien recibe', email: 'Correo de ejemplo', zip: 'Código postal', city: 'Ciudad', state: 'Estado', address: 'Calle, número y colonia' };
export type Contact = Record<keyof typeof contactFields, string>;
export const emptyContact: Contact = { name: '', email: '', zip: '', city: '', state: '', address: '' };
export const contactLimits: Record<keyof Contact, number> = { name: 100, email: 254, zip: 5, city: 80, state: 80, address: 180 };
export function validateContact(contact: Contact, method: Delivery) {
  const errors: Partial<Record<keyof Contact, string>> = {};
  const fields = (Object.keys(contactFields) as (keyof Contact)[]).slice(0, method === 'pickup' ? 2 : undefined);
  for (const field of fields) {
    const value = contact[field].trim();
    if (!value || value.length > contactLimits[field]) errors[field] = `Escribe un valor de 1 a ${contactLimits[field]} caracteres.`;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) errors.email = 'Escribe un correo válido de ejemplo.';
  if (method === 'shipping' && !/^\d{5}$/.test(contact.zip.trim())) errors.zip = 'Escribe un código postal mexicano de 5 dígitos.';
  return errors;
}
