-- Play policy compliance: phone numbers are no longer collected, legal consent is
-- recorded per account, and users can permanently delete their account and data.

alter table public.profiles drop column phone_e164;
alter table public.profiles add column terms_accepted_at timestamptz;
alter table public.profiles add column privacy_accepted_at timestamptz;
alter table public.profiles add column adult_confirmed_at timestamptz;

-- Existing users accepted the documents in the original email signup flow.
update public.profiles
set terms_accepted_at = coalesce(terms_accepted_at, created_at),
    privacy_accepted_at = coalesce(privacy_accepted_at, created_at),
    adult_confirmed_at = coalesce(adult_confirmed_at, created_at);

create or replace function public.provision_confirmed_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  personal_space_id uuid;
  user_name text;
  accepted_at timestamptz;
begin
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null then
    return new;
  end if;

  user_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1)
  );
  accepted_at := case when coalesce((new.raw_user_meta_data ->> 'accepts_terms')::boolean, false) then now() end;

  insert into public.profiles(user_id, display_name, terms_accepted_at, privacy_accepted_at, adult_confirmed_at)
  values (
    new.id,
    user_name,
    accepted_at,
    accepted_at,
    case when coalesce((new.raw_user_meta_data ->> 'confirms_adult')::boolean, false) then now() end
  )
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

create or replace function public.delete_current_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleting_user uuid := auth.uid();
  owned_space record;
  successor uuid;
begin
  if deleting_user is null then
    raise exception 'Você precisa estar autenticado para excluir a conta.';
  end if;

  -- Rows explicitly tied to this person are deleted from every personal or shared
  -- space. Other members keep their own data.
  delete from public.pending_items where created_by = deleting_user;
  delete from public.transactions where created_by = deleting_user or paid_by = deleting_user;

  for owned_space in
    select id from public.spaces where owner_user_id = deleting_user for update
  loop
    select sm.user_id into successor
    from public.space_members sm
    where sm.space_id = owned_space.id
      and sm.user_id <> deleting_user
      and sm.status = 'active'
    order by sm.joined_at
    limit 1;

    if successor is null then
      delete from public.spaces where id = owned_space.id;
    else
      update public.spaces set owner_user_id = successor, kind = 'household', updated_at = now()
      where id = owned_space.id;
      update public.space_members set role = 'owner'
      where space_id = owned_space.id and user_id = successor;
    end if;
  end loop;

  delete from public.space_members where user_id = deleting_user;
  delete from auth.users where id = deleting_user;
end;
$$;

revoke all on function public.delete_current_account() from public;
grant execute on function public.delete_current_account() to authenticated;
