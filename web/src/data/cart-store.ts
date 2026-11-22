import { useEffect, useSyncExternalStore } from 'react';
import { CART_KEY, cartSignature, changeCart, encodeCart, readCart, type CartLine } from './cart';
import type { Product } from './catalog';

type Snapshot = { lines: readonly CartLine[]; ready: boolean; memoryOnly: boolean; repaired: boolean };
type Change = { lines: readonly CartLine[] } | { error: string };
const initial: Snapshot = { lines: [], ready: false, memoryOnly: false, repaired: false };
const conflict = { error: 'El carrito cambió en otra pestaña. Revisa las cantidades e inténtalo de nuevo.' };

export function createCartStore(storage: () => Storage, lock: <T>(work: () => T) => Promise<T> = async work => work()) {
  let snapshot = initial;
  let raw: string | null | undefined;
  const listeners = new Set<() => void>();
  const publish = (next: Snapshot) => {
    snapshot = next;
    listeners.forEach(listener => listener());
  };
  function sync() {
    if (snapshot.memoryOnly) return;
    try {
      const value = storage().getItem(CART_KEY);
      if (value === raw && snapshot.ready) return;
      raw = value;
      publish({ ...readCart(value), ready: true, memoryOnly: false });
    } catch {
      publish({ ...snapshot, ready: true, memoryOnly: true });
    }
  }
  async function update(change: (lines: readonly CartLine[]) => Change) {
    const write = () => {
      sync();
      const result = change(snapshot.lines);
      if ('error' in result) return result.error;
      let memoryOnly = snapshot.memoryOnly;
      if (!memoryOnly) {
        try {
          raw = result.lines.length ? encodeCart(result.lines) : null;
          if (raw === null) storage().removeItem(CART_KEY);
          else storage().setItem(CART_KEY, raw);
        } catch { memoryOnly = true; }
      }
      publish({ lines: result.lines, ready: true, memoryOnly, repaired: false });
    };
    // Older browsers still reread storage before each synchronous mutation.
    let began = false;
    try { return await lock(() => { began = true; return write(); }); }
    catch { return began ? 'No pudimos actualizar el carrito.' : write(); }
  }
  return {
    sync,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    add: (product: Product, quantity: number) => update(lines => changeCart(lines, product, quantity, true)),
    set: (product: Product, quantity: number, previous: number) => update(lines =>
      lines.find(line => line.sku === product.sku)?.quantity === previous ? changeCart(lines, product, quantity) : conflict),
    remove: (sku: string, previous: number) => update(lines =>
      lines.find(line => line.sku === sku)?.quantity === previous ? { lines: lines.filter(line => line.sku !== sku) } : conflict),
    clear: (expected: string, active = () => true) => update(lines =>
      active() && cartSignature(lines) === expected ? { lines: [] } : conflict),
  };
}

export const cart = createCartStore(() => window.localStorage, async work =>
  navigator.locks ? navigator.locks.request(CART_KEY, work) : work());
let listening = false;
export function useCart() {
  const snapshot = useSyncExternalStore(cart.subscribe, cart.getSnapshot, () => initial);
  useEffect(() => {
    if (!listening) {
      listening = true;
      window.addEventListener('storage', event => { if (event.key === CART_KEY || event.key === null) cart.sync(); });
      window.addEventListener('pageshow', () => cart.sync());
    }
    cart.sync();
  }, []);
  return snapshot;
}
