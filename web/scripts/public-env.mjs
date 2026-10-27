/** Valida sin devolver ni registrar claves o URLs.
 * @param {Record<string, string | undefined>} values
 * @param {{ requireComplete?: boolean }} [options]
 */
export function assertPublicEnvironment(values, options = {}) {
  const mode = values.PUBLIC_CATALOG_MODE ?? 'demo';
  if (!['demo', 'supabase'].includes(mode)) throw new Error('PUBLIC_CATALOG_MODE debe ser demo o supabase.');
  const key = values.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (key !== undefined && key !== '' && !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    throw new Error('PUBLIC_SUPABASE_PUBLISHABLE_KEY solo admite publishable keys; valor omitido.');
  }
  for (const [name, value] of Object.entries(values)) {
    if (!name.startsWith('PUBLIC_')) continue;
    if (!['PUBLIC_CATALOG_MODE', 'PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_PUBLISHABLE_KEY'].includes(name)
      || /SECRET|SERVICE_ROLE|PASSWORD|TOKEN/i.test(name)
      || (value && /sb_secret_|service_role|-----BEGIN .*PRIVATE KEY|^eyJ/.test(value))) {
      throw new Error('Variable PUBLIC_* potencialmente secreta; nombre y valor omitidos.');
    }
  }
  const suppliedUrl = values.PUBLIC_SUPABASE_URL;
  if (suppliedUrl !== undefined && suppliedUrl !== '') {
    let url;
    try { url = new globalThis.URL(suppliedUrl); } catch { throw new Error('Supabase requiere URL pública válida; valor omitido.'); }
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:'))
      || url.username || url.password || url.pathname !== '/' || url.hash || url.search
      || suppliedUrl.includes('$')) throw new Error('Supabase requiere origen HTTPS o localhost; valor omitido.');
    if (mode === 'supabase' && options.requireComplete !== false && /TU-PROYECTO/i.test(url.hostname)) {
      throw new Error('Configura una URL de Supabase real o local; valor omitido.');
    }
  }
  if (mode === 'supabase' && options.requireComplete !== false) {
    if (!key || /REEMPLAZAR|TU_CLAVE|PLACEHOLDER/i.test(key)) throw new Error('Supabase requiere publishable key configurada; valor omitido.');
    if (!suppliedUrl) throw new Error('Supabase requiere URL pública válida; valor omitido.');
  }
}
