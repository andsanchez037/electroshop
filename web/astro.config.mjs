import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import process from 'node:process';
import { URL } from 'node:url';
import { assertPublicEnvironment } from './scripts/public-env.mjs';

// Validar ANTES de generar un bundle; nunca imprimir valores de archivos .env.
for (const name of readdirSync(new URL('./', import.meta.url)).filter(name => /^\.env(?:\.[A-Za-z0-9_.-]+)?$/.test(name))) {
  const file = new URL(name, import.meta.url);
  const values = parseEnv(readFileSync(file, 'utf8'));
  // Vite resolverá modo y precedencia; validar también archivos de modos personalizados.
  assertPublicEnvironment(values, { requireComplete: false });
}
assertPublicEnvironment(process.env, { requireComplete: false });

export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
