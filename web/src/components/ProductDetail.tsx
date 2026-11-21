import { useEffect, useState } from 'react';
import { categories, loadProducts, normalize, formatPrice, type Product } from '../data/catalog';
import ProductArt from './ProductArt';
import { AddToCart } from './cart/CartControls';

export default function ProductDetail({ loader = loadProducts }: { loader?: () => Promise<readonly Product[]> }) {
  const [product, setProduct] = useState<Product | undefined>();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setReady(false);
    setError(false);
    const sku = new URLSearchParams(window.location.search).get('sku');
    if (!sku?.trim()) { setProduct(undefined); setReady(true); return; }
    loader().then(items => {
      if (!active) return;
      const found = items.find(item => normalize(item.sku) === normalize(sku));
      setProduct(found);
      document.title = found ? `${found.name} | Electro Shop DEMO` : 'Producto no encontrado | Electro Shop';
      setReady(true);
    }).catch(() => { if (active) { setError(true); setReady(true); } });
    return () => { active = false; };
  }, [loader, attempt]);
  if (!ready) return <p role="status" className="empty">Cargando ficha del producto…</p>;
  if (error) return <section className="empty" role="alert"><h1>No pudimos cargar el producto</h1><p>Intenta consultar el catálogo otra vez.</p><button className="button" onClick={() => setAttempt(attempt + 1)}>Reintentar</button></section>;
  if (!product) return <section className="empty"><h1>Producto no encontrado</h1><p>El SKU no existe en este catálogo de demostración.</p><a className="button" href="/catalogo">Explorar catálogo</a></section>;
  return <article className="detail-grid">
    <div><ProductArt category={product.category} /><p className="art-caption">Ilustración conceptual propia · producto ficticio</p></div>
    <div className="detail-copy"><p className="eyebrow">{categories.find(category => category.id === product.category)?.name} / DEMO</p>
      <h1>{product.name}</h1><p className="sku">SKU {product.sku}</p>
      <p className="detail-price">{formatPrice(product.price_cents)} <span>MXN · precio demo</span></p>
      <p>{product.description}</p>
      <p className="stock">{product.stock_demo ? `${product.stock_demo} unidades de stock demo` : 'Sin stock demo'}</p>
      <AddToCart key={product.sku} product={product} />
    </div>
  </article>;
}
