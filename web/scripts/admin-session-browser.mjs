// Real Edge and SDK, with an intercepted Auth/Data API and synthetic identities.
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import { chromium } from 'playwright-core';

const site = 'http://127.0.0.1:4324';
const api = 'http://127.0.0.1:54321';
const storageKey = 'electroshop-admin-session-v2';
const admin = { id: 'fixture-admin', aud: 'authenticated', app_metadata: {}, user_metadata: {} };
const user = { ...admin, id: 'fixture-user' };
const row = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', sku: 'QA-001', name: 'Fixture de navegador',
  description: 'Datos sintéticos', price_cents: 100, stock_demo: 0, is_active: false, category_id: 'componentes' };
const accessTokens = new Map();
const refreshTokens = new Map();
let member = true;
let rpcAvailable = false;
let privilegedReads = 0;
let phase = 'arranque';
const jwt = exp => ['{"alg":"HS256","typ":"JWT"}', JSON.stringify({ exp, nonce: randomUUID() }), 'synthetic']
  .map(value => Buffer.from(value).toString('base64url')).join('.');
function issue(identity, expiresIn = 3600) {
  const access_token = jwt(Math.floor(Date.now() / 1000) + expiresIn);
  const refresh_token = randomUUID();
  accessTokens.set(access_token, identity);
  refreshTokens.set(refresh_token, identity);
  return { access_token, refresh_token, expires_in: expiresIn, token_type: 'bearer', user: identity };
}

const server = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url)),
  'dev', '--host', '127.0.0.1', '--port', '4324'], {
  cwd: fileURLToPath(new URL('../', import.meta.url)), windowsHide: true, stdio: 'ignore',
  env: { ...process.env, PUBLIC_CATALOG_MODE: 'supabase', PUBLIC_SUPABASE_URL: api, PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_browser_fixture' },
});
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 80 && server.exitCode === null; attempt++) {
    try { if ((await globalThis.fetch(site + '/admin')).ok) { ready = true; break; } } catch { /* startup */ }
    await new Promise(resolve => globalThis.setTimeout(resolve, 250));
  }
  assert.ok(ready);
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  await context.addInitScript(key => {
    globalThis.qaCopiedStorage = globalThis.sessionStorage.getItem(key) !== null;
    globalThis.qaChannels = [];
    const Channel = globalThis.BroadcastChannel;
    globalThis.BroadcastChannel = class extends Channel {
      constructor(name) { super(name); globalThis.qaChannels.push(name); }
    };
  }, storageKey);
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === site) return route.continue();
    if (url.origin !== api) return route.abort();
    const request = route.request();
    const headers = { 'access-control-allow-origin': site, 'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-expose-headers': 'content-range' };
    const respond = (json, status = 200, extra = {}) => route.fulfill({ status, json, headers: { ...headers, ...extra } });
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (url.pathname === '/auth/v1/token') {
      const body = request.postDataJSON();
      if (url.searchParams.get('grant_type') === 'password') return respond(body.email.startsWith('admin') ? issue(admin, 100) : issue(user));
      const identity = refreshTokens.get(body.refresh_token);
      if (!identity) return respond({ code: 'refresh_token_not_found', msg: 'Synthetic session expired' }, 400);
      refreshTokens.delete(body.refresh_token);
      return respond(issue(identity));
    }
    const identity = accessTokens.get(request.headers().authorization?.replace(/^Bearer /, ''));
    if (url.pathname === '/auth/v1/user') return identity ? respond(identity) : respond({}, 401);
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers });
    const allowed = identity === admin && member;
    if (url.pathname.endsWith('/rpc/current_user_is_admin')) {
      return rpcAvailable ? respond(allowed) : respond({ code: 'PGRST202', message: 'Synthetic missing RPC' }, 404);
    }
    if (url.pathname.endsWith('/products') || url.pathname.endsWith('/categories')) privilegedReads++;
    if (allowed && url.pathname.endsWith('/products')) return respond([row], 200, { 'content-range': '0-0/1' });
    if (allowed && url.pathname.endsWith('/categories')) return respond([{ id: 'componentes', name: 'Componentes', is_active: true }]);
    return respond({}, 403);
  });

  const heading = (page, name) => page.getByRole('heading', { name, exact: true });
  const login = async (page, email) => {
    await heading(page, 'Iniciar sesión').waitFor();
    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill('synthetic-browser-fixture');
    await page.getByRole('button', { name: 'Entrar' }).click();
  };
  const logout = page => page.getByRole('button', { name: 'Cerrar sesión' }).click();
  const first = await context.newPage();
  await first.clock.install();
  const second = await context.newPage();
  phase = 'RPC ausente y reintento';
  await first.goto(site + '/admin');
  await second.goto(site + '/admin');
  await login(first, 'admin@example.test');
  await heading(first, 'No pudimos verificar la administración').waitFor();
  assert.equal(privilegedReads, 0);
  assert.equal(await first.getByRole('button', { name: 'Nuevo producto', exact: true }).count(), 0);
  rpcAvailable = true;
  await first.getByRole('button', { name: 'Reintentar acceso', exact: true }).click();
  await heading(first, row.name).waitFor();
  phase = 'inicio independiente y copia por opener';
  await heading(second, 'Iniciar sesión').waitFor();
  const [copy] = await Promise.all([first.waitForEvent('popup'), first.evaluate(() => { globalThis.open('/admin'); })]);
  await heading(copy, 'Iniciar sesión').waitFor();
  assert.equal(await copy.evaluate(() => globalThis.qaCopiedStorage), true);
  assert.equal(await copy.evaluate(key => globalThis.sessionStorage.getItem(key) === null, storageKey), true);
  await copy.close();
  await login(second, 'user@example.test');
  await heading(second, 'Acceso no autorizado').waitFor();
  await logout(second);
  await heading(second, 'Iniciar sesión').waitFor();
  await heading(first, row.name).waitFor();
  for (const page of [first, second]) assert.deepEqual(await page.evaluate(() => globalThis.qaChannels), []);

  phase = 'renovación del SDK y borrador';
  await first.bringToFront();
  await first.getByRole('button', { name: 'Editar QA-001' }).click();
  const draft = first.getByLabel('Nombre', { exact: true });
  await draft.fill('Borrador sin guardar');
  const previous = await first.evaluate(key => JSON.parse(globalThis.sessionStorage.getItem(key)).refresh_token, storageKey);
  const refreshed = first.waitForResponse(response => new URL(response.url()).searchParams.get('grant_type') === 'refresh_token');
  await first.clock.fastForward(35000);
  await refreshed;
  await first.waitForFunction(({ key, token }) => {
    const next = JSON.parse(globalThis.sessionStorage.getItem(key))?.refresh_token;
    return typeof next === 'string' && next !== token;
  },
    { key: storageKey, token: previous });
  assert.equal(await draft.inputValue(), 'Borrador sin guardar');

  phase = 'recarga y revocación';
  await first.reload();
  await heading(first, row.name).waitFor();
  member = false;
  await first.evaluate(() => globalThis.dispatchEvent(new globalThis.Event('focus')));
  await heading(first, 'Acceso no autorizado').waitFor();
  assert.equal(await heading(first, row.name).count(), 0);
  await login(second, 'user@example.test');
  await heading(second, 'Acceso no autorizado').waitFor();
  await logout(first);
  await heading(first, 'Iniciar sesión').waitFor();
  await heading(second, 'Acceso no autorizado').waitFor();

  phase = 'sesión expirada y refresh rechazado';
  await second.evaluate(({ key, accessToken, origin }) => {
    globalThis.sessionStorage.setItem(key, JSON.stringify({ origin, access_token: accessToken, refresh_token: 'synthetic-rejected-refresh' }));
  }, { key: storageKey, accessToken: jwt(1), origin: api });
  await second.reload();
  await heading(second, 'Iniciar sesión').waitFor();
  assert.equal(await second.evaluate(key => globalThis.sessionStorage.getItem(key) === null, storageKey), true);
  globalThis.console.log('PASS: Edge/SDK con API sintética. RPC ausente sin lecturas privilegiadas y reintento. Dos pestañas, copia de storage, login/logout aislados, renovación y borrador, recarga, revocación y expiración.');
} catch {
  globalThis.console.error(`FAIL: prueba de navegador en fase «${phase}». Salida de sesión omitida.`);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill();
}
