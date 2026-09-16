begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

-- Ana and Bia will become a couple; Caio stays outside and must never see their data.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@example.com', crypt('Password1', gen_salt('bf')), now(), '{}', '{"display_name":"Ana","phone_e164":"+5511999999999"}', now(), now()),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bia@example.com', crypt('Password1', gen_salt('bf')), now(), '{}', '{"display_name":"Bia","phone_e164":"+5521999999999"}', now(), now()),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'caio@example.com', crypt('Password1', gen_salt('bf')), now(), '{}', '{"display_name":"Caio","phone_e164":"+5531999999999"}', now(), now());

-- Every space gets its settings row from the trigger.
select is(
  (select count(*)::integer from public.space_settings),
  3,
  'each provisioned space receives a settings row'
);

-- Ana records an expense in her own space.
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

insert into public.transactions (space_id, kind, description, amount_cents, category, local_date, paid_by, created_by)
select id, 'expense', 'Mercado', 25000, 'Mercado', current_date, '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'
from public.spaces where owner_user_id = '10000000-0000-0000-0000-000000000001';

select is((select count(*)::integer from public.transactions), 1, 'Ana sees her own transaction');

-- Before the invite, Bia sees nothing of Ana's.
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
select is((select count(*)::integer from public.transactions), 0, 'Bia cannot see Ana transactions before joining');

-- Ana issues an invite.
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
insert into public.space_invites (space_id, code, invited_by)
select id, 'ABCDEFGH1234', '10000000-0000-0000-0000-000000000001'
from public.spaces where owner_user_id = '10000000-0000-0000-0000-000000000001';

-- Nobody can accept their own invite.
select throws_ok(
  $$ select public.accept_space_invite('ABCDEFGH1234') $$,
  'Você não pode aceitar o próprio convite.',
  'the inviter cannot redeem their own code'
);

-- A wrong code fails.
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$ select public.accept_space_invite('ZZZZZZZZ9999') $$,
  'Convite não encontrado.',
  'an unknown code is rejected'
);

-- Bia accepts and joins the space.
select lives_ok(
  $$ select public.accept_space_invite('ABCDEFGH1234') $$,
  'Bia redeems the invite'
);

select is(
  (select kind::text from public.spaces where owner_user_id = '10000000-0000-0000-0000-000000000001'),
  'household',
  'the personal space becomes a household once shared'
);

-- This is the whole point: Bia now sees the data that already existed.
select is((select count(*)::integer from public.transactions), 1, 'Bia arrives to the existing transactions');

-- And she can add her own, visible to Ana.
insert into public.transactions (space_id, kind, description, amount_cents, category, local_date, paid_by, created_by)
select space_id, 'income', 'Salário', 500000, 'Salário', current_date, '20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002'
from public.space_members where user_id = '20000000-0000-0000-0000-000000000002' and role = 'member';

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select is((select count(*)::integer from public.transactions), 2, 'Ana sees the transaction Bia added');

-- The code cannot be reused.
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$ select public.accept_space_invite('ABCDEFGH1234') $$,
  'Este convite já foi usado.',
  'a spent invite cannot be redeemed twice'
);

-- Caio, outside the couple, still sees nothing.
select is((select count(*)::integer from public.transactions), 0, 'an outsider sees none of the couple data');

-- An expired invite is refused.
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
insert into public.space_invites (space_id, code, invited_by, expires_at)
select id, 'EXPIRED12345', '10000000-0000-0000-0000-000000000001', now() - interval '1 day'
from public.spaces where owner_user_id = '10000000-0000-0000-0000-000000000001';

select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true);
select throws_ok(
  $$ select public.accept_space_invite('EXPIRED12345') $$,
  'Este convite expirou.',
  'an expired invite is refused'
);

select * from finish();
rollback;
