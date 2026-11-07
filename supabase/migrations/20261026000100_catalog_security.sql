-- CP-003A. Revisar antes de aplicar. No crea usuarios Auth ni administradores.
begin;

create schema electroshop_private authorization postgres;
revoke all on schema electroshop_private from public, anon, authenticated, service_role;
grant usage on schema electroshop_private to authenticated;

create table public.categories (
  id text primary key check (id ~ '^[a-z][a-z0-9-]{0,49}$'),
  name text not null check (length(btrim(name)) between 1 and 100),
  description text not null default '' check (length(description) <= 1000),
  is_active boolean not null default true
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique check (sku = upper(btrim(sku)) and sku ~ '^[A-Z0-9][A-Z0-9-]{0,49}$'),
  name text not null check (length(btrim(name)) between 1 and 150),
  description text not null check (length(btrim(description)) between 1 and 4000),
  category_id text not null references public.categories(id) on update restrict on delete restrict,
  price_cents integer not null check (price_cents >= 0),
  stock_demo integer not null default 0 check (stock_demo >= 0),
  is_active boolean not null default true
);
create index products_category_id_idx on public.products(category_id);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.categories owner to postgres;
alter table public.products owner to postgres;
alter table public.admin_users owner to postgres;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.admin_users enable row level security;

-- Revocar también posibles grants automáticos del proyecto Supabase.
revoke all on table public.categories, public.products, public.admin_users
  from public, anon, authenticated, service_role;
grant usage on schema public to anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

-- Sin parámetros: solo comprueba al usuario del JWT verificado por la plataforma.
-- Esquema NO expuesto por la API. No depende de user_metadata ni roles del cliente.
create function electroshop_private.is_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.admin_users a where a.user_id = (select auth.uid())
  );
$$;
alter function electroshop_private.is_admin() owner to postgres;
revoke all on function electroshop_private.is_admin() from public, anon, authenticated, service_role;
grant execute on function electroshop_private.is_admin() to authenticated;

create policy categories_public_read on public.categories
  for select to anon, authenticated using (is_active);
create policy categories_admin_read on public.categories
  for select to authenticated using ((select electroshop_private.is_admin()));

create policy products_public_read on public.products
  for select to anon, authenticated using (
    is_active and exists (
      select 1 from public.categories c where c.id = products.category_id and c.is_active
    )
  );
create policy products_admin_read on public.products
  for select to authenticated using ((select electroshop_private.is_admin()));
create policy products_admin_insert on public.products
  for insert to authenticated with check ((select electroshop_private.is_admin()));
create policy products_admin_update on public.products
  for update to authenticated
  using ((select electroshop_private.is_admin()))
  with check ((select electroshop_private.is_admin()));
create policy products_admin_delete on public.products
  for delete to authenticated using ((select electroshop_private.is_admin()));

-- admin_users: deliberadamente SIN policies ni grants de cliente (ni para admin).
-- Solo el operador SQL autorizado administra esta tabla fuera del navegador.
comment on table public.products is 'Catálogo académico DEMO, sin stock ni compras reales.';
comment on table public.admin_users is 'Membresías privadas; alta manual por operador PostgreSQL.';
commit;
