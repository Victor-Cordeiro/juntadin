create extension if not exists pgcrypto with schema extensions;

create type public.space_kind as enum ('personal', 'household');
create type public.space_member_role as enum ('owner', 'member');
create type public.space_member_status as enum ('active', 'removed');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 120),
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{9,14}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  kind public.space_kind not null,
  name text not null check (char_length(trim(name)) between 2 and 80),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index spaces_one_personal_per_owner
  on public.spaces(owner_user_id) where kind = 'personal';

create table public.space_members (
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.space_member_role not null,
  status public.space_member_status not null default 'active',
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (space_id, user_id),
  check ((status = 'active' and removed_at is null) or (status = 'removed' and removed_at is not null))
);

create index space_members_user_active_idx on public.space_members(user_id, space_id) where status = 'active';

create or replace function public.is_active_space_member(target_space_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.space_members
    where space_id = target_space_id and user_id = target_user_id and status = 'active'
  );
$$;

revoke all on function public.is_active_space_member(uuid, uuid) from public;
grant execute on function public.is_active_space_member(uuid, uuid) to authenticated;

create or replace function public.provision_confirmed_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  personal_space_id uuid;
  user_name text;
  user_phone text;
begin
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null then
    return new;
  end if;

  user_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1));
  user_phone := new.raw_user_meta_data ->> 'phone_e164';
  if user_phone is null or user_phone !~ '^\+[1-9][0-9]{9,14}$' then
    raise exception 'A valid phone_e164 user metadata value is required';
  end if;

  insert into public.profiles(user_id, display_name, phone_e164)
  values (new.id, user_name, user_phone)
  on conflict (user_id) do nothing;

  insert into public.spaces(kind, name, owner_user_id)
  values ('personal', 'Meu espaço', new.id)
  on conflict (owner_user_id) where kind = 'personal' do update set updated_at = public.spaces.updated_at
  returning id into personal_space_id;

  insert into public.space_members(space_id, user_id, role, status)
  values (personal_space_id, new.id, 'owner', 'active')
  on conflict (space_id, user_id) do nothing;

  return new;
end;
$$;

create trigger provision_user_after_confirmation
after insert or update of email_confirmed_at on auth.users
for each row execute function public.provision_confirmed_user();

alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using (user_id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy spaces_select_member on public.spaces for select to authenticated using (public.is_active_space_member(id, auth.uid()));
create policy space_members_select_member on public.space_members for select to authenticated using (public.is_active_space_member(space_id, auth.uid()));

grant select, update on public.profiles to authenticated;
grant select on public.spaces, public.space_members to authenticated;
