import { useEffect, useState } from 'react';
import { loadProducts, productUrl, type Product } from '../../data/catalog';
import { formatCents, itemCount, lineTotal, subtotal, type ReviewedLine } from '../../data/cart';
import ProductArt from '../ProductArt';
import { CartIcon } from './CartControls';

export const demoNotice = 'DEMO: no se procesó ninguna compra, pago ni pedido real.';

export function useShoppingCatalog(loader = loadProducts) {
  const [state, setState] = useState<{ status: 'loading' | 'error' | 'ready'; products: readonly Product[] }>({ status: 'loading', products: [] });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loader().then(products => { if (active) setState({ status: 'ready', products }); })
      .catch(() => { if (active) setState({ status: 'error', products: [] }); });
    return () => { active = false; };
  }, [attempt, loader]);
  return {
    ...state,
    replace: (products: readonly Product[]) => setState({ status: 'ready', products }),
    retry: () => { setState({ status: 'loading', products: [] }); setAttempt(attempt + 1); },
  };
}

export function EmptyCart() {
  return <section className="empty shop-empty">
    <div className="empty-icon"><CartIcon /></div>
    <h2>Tu carrito está vacío</h2>
    <p>Explora el catálogo y agrega las piezas para tu próximo proyecto.</p>
    <a href="/catalogo" className="button">Explorar catálogo</a>
  </section>;
}

export function CatalogStatus({ status, retry }: { status: 'loading' | 'error'; retry: () => void }) {
  if (status === 'loading') return <p className="empty" role="status">Consultando precios y existencias…</p>;
  return <section className="empty" role="alert"><h2>El catálogo no está disponible</h2>
    <p>Conservamos tu selección. Vuelve a consultar para revisar precios y existencias.</p>
    <button type="button" className="button secondary" onClick={retry}>Reintentar</button></section>;
}

export function OrderSummary({ lines, shipping, children }: { lines: readonly ReviewedLine[]; shipping?: bigint; children?: React.ReactNode }) {
  const count = itemCount(lines);
  const sum = subtotal(lines);
  const valid = !lines.some(line => line.issue);
  return <aside id="resumen-pedido" tabIndex={-1} className="order-summary" aria-label="Resumen del pedido">
    <h2>Resumen del pedido</h2>
    <p>{count.toLocaleString('es-MX')} {count === 1 ? 'artículo' : 'artículos'}</p>
    <dl>
      <div><dt>Subtotal</dt><dd>{valid ? formatCents(sum) : 'Por revisar'}</dd></div>
      {shipping !== undefined && <div><dt>Entrega simulada</dt><dd>{formatCents(shipping)}</dd></div>}
      <div className="order-total"><dt>Total <span>MXN</span></dt><dd>{valid ? formatCents(sum + (shipping ?? 0n)) : 'Por revisar'}</dd></div>
    </dl>
    {children}
    <p className="shop-fine-print">Proyecto académico. Aquí no se realiza ninguna compra ni pago.</p>
  </aside>;
}

export function ShoppingLines({ lines, onQuantity, onRemove }: {
  lines: readonly ReviewedLine[];
  onQuantity?: (line: ReviewedLine, quantity: number) => void;
  onRemove?: (sku: string) => void;
}) {
  return <ul className="shopping-lines" aria-label="Productos seleccionados">{lines.map(line => {
    const { product, quantity, sku, issue } = line;
    const name = product?.name ?? sku;
    return <li key={sku} className="shopping-line">
      {product ? <ProductArt category={product.category} /> : <div className="line-placeholder"><CartIcon /></div>}
      <div className="line-description">
        <h3>{product ? <a href={productUrl(sku)}>{name}</a> : 'Producto no disponible'}</h3>
        <p className="sku">{sku}</p>
        {product && <p>{formatCents(product.price_cents)} <span className="shop-fine-print">por unidad</span></p>}
        <p className={issue ? 'shop-warning' : 'stock'}>{issue === 'missing' ? 'Ya no aparece en el catálogo. Elimínalo para continuar.'
          : issue === 'stock' ? product.stock_demo ? `Quedan ${product.stock_demo} unidades. Ajusta la cantidad o elimina el producto.` : 'Agotado. Elimínalo para continuar.'
            : 'Disponible · DEMO'}</p>
      </div>
      <div className="line-actions">
        <strong>{product ? formatCents(lineTotal(product.price_cents, quantity)) : '—'}</strong>
        {onQuantity && product && !issue ? <div className="line-quantity" aria-label={`Cantidad de ${name}`} role="group">
          <button type="button" disabled={quantity <= 1} aria-label={`Reducir cantidad de ${name}`} onClick={() => onQuantity(line, quantity - 1)}>−</button>
          <span aria-live="polite">{quantity}</span>
          <button type="button" disabled={quantity >= product.stock_demo} aria-label={`Aumentar cantidad de ${name}`} onClick={() => onQuantity(line, quantity + 1)}>+</button>
        </div> : <span className="shop-fine-print">{quantity} {quantity === 1 ? 'unidad' : 'unidades'}</span>}
        {onQuantity && issue === 'stock' && product.stock_demo > 0 &&
          <button className="text-button" type="button" onClick={() => onQuantity(line, product.stock_demo)}>Ajustar a {product.stock_demo}</button>}
        {onRemove && <button id={`cart-remove-${sku}`} className="text-button line-remove" type="button" aria-label={`Eliminar ${name} del carrito`} onClick={() => onRemove(sku)}>Eliminar</button>}
      </div>
    </li>;
  })}</ul>;
}
