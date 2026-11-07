import { describe, expect, it } from 'vitest';
import { blankFields, parseAdminProduct, validateProduct } from './admin-product';
const valid = { ...blankFields(), sku: 'TEST-001', name: 'Demo', description: 'Descripción demo', price_cents: '24900' };
describe('Contrato de productos admin', () => {
  it('convierte centavos/stock enteros sin redondeo e incluye visibilidad', () => {
    expect(validateProduct(valid).value).toEqual({ sku: 'TEST-001', name: 'Demo', description: 'Descripción demo', category_id: 'componentes', price_cents: 24900, stock_demo: 0, is_active: true });
    expect(validateProduct({ ...valid, price_cents: '0', stock_demo: '2147483647', is_active: 'false' }).value?.is_active).toBe(false);
  });
  it.each(['-1', '1.50', '1e3', '2147483648', '', 'NaN', ' 12'])('rechaza precio y stock no int32: %s', value => {
    expect(validateProduct({ ...valid, price_cents: value }).errors.price_cents).toBeTruthy();
    expect(validateProduct({ ...valid, stock_demo: value }).errors.stock_demo).toBeTruthy();
  });
  it('rechaza SKU no canónico, categoría desconocida y flags manipulados', () => {
    expect(validateProduct({ ...valid, sku: 'test-001' }).errors.sku).toBeTruthy();
    expect(validateProduct({ ...valid, sku: ' TEST-001' }).value).toBeUndefined();
    expect(validateProduct({ ...valid, category_id: 'otra' }).errors.category_id).toBeTruthy();
    expect(validateProduct({ ...valid, is_active: 'admin' }).errors.is_active).toBeTruthy();
  });
  it('valida límites de texto y cuenta caracteres Unicode como PostgreSQL', () => {
    expect(validateProduct({ ...valid, name: ' '.repeat(4), description: '' }).value).toBeUndefined();
    expect(validateProduct({ ...valid, name: '😀'.repeat(150) }).value).toBeTruthy();
    expect(validateProduct({ ...valid, name: ` ${'a'.repeat(150)} ` }).value).toBeTruthy();
    expect(validateProduct({ ...valid, name: 'a'.repeat(151) }).errors.name).toBeTruthy();
    expect(validateProduct({ ...valid, description: 'a'.repeat(4001) }).errors.description).toBeTruthy();
  });
  it('valida también respuestas de BD sin aceptar tipos malformados', () => {
    const p = { ...validateProduct(valid).value!, id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' };
    expect(parseAdminProduct(p)).toEqual(p);
    expect(() => parseAdminProduct({ ...p, stock_demo: '1' })).toThrow();
    expect(() => parseAdminProduct({ ...p, category_id: 'otra' })).toThrow();
  });
});
