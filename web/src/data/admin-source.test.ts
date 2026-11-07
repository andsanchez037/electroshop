import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { AdminAccessError, gatewayFor } from './admin-source';
import type { ProductDraft } from './admin-product';
const row = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', sku: 'TEST-001', name: 'Demo', description: 'Fixture local', category_id: 'componentes', price_cents: 1234, stock_demo: 0, is_active: false } as const;
const value: ProductDraft = { sku: row.sku, name: row.name, description: row.description, category_id: row.category_id, price_cents: row.price_cents, stock_demo: row.stock_demo, is_active: row.is_active };
function setup(admin = true, failure?: string, emptyWrite = false) {
  const requests: { path: string; method: string; body: unknown; headers: Headers }[] = [];
  const request = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input)); const method = init?.method ?? 'GET';
    requests.push({ path: url.pathname, method, body: init?.body ? JSON.parse(String(init.body)) : null, headers: new Headers(init?.headers) });
    if (url.pathname.endsWith('/rpc/current_user_is_admin')) return new Response(JSON.stringify(admin), { headers: { 'content-type': 'application/json' } });
    if (failure) return new Response(JSON.stringify({ code: failure, message: 'never expose internal details' }), { status: 403, headers: { 'content-type': 'application/json' } });
    const body = method === 'GET' ? [row] : emptyWrite ? [] : [{ id: row.id }];
    return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json', 'content-range': '0-0/1' } });
  });
  const client = createClient('https://example.supabase.co', 'sb_publishable_testfixture', { accessToken: async () => 'synthetic-session-fixture', global: { fetch: request } });
  return { gateway: gatewayFor(client), requests, request };
}
describe('SDK administrativo bajo RLS, transporte inyectado', () => {
  it('comprueba membresía con RPC y lista también ocultos, sin filtro público', async () => {
    const { gateway, requests } = setup();
    expect(await gateway.listProducts()).toEqual([row]);
    expect(requests[0]?.path).toBe('/rest/v1/rpc/current_user_is_admin');
    expect(requests.every(r => !r.path.includes('admin_users'))).toBe(true);
  });
  it('deniega listado y toda escritura de no admin antes de enviar DML', async () => {
    const { gateway, requests } = setup(false);
    await expect(gateway.listProducts()).rejects.toBeInstanceOf(AdminAccessError);
    await expect(gateway.saveProduct(value)).rejects.toBeInstanceOf(AdminAccessError);
    await expect(gateway.deleteProduct(row.id)).rejects.toBeInstanceOf(AdminAccessError);
    expect(requests.every(r => r.path.endsWith('current_user_is_admin'))).toBe(true);
  });
  it('CRUD usa JWT de sesión y publishable key; identifica filas por UUID', async () => {
    const { gateway, requests } = setup();
    await gateway.saveProduct(value); await gateway.saveProduct(value, row.id); await gateway.deleteProduct(row.id);
    const writes = requests.filter(r => !r.path.includes('/rpc/'));
    expect(writes.map(r => r.method)).toEqual(['POST', 'PATCH', 'DELETE']);
    expect(writes[0]?.body).toEqual(value);
    expect(writes.every(r => r.headers.get('apikey') === 'sb_publishable_testfixture' && r.headers.get('authorization') === 'Bearer synthetic-session-fixture')).toBe(true);
  });
  it('traduce rechazo RLS sin divulgar error de BD', async () => {
    const { gateway } = setup(true, '42501');
    await expect(gateway.saveProduct(value)).rejects.toBeInstanceOf(AdminAccessError);
  });
  it('distingue SKU duplicado y rechaza modificación de cero filas', async () => {
    await expect(setup(true, '23505').gateway.saveProduct(value)).rejects.toThrow('El SKU ya existe');
    await expect(setup(true, undefined, true).gateway.saveProduct(value, row.id)).rejects.toBeInstanceOf(AdminAccessError);
    await expect(setup(true, undefined, true).gateway.deleteProduct(row.id)).rejects.toBeInstanceOf(AdminAccessError);
  });
  it('valida antes de transmitir valores corruptos', async () => {
    const { gateway, requests } = setup();
    await expect(gateway.saveProduct({ ...value, stock_demo: -1 })).rejects.toThrow('Revisa los campos');
    expect(requests).toHaveLength(0);
  });
  it('respuesta RPC malformada nunca equivale a membresía', async () => {
    const client = createClient('https://example.supabase.co', 'sb_publishable_testfixture', { accessToken: async () => 'synthetic-session-fixture', global: { fetch: async () => new Response(JSON.stringify('admin'), { headers: { 'content-type': 'application/json' } }) } });
    await expect(gatewayFor(client).isAdmin()).rejects.toThrow('No se pudo verificar el acceso');
    await expect(gatewayFor(client).listProducts()).rejects.toBeInstanceOf(AdminAccessError);
  });
});
