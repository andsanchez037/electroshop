import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductDetail from './ProductDetail';
import Catalog from './Catalog';
import { createCatalogSource } from '../data/catalog-source';

afterEach(() => { cleanup(); window.history.replaceState({}, '', '/'); });

it('ficha obtiene producto desde el mismo loader que catálogo, sin leer fixture por SKU', async () => {
  window.history.replaceState({}, '', '/producto?sku=es-live001');
  const loader = async () => [{ sku: 'ES-LIVE001', name: 'Producto persistente fixture', description: 'Demo de contrato',
    category: 'energia' as const, price_cents: 5555, stock_demo: 4 }];
  render(<ProductDetail loader={loader} />);
  await screen.findByRole('heading', { name: 'Producto persistente fixture' });
  expect(screen.getByText('4 unidades de stock demo')).toBeTruthy();
});

it('error de ficha ofrece reintento y nunca presenta el producto ficticio del mismo SKU', async () => {
  window.history.replaceState({}, '', '/producto?sku=ES-D001');
  let calls = 0;
  const loader = async () => { if (++calls === 1) throw new Error('no mostrar'); return []; };
  render(<ProductDetail loader={loader} />);
  await screen.findByRole('alert');
  expect(screen.queryByText('Placa de desarrollo Nova')).toBeNull();
  expect(screen.queryByText('Producto no encontrado')).toBeNull();
  await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }));
  await screen.findByText('Producto no encontrado');
});

it('catálogo con origen Supabase fallido conserva estado de error y no presenta demo', async () => {
  const source = createCatalogSource({ mode: 'supabase', url: 'https://example.supabase.co', publishableKey: 'sb_publishable_testfixture' },
    async () => new Response('detalle privado', { status: 403 }));
  render(<Catalog loader={source.loadProducts} />);
  await screen.findByRole('alert');
  expect(screen.queryByText('Placa de desarrollo Nova')).toBeNull();
  expect(screen.queryByText('16 de 16 productos')).toBeNull();
});
