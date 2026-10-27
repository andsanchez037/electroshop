import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { URL } from 'node:url';
import { categories, products } from '../src/data/catalog.ts';

const quote = value => `'${value.replaceAll("'", "''")}'`;
const target = new URL('../../supabase/seed.sql', import.meta.url);
const sql = `-- Generado desde web/src/data/catalog.ts. DEMO; sin usuarios ni administradores.
-- Regenerar: cd web && npm run seed:generate. Revisar antes de aplicar SQL.
begin;
insert into public.categories (id, name, description, is_active) values
${categories.map(c => `  (${quote(c.id)}, ${quote(c.name)}, ${quote(c.description)}, true)`).join(',\n')}
on conflict (id) do update set name = excluded.name, description = excluded.description, is_active = excluded.is_active;

insert into public.products (sku, name, description, category_id, price_cents, stock_demo, is_active) values
${products.map(p => `  (${quote(p.sku)}, ${quote(p.name)}, ${quote(p.description)}, ${quote(p.category)}, ${p.price_cents}, ${p.stock_demo}, true)`).join(',\n')}
on conflict (sku) do update set name = excluded.name, description = excluded.description,
  category_id = excluded.category_id, price_cents = excluded.price_cents,
  stock_demo = excluded.stock_demo, is_active = excluded.is_active;
commit;
`;
if (process.argv.includes('--check')) {
  if ((await readFile(target, 'utf8')).replaceAll('\r\n', '\n') !== sql) {
    globalThis.console.error('FAIL: seed.sql no coincide con los 16 productos aprobados.');
    process.exitCode = 1;
  } else globalThis.console.log('PASS: seed reproducible, idéntico a los 16 productos de CP-002.');
} else {
  await writeFile(target, sql, 'utf8');
  globalThis.console.log('Seed SQL generado localmente; no se ejecutó contra ninguna base.');
}
