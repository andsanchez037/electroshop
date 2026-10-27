import { createServer } from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import axe from 'axe-core';

// Servidor estático exclusivo del test. No despliega ni contacta servicios externos.
const root = resolve('dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new globalThis.URL(request.url, 'http://localhost').pathname);
    let file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + sep)) throw new Error('Invalid path');
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    response.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    response.end(await readFile(file));
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/html' });
    response.end(await readFile(resolve(root, '404.html')));
  }
});
await new Promise(done => server.listen(4322, '127.0.0.1', done));
let browser;
try {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await mkdir('../docs/evidencia/CP-002', { recursive: true });
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [route, label] of [['/', 'inicio'], ['/catalogo', 'catalogo'], ['/producto?sku=ES-D001', 'producto'], ['/acerca', 'acerca']]) {
      const response = await page.goto(`http://127.0.0.1:4322${route}`);
      assert.equal(response.status(), 200);
      if (label === 'catalogo') await page.getByText('16 de 16 productos').waitFor();
      if (label === 'producto') await page.getByRole('heading', { name: 'Placa de desarrollo Nova' }).waitFor();
      assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth), true, `Desbordamiento ${label} ${width}`);
      await page.addScriptTag({ content: axe.source });
      const violations = await page.evaluate(async () => (await globalThis.axe.run()).violations);
      assert.deepEqual(violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), [], `Accesibilidad ${label} ${width}`);
      await page.screenshot({ path: `../docs/evidencia/CP-002/${label}-${width}.png`, fullPage: true });
    }
  }
  await page.goto('http://127.0.0.1:4322/');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(), 'Saltar al contenido');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'contenido');
  await page.getByRole('searchbox').fill('es-d001');
  await page.getByRole('button', { name: 'Buscar en el catálogo' }).click();
  await page.getByText('1 de 16 productos').waitFor();
  await page.getByLabel('Nombre o SKU', { exact: true }).fill('ES-C');
  await page.getByLabel('Categoría', { exact: true }).selectOption('componentes');
  await page.getByLabel('Solo disponibles demo').check();
  await page.getByText('3 de 16 productos').waitFor();
  await page.getByLabel('Nombre o SKU', { exact: true }).fill('inexistente');
  await page.getByRole('heading', { name: 'No encontramos coincidencias' }).waitFor();
  await page.getByRole('button', { name: 'Limpiar filtros' }).first().click();
  await page.getByText('16 de 16 productos').waitFor();
  await page.getByRole('link', { name: /Placa de desarrollo Nova/ }).click();
  await page.getByRole('heading', { name: 'Placa de desarrollo Nova' }).waitFor();
  assert.equal(await page.getByRole('button', { name: /Agregar al carrito/ }).isDisabled(), true);
  await page.reload();
  await page.getByRole('heading', { name: 'Placa de desarrollo Nova' }).waitFor();
  await page.goto('http://127.0.0.1:4322/producto?sku=INVALIDO');
  await page.getByRole('heading', { name: 'Producto no encontrado' }).waitFor();
  assert.equal((await page.goto('http://127.0.0.1:4322/no-existe')).status(), 404);
  await page.getByRole('heading', { name: 'Esta conexión no existe.' }).waitFor();
  assert.deepEqual(errors, [], 'Errores JS del navegador');
  globalThis.console.log('PASS: 360/1440 px, 4 rutas, axe (incluye contraste), búsqueda, filtros, SKU, recarga, teclado, 404; sin errores JS. 8 capturas.');
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
