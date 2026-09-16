-- Financial data owned by a space, so every member of a couple sees the same figures.
-- Builds on the spaces/space_members tables from 20260913190000_auth_spaces.sql.

create type public.transaction_kind as enum ('expense', 'income');
create type public.recurrence_frequency as enum ('weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'yearly');
create type public.invite_status as enum ('pending', 'accepted', 'revoked');

-- ---------------------------------------------------------------- categories

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  kind public.transaction_kind not null,
  name text not null check (char_length(trim(name)) between 1 and 40),
  icon text not null default 'category',
  color text not null default '#0F8F6B' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  unique (space_id, kind, name)
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 40),
  icon text not null default 'credit_card',
  -- Only a credit method may be paid in installments.
  is_credit boolean not null default false,
  created_at timestamptz not null default now(),
  unique (space_id, name)
);

-- ------------------------------------------------------------- transactions

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  kind public.transaction_kind not null,
  description text not null check (char_length(trim(description)) between 1 and 120),
  amount_cents bigint not null check (amount_cents > 0),
  category text not null,
  payment_method text,
  local_date date not null,
  note text check (note is null or char_length(note) <= 500),

  -- Who actually paid. Storing the user id instead of "me"/"partner" keeps the record
  -- meaningful for both members — "me" would flip meaning depending on who is looking.
  paid_by uuid not null references auth.users(id) on delete restrict,
  -- Share of the amount that belongs to the payer; the rest belongs to the other
  -- members. 100 means the payer owns it entirely.
  payer_percent smallint not null default 100 check (payer_percent between 0 and 100),

  recurrence public.recurrence_frequency,

  -- Installments are materialised one row per month; these tie the slices together.
  purchase_id uuid,
  installment_number smallint check (installment_number is null or installment_number > 0),
  installment_total smallint check (installment_total is null or installment_total > 1),
  purchase_amount_cents bigint check (purchase_amount_cents is null or purchase_amount_cents > 0),

  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- An installment row carries all four fields or none of them.
  constraint installment_fields_together check (
    (purchase_id is null and installment_number is null and installment_total is null and purchase_amount_cents is null)
    or (purchase_id is not null and installment_number is not null and installment_total is not null and purchase_amount_cents is not null)
  ),
  constraint installment_number_within_total check (
    installment_number is null or installment_number <= installment_total
  )
);

create index transactions_space_date_idx on public.transactions(space_id, local_date desc);
create index transactions_purchase_idx on public.transactions(purchase_id) where purchase_id is not null;

-- --------------------------------------------------------------- settings

create table public.space_settings (
  space_id uuid primary key references public.spaces(id) on delete cascade,
  currency text not null default 'BRL' check (char_length(currency) = 3),
  timezone text not null default 'America/Sao_Paulo',
  monthly_limit_cents bigint check (monthly_limit_cents is null or monthly_limit_cents >= 0),
  -- Category name → limit in cents.
  category_limits jsonb not null default '{}'::jsonb,
  cycle_start_day smallint not null default 1 check (cycle_start_day between 1 and 28),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- invites

create table public.space_invites (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  -- Long enough that codes cannot be guessed by trying.
  code text not null unique check (code ~ '^[A-Z0-9]{12}$'),
  invited_by uuid not null references auth.users(id) on delete cascade,
  status public.invite_status not null default 'pending',
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint accepted_fields_together check (
    (status = 'accepted' and accepted_by is not null and accepted_at is not null)
    or (status <> 'accepted' and accepted_by is null and accepted_at is null)
  )
);

create index space_invites_space_idx on public.space_invites(space_id) where status = 'pending';

-- ------------------------------------------------------------------- RLS

alter table public.categories enable row level security;
alter table public.payment_methods enable row level security;
alter table public.transactions enable row level security;
alter table public.space_settings enable row level security;
alter table public.space_invites enable row level security;

-- Every financial table follows the same rule: you reach a row only through an active
-- membership of its space.
create policy categories_member_all on public.categories for all to authenticated
  using (public.is_active_space_member(space_id, auth.uid()))
  with check (public.is_active_space_member(space_id, auth.uid()));

create policy payment_methods_member_all on public.payment_methods for all to authenticated
  using (public.is_active_space_member(space_id, auth.uid()))
  with check (public.is_active_space_member(space_id, auth.uid()));

create policy transactions_member_all on public.transactions for all to authenticated
  using (public.is_active_space_member(space_id, auth.uid()))
  with check (public.is_active_space_member(space_id, auth.uid()) and created_by = auth.uid());

create policy space_settings_member_all on public.space_settings for all to authenticated
  using (public.is_active_space_member(space_id, auth.uid()))
  with check (public.is_active_space_member(space_id, auth.uid()));

-- Invites are readable by the space that issued them. Redeeming happens through
-- accept_space_invite, so an invitee never needs to select this table.
create policy space_invites_member_read on public.space_invites for select to authenticated
  using (public.is_active_space_member(space_id, auth.uid()));

create policy space_invites_member_write on public.space_invites for insert to authenticated
  with check (public.is_active_space_member(space_id, auth.uid()) and invited_by = auth.uid());

create policy space_invites_member_revoke on public.space_invites for update to authenticated
  using (public.is_active_space_member(space_id, auth.uid()))
  with check (public.is_active_space_member(space_id, auth.uid()));

grant select, insert, update, delete on public.categories, public.payment_methods, public.transactions, public.space_settings to authenticated;
grant select, insert, update on public.space_invites to authenticated;

-- ------------------------------------------------------- accepting an invite

/*
  Redeeming a code is security definer on purpose: the person accepting is not a member
  of the space yet, so RLS would hide the invite from them and block the membership
  insert. Everything the caller can influence is the code itself.

  The inviter's personal space becomes a household, which is what makes the new member
  "arrive with" the existing data — no rows are moved.
*/
create or replace function public.accept_space_invite(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite public.space_invites;
  joining_user uuid := auth.uid();
begin
  if joining_user is null then
    raise exception 'Você precisa estar autenticado para aceitar um convite.';
  end if;

  select * into invite from public.space_invites
  where code = upper(trim(invite_code)) for update;

  if not found then
    raise exception 'Convite não encontrado.';
  end if;
  if invite.status <> 'pending' then
    raise exception 'Este convite já foi usado.';
  end if;
  if invite.expires_at < now() then
    raise exception 'Este convite expirou.';
  end if;
  if invite.invited_by = joining_user then
    raise exception 'Você não pode aceitar o próprio convite.';
  end if;
  if public.is_active_space_member(invite.space_id, joining_user) then
    raise exception 'Você já faz parte deste espaço.';
  end if;

  update public.spaces set kind = 'household', updated_at = now()
  where id = invite.space_id and kind = 'personal';

  insert into public.space_members(space_id, user_id, role, status)
  values (invite.space_id, joining_user, 'member', 'active')
  on conflict (space_id, user_id) do update set status = 'active', removed_at = null;

  update public.space_invites
  set status = 'accepted', accepted_by = joining_user, accepted_at = now()
  where id = invite.id;

  return invite.space_id;
end;
$$;

revoke all on function public.accept_space_invite(text) from public;
grant execute on function public.accept_space_invite(text) to authenticated;

-- Seeds the settings row so a space always has one to read.
create or replace function public.provision_space_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.space_settings(space_id) values (new.id) on conflict (space_id) do nothing;
  return new;
end;
$$;

create trigger provision_settings_after_space
after insert on public.spaces
for each row execute function public.provision_space_settings();

-- Backfills spaces created before this migration.
insert into public.space_settings(space_id)
select id from public.spaces on conflict (space_id) do nothing;
