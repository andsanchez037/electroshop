import { useRef, useState } from 'react';
import { cartSignature, reconcileCart } from '../../data/cart';
import { cart, useCart } from '../../data/cart-store';
import { CatalogStatus, EmptyCart, OrderSummary, ShoppingLines, useShoppingCatalog } from './CartContent';

export default function CartPage() {
  const { lines, ready, memoryOnly, repaired } = useCart();
  const catalog = useShoppingCatalog();
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const clearButton = useRef<HTMLButtonElement>(null);
  const pending = useRef(false);
  async function change(work: () => Promise<string | undefined>, success: string, restoreFocus = false, sku?: string) {
    if (pending.current) return;
    pending.current = true;
    setMessage('');
    setError('');
    try {
      const failure = await work();
      if (failure) setError(failure);
      else setMessage(success);
      if (restoreFocus || sku) {
        requestAnimationFrame(() => {
          const next = sku ? document.getElementById(`cart-remove-${sku}`) : null;
          (next ?? heading.current)?.focus();
        });
      }
    } finally { pending.current = false; }
  }
  const reviewed = reconcileCart(lines, catalog.products);
  const blocked = reviewed.some(line => line.issue);
  return <>
    <h1 className="page-title shop-title" ref={heading} tabIndex={-1}>Tu carrito<span>.</span></h1>
    {memoryOnly && <p className="notice">El navegador bloquea el guardado. Tu carrito podría perderse al salir de esta página.</p>}
    {repaired && <p className="notice">Omitimos selecciones guardadas que no se pudieron recuperar.</p>}
    <p className="shop-announcement" role="status">{message}</p>
    {error && <p role="alert" className="notice">{error}</p>}
    {!ready ? <p className="empty" role="status">Cargando carrito…</p>
      : !lines.length ? <EmptyCart />
      : <>
        <div className="shop-toolbar">
          <a href="/catalogo" className="text-button">← Seguir comprando</a>
          {catalog.status === 'ready' && <a href="#resumen-pedido" className="text-button">Ver resumen</a>}
          <button className="text-button" type="button" ref={clearButton} onClick={() => {
            setConfirmation(cartSignature(lines));
            requestAnimationFrame(() => cancel.current?.focus());
          }}>Vaciar carrito</button>
        </div>
        {confirmation !== null && <section className="shop-panel cart-confirm" aria-labelledby="clear-cart-title">
          <h2 id="clear-cart-title">¿Vaciar tu carrito?</h2><p>Se quitarán todos los productos seleccionados.</p>
          <div className="shop-actions">
            <button type="button" ref={cancel} className="button secondary" onClick={() => { setConfirmation(null); clearButton.current?.focus(); }}>Conservar carrito</button>
            <button type="button" className="button" onClick={() => {
              setConfirmation(null);
              void change(() => cart.clear(confirmation), 'Vaciaste el carrito.', true);
            }}>Sí, vaciar carrito</button>
          </div>
        </section>}
        {catalog.status !== 'ready' ? <CatalogStatus status={catalog.status} retry={catalog.retry} />
          : <div className="shop-layout">
            <section aria-labelledby="cart-lines-title">
              <h2 className="sr-only" id="cart-lines-title">Productos en tu carrito</h2>
              <ShoppingLines lines={reviewed}
              onQuantity={(line, quantity) => { if (line.product) {
                const product = line.product;
                void change(() => cart.set(product, quantity, line.quantity), 'Cantidad actualizada.', line.issue === 'stock');
              } }}
              onRemove={sku => {
                const index = lines.findIndex(line => line.sku === sku);
                void change(() => cart.remove(sku), 'Producto eliminado.', true, lines[index + 1]?.sku ?? lines[index - 1]?.sku);
              }} />
            </section>
            <OrderSummary lines={reviewed}>
              {blocked ? <p className="shop-warning">Resuelve los cambios de disponibilidad para continuar.</p>
                : <a href="/checkout" className="button shop-primary">Continuar con el pedido</a>}
              <p className="shop-fine-print">El costo de entrega se muestra al elegir un método.</p>
            </OrderSummary>
          </div>}
      </>}
  </>;
}
