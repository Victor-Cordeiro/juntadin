begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('81000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-delete@example.com', crypt('Password1', gen_salt('bf')), now(), '{}', '{"display_name":"Owner","accepts_terms":true,"confirms_adult":true}', now(), now()),
  ('82000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'partner-keep@example.com', crypt('Password1', gen_salt('bf')), now(), '{}', '{"display_name":"Partner","accepts_terms":true,"confirms_adult":true}', now(), now());

do $$
declare owner_space uuid;
begin
  select id into owner_space from public.spaces where owner_user_id = '81000000-0000-0000-0000-000000000001';
  update public.spaces set kind = 'household' where id = owner_space;
  insert into public.space_members(space_id, user_id, role, status)
  values (owner_space, '82000000-0000-0000-0000-000000000002', 'member', 'active');
  insert into public.transactions(space_id, kind, description, amount_cents, category, local_date, paid_by, created_by)
  values
    (owner_space, 'expense', 'Do usuário excluído', 1000, 'Outros', current_date, '81000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001'),
    (owner_space, 'expense', 'Do parceiro', 2000, 'Outros', current_date, '82000000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000002');
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '81000000-0000-0000-0000-000000000001', true);
select lives_ok('select public.delete_current_account()', 'authenticated user can delete own account');

reset role;
select is((select count(*)::integer from auth.users where id = '81000000-0000-0000-0000-000000000001'), 0, 'auth account was deleted');
select is((select count(*)::integer from public.profiles where user_id = '81000000-0000-0000-0000-000000000001'), 0, 'profile was deleted');
select is((select count(*)::integer from public.transactions where description = 'Do usuário excluído'), 0, 'deleted user transactions were removed');
select is((select count(*)::integer from public.transactions where description = 'Do parceiro'), 1, 'partner transaction was preserved');
select is((select count(*)::integer from public.spaces where owner_user_id = '82000000-0000-0000-0000-000000000002' and kind = 'household'), 1, 'shared space ownership transferred to partner');
select is((select count(*)::integer from public.space_members sm join public.spaces s on s.id = sm.space_id where sm.user_id = '82000000-0000-0000-0000-000000000002' and sm.role = 'owner' and s.kind = 'household'), 1, 'partner became owner of the shared space');

select * from finish();
rollback;
