import { categories, type CategoryId } from './catalog';

export interface ProductDraft {
  sku: string;
  name: string;
  description: string;
  category_id: CategoryId;
  price_cents: number;
  stock_demo: number;
  is_active: boolean;
}
export interface AdminProduct extends ProductDraft { id: string }
export interface AdminCategory { id: CategoryId; name: string; is_active: boolean }
export type ProductFields = Record<keyof ProductDraft, string>;
export type ProductErrors = Partial<Record<keyof ProductDraft, string>>;

export const blankFields = (): ProductFields => ({ sku: '', name: '', description: '', category_id: 'componentes', price_cents: '', stock_demo: '0', is_active: 'true' });
export const fieldsFor = (p: ProductDraft): ProductFields => ({ ...p, price_cents: String(p.price_cents), stock_demo: String(p.stock_demo), is_active: String(p.is_active) });
const integer = (s: string) => /^\d+$/.test(s) && Number.isSafeInteger(Number(s)) && Number(s) <= 2147483647;
const pgLength = (s: string) => [...s].length;
// PostgreSQL btrim(text) elimina espacios ASCII; no normalizar silenciosamente SKU.
const trimmedLength = (s: string) => pgLength(s.replace(/^ +| +$/g, ''));
export function validateProduct(fields: ProductFields): { value?: ProductDraft; errors: ProductErrors } {
  const errors: ProductErrors = {};
  if (!/^[A-Z0-9][A-Z0-9-]{0,49}$/.test(fields.sku)) errors.sku = 'Usa 1–50 letras mayúsculas, números o guiones, sin espacios.';
  if (trimmedLength(fields.name) < 1 || trimmedLength(fields.name) > 150) errors.name = 'Escribe un nombre de 1 a 150 caracteres.';
  if (trimmedLength(fields.description) < 1 || trimmedLength(fields.description) > 4000) errors.description = 'Escribe una descripción de 1 a 4000 caracteres.';
  if (!categories.some(c => c.id === fields.category_id)) errors.category_id = 'Selecciona una categoría del catálogo.';
  if (!integer(fields.price_cents)) errors.price_cents = 'Usa centavos enteros entre 0 y 2147483647.';
  if (!integer(fields.stock_demo)) errors.stock_demo = 'Usa stock entero entre 0 y 2147483647.';
  if (!['true', 'false'].includes(fields.is_active)) errors.is_active = 'Selecciona la visibilidad.';
  if (Object.keys(errors).length) return { errors };
  return { errors, value: { sku: fields.sku, name: fields.name, description: fields.description, category_id: fields.category_id as CategoryId,
    price_cents: Number(fields.price_cents), stock_demo: Number(fields.stock_demo), is_active: fields.is_active === 'true' } };
}

export function parseAdminProduct(row: unknown): AdminProduct {
  if (!row || typeof row !== 'object') throw new Error('Datos de producto no válidos.');
  const p = row as Record<string, unknown>;
  if (typeof p.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id)
    || typeof p.sku !== 'string' || typeof p.name !== 'string' || typeof p.description !== 'string' || typeof p.category_id !== 'string'
    || typeof p.price_cents !== 'number' || typeof p.stock_demo !== 'number' || typeof p.is_active !== 'boolean') throw new Error('Datos de producto no válidos.');
  const validated = validateProduct({ sku: p.sku, name: p.name, description: p.description, category_id: p.category_id,
    price_cents: String(p.price_cents), stock_demo: String(p.stock_demo), is_active: String(p.is_active) });
  if (!validated.value) throw new Error('Datos de producto no válidos.');
  return { id: p.id, ...validated.value };
}
