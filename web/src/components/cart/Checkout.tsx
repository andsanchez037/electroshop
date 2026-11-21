import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { loadProducts } from '../../data/catalog';
import { cartSignature, contactFields, contactLimits, deliveryLabel, emptyContact, formatCents, lineTotal, quoteSignature,
  reconcileCart, shippingCost, subtotal, validateContact, type Contact, type Delivery, type ReviewedLine } from '../../data/cart';
import { cart, useCart } from '../../data/cart-store';
import { CatalogStatus, demoNotice, EmptyCart, OrderSummary, ShoppingLines, useShoppingCatalog } from './CartContent';

const steps = ['Revisar carrito', 'Datos de entrega', 'Confirmar pedido'] as const;
const contactKeys = Object.keys(contactFields) as (keyof Contact)[];
const methods = ['shipping', 'pickup'] as const;
type Receipt = { reference: string; date: Date; method: Delivery; total: bigint; items: { sku: string; name: string; quantity: number; total: bigint }[] };
const dateFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' });

function Confirmation({ receipt }: { receipt: Receipt }) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus(); }, []);
  return <section className="shop-panel shop-receipt">
    <p className="receipt-mark" aria-hidden="true">✓</p>
    <h2 tabIndex={-1} ref={title}>Pedido DEMO confirmado</h2>
    <p><strong>{receipt.reference}</strong></p>
    <p><time dateTime={receipt.date.toISOString()}>{dateFormat.format(receipt.date)}</time></p>
    <ul className="receipt-items">{receipt.items.map(item => <li key={item.sku}>
      <span>{item.quantity} × {item.name} <small>{item.sku}</small></span><strong>{formatCents(item.total)}</strong>
    </li>)}</ul>
    <dl><div><dt>Método de entrega</dt><dd>{deliveryLabel(receipt.method)}</dd></div>
      <div><dt>Total simulado</dt><dd>{formatCents(receipt.total)} MXN</dd></div></dl>
    <p className="notice">{demoNotice}</p>
    <a className="button" href="/catalogo">Volver al catálogo</a>
  </section>;
}

export default function Checkout({ loader = loadProducts }: { loader?: typeof loadProducts }) {
  const { lines, ready, memoryOnly } = useCart();
  const catalog = useShoppingCatalog(loader);
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState<Delivery>('shipping');
  const [contact, setContact] = useState<Contact>(emptyContact);
  const [errors, setErrors] = useState<ReturnType<typeof validateContact>>({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [reviewed, setReviewed] = useState<readonly ReviewedLine[]>([]);
  const [start, setStart] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const pending = useRef(false);
  const lifetime = useRef(0);
  const current = reconcileCart(lines, catalog.products);
  const signature = cartSignature(lines);
  const changed = step > 0 && signature !== start;
  const issues = current.some(line => line.issue);
  const delivery = shippingCost(method);

  useEffect(() => {
    const discard = () => {
      ++lifetime.current;
      setStep(0); setContact(emptyContact); setErrors({}); setReceipt(null);
      setReviewed([]); setStart(''); setNotice(''); setBusy(false);
    };
    const restore = (event: PageTransitionEvent) => { if (event.persisted) discard(); };
    window.addEventListener('pagehide', discard);
    window.addEventListener('pageshow', restore);
    return () => {
      ++lifetime.current;
      window.removeEventListener('pagehide', discard);
      window.removeEventListener('pageshow', restore);
    };
  }, []);

  function go(next: number) {
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function reviewDelivery(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (changed || issues) return;
    const validation = validateContact(contact, method);
    setErrors(validation);
    const first = contactKeys.find(field => validation[field]);
    if (first) {
      requestAnimationFrame(() => document.getElementById(`delivery-${first}`)?.focus());
      return;
    }
    setReviewed(current);
    setNotice('');
    go(2);
  }
  async function confirm() {
    if (pending.current || changed || issues || !reviewed.length) return;
    pending.current = true;
    setBusy(true);
    setNotice('');
    const active = lifetime.current;
    try {
      const products = await loader();
      if (active !== lifetime.current) return;
      cart.sync();
      const latest = cart.getSnapshot().lines;
      const refreshed = reconcileCart(latest, products);
      catalog.replace(products);
      if (cartSignature(latest) !== start || refreshed.some((line, index) =>
        line.issue || (line.product?.stock_demo ?? 0) < (reviewed[index]?.product?.stock_demo ?? 0))
        || quoteSignature(refreshed) !== quoteSignature(reviewed)) {
        setNotice('Cambió el carrito, el precio o la disponibilidad. Revisa la selección y el total antes de confirmar.');
        go(0);
        return;
      }
      const reference = `DEMO-${crypto.randomUUID().toUpperCase()}`;
      const result = await cart.clear(start, () => active === lifetime.current);
      if (active !== lifetime.current) return;
      if (result) { setNotice(result); go(0); return; }
      setReceipt({ reference, date: new Date(), method, total: subtotal(refreshed) + delivery,
        items: refreshed.flatMap(line => line.product ? [{ sku: line.sku, name: line.product.name, quantity: line.quantity,
          total: lineTotal(line.product.price_cents, line.quantity) }] : []) });
      setContact(emptyContact);
      setErrors({});
      setReviewed([]);
    } catch {
      if (active === lifetime.current) setNotice('No pudimos comprobar el pedido DEMO. Tu carrito se conserva. Intenta de nuevo.');
    } finally {
      pending.current = false;
      if (active === lifetime.current) setBusy(false);
    }
  }

  if (receipt) return <Confirmation receipt={receipt} />;
  if (!ready) return <p role="status" className="empty">Cargando carrito…</p>;
  if (!lines.length) return <EmptyCart />;
  return <>
    <ol className="checkout-progress" aria-label="Progreso del pedido DEMO">{steps.map((label, index) =>
      <li key={label} aria-current={index === step ? 'step' : undefined}>
        <span aria-hidden="true">{index + 1}</span>{label}
      </li>)}</ol>
    {memoryOnly && <p className="notice">El navegador bloquea el guardado del carrito. Evita recargar mientras haces la simulación.</p>}
    {notice && <p className="notice" role="alert">{notice}</p>}
    {changed && <p className="notice" role="alert">Tu carrito cambió. Vuelve a revisar la selección antes de confirmar.</p>}
    {catalog.status !== 'ready' ? <CatalogStatus status={catalog.status} retry={catalog.retry} />
      : <div className="shop-layout">
        <section className="checkout-step" aria-labelledby="checkout-step-title">
          <h2 id="checkout-step-title" ref={heading} tabIndex={-1}>{steps[step]}</h2>
          {step === 0 && <>
            <ShoppingLines lines={current} />
            <div className="shop-actions">
              <a href="/carrito" className="button secondary">Editar carrito</a>
              <button type="button" className="button" disabled={issues} onClick={() => { setStart(signature); setNotice(''); go(1); }}>
                Continuar a entrega
              </button>
            </div>
          </>}
          {step === 1 && <form className="shop-panel delivery-form" onSubmit={reviewDelivery} autoComplete="off" noValidate>
            <fieldset className="delivery-methods"><legend>Método de entrega</legend>{methods.map(option =>
              <label key={option}><input type="radio" name="delivery-option" checked={method === option}
                onChange={() => { setMethod(option); setErrors({}); if (option === 'pickup') setContact({ ...emptyContact, name: contact.name, email: contact.email }); }} />
                <span>{deliveryLabel(option)}</span><strong>{option === 'shipping' ? formatCents(shippingCost(option)) : 'Gratis'}</strong>
              </label>)}</fieldset>
            <p className="shop-fine-print">La tarifa de envío es ficticia. No es una cotización de paquetería.</p>
            <p>Usa únicamente datos ficticios para esta demostración.</p>
            <div className="delivery-fields">{contactKeys.slice(0, method === 'pickup' ? 2 : undefined).map(key =>
              <div key={key} className={key === 'address' ? 'delivery-address' : undefined}>
                <label htmlFor={`delivery-${key}`}>{contactFields[key]}</label>
                <input id={`delivery-${key}`} type={key === 'email' ? 'email' : 'text'} inputMode={key === 'zip' ? 'numeric' : undefined}
                  required autoComplete="off" maxLength={contactLimits[key]} value={contact[key]}
                  aria-invalid={errors[key] ? true : undefined} aria-describedby={errors[key] ? `delivery-error-${key}` : undefined}
                  onChange={event => { setContact({ ...contact, [key]: event.target.value }); setErrors({ ...errors, [key]: undefined }); }} />
                {errors[key] && <p className="shop-warning" id={`delivery-error-${key}`}>{errors[key]}</p>}
              </div>)}</div>
            <div className="shop-actions">
              <button className="button secondary" type="button" onClick={() => go(0)}>Volver a revisar</button>
              <button className="button" type="submit" disabled={changed || issues}>Revisar pedido DEMO</button>
            </div>
          </form>}
          {step === 2 && <>
            <ShoppingLines lines={reviewed} />
            <section className="shop-panel delivery-preview">
              <h3>{deliveryLabel(method)}</h3>
              <p>{contact.name.trim()} · {contact.email.trim()}</p>
              {method === 'shipping' && <p>{contact.address.trim()}, {contact.city.trim()}, {contact.state.trim()}, C. P. {contact.zip.trim()}</p>}
              <p><strong>Total revisado: {formatCents(subtotal(reviewed) + delivery)} MXN</strong></p>
              <p className="notice">{demoNotice}</p>
            </section>
            <div className="shop-actions">
              <button className="button secondary" type="button" disabled={busy} onClick={() => go(changed ? 0 : 1)}>Volver a {changed ? 'revisar' : 'entrega'}</button>
              <button type="button" className="button" disabled={busy || changed || issues} onClick={confirm}>
                {busy ? 'Verificando disponibilidad…' : 'Confirmar pedido DEMO'}
              </button>
            </div>
          </>}
        </section>
        <OrderSummary lines={step === 2 ? reviewed : current} shipping={step > 0 ? delivery : undefined} />
      </div>}
  </>;
}
