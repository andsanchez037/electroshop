import { useEffect, useState } from 'react';
import { categories, filterProducts, loadProducts, type Product } from '../data/catalog';
import ProductCard from './ProductCard';

export default function Catalog({ loader = loadProducts }: { loader?: () => Promise<readonly Product[]> }) {
  const [items, setItems] = useState<readonly Product[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [available, setAvailable] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get('q') ?? '');
    const initial = params.get('categoria') ?? '';
    setCategory(categories.some(c => c.id === initial) ? initial : '');
  }, []);
  useEffect(() => {
    let active = true;
    setStatus('loading');
    loader().then(data => { if (active) { setItems(data); setStatus('ready'); } })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [loader, attempt]);
  const filtered = filterProducts(items, query, category, available);
  function clear() { setQuery(''); setCategory(''); setAvailable(false); }
  return <div className="catalog-layout">
    <aside className="filters" aria-label="Filtros de catálogo">
      <h2>Encuentra tu pieza</h2>
      <label htmlFor="catalog-search">Nombre o SKU</label>
      <input id="catalog-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ej. Nova o ES-D001" />
      <label htmlFor="category">Categoría</label>
      <select id="category" value={category} onChange={event => setCategory(event.target.value)}>
        <option value="">Todas las categorías</option>
        {categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <label className="checkbox"><input type="checkbox" checked={available} onChange={event => setAvailable(event.target.checked)} /> Solo disponibles demo</label>
      <button type="button" className="text-button" onClick={clear}>Limpiar filtros</button>
      <p className="filter-note">Un catálogo para experimentar.<br />Todos los precios y existencias son ficticios.</p>
    </aside>
    <section aria-label="Productos" aria-busy={status === 'loading'}>
      <div className="results-bar"><p role="status">{status === 'loading' ? 'Cargando catálogo…' : status === 'error' ? 'Catálogo no disponible' : `${filtered.length} de ${items.length} productos`}</p><span>Precios demo · MXN</span></div>
      {status === 'error' ? <div className="empty" role="alert"><h2>No pudimos cargar los productos</h2><p>Intenta cargar el catálogo otra vez.</p><button className="button" onClick={() => setAttempt(attempt + 1)}>Reintentar</button></div>
        : status === 'ready' && filtered.length === 0 ? <div className="empty"><h2>{items.length ? 'No encontramos coincidencias' : 'Aún no hay productos'}</h2><p>Prueba otro nombre, SKU o categoría.</p><button className="button secondary" onClick={clear}>Limpiar filtros</button></div>
        : <div className="product-grid">{filtered.map(product => <ProductCard key={product.sku} product={product} />)}</div>}
    </section>
  </div>;
}
