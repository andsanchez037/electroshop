import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { assertPublicEnvironment } from '../../scripts/public-env.mjs';
import { categories } from './catalog';
import { fieldsFor, parseAdminProduct, validateProduct, type AdminCategory, type AdminProduct, type ProductDraft } from './admin-product';
import { openAdminSessionStore } from './admin-session';

export interface AdminSession { userId: string }
export interface AdminGateway {
  session(): Promise<AdminSession | null>;
  subscribe(callback: (session: AdminSession | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  isAdmin(): Promise<boolean>;
  listProducts(): Promise<AdminProduct[]>;
  listCategories(): Promise<AdminCategory[]>;
  saveProduct(value: ProductDraft, id?: string): Promise<void>;
  deleteProduct(id: string): Promise<void>;
}
export class AdminAccessError extends Error {
  constructor() { super('Tu sesión o permiso de administrador no está disponible. Vuelve a verificar el acceso.'); }
}
export class AdminOperationError extends Error {}
const select = 'id,sku,name,description,category_id,price_cents,stock_demo,is_active';
function failure(error: { code?: string; status?: number }): never {
  if (error.code === '42501' || error.code === 'PGRST301' || error.status === 401 || error.status === 403) throw new AdminAccessError();
  if (error.code === '23505') throw new AdminOperationError('El SKU ya existe. Usa otro SKU.');
  if (['23514', '23503', '23502', '22003'].includes(error.code ?? '')) throw new AdminOperationError('La base rechazó los valores. Revisa los campos y la categoría.');
  throw new AdminOperationError('No se pudo completar la operación. Comprueba la conexión e inténtalo de nuevo.');
}

// Un cliente Auth administrativo separado del fetch anónimo: nunca se transmite
// la sesión del admin a consultas del storefront. No hay acceso a admin_users.
export function gatewayFor(client: SupabaseClient): AdminGateway {
  const requireAdmin = async () => {
    const { data, error } = await client.rpc('current_user_is_admin');
    if (error) failure(error);
    if (data !== true) throw new AdminAccessError();
  };
  return {
    async session() { const { data, error } = await client.auth.getSession(); if (error) throw new AdminAccessError(); return data.session ? { userId: data.session.user.id } : null; },
    subscribe(callback) {
      // Callback síncrono: no consultas SDK dentro del lock de onAuthStateChange.
      const { data } = client.auth.onAuthStateChange((event, session) => callback(event !== 'SIGNED_OUT' && session ? { userId: session.user.id } : null));
      return () => data.subscription.unsubscribe();
    },
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw new AdminOperationError('No pudimos iniciar sesión. Revisa tus credenciales o inténtalo más tarde.');
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw new AdminOperationError('No se pudo confirmar el cierre remoto. La sesión local se ha cerrado.');
    },
    async isAdmin() { const { data, error } = await client.rpc('current_user_is_admin'); if (error) failure(error); if (typeof data !== 'boolean') throw new AdminOperationError('No se pudo verificar el acceso.'); return data; },
    async listProducts() {
      await requireAdmin();
      const result: AdminProduct[] = [];
      for (let offset = 0; ;) {
        const { data, error, count } = await client.from('products').select(select, { count: 'exact' }).order('sku').range(offset, offset + 499);
        if (error) failure(error);
        if (!data || count === null || count < offset + data.length || (!data.length && count > offset)) throw new AdminOperationError('El listado no pudo cargarse completo. Reintenta.');
        result.push(...data.map(parseAdminProduct)); offset += data.length;
        if (offset >= count) break;
      }
      if (new Set(result.map(p => p.id)).size !== result.length) throw new AdminOperationError('El listado cambió durante la consulta. Actualiza.');
      return result;
    },
    async listCategories() {
      await requireAdmin();
      const { data, error } = await client.from('categories').select('id,name,is_active').order('id');
      if (error) failure(error);
      if (!data || data.some(c => !categories.some(known => known.id === c.id) || typeof c.name !== 'string' || typeof c.is_active !== 'boolean')) throw new AdminOperationError('Las categorías no coinciden con el catálogo soportado.');
      return data as AdminCategory[];
    },
    async saveProduct(value, id) {
      const checked = validateProduct(fieldsFor(value));
      if (!checked.value) throw new AdminOperationError('Revisa los campos antes de guardar.');
      await requireAdmin();
      const query = id ? client.from('products').update(checked.value).eq('id', id) : client.from('products').insert(checked.value);
      const { data, error } = await query.select('id');
      if (error) failure(error);
      if (data?.length !== 1) throw new AdminAccessError();
    },
    async deleteProduct(id) {
      await requireAdmin();
      const { data, error } = await client.from('products').delete().eq('id', id).select('id');
      if (error) failure(error);
      if (data?.length !== 1) throw new AdminAccessError();
    },
  };
}

let browserGateway: Promise<AdminGateway> | undefined;
export function createAdminGateway(): Promise<AdminGateway> {
  return browserGateway ??= initializeAdminGateway().catch(error => {
    browserGateway = undefined;
    throw error;
  });
}

async function initializeAdminGateway(): Promise<AdminGateway> {
  const env = { PUBLIC_CATALOG_MODE: import.meta.env.PUBLIC_CATALOG_MODE, PUBLIC_SUPABASE_URL: import.meta.env.PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_PUBLISHABLE_KEY: import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY };
  assertPublicEnvironment({ ...env, PUBLIC_CATALOG_MODE: 'supabase' });
  if (env.PUBLIC_CATALOG_MODE !== 'supabase') throw new AdminOperationError('Administración requiere el modo Supabase configurado.');
  const url = env.PUBLIC_SUPABASE_URL!;
  const storage = await openAdminSessionStore(new URL(url).origin);
  const client = createClient(url, env.PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    // The SDK keeps its own session in memory and opens no Auth broadcast channel.
    auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false },
    global: { fetch: (input, init) => globalThis.fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(15000) }) },
  });
  const gateway = gatewayFor(client);
  if (!storage) return gateway;

  let signingOut = false;
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') storage.write(null);
    if (!signingOut && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) storage.write(session);
  });
  const tokens = storage.read();
  if (tokens) {
    try {
      const { error } = await client.auth.setSession(tokens);
      if (error) storage.write(null);
    } catch {
      storage.write(null);
    }
  }
  return {
    ...gateway,
    async signOut() {
      signingOut = true;
      storage.write(null);
      try { await gateway.signOut(); }
      finally { signingOut = false; }
    },
  };
}
