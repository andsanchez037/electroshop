import assert from 'node:assert/strict';
import { URL } from 'node:url';
import axe from 'axe-core';

const cartKey = 'electroshop-cart';
const sku = 'ES-D001';
const product = 'Placa de desarrollo Nova';

export async function exerciseShopping(browser, site, supabase) {
  for (const width of [360, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const prohibited = [];
    const errors = [];
    let catalogReads = 0;
    page.on('pageerror', () => errors.push('pageerror'));
    page.on('console', message => { if (message.type() === 'error') errors.push('console'); });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      const method = route.request().method();
      const catalog = supabase && url.origin === 'http://127.0.0.1:54321' && url.pathname === '/rest/v1/products';
      if ((url.origin === site && method === 'GET') || (catalog && ['GET', 'OPTIONS'].includes(method))) {
        if (catalog && method === 'GET') catalogReads++;
        return route.continue();
      }
      prohibited.push(method);
      return route.abort();
    });
    const button = name => page.getByRole('button', { name, exact: true });
    const heading = name => page.getByRole('heading', { name, exact: true });
    async function accessibility() {
      assert.ok(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth), `Desbordamiento a ${width}px`);
      await page.addScriptTag({ content: axe.source });
      assert.deepEqual(await page.evaluate(async () => (await globalThis.axe.run()).violations.map(item => item.id)), []);
    }
    try {
      await page.goto(site + '/catalogo?q=' + sku);
      await heading(product).waitFor();
      await page.getByLabel('Cantidad de ' + product).fill('2');
      await button('Agregar al carrito: ' + product).dblclick();
      await page.getByRole('link', { name: 'Carrito 2 artículos', exact: true }).waitFor();
      await page.getByRole('link', { name: new RegExp(product) }).first().click();
      await heading(product).waitFor();
      await button('Agregar al carrito: ' + product).press('Enter');
      await page.getByRole('link', { name: 'Carrito 3 artículos', exact: true }).click();
      await heading(product).waitFor();
      await page.reload();
      await page.getByRole('link', { name: 'Carrito 3 artículos', exact: true }).waitFor();
      await heading(product).waitFor();

      // Another browser tab writes a previously valid selection with less current stock.
      const other = await context.newPage();
      await other.goto(site);
      await other.evaluate(({ key, sku }) => globalThis.localStorage.setItem(key,
        JSON.stringify({ version: 1, lines: [{ sku, quantity: 9 }] })), { key: cartKey, sku });
      await page.getByText(/Quedan 8 unidades/).waitFor();
      assert.equal(await page.getByRole('link', { name: 'Continuar con el pedido' }).count(), 0);
      await button('Ajustar a 8').click();
      await page.getByRole('link', { name: 'Carrito 8 artículos' }).waitFor();
      await other.getByRole('link', { name: 'Carrito 8 artículos' }).waitFor();
      await other.close();
      await button('Reducir cantidad de ' + product).click();
      await page.getByRole('link', { name: 'Carrito 7 artículos' }).waitFor();
      await button('Aumentar cantidad de ' + product).click();
      await page.getByRole('link', { name: 'Carrito 8 artículos' }).waitFor();
      await button('Vaciar carrito').click();
      await button('Conservar carrito').press('Enter');
      await accessibility();
      await page.getByRole('link', { name: 'Continuar con el pedido' }).click();
      await button('Continuar a entrega').click();
      await button('Revisar pedido DEMO').click();
      await page.getByLabel('Nombre de quien recibe').waitFor();
      assert.equal(await page.getByLabel('Nombre de quien recibe').getAttribute('aria-invalid'), 'true');
      await page.getByLabel('Nombre de quien recibe').fill('Persona ficticia');
      await page.getByLabel('Correo de ejemplo').fill('persona@example.test');
      if (width === 360) {
        const entries = { 'Código postal': '31000', Ciudad: 'Chihuahua', Estado: 'Chihuahua', 'Calle, número y colonia': 'Calle DEMO 123' };
        for (const [label, value] of Object.entries(entries)) await page.getByLabel(label, { exact: true }).fill(value);
      } else {
        await page.getByRole('radio', { name: /Recoger en tienda/ }).check();
        assert.equal(await page.getByLabel('Código postal').count(), 0);
      }
      await accessibility();
      const saved = await page.evaluate(() => Object.fromEntries(Object.entries(globalThis.localStorage)));
      assert.deepEqual(saved, { [cartKey]: JSON.stringify({ version: 1, lines: [{ sku, quantity: 8 }] }) });
      assert.equal(await page.evaluate(() => globalThis.sessionStorage.length), 0);
      await button('Revisar pedido DEMO').click();
      await page.getByText(width === 360 ? /Total revisado: \$2,091\.00 MXN/ : /Total revisado: \$1,992\.00 MXN/).waitFor();
      await button('Confirmar pedido DEMO').click();
      await heading('Pedido DEMO confirmado').waitFor();
      assert.equal(await page.getByText(/^DEMO-[A-F0-9-]{36}$/).count(), 1);
      await page.getByText('DEMO: no se procesó ninguna compra, pago ni pedido real.', { exact: true }).waitFor();
      assert.equal(await page.getByText(/persona@example\.test/).count(), 0);
      assert.equal(await page.evaluate(() => globalThis.localStorage.length + globalThis.sessionStorage.length), 0);
      await accessibility();
      await page.reload();
      await heading('Tu carrito está vacío').waitFor();
      assert.deepEqual(errors, []);
      assert.deepEqual(prohibited, []);
      if (supabase) assert.ok(catalogReads >= 5, 'Se esperaban lecturas reales del catálogo');
      globalThis.console.log(`PASS: carrito y checkout ${supabase ? 'Supabase local' : 'DEMO'} a ${width}px. Recarga, dos pestañas, ajuste, confirmación, axe y solo red permitida.`);
    } finally {
      await context.close();
    }
  }
}
