import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';
import process from 'node:process';

const available = name => spawnSync(name, ['--version'], { encoding: 'utf8', windowsHide: true, stdio: 'pipe' }).status === 0;
if (!available('supabase') || !available('docker')) {
  globalThis.console.error('BLOCKED_EXTERNAL: pruebas RLS sin ejecutar. Requieren Supabase CLI y Docker locales; no se intentó conexión remota.');
  process.exitCode = 2;
} else {
  if (spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], { stdio: 'pipe', windowsHide: true }).status !== 0) {
    globalThis.console.error('BLOCKED_EXTERNAL: Docker local no está disponible. No se ejecutó SQL.');
    process.exit(2);
  }
  // Sin --linked ni --db-url; no aceptar argumentos para apuntar a otra base.
  const result = spawnSync('supabase', ['test', 'db', '--local', '--workdir', fileURLToPath(new URL('../../', import.meta.url))],
    { encoding: 'utf8', windowsHide: true, stdio: 'pipe' });
  // No imprimir salida arbitraria de CLI (podría contener secretos de configuración).
  const output = (result.stdout ?? '') + (result.stderr ?? '');
  if (result.status === 0 && /Result:\s*PASS/i.test(output) && /Tests=[1-9]\d*/.test(output) && !/not ok|Bail out!/i.test(output)) {
    globalThis.console.log('PASS: suite pgTAP RLS ejecutada en Supabase local.');
  } else {
    const blocked = /not running|connection refused|failed to connect|cannot connect/i.test(output);
    globalThis.console.error(blocked ? 'BLOCKED_EXTERNAL: base Supabase local no disponible. No se probó el remoto.'
      : 'FAIL: suite pgTAP local no superada o sin evidencia de tests ejecutados. Revisa la salida en una terminal segura. No se probó el remoto.');
    process.exitCode = blocked ? 2 : 1;
  }
}
