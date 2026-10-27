import { categories, products, type Product, type CategoryId } from './catalog';
import { assertPublicEnvironment } from '../../scripts/public-env.mjs';

export interface CatalogEnvironment {
  mode?: string;
  url?: string;
  publishableKey?: string;
}
export interface CatalogSource { loadProducts(): Promise<readonly Product[]> }

const invalidData = () => new Error('El catálogo recibió datos no válidos.');
function parseProduct(value: unknown): Product {
  if (typeof value !== 'object' || value === null) throw invalidData();
  const row = value as Record<string, unknown>;
  if (typeof row.sku !== 'string' || !/^[A-Z0-9][A-Z0-9-]{0,49}$/.test(row.sku)
    || typeof row.name !== 'string' || !row.name.trim() || row.name.length > 150
    || typeof row.description !== 'string' || !row.description.trim() || row.description.length > 4000
    || !categories.some(category => category.id === row.category_id)
    || typeof row.price_cents !== 'number' || !Number.isSafeInteger(row.price_cents) || row.price_cents < 0 || row.price_cents > 2147483647
    || typeof row.stock_demo !== 'number' || !Number.isSafeInteger(row.stock_demo) || row.stock_demo < 0 || row.stock_demo > 2147483647) throw invalidData();
  return { sku: row.sku, name: row.name, description: row.description,
    category: row.category_id as CategoryId, price_cents: row.price_cents, stock_demo: row.stock_demo };
}

/** Solo lectura pública; no Auth, escrituras ni claves elevadas en CP-003A. */
export function createCatalogSource(env: CatalogEnvironment, request: typeof fetch = globalThis.fetch): CatalogSource {
  assertPublicEnvironment({ PUBLIC_CATALOG_MODE: env.mode, PUBLIC_SUPABASE_URL: env.url,
    PUBLIC_SUPABASE_PUBLISHABLE_KEY: env.publishableKey });
  const mode = env.mode ?? 'demo';
  if (mode === 'demo') return { loadProducts: async () => products };
  if (mode !== 'supabase') throw new Error('Modo de catálogo no válido.');
  let base: URL;
  try { base = new URL(env.url ?? ''); } catch { throw new Error('Configura la URL pública de Supabase.'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
  if ((base.protocol !== 'https:' && !(local && base.protocol === 'http:'))
    || base.username || base.password || base.search || base.hash || base.pathname !== '/') {
    throw new Error('La URL de Supabase debe ser un origen HTTPS o localhost.');
  }
  if (!env.publishableKey || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(env.publishableKey)
    || /REEMPLAZAR|TU_CLAVE|PLACEHOLDER/i.test(env.publishableKey)) {
    throw new Error('Configura únicamente una publishable key de Supabase.');
  }
  const key = env.publishableKey;
  return { async loadProducts() {
    const result: Product[] = [];
    // Paginación explícita: no truncar silenciosamente el catálogo al límite de PostgREST.
    const pageSize = 500;
    for (let offset = 0; ;) {
      const endpoint = new URL('/rest/v1/products', base);
      endpoint.searchParams.set('select', 'sku,name,description,price_cents,stock_demo,category_id');
      endpoint.searchParams.set('is_active', 'eq.true');
      endpoint.searchParams.set('order', 'sku.asc');
      endpoint.searchParams.set('limit', String(pageSize));
      endpoint.searchParams.set('offset', String(offset));
      let response: Response;
      try {
        response = await request(endpoint.toString(), { headers: { apikey: key, Accept: 'application/json', Prefer: 'count=exact' },
          credentials: 'omit', signal: AbortSignal.timeout(10000), redirect: 'error' });
      } catch { throw new Error('No se pudo conectar con el catálogo. Intenta de nuevo.'); }
      // Nunca reenviar body/URL/headers al log o UI; podrían contener información sensible.
      if (!response.ok) throw new Error('No se pudo consultar el catálogo. Revisa la conexión y los permisos.');
      let body: unknown;
      try { body = await response.json(); } catch { throw invalidData(); }
      if (!Array.isArray(body)) throw invalidData();
      const page = body.map(parseProduct);
      const range = response.headers.get('content-range');
      const totalText = range?.split('/')[1];
      if (!totalText || !/^\d+$/.test(totalText)) throw invalidData();
      const total = Number(totalText);
      if (!Number.isSafeInteger(total) || total < 0 || page.length > pageSize || offset + page.length > total) throw invalidData();
      result.push(...page);
      offset += page.length;
      if (offset >= total) break;
      if (!page.length) throw invalidData();
    }
    if (new Set(result.map(product => product.sku)).size !== result.length) throw invalidData();
    return result;
  } };
}

export async function loadCatalogProducts(): Promise<readonly Product[]> {
  return createCatalogSource({ mode: import.meta.env.PUBLIC_CATALOG_MODE,
    url: import.meta.env.PUBLIC_SUPABASE_URL,
    publishableKey: import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY }).loadProducts();
}
