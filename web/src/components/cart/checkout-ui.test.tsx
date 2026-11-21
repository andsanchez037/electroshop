import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Checkout from './Checkout';
import { CART_KEY, encodeCart } from '../../data/cart';
import { cart } from '../../data/cart-store';
import { products } from '../../data/catalog';

const product = products.find(item => item.sku === 'ES-D001')!;
function seed(quantity = 2) {
  localStorage.setItem(CART_KEY, encodeCart([{ sku: product.sku, quantity }]));
  cart.sync();
}
afterEach(() => { cleanup(); localStorage.clear(); cart.sync(); vi.restoreAllMocks(); });

async function delivery(user: ReturnType<typeof userEvent.setup>, pickup = true) {
  await user.click(await screen.findByRole('button', { name: 'Continuar a entrega' }));
  if (pickup) await user.click(screen.getByRole('radio', { name: /Recoger en tienda/ }));
  await user.type(screen.getByLabelText('Nombre de quien recibe'), 'Persona DEMO');
  await user.type(screen.getByLabelText('Correo de ejemplo'), 'persona@example.test');
}

describe('Checkout académico', () => {
  it('bloquea acceso directo sin carrito y conserva selecciones si falla catálogo', async () => {
    const loader = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue([product]);
    const { unmount } = render(<Checkout loader={async () => []} />);
    await screen.findByRole('heading', { name: 'Tu carrito está vacío' });
    expect(screen.queryByRole('button', { name: 'Confirmar pedido DEMO' })).toBeNull();
    unmount(); seed();
    render(<Checkout loader={loader} />);
    await screen.findByRole('heading', { name: 'El catálogo no está disponible' });
    expect(cart.getSnapshot().lines).toHaveLength(1);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('button', { name: 'Continuar a entrega' })).toBeTruthy();
  });
  it('valida envío, correo y código postal y muestra el costo ficticio antes de confirmar', async () => {
    seed();
    const user = userEvent.setup();
    render(<Checkout loader={async () => [product]} />);
    await user.click(await screen.findByRole('button', { name: 'Continuar a entrega' }));
    await user.click(screen.getByRole('button', { name: 'Revisar pedido DEMO' }));
    expect(screen.getByLabelText('Nombre de quien recibe').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Correo de ejemplo').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Escribe un código postal mexicano de 5 dígitos.')).toBeTruthy();
    const entries = { 'Nombre de quien recibe': 'Entrega DEMO', 'Correo de ejemplo': 'entrega@example.test', 'Código postal': '31000',
      Ciudad: 'Chihuahua', Estado: 'Chihuahua', 'Calle, número y colonia': 'Calle de prueba 123' };
    for (const [label, value] of Object.entries(entries)) await user.type(screen.getByLabelText(label, { exact: true }), value);
    await user.click(screen.getByRole('button', { name: 'Revisar pedido DEMO' }));
    expect(screen.getByText(/Calle de prueba 123/)).toBeTruthy();
    expect(screen.getByText(/Total revisado: \$597\.00 MXN/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Confirmar pedido DEMO' }));
    expect(await screen.findByRole('heading', { name: 'Pedido DEMO confirmado' })).toBeTruthy();
  });
  it('confirma recolección una sola vez y elimina los datos personales y el carrito', async () => {
    seed();
    let finish!: (items: typeof product[]) => void;
    const loader = vi.fn().mockResolvedValueOnce([product]).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const user = userEvent.setup();
    render(<Checkout loader={loader} />);
    await delivery(user);
    expect(screen.queryByLabelText('Código postal')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Revisar pedido DEMO' }));
    expect(screen.getByText(/Total revisado: \$498\.00 MXN/)).toBeTruthy();
    const button = screen.getByRole('button', { name: 'Confirmar pedido DEMO' });
    fireEvent.click(button);
    fireEvent.click(button);
    await act(async () => finish([product]));
    expect(loader).toHaveBeenCalledTimes(2);
    expect(await screen.findByText(/^DEMO-[A-F0-9-]{36}$/)).toBeTruthy();
    expect(screen.queryByText(/persona@example\.test/)).toBeNull();
    expect(localStorage.getItem(CART_KEY)).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });
  it.each([['precio', [{ ...product, price_cents: product.price_cents + 1 }]], ['disponibilidad', []],
    ['stock reducido', [{ ...product, stock_demo: product.stock_demo - 1 }]]] as const)('exige nueva revisión si cambia %s', async (_reason, updated) => {
    seed();
    const loader = vi.fn().mockResolvedValueOnce([product]).mockResolvedValueOnce(updated);
    const user = userEvent.setup();
    render(<Checkout loader={loader} />);
    await delivery(user);
    await user.click(screen.getByRole('button', { name: 'Revisar pedido DEMO' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar pedido DEMO' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Cambió el carrito, el precio o la disponibilidad');
    expect(screen.queryByRole('heading', { name: 'Pedido DEMO confirmado' })).toBeNull();
    expect(cart.getSnapshot().lines).toHaveLength(1);
  });
});
