import { defineConfig } from 'vitest/config';
export default defineConfig({ test: {
  environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'],
  // Nunca leer el proyecto real durante pruebas frontend. Los tests del adaptador inyectan transporte.
  env: { PUBLIC_CATALOG_MODE: 'demo', PUBLIC_SUPABASE_URL: '', PUBLIC_SUPABASE_PUBLISHABLE_KEY: '' },
} });
