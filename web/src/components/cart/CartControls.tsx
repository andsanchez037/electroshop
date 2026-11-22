import { useId, useRef, useState, type SubmitEvent } from 'react';
import type { Product } from '../../data/catalog';
import { itemCount, parseQuantity, validQuantity } from '../../data/cart';
import { cart, useCart } from '../../data/cart-store';

export function CartIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M2 3h3l2.2 11h12l2-8H6M8 19h.01M18 19h.01" strokeLinecap="round" strokeLinejoin="round" /><circle cx="8" cy="19" r="1" /><circle cx="18" cy="19" r="1" />
  </svg>;
}

export function CartLink({ current }: { current: boolean }) {
  const { lines } = useCart();
  const count = itemCount(lines);
  return <a className="header-cart" href="/carrito" aria-current={current ? 'page' : undefined}>
    <CartIcon /><span>Carrito</span>{' '}<strong>{count.toLocaleString('es-MX')}</strong>{' '}
    <span className="sr-only">{count === 1 ? 'artículo' : 'artículos'}</span>
  </a>;
}

export function AddToCart({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { lines, ready, memoryOnly } = useCart();
  const [quantity, setQuantity] = useState('1');
  const [feedback, setFeedback] = useState<{ error?: string; quantity?: number }>({});
  const [busy, setBusy] = useState(false);
  const lastAdd = useRef(-Infinity);
  const pending = useRef(false);
  const field = useRef<HTMLInputElement>(null);
  const id = useId();
  const remaining = product.stock_demo - (lines.find(line => line.sku === product.sku)?.quantity ?? 0);
  async function add(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || performance.now() - lastAdd.current < 350) return;
    const units = parseQuantity(quantity);
    if (!validQuantity(units) || units > remaining) {
      setFeedback({ error: `Elige una cantidad de 1 a ${remaining}.` });
      field.current?.focus();
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      const error = await cart.add(product, units);
      if (error) setFeedback({ error });
      else {
        lastAdd.current = performance.now();
        setFeedback({ quantity: units });
      }
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return <form className={compact ? 'add-product add-product-compact' : 'add-product'} onSubmit={add} noValidate>
    <label htmlFor={id}>Cantidad<span className="sr-only"> de {product.name}</span></label>
    <div className="add-product-actions">
      <input id={id} ref={field} type="number" inputMode="numeric" min="1" max={Math.max(remaining, 1)} step="1"
        value={quantity} onChange={event => { setQuantity(event.target.value); setFeedback({}); }}
        disabled={!ready || remaining <= 0 || busy} aria-invalid={feedback.error ? true : undefined} aria-describedby={feedback.error ? `${id}-message` : undefined} />
      <button className="button" disabled={!ready || remaining <= 0 || busy} type="submit"
        aria-label={`Agregar al carrito: ${product.name}`}>{busy ? 'Agregando…' : 'Agregar al carrito'}</button>
    </div>
    <div className="add-product-feedback" id={`${id}-message`} role="status">
      {feedback.error ?? (feedback.quantity ? `${feedback.quantity} ${feedback.quantity === 1 ? 'unidad agregada' : 'unidades agregadas'}.`
        : !product.stock_demo ? 'Agotado' : remaining <= 0 ? 'Ya agregaste todas las unidades disponibles.' : '')}
      {feedback.quantity && <> <a href="/carrito">Ver carrito</a></>}
      {feedback.quantity && memoryOnly && <p>El navegador bloquea el guardado. La selección puede perderse al salir.</p>}
    </div>
  </form>;
}
