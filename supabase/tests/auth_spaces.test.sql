begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@example.com', crypt('Password1', gen_salt('bf')), now(), '{}', '{"display_name":"Ana","accepts_terms":true,"confirms_adult":true}', now(), now()),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bia@example.com', crypt('Password1', gen_salt('bf')), now(), '{}', '{"display_name":"Bia","accepts_terms":true,"confirms_adult":true}', now(), now());

select is((select count(*)::integer from public.profiles where user_id in ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002')), 2, 'confirmation provisions two profiles');
select is((select count(*)::integer from public.spaces where kind = 'personal' and owner_user_id in ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002')), 2, 'each user receives one personal space');
select is((select count(*)::integer from public.space_members where role = 'owner' and user_id in ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002')), 2, 'each user owns the personal space');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select is((select count(*)::integer from public.profiles), 1, 'user A sees only own profile');
select is((select count(*)::integer from public.spaces), 1, 'user A sees only own space');
select is((select count(*)::integer from public.space_members), 1, 'user A sees only own membership');
select is((select count(*)::integer from public.profiles where user_id = '20000000-0000-0000-0000-000000000002'), 0, 'user A cannot read user B profile');
create function pg_temp.try_update_other_profile() returns integer language plpgsql as $$
declare changed_rows integer;
begin
  update public.profiles set display_name = 'Tentativa indevida'
  where user_id = '20000000-0000-0000-0000-000000000002';
  get diagnostics changed_rows = row_count;
  return changed_rows;
end;
$$;
select is(pg_temp.try_update_other_profile(), 0, 'user A cannot update user B profile');

select * from finish();
rollback;
