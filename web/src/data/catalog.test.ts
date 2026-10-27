import { describe, expect, it } from 'vitest';
import { categories, filterProducts, findProduct, formatPrice, products, productUrl } from './catalog';

describe('Contrato del catálogo demo', () => {
  it('contiene 16 SKU únicos y cuatro categorías con cuatro productos', () => {
    expect(products).toHaveLength(16);
    expect(new Set(products.map(p => p.sku)).size).toBe(16);
    for (const category of categories) expect(filterProducts(products, '', category.id)).toHaveLength(4);
    for (const product of products) {
      expect(Number.isInteger(product.price_cents) && product.price_cents >= 0).toBe(true);
      expect(Number.isInteger(product.stock_demo) && product.stock_demo >= 0).toBe(true);
      expect(categories.some(category => category.id === product.category)).toBe(true);
    }
  });
  it('busca por nombre sin acentos, mayúsculas ni espacios externos', () => {
    expect(filterProducts(products, '  PRECISION  ').map(p => p.sku)).toEqual(['ES-H004']);
  });
  it('busca SKU parcial o completo sin distinguir mayúsculas', () => {
    expect(filterProducts(products, 'es-d')).toHaveLength(4);
    expect(filterProducts(products, ' es-d001 ')).toHaveLength(1);
    expect(findProduct(' es-D001 ')?.name).toBe('Placa de desarrollo Nova');
  });
  it('rechaza SKU ausente, desconocido o contenido HTML', () => {
    for (const sku of [null, '', 'ES-INVALIDO', '<script>']) expect(findProduct(sku)).toBeUndefined();
    expect(filterProducts(products, '<script>')).toEqual([]);
  });
  it('combina texto, categoría y disponibilidad y devuelve cero resultados', () => {
    expect(filterProducts(products, 'ES-C', 'componentes', true)).toHaveLength(3);
    expect(filterProducts(products, 'ES-C', 'energia', true)).toEqual([]);
    expect(filterProducts([], '', '', true)).toEqual([]);
  });
  it('mantiene centavos y escapa el SKU al construir enlaces', () => {
    expect(formatPrice(3599)).toContain('35.99');
    expect(productUrl('A&B')).toBe('/producto?sku=A%26B');
  });
});
