import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import AdminApp from './AdminApp';
import { AdminAccessError, AdminOperationError, type AdminGateway, type AdminSession } from '../../data/admin-source';
import type { AdminProduct } from '../../data/admin-product';
const sample: AdminProduct = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', sku: 'TEST-001', name: 'Producto local', description: 'Solo fixture de UI', category_id: 'componentes', price_cents: 24900, stock_demo: 0, is_active: true };
function setup(initial = false, admin = true) {
  let session: AdminSession | null = initial ? { userId: 'local-ui-fixture' } : null;
  let items: AdminProduct[] = [{ ...sample }];
  const listeners = new Set<(value: AdminSession | null) => void>();
  const changeSession = (next: AdminSession | null) => { session = next; listeners.forEach(fn => fn(next)); };
  const gateway = {
    session: vi.fn(async () => session), subscribe: vi.fn((fn: (value: AdminSession | null) => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; }),
    signIn: vi.fn(async () => { changeSession({ userId: 'local-ui-fixture' }); }),
    signOut: vi.fn(async () => { changeSession(null); }),
    isAdmin: vi.fn(async () => admin), listProducts: vi.fn(async () => items),
    listCategories: vi.fn(async () => [{ id: 'componentes' as const, name: 'Componentes', is_active: true }]),
    saveProduct: vi.fn(async (value, id) => { if (id) items = items.map(p => p.id === id ? { ...value, id } : p); else items = [...items, { ...value, id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }]; }),
    deleteProduct: vi.fn(async (id: string) => { items = items.filter(p => p.id !== id); }),
  } satisfies AdminGateway;
  return { gateway, changeSession };
}
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('Administración: login y protección de UI', () => {
  it('visitante solo ve login y no consulta productos; formulario accesible', async () => {
    const { gateway } = setup(); const { container } = render(<AdminApp gateway={gateway} />);
    await screen.findByRole('heading', { name: 'Iniciar sesión' });
    expect(gateway.listProducts).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Nuevo producto' })).toBeNull();
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
  it('usuario autenticado no admin no obtiene listado, aunque exista sesión', async () => {
    const { gateway } = setup(true, false); render(<AdminApp gateway={gateway} />);
    await screen.findByRole('heading', { name: 'Acceso no autorizado' });
    expect(gateway.listProducts).not.toHaveBeenCalled();
  });
  it('error de login genérico limpia contraseña y permite nuevo intento', async () => {
    const user = userEvent.setup(); const { gateway } = setup();
    gateway.signIn.mockRejectedValueOnce(new AdminOperationError('No pudimos iniciar sesión.'));
    render(<AdminApp gateway={gateway} />); await screen.findByRole('heading', { name: 'Iniciar sesión' });
    await user.type(screen.getByLabelText('Correo electrónico'), 'demo@example.test'); await user.type(screen.getByLabelText('Contraseña'), 'synthetic-fixture');
    await user.click(screen.getByRole('button', { name: 'Entrar' })); await screen.findByRole('alert');
    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).value).toBe('');
    await user.type(screen.getByLabelText('Contraseña'), 'synthetic-fixture'); await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByRole('heading', { name: sample.name }); expect(gateway.isAdmin).toHaveBeenCalled();
  });
  it('cerrar sesión elimina listado y formulario aunque falle confirmación remota', async () => {
    const user = userEvent.setup(); const { gateway } = setup(true); gateway.signOut.mockRejectedValueOnce(new AdminOperationError('Sesión local cerrada.'));
    render(<AdminApp gateway={gateway} />); await screen.findByRole('heading', { name: sample.name });
    await user.click(screen.getByRole('button', { name: 'Editar TEST-001' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await screen.findByRole('heading', { name: 'Iniciar sesión' }); expect(screen.queryByText(sample.name)).toBeNull();
    expect(screen.queryByLabelText('SKU')).toBeNull();
    expect(gateway.signOut).toHaveBeenCalledTimes(1);
  });
  it('conserva el borrador al renovar el token y recibir eventos repetidos del mismo usuario', async () => {
    const user = userEvent.setup(); const { gateway, changeSession } = setup(true);
    render(<AdminApp gateway={gateway} />); await screen.findByRole('heading', { name: sample.name });
    await user.click(screen.getByRole('button', { name: 'Editar TEST-001' }));
    const name = screen.getByLabelText('Nombre', { exact: true }) as HTMLInputElement;
    await user.type(name, ' sin guardar');
    await act(async () => {
      changeSession({ userId: 'local-ui-fixture' });
      changeSession({ userId: 'local-ui-fixture' });
    });
    expect(screen.getByLabelText('Nombre', { exact: true })).toBe(name);
    expect(name.value).toBe('Producto local sin guardar');
    expect(gateway.listProducts).toHaveBeenCalledTimes(1);
  });
  it('una identidad nueva elimina el editor y vuelve a verificar membresía', async () => {
    const user = userEvent.setup(); const { gateway, changeSession } = setup(true);
    render(<AdminApp gateway={gateway} />); await screen.findByRole('heading', { name: sample.name });
    await user.click(screen.getByRole('button', { name: 'Editar TEST-001' }));
    gateway.isAdmin.mockResolvedValue(false);
    await act(async () => { changeSession({ userId: 'other-user' }); });
    await screen.findByRole('heading', { name: 'Acceso no autorizado' });
    expect(screen.queryByLabelText('SKU')).toBeNull();
    expect(screen.queryByText(sample.name)).toBeNull();
    expect(gateway.listProducts).toHaveBeenCalledTimes(1);
  });
  it('un logout e inicio de la misma identidad en un lote vuelven a verificar acceso', async () => {
    const { gateway, changeSession } = setup(true);
    render(<AdminApp gateway={gateway} />); await screen.findByRole('heading', { name: sample.name });
    gateway.isAdmin.mockResolvedValue(false);
    await act(async () => {
      changeSession(null);
      changeSession({ userId: 'local-ui-fixture' });
    });
    await screen.findByRole('heading', { name: 'Acceso no autorizado' });
  });
  it('expiración descarta una respuesta privilegiada que llega tarde', async () => {
    const { gateway, changeSession } = setup(true); let resolve!: (p: AdminProduct[]) => void;
    gateway.listProducts.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    render(<AdminApp gateway={gateway} />); await waitFor(() => expect(gateway.listProducts).toHaveBeenCalled());
    await act(async () => { changeSession(null); resolve([sample]); });
    await screen.findByRole('heading', { name: 'Iniciar sesión' }); expect(screen.queryByText(sample.name)).toBeNull();
  });
  it('SIGNED_OUT tardío con sesión ya nula no deja la pantalla verificando', async () => {
    const user = userEvent.setup(); const { gateway, changeSession } = setup(true); let finish!: () => void;
    gateway.signOut.mockImplementationOnce(() => new Promise<void>(done => { finish = done; }));
    render(<AdminApp gateway={gateway} />); await screen.findByRole('heading', { name: sample.name });
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' })); await screen.findByRole('heading', { name: 'Iniciar sesión' });
    await act(async () => { changeSession(null); finish(); });
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy();
    expect(screen.queryByText('Verificando acceso…')).toBeNull();
  });
  it('revocación detectada al volver a la ventana cierra inmediatamente la gestión', async () => {
    const user = userEvent.setup(); const { gateway } = setup(true);
    render(<AdminApp gateway={gateway} />); await screen.findByRole('heading', { name: sample.name });
    await user.click(screen.getByRole('button', { name: 'Editar TEST-001' }));
    gateway.isAdmin.mockResolvedValue(false);
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    await screen.findByRole('heading', { name: 'Acceso no autorizado' }); expect(screen.queryByText(sample.name)).toBeNull();
    expect(screen.queryByLabelText('SKU')).toBeNull();
  });
  it('fallo de red al verificar acceso permanece cerrado y ofrece reintento', async () => {
    const user = userEvent.setup(); const { gateway } = setup(true); gateway.isAdmin.mockRejectedValueOnce(new Error('PRIVATE raw backend message'));
    render(<AdminApp gateway={gateway} />); await screen.findByRole('heading', { name: 'No pudimos verificar la administración' });
    expect(screen.queryByText(/PRIVATE/)).toBeNull(); expect(gateway.listProducts).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Reintentar acceso' })); await screen.findByRole('heading', { name: sample.name });
  });
});
describe('CRUD admin: estados, validación y confirmación', () => {
  it('crea un producto con centavos y stock cero, y muestra éxito solo tras guardar', async () => {
    const user = userEvent.setup(); const { gateway } = setup(true); render(<AdminApp gateway={gateway} />);
    await screen.findByRole('heading', { name: sample.name }); await user.click(screen.getByRole('button', { name: 'Nuevo producto' }));
    await user.type(screen.getByLabelText('SKU'), 'TEST-002'); await user.type(screen.getByLabelText('Nombre', { exact: true }), 'Nuevo demo');
    await user.type(screen.getByLabelText('Descripción'), 'Descripción ficticia'); await user.type(screen.getByLabelText('Precio en centavos MXN'), '1234');
    await user.click(screen.getByRole('button', { name: 'Guardar producto' })); await screen.findByText('Producto guardado.'); await screen.findByRole('heading', { name: 'Nuevo demo' });
    expect(gateway.saveProduct).toHaveBeenCalledWith(expect.objectContaining({ sku: 'TEST-002', price_cents: 1234, stock_demo: 0 }), undefined);
  });
  it('errores por campo impiden guardar y reciben foco', async () => {
    const user = userEvent.setup(); const { gateway } = setup(true); render(<AdminApp gateway={gateway} />); await screen.findByRole('heading', { name: sample.name });
    await user.click(screen.getByRole('button', { name: 'Nuevo producto' })); await user.click(screen.getByRole('button', { name: 'Guardar producto' }));
    expect(screen.getByLabelText('SKU').getAttribute('aria-invalid')).toBe('true'); expect(document.activeElement).toBe(screen.getByLabelText('SKU'));
    expect(gateway.saveProduct).not.toHaveBeenCalled();
  });
  it('edita precio/visibilidad por identidad estable y conserva los campos al rechazarse', async () => {
    const user = userEvent.setup(); const { gateway } = setup(true); gateway.saveProduct.mockRejectedValueOnce(new AdminOperationError('El SKU ya existe.'));
    render(<AdminApp gateway={gateway} />); await screen.findByRole('heading', { name: sample.name }); await user.click(screen.getByRole('button', { name: 'Editar TEST-001' }));
    await user.clear(screen.getByLabelText('Precio en centavos MXN')); await user.type(screen.getByLabelText('Precio en centavos MXN'), '4567');
    await user.selectOptions(screen.getByLabelText('Visibilidad del producto'), 'false'); await user.click(screen.getByRole('button', { name: 'Guardar producto' }));
    await screen.findByText('El SKU ya existe.'); expect(screen.queryByText('Producto guardado.')).toBeNull();
    expect((screen.getByLabelText('Precio en centavos MXN') as HTMLInputElement).value).toBe('4567');
    await user.click(screen.getByRole('button', { name: 'Guardar producto' })); await screen.findByText('Producto guardado.');
    expect(gateway.saveProduct).toHaveBeenLastCalledWith(expect.objectContaining({ price_cents: 4567, is_active: false }), sample.id);
    expect((await screen.findAllByText(/Oculto/)).length).toBeGreaterThan(0);
  });
  it('exige confirmación explícita y permite cancelar antes de borrar', async () => {
    const user = userEvent.setup(); const { gateway } = setup(true); render(<AdminApp gateway={gateway} />); await screen.findByRole('heading', { name: sample.name });
    await user.click(screen.getByRole('button', { name: 'Eliminar TEST-001' })); await screen.findByRole('heading', { name: 'Confirmar eliminación' }); expect(gateway.deleteProduct).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancelar eliminación' })); expect(gateway.deleteProduct).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Eliminar TEST-001' })); await user.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));
    await screen.findByText('Producto eliminado.'); await screen.findByText('No hay productos que mostrar.'); expect(gateway.deleteProduct).toHaveBeenCalledExactlyOnceWith(sample.id);
  });
  it('rechazo RLS descarta el formulario y no comunica éxito', async () => {
    const user = userEvent.setup(); const { gateway } = setup(true); gateway.deleteProduct.mockRejectedValueOnce(new AdminAccessError());
    render(<AdminApp gateway={gateway} />); await screen.findByRole('heading', { name: sample.name }); await user.click(screen.getByRole('button', { name: 'Eliminar TEST-001' })); await user.click(screen.getByRole('button', { name: 'Eliminar definitivamente' }));
    await screen.findByRole('heading', { name: 'Acceso no autorizado' }); expect(screen.queryByText('Producto eliminado.')).toBeNull();
  });
});
