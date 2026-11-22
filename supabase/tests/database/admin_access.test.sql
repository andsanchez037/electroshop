-- CP-004: exclusivamente local, identidades transaccionales sin contraseñas.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(16);
select ok(to_regprocedure('public.current_user_is_admin()') is not null, 'RPC existe');
select ok(not (select prosecdef from pg_proc where oid='public.current_user_is_admin()'::regprocedure), 'RPC SECURITY INVOKER');
select is((select pg_get_userbyid(proowner) from pg_proc where oid='public.current_user_is_admin()'::regprocedure), 'postgres', 'Owner postgres');
select ok((select proconfig @> array['search_path=""'] from pg_proc where oid='public.current_user_is_admin()'::regprocedure), 'Search path fijo');
select is((select provolatile::text from pg_proc where oid='public.current_user_is_admin()'::regprocedure), 's', 'RPC estable');
select ok(not has_function_privilege('anon','public.current_user_is_admin()','EXECUTE'), 'Anon sin EXECUTE');
select ok(has_function_privilege('authenticated','public.current_user_is_admin()','EXECUTE'), 'Authenticated con EXECUTE');
select ok(not has_function_privilege('service_role','public.current_user_is_admin()','EXECUTE'), 'Service role sin EXECUTE');
select is((select pronargs::integer from pg_proc where oid='public.current_user_is_admin()'::regprocedure), 0, 'Sin parámetros de identidad');

insert into auth.users(id,aud,role,raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111','authenticated','authenticated','{"role":"admin"}'),
('22222222-2222-4222-8222-222222222222','authenticated','authenticated','{}');
set local role anon;
select throws_ok($$select public.current_user_is_admin()$$,'42501',null::text,'Anon no consulta RPC');
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","user_metadata":{"role":"admin"}}',true);
select ok(not public.current_user_is_admin(),'Metadata falsa no concede membresía');
select throws_ok($$insert into public.admin_users(user_id) values (auth.uid())$$,'42501',null::text,'RPC no permite autoasignación');
reset role;
insert into public.admin_users(user_id) values ('22222222-2222-4222-8222-222222222222');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
select ok(public.current_user_is_admin(),'Membresía real comprobada en PostgreSQL');
reset role;
delete from public.admin_users where user_id='22222222-2222-4222-8222-222222222222';
set local role authenticated;
select ok(not public.current_user_is_admin(),'Revocación efectiva con mismo JWT');
select set_config('request.jwt.claims','{"role":"authenticated"}',true);
select ok(not public.current_user_is_admin(),'Sin sub no es administrador');
select throws_ok($$select public.current_user_is_admin('22222222-2222-4222-8222-222222222222'::uuid)$$,'42883',null::text,'No acepta identidad arbitraria');
reset role;
select * from finish();
rollback;
