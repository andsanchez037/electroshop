// Auth real y CRUD SOLO Supabase local; jamás leer web/.env.local ni escribir remoto.
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath, URL } from 'node:url';
import { chromium } from 'playwright-core';
import axe from 'axe-core';
import assert from 'node:assert/strict';
import process from 'node:process';
import { isLocalDocker } from './db-test-results.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const run = (name, args, input) => spawnSync(name, args, { cwd: root, input, encoding: 'utf8', windowsHide: true, timeout: 60000, maxBuffer: 4 * 1024 * 1024 });
const sql = text => { const r = run('docker', ['exec', '-i', 'supabase_db_electroshop-local', 'psql', '-XAt', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres'], text); if (r.status !== 0) throw new Error('SQL local no completado; salida omitida.'); return r.stdout.trim(); };
const quote = value => `'${value.replaceAll("'", "''")}'`;
const adminId = '44444444-4444-4444-8444-444444444444'; const userId = '55555555-5555-4555-8555-555555555555';
const sku = 'CP004-LOCAL-QA'; const password = `${randomUUID()}Aa1!`;
let server, browser, lastPage, fixtures = false, phase = 'preflight';
const apiStatuses = [];
let axeViolations = [];
const baselineSql = 'select json_build_object(\'products\',(select count(*) from public.products),\'users\',(select count(*) from auth.users),\'admins\',(select count(*) from public.admin_users));';
let baseline; let externalRequests = 0; const errors = []; let expectedFailure = false;
try {
  if (process.argv.length !== 2) throw new Error('Sin argumentos externos.');
  const endpoint = process.env.DOCKER_HOST || run('docker', ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}']).stdout?.trim();
  if (!isLocalDocker(endpoint ?? '')) throw new Error('Requiere Docker local.');
  const status = run('supabase', ['status', '--workdir', fileURLToPath(new URL('../../', import.meta.url)), '--output', 'json']);
  if (status.status !== 0) { globalThis.console.error('BLOCKED_EXTERNAL: Supabase local debe estar iniciado y migrado.'); process.exit(2); }
  const config = JSON.parse(status.stdout);
  assert.equal(config.API_URL, 'http://127.0.0.1:54321'); assert.match(config.PUBLISHABLE_KEY, /^sb_publishable_/);
  baseline = sql(baselineSql);
  assert.equal(sql(`select count(*) from auth.users where id in ('${adminId}','${userId}');`), '0');
  assert.equal(sql(`select count(*) from public.products where sku in ('${sku}','CP004-FORBIDDEN');`), '0');
  phase = 'local fixtures';
  sql(`begin;
    insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,email_change_token_new,email_change,created_at,updated_at,email_change_token_current,reauthentication_token)
    values ('00000000-0000-0000-0000-000000000000','${adminId}','authenticated','authenticated','admin@electroshop.invalid',extensions.crypt(${quote(password)},extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}','','','','',now(),now(),'',''),
    ('00000000-0000-0000-0000-000000000000','${userId}','authenticated','authenticated','user@electroshop.invalid',extensions.crypt(${quote(password)},extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"role":"admin"}','','','','',now(),now(),'','');
    insert into auth.identities(provider_id,user_id,identity_data,provider,created_at,updated_at) values
    ('${adminId}','${adminId}','{"sub":"${adminId}","email":"admin@electroshop.invalid"}','email',now(),now()),
    ('${userId}','${userId}','{"sub":"${userId}","email":"user@electroshop.invalid"}','email',now(),now());
    insert into public.admin_users(user_id) values ('${adminId}'); commit;`);
  fixtures = true;
  phase = 'local frontend';
  server = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url)), 'dev', '--host', '127.0.0.1', '--port', '4323'], {
    cwd: root, windowsHide: true, stdio: 'pipe', env: { ...process.env, PUBLIC_CATALOG_MODE: 'supabase', PUBLIC_SUPABASE_URL: config.API_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.PUBLISHABLE_KEY },
  });
  server.stdout.resume(); server.stderr.resume();
  let ready = false;
  for (let i = 0; i < 80; i++) { if (server.exitCode !== null) break; try { if ((await globalThis.fetch('http://127.0.0.1:4323/admin')).ok) { ready = true; break; } } catch { /* startup */ } await new Promise(done => globalThis.setTimeout(done, 500)); }
  assert.ok(ready, 'Frontend local no disponible');
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  await context.route('**/*', route => {
    const u = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost'].includes(u.hostname)) { externalRequests++; return route.abort(); }
    return route.continue();
  });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  lastPage = page;
  page.on('response', response => { const u = new URL(response.url()); if (u.port === '54321') apiStatuses.push({ endpoint: u.pathname, status: response.status() }); });
  page.on('console', m => { if (m.type() === 'error' && !expectedFailure) errors.push('console'); });
  page.on('pageerror', () => { if (!expectedFailure) errors.push('javascript'); });
  await page.goto('http://127.0.0.1:4323/admin'); await page.getByRole('heading', { name: 'Iniciar sesión', exact: true }).waitFor();
  phase = 'login accessibility';
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth));
    await page.addScriptTag({ content: axe.source });
    assert.deepEqual(await page.evaluate(async () => (await globalThis.axe.run()).violations.map(v => v.id)), []);
  }
  const login = async email => { await page.getByLabel('Correo electrónico').fill(email); await page.getByLabel('Contraseña', { exact: true }).fill(password); await page.getByRole('button', { name: 'Entrar', exact: true }).click(); };
  phase = 'real failed login'; expectedFailure = true;
  await page.getByLabel('Correo electrónico').fill('user@electroshop.invalid'); await page.getByLabel('Contraseña', { exact: true }).fill('incorrect-fixture'); await page.getByRole('button', { name: 'Entrar', exact: true }).click(); await page.getByRole('alert').waitFor(); expectedFailure = false;
  phase = 'real non-admin login'; await login('user@electroshop.invalid'); await page.getByRole('heading', { name: 'Acceso no autorizado', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Nuevo producto', exact: true }).count(), 0);
  expectedFailure = true;
  const denied = await page.evaluate(async key => {
    const saved = JSON.parse(globalThis.sessionStorage.getItem('electroshop-admin-session'));
    const response = await globalThis.fetch('http://127.0.0.1:54321/rest/v1/products', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${saved.access_token}` }, body: JSON.stringify({ sku: 'CP004-FORBIDDEN', name: 'Fixture', description: 'Fixture local', category_id: 'componentes', price_cents: 1 }) });
    return response.status;
  }, config.PUBLISHABLE_KEY);
  assert.equal(denied, 403); expectedFailure = false;
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click(); await page.getByRole('heading', { name: 'Iniciar sesión', exact: true }).waitFor();
  phase = 'real admin login'; await login('admin@electroshop.invalid'); await page.getByRole('button', { name: 'Nuevo producto', exact: true }).waitFor();
  phase = 'admin UI accessibility';
  for (const width of [360, 1440]) { await page.setViewportSize({ width, height: 900 }); assert.ok(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth)); await page.addScriptTag({ content: axe.source }); axeViolations = await page.evaluate(async () => (await globalThis.axe.run()).violations.map(v => v.id)); assert.deepEqual(axeViolations, []); }
  phase = 'real create'; await page.getByRole('button', { name: 'Nuevo producto', exact: true }).click();
  await page.getByLabel('SKU', { exact: true }).fill(sku); await page.getByLabel('Nombre', { exact: true }).fill('Producto QA local'); await page.getByLabel('Descripción', { exact: true }).fill('Fixture efímero solo localhost.'); await page.getByLabel('Precio en centavos MXN').fill('12345'); await page.getByLabel('Categoría del producto').selectOption('desarrollo');
  axeViolations = await page.evaluate(async () => (await globalThis.axe.run()).violations.map(v => v.id)); assert.deepEqual(axeViolations, []);
  await page.getByRole('button', { name: 'Guardar producto', exact: true }).click(); await page.getByText('Producto guardado.', { exact: true }).waitFor(); await page.getByRole('heading', { name: 'Producto QA local', exact: true }).waitFor();
  const publicPage = await context.newPage();
  await publicPage.goto(`http://127.0.0.1:4323/producto?sku=${sku}`); await publicPage.getByRole('heading', { name: 'Producto QA local', exact: true }).waitFor(); assert.equal(await publicPage.locator('.stock').textContent(), 'Sin stock demo');
  phase = 'real edit and visibility'; await page.getByRole('button', { name: `Editar ${sku}`, exact: true }).click(); await page.getByLabel('Precio en centavos MXN').fill('23456'); await page.getByLabel('Stock demo', { exact: true }).fill('3'); await page.getByLabel('Categoría del producto').selectOption('energia'); await page.getByLabel('Visibilidad del producto').selectOption('false'); await page.getByRole('button', { name: 'Guardar producto', exact: true }).click(); await page.getByText('Producto guardado.', { exact: true }).waitFor(); await page.getByRole('button', { name: `Editar ${sku}`, exact: true }).waitFor();
  assert.equal(sql(`select price_cents || ':' || stock_demo || ':' || category_id || ':' || is_active from public.products where sku='${sku}';`), '23456:3:energia:false');
  await publicPage.reload(); await publicPage.getByRole('heading', { name: 'Producto no encontrado', exact: true }).waitFor();
  phase = 'real delete'; await page.getByRole('button', { name: `Eliminar ${sku}`, exact: true }).click(); assert.equal(sql(`select count(*) from public.products where sku='${sku}';`), '1'); await page.getByRole('button', { name: 'Cancelar eliminación', exact: true }).click();
  await page.getByRole('button', { name: `Eliminar ${sku}`, exact: true }).click(); await page.getByRole('button', { name: 'Eliminar definitivamente', exact: true }).click(); await page.getByText('Producto eliminado.', { exact: true }).waitFor(); assert.equal(sql(`select count(*) from public.products where sku='${sku}';`), '0');
  phase = 'real revocation'; sql(`delete from public.admin_users where user_id='${adminId}';`); await page.evaluate(() => globalThis.dispatchEvent(new globalThis.Event('focus'))); await page.getByRole('heading', { name: 'Acceso no autorizado', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click(); await page.getByRole('heading', { name: 'Iniciar sesión', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => globalThis.sessionStorage.getItem('electroshop-admin-session')), null);
  phase = 'expired session with rejected refresh';
  await login('user@electroshop.invalid'); await page.getByRole('heading', { name: 'Acceso no autorizado', exact: true }).waitFor();
  await page.evaluate(() => { const value = JSON.parse(globalThis.sessionStorage.getItem('electroshop-admin-session')); value.expires_at = Math.floor(Date.now() / 1000) - 3600; value.refresh_token = 'invalid-local-refresh-fixture'; globalThis.sessionStorage.setItem('electroshop-admin-session', JSON.stringify(value)); });
  expectedFailure = true; await page.reload(); await page.getByRole('heading', { name: 'Iniciar sesión', exact: true }).waitFor(); expectedFailure = false;
  phase = 'public regression'; await publicPage.goto('http://127.0.0.1:4323/catalogo'); await publicPage.getByText('16 de 16 productos', { exact: true }).waitFor(); await publicPage.getByLabel('Nombre o SKU', { exact: true }).fill('ES-D001'); await publicPage.getByText('1 de 16 productos', { exact: true }).waitFor();
  assert.equal(externalRequests, 0); assert.deepEqual(errors, []);
  globalThis.console.log('PASS: Auth real local (fallo/login/no admin/admin/logout/refresh rechazado), CRUD/confirmación/visibilidad, revocación, catálogo anónimo y axe login/admin/formulario 360/1440. Sin peticiones externas.');
} catch {
  globalThis.console.error(`FAIL: admin local smoke en fase ${phase}; logs/credenciales omitidos.`);
  globalThis.console.error(JSON.stringify({ apiStatuses, axeViolations, headings: await lastPage?.locator('h2').allTextContents(), alerts: await lastPage?.getByRole('alert').allTextContents() })); process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill();
  if (fixtures) {
    try { sql(`begin; delete from public.products where sku in ('${sku}','CP004-FORBIDDEN'); delete from auth.users where id in ('${adminId}','${userId}'); commit;`); assert.equal(sql(baselineSql), baseline); globalThis.console.log('PASS: fixtures locales eliminados; recuentos originales restaurados.'); }
    catch { globalThis.console.error('FAIL: limpieza de fixtures locales pendiente; no tocar remoto.'); process.exitCode = 1; }
  }
}
