-- CP-004 LOCAL ONLY until independent review and remote authorization.
begin;

-- Necesario para comprobar membresía desde la API sin exponer la tabla ni el
-- esquema privado. INVOKER: no añade privilegios al helper aprobado CP-003A.
create function public.current_user_is_admin()
returns boolean
language sql stable security invoker
set search_path = ''
as $$
  select electroshop_private.is_admin();
$$;
alter function public.current_user_is_admin() owner to postgres;
revoke all on function public.current_user_is_admin() from public, anon, authenticated, service_role;
grant execute on function public.current_user_is_admin() to authenticated;

comment on function public.current_user_is_admin() is 'Consulta de membresía propia; no concede roles ni acepta identidad del cliente.';
commit;
