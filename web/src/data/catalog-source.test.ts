import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCatalogSource, loadCatalogProducts } from './catalog-source';
import { products } from './catalog';
import { assertPublicEnvironment } from '../../scripts/public-env.mjs';

const env = { mode: 'supabase', url: 'https://example.supabase.co', publishableKey: 'sb_publishable_testfixture' };
const row = { sku: 'ES-D001', name: 'Producto de la base', description: 'Fixture de transporte, no servidor real',
  category_id: 'desarrollo', price_cents: 12345, stock_demo: 2 };
const reply = (rows: unknown, total = 1) => new Response(JSON.stringify(rows), { headers: { 'content-range': `0-0/${total}` } });
afterEach(() => vi.unstubAllEnvs());

describe('Origen de datos y seguridad de configuración', () => {
  it('demo explícito o por defecto conserva CP-002 sin hacer peticiones', async () => {
    const request = vi.fn();
    expect(await createCatalogSource({}, request).loadProducts()).toBe(products);
    expect(await createCatalogSource({ ...env, mode: 'demo' }, request).loadProducts()).toBe(products);
    expect(request).not.toHaveBeenCalled();
  });
  it('rechaza modos desconocidos y configuración incompleta sin fallback', () => {
    expect(() => createCatalogSource({ mode: 'other' })).toThrow();
    expect(() => createCatalogSource({ mode: 'supabase' })).toThrow();
    expect(() => createCatalogSource({ ...env, publishableKey: undefined })).toThrow();
  });
  it('rechaza claves elevadas/legacy aun en modo demo sin revelar valores', () => {
    for (const key of ['sb_secret_testfixture', 'eyJlegacyJWT', 'service_role']) {
      expect(() => createCatalogSource({ ...env, mode: 'demo', publishableKey: key })).toThrow(/omitido/);
    }
    expect(() => assertPublicEnvironment({ PUBLIC_DB_PASSWORD: 'fixture' })).toThrow(/omitidos/);
  });
  it('rechaza URL insegura, credenciales en URL, paths, query o hash', () => {
    for (const url of ['http://example.supabase.co', 'https://user:fixture@example.supabase.co', 'https://example.supabase.co/rest',
      'https://example.supabase.co?x=1', 'https://example.supabase.co#x', 'javascript:void(0)']) {
      expect(() => createCatalogSource({ ...env, url })).toThrow();
      expect(() => createCatalogSource({ ...env, mode: 'demo', url })).toThrow();
    }
    expect(() => createCatalogSource({ ...env, url: 'http://127.0.0.1:54321' })).not.toThrow();
    expect(() => assertPublicEnvironment({ PUBLIC_SUPABASE_URL: 'https://${HOST}' }, { requireComplete: false })).toThrow();
  });
  it('mapea filas validadas a la interfaz aprobada y solo envía apikey pública', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(reply([row]));
    const result = await createCatalogSource(env, request).loadProducts();
    expect(result).toEqual([{ sku: row.sku, name: row.name, description: row.description,
      category: 'desarrollo', price_cents: 12345, stock_demo: 2 }]);
    const url = new URL(String(request.mock.calls[0]?.[0]));
    expect(url.pathname).toBe('/rest/v1/products');
    expect(url.searchParams.get('is_active')).toBe('eq.true');
    const options = request.mock.calls[0]?.[1];
    expect(options?.headers).toEqual({ apikey: env.publishableKey, Accept: 'application/json', Prefer: 'count=exact' });
    expect(options?.credentials).toBe('omit');
    expect(options?.redirect).toBe('error');
    expect(options?.signal).toBeTruthy();
  });
  it('respeta catálogo vacío real sin sustituirlo por demo', async () => {
    expect(await createCatalogSource(env, vi.fn().mockResolvedValue(reply([], 0))).loadProducts()).toEqual([]);
  });
  it('pagina incluso si el servidor devuelve menos que el tamaño solicitado', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(reply([row], 2))
      .mockResolvedValueOnce(reply([{ ...row, sku: 'ES-D002' }], 2));
    expect(await createCatalogSource(env, request).loadProducts()).toHaveLength(2);
    expect(new URL(String(request.mock.calls[1]?.[0])).searchParams.get('offset')).toBe('1');
  });
  it('errores HTTP, red, JSON y esquema rechazan la promesa, sin demo ni detalles del servidor', async () => {
    for (const status of [401, 403, 404, 429, 500]) {
      const request = vi.fn().mockResolvedValue(new Response('detalle privado', { status }));
      await expect(createCatalogSource(env, request).loadProducts()).rejects.toThrow('No se pudo consultar');
    }
    await expect(createCatalogSource(env, vi.fn().mockRejectedValue(new Error('detalle privado'))).loadProducts()).rejects.toThrow('No se pudo conectar');
    await expect(createCatalogSource(env, vi.fn().mockResolvedValue(new Response('no-json'))).loadProducts()).rejects.toThrow('datos no válidos');
    for (const bad of [{ ...row, price_cents: -1 }, { ...row, stock_demo: 1.5 }, { ...row, category_id: 'desconocida' },
      { ...row, sku: 'es-d001' }, { ...row, name: '' }, null]) {
      await expect(createCatalogSource(env, vi.fn().mockResolvedValue(reply([bad]))).loadProducts()).rejects.toThrow('datos no válidos');
    }
    await expect(createCatalogSource(env, vi.fn().mockResolvedValue(reply({ error: 'x' }))).loadProducts()).rejects.toThrow();
  });
  it('rechaza paginación incompleta y SKU duplicados', async () => {
    await expect(createCatalogSource(env, vi.fn().mockResolvedValue(reply([], 3))).loadProducts()).rejects.toThrow();
    await expect(createCatalogSource(env, vi.fn().mockResolvedValue(reply([row, row], 2))).loadProducts()).rejects.toThrow();
    await expect(createCatalogSource(env, vi.fn().mockResolvedValue(new Response(JSON.stringify([row])))).loadProducts()).rejects.toThrow();
  });
  it('el selector usa exclusivamente las variables públicas previstas', async () => {
    vi.stubEnv('PUBLIC_CATALOG_MODE', 'demo');
    expect(await loadCatalogProducts()).toBe(products);
    vi.stubEnv('PUBLIC_CATALOG_MODE', 'supabase');
    vi.stubEnv('PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_secret_fixture');
    await expect(loadCatalogProducts()).rejects.toThrow();
  });
});
