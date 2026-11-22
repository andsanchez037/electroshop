import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import { completeSummary, completeTap, isLocalDocker } from './db-test-results.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const run = (name, args, input) => spawnSync(name, args, {
  encoding: 'utf8', windowsHide: true, stdio: 'pipe', timeout: 120000, cwd: root,
  maxBuffer: 4 * 1024 * 1024, input,
});
const stop = (message, code) => { globalThis.console.error(message); process.exit(code); };
if (process.argv.length !== 2) stop('FAIL: este runner no acepta argumentos ni destinos.', 1);
const version = run('supabase', ['--version']);
const major = Number(version.stdout?.trim().match(/^(\d+)\./)?.[1]);
if (version.status !== 0 || ![2, 3].includes(major)) {
  stop('BLOCKED_EXTERNAL: requiere Supabase CLI oficial 2.x o 3.x (ejecutable en PATH).', 2);
}
// Comprobar el endpoint antes de contactar el daemon; nunca Docker remoto.
const context = run('docker', ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}']);
const endpoint = process.env.DOCKER_HOST || context.stdout?.trim() || '';
if (context.status !== 0 || !isLocalDocker(endpoint)) {
  stop('BLOCKED_EXTERNAL: se requiere un endpoint Docker local verificable.', 2);
}
const engine = run('docker', ['version', '--format', '{{.Server.Os}}']);
if (engine.status !== 0 || engine.stdout.trim() !== 'linux') stop('BLOCKED_EXTERNAL: motor Docker Linux local no disponible.', 2);
// Archivos/recuentos fijos; no aceptar destinos o planes desde argumentos externos.
for (const [file, count] of [['catalog_rls.test.sql', 53], ['admin_access.test.sql', 16]]) {
// CLI 3 eliminó --local: sin --remote el destino es exclusivamente local.
const result = run('supabase', ['test', 'db', `supabase/tests/database/${file}`, ...(major === 2 ? ['--local'] : []), '--workdir', root]);
const output = (result.stdout ?? '') + (result.stderr ?? '');
if (result.status !== 0 || !completeSummary(output, count)) {
  stop(`FAIL: ${file} no acredita exactamente ${count} tests PASS sin omisiones. Salida sensible omitida.`, 1);
}
// pg_prove oculta el TAP: reejecutar la transacción para verificar cada número.
const sql = readFileSync(new URL(`../../supabase/tests/database/${file}`, import.meta.url), 'utf8');
const tap = run('docker', ['exec', '-i', 'supabase_db_electroshop-local', 'psql', '-XAt', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres'], sql);
if (tap.status !== 0 || !completeTap(tap.stdout ?? '', count)) stop(`FAIL: TAP ${file} incompleto; se requieren ${count}/${count}.`, 1);
globalThis.console.log(`PASS: ${file} ${count}/${count} en pg_prove y TAP independiente; sin fallos, SKIP o TODO. Solo local.`);
}
