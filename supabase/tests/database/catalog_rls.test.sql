-- SOLO Supabase local. Usuarios efímeros en transacción, sin contraseñas ni cuentas remotas.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

select is((select count(*) from public.products where sku like 'ES-%'), 16::bigint, 'Seed: 16 productos CP-002');
select is((select count(*) from public.categories), 4::bigint, 'Seed: cuatro categorías');
select ok((select bool_and(relrowsecurity) from pg_class where oid in (
  'public.products'::regclass, 'public.categories'::regclass, 'public.admin_users'::regclass
)), 'RLS habilitado en las tres tablas');
select ok(not has_table_privilege('anon', 'public.products', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'), 'Anon sin privilegios de escritura');
select ok(not has_table_privilege('authenticated', 'public.products', 'TRUNCATE,REFERENCES,TRIGGER'), 'Authenticated sin privilegios de DDL o truncate');
select ok(not has_table_privilege('authenticated', 'public.admin_users', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'), 'Membresías sin grants a authenticated');
select ok(not has_table_privilege('anon', 'public.admin_users', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER'), 'Membresías sin grants a anon');
select ok(not has_table_privilege('authenticated', 'public.categories', 'INSERT,UPDATE,DELETE,TRUNCATE'), 'Categorías no editables desde cliente');
select ok(not has_function_privilege('anon', 'electroshop_private.is_admin()', 'EXECUTE'), 'Anon no ejecuta helper');
select ok(has_function_privilege('authenticated', 'electroshop_private.is_admin()', 'EXECUTE'), 'Authenticated puede evaluar su membresía');
select ok((select prosecdef from pg_proc where oid = 'electroshop_private.is_admin()'::regprocedure), 'Helper SECURITY DEFINER');
select ok((select proconfig @> array['search_path=""'] from pg_proc where oid = 'electroshop_private.is_admin()'::regprocedure), 'Helper fija search_path vacío');

insert into auth.users (id, aud, role, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', '{"role":"admin"}'),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', '{}');
insert into public.admin_users(user_id) values ('22222222-2222-4222-8222-222222222222');
insert into public.categories(id, name, is_active) values ('test-inactive', 'Categoría oculta de prueba', false);
insert into public.products(sku, name, description, category_id, price_cents, stock_demo, is_active) values
  ('TEST-HIDDEN', 'Oculto', 'Fixture transaccional', 'componentes', 100, 1, false),
  ('TEST-HIDDEN-CATEGORY', 'Categoría oculta', 'Fixture transaccional', 'test-inactive', 100, 1, true);

-- Constraints se prueban con privilegios del operador, independientes de RLS.
select throws_ok($$insert into public.products(sku,name,description,category_id,price_cents) values ('ES-C001','x','x','componentes',1)$$, '23505', null::text, 'SKU único');
select throws_ok($$insert into public.products(sku,name,description,category_id,price_cents) values ('test-lower','x','x','componentes',1)$$, '23514', null::text, 'SKU canónico mayúsculas');
select throws_ok($$insert into public.products(sku,name,description,category_id,price_cents) values ('TEST-PRICE','x','x','componentes',-1)$$, '23514', null::text, 'Precio no negativo');
select throws_ok($$insert into public.products(sku,name,description,category_id,price_cents,stock_demo) values ('TEST-STOCK','x','x','componentes',1,-1)$$, '23514', null::text, 'Stock no negativo');
select throws_ok($$insert into public.products(sku,name,description,category_id,price_cents) values ('TEST-FK','x','x','no-existe',1)$$, '23503', null::text, 'Categoría FK');
select throws_ok($$delete from public.categories where id='componentes'$$, '23503', null::text, 'No borrar categoría referenciada');
select throws_ok($$insert into public.admin_users(user_id) values ('33333333-3333-4333-8333-333333333333')$$, '23503', null::text, 'Admin requiere usuario Auth existente');

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is((select count(*) from public.products), 16::bigint, 'Anon solo ve productos activos de categorías activas');
select is((select count(*) from public.categories), 4::bigint, 'Anon solo ve categorías activas');
select throws_ok($$insert into public.products(sku,name,description,category_id,price_cents) values ('TEST-ANON','x','x','componentes',1)$$, '42501', null::text, 'Anon no inserta');
select throws_ok($$update public.products set price_cents=0 where sku='ES-C001'$$, '42501', null::text, 'Anon no actualiza');
select throws_ok($$delete from public.products where sku='ES-C001'$$, '42501', null::text, 'Anon no borra');
select throws_ok($$select * from public.admin_users$$, '42501', null::text, 'Anon no enumera administradores');
select throws_ok($$insert into public.admin_users(user_id) values ('11111111-1111-4111-8111-111111111111')$$, '42501', null::text, 'Anon no se asigna admin');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","user_metadata":{"role":"admin"}}', true);
select ok(not electroshop_private.is_admin(), 'Metadata admin del cliente no concede permisos');
select is((select count(*) from public.products), 16::bigint, 'Usuario normal no ve inactivos');
select is((select count(*) from public.categories), 4::bigint, 'Usuario normal no ve categorías inactivas');
select throws_ok($$insert into public.products(sku,name,description,category_id,price_cents) values ('TEST-USER','x','x','componentes',1)$$, '42501', null::text, 'RLS bloquea INSERT normal con grant existente');
select is((with changed as (update public.products set price_cents=0 where sku='ES-C001' returning sku) select count(*) from changed), 0::bigint, 'RLS no actualiza filas para usuario normal');
select is((with changed as (delete from public.products where sku='ES-C001' returning sku) select count(*) from changed), 0::bigint, 'RLS no borra filas para usuario normal');
select is((select price_cents from public.products where sku='ES-C001'), 3500, 'Precio original intacto');
select throws_ok($$select * from public.admin_users$$, '42501', null::text, 'Usuario no enumera administradores');
select throws_ok($$insert into public.admin_users(user_id) values (auth.uid())$$, '42501', null::text, 'Usuario no se asigna admin');
select throws_ok($$update public.admin_users set user_id=auth.uid()$$, '42501', null::text, 'Usuario no reemplaza membresías');
select throws_ok($$delete from public.admin_users$$, '42501', null::text, 'Usuario no borra membresías');
select throws_ok($$truncate public.products$$, '42501', null::text, 'Authenticated no elude RLS con TRUNCATE');

-- Rol authenticated SIN sub, como defensa adicional ante sesiones sin identidad.
select set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select ok(not electroshop_private.is_admin(), 'Sin auth.uid no es admin');
select throws_ok($$insert into public.products(sku,name,description,category_id,price_cents) values ('TEST-NO-SUB','x','x','componentes',1)$$, '42501', null::text, 'Sin sub no escribe');

select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select ok(electroshop_private.is_admin(), 'Admin verificado desde PostgreSQL');
select is((select count(*) from public.products), 18::bigint, 'Admin lee también productos ocultos');
select is((select count(*) from public.categories), 5::bigint, 'Admin lee categorías ocultas');
select lives_ok($$insert into public.products(sku,name,description,category_id,price_cents) values ('TEST-ADMIN','Producto demo','Fixture','componentes',123)$$, 'Admin inserta');
select is((with changed as (update public.products set price_cents=456, stock_demo=2, is_active=false where sku='TEST-ADMIN' returning sku) select count(*) from changed), 1::bigint, 'Admin actualiza y desactiva');
select is((select price_cents from public.products where sku='TEST-ADMIN'), 456, 'Persistió actualización del admin');
select is((with changed as (delete from public.products where sku='TEST-ADMIN' returning sku) select count(*) from changed), 1::bigint, 'Admin borra');
select throws_ok($$insert into public.admin_users(user_id) values ('11111111-1111-4111-8111-111111111111')$$, '42501', null::text, 'Ni admin crea administradores desde cliente');
select throws_ok($$update public.admin_users set user_id='11111111-1111-4111-8111-111111111111'$$, '42501', null::text, 'Ni admin reemplaza membresías');
select throws_ok($$delete from public.admin_users$$, '42501', null::text, 'Ni admin revoca membresías desde cliente');
select throws_ok($$insert into public.categories(id,name) values ('test-api','No permitido')$$, '42501', null::text, 'Admin API no administra categorías en CP-003A');
reset role;

-- Revocación por operador: el JWT no conserva privilegios antiguos.
delete from public.admin_users where user_id='22222222-2222-4222-8222-222222222222';
set local role authenticated;
select ok(not electroshop_private.is_admin(), 'Membresía revocada se aplica sin renovar JWT');
select throws_ok($$insert into public.products(sku,name,description,category_id,price_cents) values ('TEST-REVOKED','x','x','componentes',1)$$, '42501', null::text, 'Admin revocado no escribe');
reset role;

select * from finish();
rollback;
