import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import Catalog from './Catalog';
import ProductDetail from './ProductDetail';

afterEach(() => { cleanup(); window.history.replaceState({}, '', '/'); });

describe('Catálogo interactivo', () => {
  it('combina filtros, anuncia cero resultados y permite limpiar', async () => {
    const user = userEvent.setup();
    render(<Catalog />);
    await screen.findByText('16 de 16 productos');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'componentes');
    await user.click(screen.getByLabelText('Solo disponibles demo'));
    expect(screen.getByRole('status').textContent).toBe('3 de 16 productos');
    await user.type(screen.getByLabelText('Nombre o SKU'), 'inexistente');
    expect(screen.getByText('No encontramos coincidencias')).toBeTruthy();
    await user.click(screen.getAllByRole('button', { name: 'Limpiar filtros' })[0]!);
    expect(screen.getByRole('status').textContent).toBe('16 de 16 productos');
  });
  it('recibe búsqueda y categoría desde la navegación', async () => {
    window.history.replaceState({}, '', '/catalogo?q=es-d001&categoria=desarrollo');
    render(<Catalog />);
    await screen.findByText('1 de 16 productos');
    expect(screen.getByRole('heading', { name: 'Placa de desarrollo Nova' })).toBeTruthy();
  });
  it('presenta carga y catálogo vacío', async () => {
    render(<Catalog loader={async () => []} />);
    expect(screen.getByRole('status').textContent).toBe('Cargando catálogo…');
    await screen.findByText('Aún no hay productos');
  });
  it('presenta un error legible y reintenta', async () => {
    let calls = 0;
    const loader = async () => { calls++; if (calls === 1) throw new Error('demo'); return []; };
    render(<Catalog loader={loader} />);
    await screen.findByRole('alert');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
    await screen.findByText('Aún no hay productos');
    expect(calls).toBe(2);
  });
  it('no presenta infracciones automatizables básicas de accesibilidad', async () => {
    const { container } = render(<main><h1>Catálogo</h1><Catalog /></main>);
    await screen.findByText('16 de 16 productos');
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});

describe('Ficha por SKU', () => {
  it('muestra precio, stock, cantidad y carrito honestamente deshabilitado', async () => {
    window.history.replaceState({}, '', '/producto?sku=es-d001');
    const { container } = render(<main><ProductDetail /></main>);
    await screen.findByRole('heading', { name: 'Placa de desarrollo Nova' });
    expect(screen.getByText('8 unidades de stock demo')).toBeTruthy();
    expect(screen.getByLabelText('Cantidad de referencia').getAttribute('max')).toBe('8');
    expect(screen.getByRole('button', { name: /Agregar al carrito/ }).hasAttribute('disabled')).toBe(true);
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
  it('maneja SKU inválido con enlace para volver', async () => {
    window.history.replaceState({}, '', '/producto?sku=desconocido');
    render(<ProductDetail />);
    await waitFor(() => expect(screen.getByRole('heading').textContent).toBe('Producto no encontrado'));
    expect(screen.getByRole('link', { name: 'Explorar catálogo' }).getAttribute('href')).toBe('/catalogo');
  });
  it('deshabilita cantidad si no hay stock', async () => {
    window.history.replaceState({}, '', '/producto?sku=ES-C003');
    render(<ProductDetail />);
    await screen.findByText('Sin stock demo');
    expect(screen.getByLabelText('Cantidad de referencia').hasAttribute('disabled')).toBe(true);
  });
});
