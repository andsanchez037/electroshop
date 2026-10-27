import { categories, formatPrice, productUrl, type Product } from '../data/catalog';
import ProductArt from './ProductArt';

export default function ProductCard({ product }: { product: Product }) {
  return <article className="product-card">
    <a href={productUrl(product.sku)} className="product-link">
      <ProductArt category={product.category} />
      <div className="card-body">
        <p className="eyebrow">{categories.find(category => category.id === product.category)?.name} · DEMO</p>
        <h3>{product.name}</h3>
        <p className="sku">{product.sku}</p>
        <div className="price-row"><strong>{formatPrice(product.price_cents)}</strong><span aria-hidden="true">↗</span></div>
        <p className={`stock ${product.stock_demo ? '' : 'unavailable'}`}>{product.stock_demo ? '● Disponible demo' : '○ Sin stock demo'}</p>
        <span className="card-detail">Ver producto <span aria-hidden="true">→</span></span>
      </div>
    </a>
  </article>;
}
