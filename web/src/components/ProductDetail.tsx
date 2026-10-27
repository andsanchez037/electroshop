import { useEffect, useState } from 'react';
import { categories, findProduct, formatPrice, type Product } from '../data/catalog';
import ProductArt from './ProductArt';

export default function ProductDetail() {
  const [product, setProduct] = useState<Product | undefined>();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const found = findProduct(new URLSearchParams(window.location.search).get('sku'));
    setProduct(found);
    document.title = found ? `${found.name} | Electro Shop DEMO` : 'Producto no encontrado | Electro Shop';
    setReady(true);
  }, []);
  if (!ready) return <p role="status" className="empty">Cargando ficha del producto…</p>;
  if (!product) return <section className="empty"><h1>Producto no encontrado</h1><p>El SKU no existe en este catálogo de demostración.</p><a className="button" href="/catalogo">Explorar catálogo</a></section>;
  return <article className="detail-grid">
    <div><ProductArt category={product.category} /><p className="art-caption">Ilustración conceptual propia · producto ficticio</p></div>
    <div className="detail-copy"><p className="eyebrow">{categories.find(category => category.id === product.category)?.name} / DEMO</p>
      <h1>{product.name}</h1><p className="sku">SKU {product.sku}</p>
      <p className="detail-price">{formatPrice(product.price_cents)} <span>MXN · precio demo</span></p>
      <p>{product.description}</p>
      <p className="stock">{product.stock_demo ? `${product.stock_demo} unidades de stock demo` : 'Sin stock demo'}</p>
      <label htmlFor="quantity">Cantidad de referencia</label>
      <input id="quantity" type="number" min="1" max={product.stock_demo || 1} defaultValue="1" disabled={!product.stock_demo} className="quantity" aria-describedby="cart-note" />
      <button className="button cart-button" disabled aria-describedby="cart-note">Agregar al carrito · próximamente</button>
      <p id="cart-note" className="notice">DEMO / NO ES UNA COMPRA REAL. El carrito aún no está disponible; aquí no se guarda ninguna selección ni se procesa un pedido.</p>
    </div>
  </article>;
}
