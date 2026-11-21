import { describe, expect, it, vi } from 'vitest';
import { CART_KEY, cartSignature, encodeCart, formatCents, lineTotal, readCart, reconcileCart, shippingCost, subtotal } from './cart';
import { createCartStore } from './cart-store';
import { products } from './catalog';

const first = products[0]!;
const second = products[1]!;
const line = { sku: first.sku, quantity: 2 };

function storageFixture() {
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key), clear: () => data.clear(), get length() { return data.size; }, key: (index: number) => [...data.keys()][index] ?? null };
  return { storage, store: createCartStore(() => storage) };
}

describe('Persistencia de carrito', () => {
  it('agrega, incrementa una sola línea por SKU, cambia cantidad, elimina y vacía', async () => {
    const { store, storage } = storageFixture();
    await store.add(first, 1);
    await store.add(first, 1);
    await store.add(second, 1);
    expect(store.getSnapshot().lines).toEqual([line, { sku: second.sku, quantity: 1 }]);
    expect(await store.set(first, 1, 2)).toBeUndefined();
    expect((await store.set(first, 2, 2))?.includes('cambió')).toBe(true);
    await store.remove(second.sku);
    expect(storage.getItem(CART_KEY)).toBe(encodeCart([{ sku: first.sku, quantity: 1 }]));
    await store.clear(cartSignature(store.getSnapshot().lines));
    expect(storage.getItem(CART_KEY)).toBeNull();
  });
  it('rechaza cantidades inválidas, stock excedido y productos agotados', async () => {
    const { store } = storageFixture();
    for (const quantity of [NaN, 0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER, first.stock_demo + 1]) {
      expect(await store.add(first, quantity)).toBeTruthy();
    }
    expect(await store.add({ ...first, stock_demo: 0 }, 1)).toBeTruthy();
    await store.add(first, first.stock_demo);
    expect(await store.add(first, 1)).toBeTruthy();
    expect(store.getSnapshot().lines).toEqual([{ sku: first.sku, quantity: first.stock_demo }]);
  });
  it('restaura la selección, relee cambios remotos y rechaza confirmar un carrito obsoleto', async () => {
    const { store, storage } = storageFixture();
    await store.add(first, 2);
    const original = cartSignature(store.getSnapshot().lines);
    const other = createCartStore(() => storage);
    other.sync();
    expect(other.getSnapshot().lines).toEqual([line]);
    const listener = vi.fn();
    store.subscribe(listener);
    await other.add(second, 1);
    store.sync();
    expect(listener).toHaveBeenCalledOnce();
    expect(await store.clear(original)).toBeTruthy();
    expect(store.getSnapshot().lines).toHaveLength(2);
  });
  it('conserva el carrito de la página si el navegador rechaza la escritura', async () => {
    const { storage } = storageFixture();
    const store = createCartStore(() => ({ ...storage, setItem: () => { throw new Error('quota'); } }));
    await store.add(first, 2);
    store.sync();
    expect(store.getSnapshot()).toMatchObject({ lines: [line], memoryOnly: true });
  });
  it('omite valores corruptos, versiones anteriores, duplicados y listas excesivas', () => {
    for (const raw of ['{broken', 'null', '[]', '{"version":0,"lines":[]}', '{"version":1,"lines":{}}', 'x'.repeat(8193)]) {
      expect(readCart(raw)).toEqual({ lines: [], repaired: true });
    }
    expect(readCart(JSON.stringify({ version: 1, lines: [line, line, null, { sku: 'a', quantity: 4 },
      { sku: 'X', quantity: 1.4 }, { sku: 'Y', quantity: -1 }, { sku: 'Z', quantity: 2147483648 }] }))).toEqual({ lines: [line], repaired: true });
    const excess = Array.from({ length: 51 }, (_, i) => ({ sku: `T-${i}`, quantity: 1 }));
    expect(readCart(encodeCart(excess))).toMatchObject({ repaired: true, lines: excess.slice(0, 50) });
  });
});

describe('Reconciliación y centavos', () => {
  it('detecta discontinuación y stock menor conservando cantidades hasta resolver', () => {
    const lines = reconcileCart([line, { sku: second.sku, quantity: 1 }], [{ ...first, stock_demo: 1 }]);
    expect(lines.map(({ issue }) => issue)).toEqual(['stock', 'missing']);
    expect(lines[0]?.quantity).toBe(2);
  });
  it('calcula con precios actuales, varios productos y entrega ficticia sin perder centavos', () => {
    const lines = reconcileCart([line, { sku: second.sku, quantity: 3 }], [{ ...first, price_cents: 101 }, { ...second, price_cents: 233 }]);
    expect(subtotal(lines)).toBe(901n);
    expect(subtotal(lines) + shippingCost('shipping')).toBe(10801n);
    expect(shippingCost('pickup')).toBe(0n);
    expect(formatCents(10801n)).toBe('$108.01');
    expect(formatCents(100n)).toBe('$1.00');
    expect(formatCents(lineTotal(2147483647, 2147483647))).toBe('$46,116,860,141,324,206.09');
  });
});
