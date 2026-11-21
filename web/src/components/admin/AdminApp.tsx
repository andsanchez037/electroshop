import { useCallback, useEffect, useRef, useState, type SubmitEvent } from 'react';
import { AdminAccessError, AdminOperationError, createAdminGateway, type AdminGateway, type AdminSession } from '../../data/admin-source';
import { type AdminCategory, type AdminProduct, type ProductDraft } from '../../data/admin-product';
import { formatPrice, normalize } from '../../data/catalog';
import ProductForm from './ProductForm';

type Access = 'checking' | 'login' | 'denied' | 'admin' | 'error';
const message = (error: unknown) => error instanceof AdminOperationError || error instanceof AdminAccessError ? error.message : 'No se pudo completar la operación. Comprueba tu conexión e inténtalo de nuevo.';

export default function AdminApp({ gateway: supplied }: { gateway?: AdminGateway }) {
  const [gateway, setGateway] = useState<AdminGateway | null>(supplied ?? null);
  const [session, setSession] = useState<AdminSession | null>();
  const [access, setAccess] = useState<Access>('checking');
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false); const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<AdminProduct | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AdminProduct | null>(null);
  const [query, setQuery] = useState(''); const [visibility, setVisibility] = useState('');
  const epoch = useRef(0); const action = useRef(false);
  const identity = useRef<string | null | undefined>(undefined);
  const signingOut = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null); const deleteCancel = useRef<HTMLButtonElement>(null);
  const clearPrivate = useCallback(() => { setProducts([]); setCategories([]); setEditor(null); setDeleting(null); }, []);
  const transition = useCallback((next: string | null) => {
    if (identity.current === next) return;
    identity.current = next;
    ++epoch.current;
    clearPrivate();
    setSession(next ? { userId: next } : null);
    setAccess(next ? 'checking' : 'login');
    setNotice('');
    setError('');
  }, [clearPrivate]);

  useEffect(() => {
    if (gateway) return;
    let active = true;
    createAdminGateway().then(next => { if (active) setGateway(next); })
      .catch(() => {
        if (active) { setError('Administración no configurada. Requiere Supabase y la migración CP-004 revisada.'); setAccess('error'); }
      });
    return () => { active = false; };
  }, [gateway, revision]);

  useEffect(() => {
    if (!gateway) return;
    let active = true; let receivedEvent = false;
    const unsubscribe = gateway.subscribe(next => {
      receivedEvent = true;
      if (active && !signingOut.current) transition(next?.userId ?? null);
    });
    gateway.session().then(next => { if (active && !receivedEvent) transition(next?.userId ?? null); })
      .catch(() => { if (active && !receivedEvent) { transition(null); setError('La sesión no pudo recuperarse. Vuelve a iniciar sesión.'); } });
    return () => { active = false; ++epoch.current; unsubscribe(); };
  }, [gateway, transition]);

  useEffect(() => {
    if (!gateway || !session) return;
    const current = ++epoch.current;
    clearPrivate(); setAccess('checking');
    (async () => {
      try {
        if (!await gateway.isAdmin()) { if (epoch.current === current) setAccess('denied'); return; }
        if (epoch.current !== current) return;
        const [items, groups] = await Promise.all([gateway.listProducts(), gateway.listCategories()]);
        if (epoch.current !== current) return;
        setProducts(items); setCategories(groups); setAccess('admin'); setError('');
      } catch (e) { if (epoch.current === current) { clearPrivate(); setAccess(e instanceof AdminAccessError ? 'denied' : 'error'); setError(message(e)); } }
    })();
    return () => { if (epoch.current === current) ++epoch.current; };
  }, [gateway, session, revision, clearPrivate]);

  // Revocación/expiración: reevaluación en BD, sin leer metadata ni cachear roles.
  useEffect(() => {
    if (!gateway || access !== 'admin') return;
    const recheck = async () => {
      const current = epoch.current;
      try { if (await gateway.isAdmin()) return; } catch { /* fallo cerrado */ }
      if (epoch.current === current) { ++epoch.current; clearPrivate(); setAccess('denied'); setError('El permiso dejó de estar disponible. Verifica tu sesión.'); }
    };
    const visible = () => { if (document.visibilityState === 'visible') void recheck(); };
    const timer = window.setInterval(() => void recheck(), 30000);
    window.addEventListener('focus', visible);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', visible); };
  }, [gateway, access, clearPrivate]);

  useEffect(() => { if (editor) heading.current?.focus(); if (deleting) deleteCancel.current?.focus(); }, [editor, deleting]);

  async function login(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); if (!gateway || action.current) return;
    const form = event.currentTarget; const data = new FormData(form);
    const email = String(data.get('email') ?? '').trim(); const password = String(data.get('password') ?? '');
    action.current = true; setBusy(true); setError('');
    try { await gateway.signIn(email, password); }
    catch (e) { setError(message(e)); }
    finally { const input = form.elements.namedItem('password'); if (input instanceof HTMLInputElement) input.value = ''; action.current = false; setBusy(false); }
  }
  async function logout() {
    if (!gateway || action.current) return;
    action.current = true; signingOut.current = true; setBusy(true); transition(null);
    try { await gateway.signOut(); } catch (e) { setError(message(e)); }
    finally { signingOut.current = false; action.current = false; setBusy(false); }
  }
  async function mutate(work: () => Promise<void>, success: string) {
    if (!gateway || access !== 'admin' || action.current) return;
    action.current = true; setBusy(true); setError(''); setNotice(''); const current = epoch.current;
    try {
      await work();
      if (epoch.current === current) { setEditor(null); setDeleting(null); setNotice(success); setRevision(n => n + 1); }
    } catch (e) {
      if (epoch.current === current) {
        setError(message(e));
        if (e instanceof AdminAccessError) { ++epoch.current; clearPrivate(); setAccess('denied'); }
      }
    } finally { action.current = false; setBusy(false); }
  }
  const retry = () => { setError(''); setRevision(n => n + 1); };
  const filtered = products.filter(p => (!query || normalize(`${p.sku} ${p.name}`).includes(normalize(query))) && (!visibility || String(p.is_active) === visibility));
  return <div className="admin-app">
    {notice && <p role="status" className="notice">{notice}</p>}
    {error && <p role="alert" className="admin-error">{error}</p>}
    {session && <div className="admin-actions"><span>{access === 'admin' ? 'Administrador verificado en PostgreSQL' : 'Sesión autenticada · acceso pendiente o no autorizado'}</span><button className="button secondary" disabled={busy} onClick={logout}>Cerrar sesión</button></div>}
    {access === 'checking' && <p role="status">Verificando acceso…</p>}
    {access === 'login' && <section className="admin-panel admin-login" aria-labelledby="login-title"><h2 id="login-title">Iniciar sesión</h2><p>Acceso exclusivo a administradores autorizados.</p>
      <form onSubmit={login}><fieldset disabled={busy} className="admin-fields"><legend className="sr-only">Credenciales</legend>
        <div className="admin-full"><label htmlFor="admin-email">Correo electrónico</label><input id="admin-email" name="email" type="email" autoComplete="username" required maxLength={254} /></div>
        <div className="admin-full"><label htmlFor="admin-password">Contraseña</label><input id="admin-password" name="password" type="password" autoComplete="current-password" required /></div>
      </fieldset><button className="button" type="submit" disabled={busy}>{busy ? 'Iniciando sesión…' : 'Entrar'}</button></form>
    </section>}
    {access === 'denied' && <section className="admin-panel"><h2>Acceso no autorizado</h2><p>Una cuenta autenticada no concede permisos de administración. Solicita al operador que revise tu acceso.</p><button className="button secondary" onClick={retry}>Verificar acceso</button></section>}
    {access === 'error' && <section className="admin-panel"><h2>No pudimos verificar la administración</h2><p>El listado permanece cerrado hasta comprobar sesión y permisos.</p><button className="button secondary" onClick={retry}>Reintentar acceso</button></section>}
    {access === 'admin' && <>
      <h2>Productos del catálogo</h2>
      <div className="admin-actions"><p role="status">{products.length} productos · {products.filter(p => p.is_active).length} activos · {products.filter(p => !p.stock_demo).length} sin stock</p><button className="button" disabled={busy || !!editor || !!deleting} onClick={() => { setEditor('new'); setNotice(''); }}>Nuevo producto</button><button className="button secondary" disabled={busy || !!editor || !!deleting} onClick={retry}>Actualizar listado</button></div>
      {editor && <><h2 className="sr-only" ref={heading} tabIndex={-1}>Formulario de producto</h2><ProductForm key={editor === 'new' ? 'new' : editor.id} product={editor === 'new' ? undefined : editor} categories={categories} busy={busy} onCancel={() => setEditor(null)} onSave={(value: ProductDraft) => mutate(() => gateway!.saveProduct(value, editor === 'new' ? undefined : editor.id), 'Producto guardado.')} /></>}
      {deleting && <section className="admin-panel admin-confirm" role="region" aria-labelledby="delete-title"><h2 id="delete-title">Confirmar eliminación</h2><p>¿Eliminar definitivamente {deleting.sku} · {deleting.name}? Esta acción no se puede deshacer. Puedes ocultarlo mediante edición en su lugar.</p><div className="admin-actions"><button className="button secondary" ref={deleteCancel} disabled={busy} onClick={() => setDeleting(null)}>Cancelar eliminación</button><button className="button danger" disabled={busy} onClick={() => mutate(() => gateway!.deleteProduct(deleting.id), 'Producto eliminado.')}>{busy ? 'Eliminando…' : 'Eliminar definitivamente'}</button></div></section>}
      <div className="admin-filters"><div><label htmlFor="admin-search">Buscar producto por nombre o SKU</label><input id="admin-search" value={query} onChange={e => setQuery(e.target.value)} type="search" /></div><div><label htmlFor="admin-visibility">Filtrar visibilidad</label><select id="admin-visibility" value={visibility} onChange={e => setVisibility(e.target.value)}><option value="">Todos</option><option value="true">Activos</option><option value="false">Ocultos</option></select></div></div>
      <p role="status">{filtered.length} resultados</p>
      {filtered.length === 0 ? <p className="empty">No hay productos que mostrar.</p> : <ul className="admin-products">{filtered.map(p => <li key={p.id} className="admin-panel"><div><h3>{p.name}</h3><p className="sku">{p.sku}</p><p>{formatPrice(p.price_cents)} · {categories.find(c => c.id === p.category_id)?.name}</p><p>{p.is_active ? 'Activo' : 'Oculto'} · {p.stock_demo ? `${p.stock_demo} unidades demo` : 'Sin stock demo'}{categories.find(c => c.id === p.category_id)?.is_active === false ? ' · Categoría oculta: no visible al público' : ''}</p></div><div className="admin-actions"><button className="button secondary" aria-label={`Editar ${p.sku}`} disabled={busy || !!editor || !!deleting} onClick={() => { setEditor(p); setNotice(''); }}>Editar</button><button className="text-button" aria-label={`Eliminar ${p.sku}`} disabled={busy || !!editor || !!deleting} onClick={() => { setDeleting(p); setNotice(''); }}>Eliminar</button></div></li>)}</ul>}
    </>}
  </div>;
}
