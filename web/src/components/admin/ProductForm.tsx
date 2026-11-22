import { useRef, useState, type SubmitEvent } from 'react';
import { blankFields, fieldsFor, validateProduct, type AdminCategory, type AdminProduct, type ProductDraft, type ProductErrors, type ProductFields } from '../../data/admin-product';

export default function ProductForm({ product, categories, busy, onSave, onCancel }: {
  product?: AdminProduct; categories: AdminCategory[]; busy: boolean;
  onSave: (value: ProductDraft) => Promise<void>; onCancel: () => void;
}) {
  const [fields, setFields] = useState<ProductFields>(() => product ? fieldsFor(product) : blankFields());
  const [errors, setErrors] = useState<ProductErrors>({});
  const form = useRef<HTMLFormElement>(null);
  const change = (key: keyof ProductFields, value: string) => setFields(old => ({ ...old, [key]: value }));
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateProduct(fields);
    if (!categories.some(c => c.id === fields.category_id)) result.errors.category_id = 'Selecciona una categoría existente.';
    setErrors(result.errors);
    if (!result.value || Object.keys(result.errors).length) {
      queueMicrotask(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    await onSave(result.value);
  }
  const attrs = (key: keyof ProductFields) => ({ id: `admin-${key}`, 'aria-invalid': errors[key] ? true as const : undefined,
    'aria-describedby': errors[key] ? `error-${key}` : undefined });
  const error = (key: keyof ProductFields) => errors[key] ? <p className="field-error" id={`error-${key}`}>{errors[key]}</p> : null;
  return <section className="admin-panel" aria-labelledby="product-form-title">
    <h2 id="product-form-title">{product ? 'Editar producto' : 'Nuevo producto'}</h2>
    <p>Datos ficticios DEMO. Precio en centavos MXN, sin decimales: 24900 equivale a $249.00.</p>
    <form ref={form} onSubmit={submit} noValidate>
      <fieldset disabled={busy} className="admin-fields">
        <legend className="sr-only">Datos del producto</legend>
        <div><label htmlFor="admin-sku">SKU</label><input {...attrs('sku')} value={fields.sku} onChange={e => change('sku', e.target.value)} maxLength={50} autoComplete="off" required />{error('sku')}</div>
        <div><label htmlFor="admin-name">Nombre</label><input {...attrs('name')} value={fields.name} onChange={e => change('name', e.target.value)} required />{error('name')}</div>
        <div className="admin-full"><label htmlFor="admin-description">Descripción</label><textarea {...attrs('description')} value={fields.description} onChange={e => change('description', e.target.value)} rows={4} required />{error('description')}</div>
        <div><label htmlFor="admin-category_id">Categoría del producto</label><select {...attrs('category_id')} value={fields.category_id} onChange={e => change('category_id', e.target.value)}>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}{c.is_active ? '' : ' (categoría oculta)'}</option>)}
        </select>{error('category_id')}</div>
        <div><label htmlFor="admin-price_cents">Precio en centavos MXN</label><input {...attrs('price_cents')} inputMode="numeric" value={fields.price_cents} onChange={e => change('price_cents', e.target.value)} required />{error('price_cents')}</div>
        <div><label htmlFor="admin-stock_demo">Stock demo</label><input {...attrs('stock_demo')} inputMode="numeric" value={fields.stock_demo} onChange={e => change('stock_demo', e.target.value)} required />{error('stock_demo')}</div>
        <div><label htmlFor="admin-is_active">Visibilidad del producto</label><select {...attrs('is_active')} value={fields.is_active} onChange={e => change('is_active', e.target.value)}><option value="true">Activo</option><option value="false">Oculto</option></select>{error('is_active')}</div>
      </fieldset>
      <div className="admin-actions"><button className="button" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar producto'}</button><button className="button secondary" type="button" disabled={busy} onClick={onCancel}>Cancelar edición</button></div>
    </form>
  </section>;
}
