// Validación reproducible y destructiva SOLO del seed DEMO en la instancia local.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import assert from 'node:assert/strict';
import process from 'node:process';
import { isLocalDocker } from './db-test-results.mjs';

const run = (command, args, input) => spawnSync(command, args, {
  input, encoding: 'utf8', windowsHide: true, timeout: 120000, maxBuffer: 4 * 1024 * 1024,
});
const sql = text => {
  const result = run('docker', ['exec', '-i', 'supabase_db_electroshop-local', 'psql', '-XAt', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres'], text);
  assert.equal(result.status, 0, 'SQL local no completado');
  return result.stdout.trim();
};
try {
  assert.equal(process.argv.length, 2, 'No se aceptan argumentos');
  const context = run('docker', ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}']);
  const endpoint = process.env.DOCKER_HOST || context.stdout?.trim() || '';
  assert.equal(context.status, 0);
  assert.ok(isLocalDocker(endpoint));
  const status = run('supabase', ['status', '--output', 'json', '--workdir', fileURLToPath(new URL('../../', import.meta.url))]);
  assert.equal(status.status, 0, 'Stack local no disponible');
  // Mantener credenciales exclusivamente en memoria; no imprimir el status.
  const config = JSON.parse(status.stdout);
  const base = new URL(config.API_URL);
  assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname) && base.protocol === 'http:' && base.port === '54321');
  const key = config.ANON_KEY;
  assert.ok(typeof key === 'string' && key.length > 0, 'Falta credencial anon local');
  const snapshotSql = `select json_build_object(
    'products', (select json_agg(p order by sku) from public.products p),
    'categories', (select json_agg(c order by id) from public.categories c),
    'admins', (select count(*) from public.admin_users),
    'users', (select count(*) from auth.users));`;
  const before = sql(snapshotSql);
  const data = JSON.parse(before);
  assert.equal(data.products.length, 16);
  assert.equal(data.categories.length, 4);
  assert.equal(data.admins, 0);
  assert.equal(data.users, 0);
  const seed = readFileSync(new URL('../../supabase/seed.sql', import.meta.url), 'utf8');
  sql(seed);
  assert.equal(sql(snapshotSql), before, 'Primera repetición del seed cambia datos/UUIDs');
  sql(seed);
  assert.equal(sql(snapshotSql), before, 'Segunda repetición del seed cambia datos/UUIDs');
  globalThis.console.log('PASS: seed repetido dos veces; 16 productos, 4 categorías, datos y UUIDs idénticos; 0 usuarios/admins.');
  const request = (path, method = 'GET', body) => globalThis.fetch(new URL(`/rest/v1/${path}`, base), {
    method, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined, signal: globalThis.AbortSignal.timeout(10000), redirect: 'error',
  });
  let checks = 0;
  for (const [table, count] of [['products', 16], ['categories', 4]]) {
    const response = await request(`${table}?select=*`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).length, count);
    checks++;
  }
  for (const [path, method, body] of [
    ['products', 'POST', { sku: 'TEST-REST', name: 'Fixture DEMO', description: 'Solo local', category_id: 'componentes', price_cents: 1 }],
    ['products?sku=eq.ES-C001', 'PATCH', { price_cents: 0 }],
    ['products?sku=eq.ES-C001', 'DELETE'],
    ['admin_users?select=*', 'GET'],
    ['admin_users', 'POST', { user_id: '11111111-1111-4111-8111-111111111111' }],
  ]) {
    assert.ok([401, 403].includes((await request(path, method, body)).status), 'Operación anon no denegada');
    checks++;
  }
  assert.equal(sql(snapshotSql), before, 'REST alteró datos');
  globalThis.console.log(`PASS: REST anon local ${checks}/${checks}: lectura 16/4, INSERT/UPDATE/DELETE denegados, membresías privadas y autoasignación denegada; base intacta.`);
} catch {
  // Nunca mostrar errores crudos, status, URLs ni credenciales.
  globalThis.console.error('FAIL: validación REST/seed exclusivamente local no completada. Sin salida de credenciales.');
  process.exitCode = 1;
}
