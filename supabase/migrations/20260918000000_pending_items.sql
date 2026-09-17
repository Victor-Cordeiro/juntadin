-- Bills/debts tracked ahead of time — "devo pro Felipe", "conta de luz" — not yet
-- reflected in the balance. Settling one creates a normal row in public.transactions;
-- this table only tracks what's still owed and, once paid, a pointer to that row.

create type public.pending_item_kind as enum ('payable', 'receivable');
create type public.pending_item_status as enum ('pending', 'settled');

create table public.pending_items (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  kind public.pending_item_kind not null,
  description text not null check (char_length(trim(description)) between 1 and 120),
  amount_cents bigint not null check (amount_cents > 0),
  due_date date not null,
  category text not null,
  payment_method text,
  -- Free text ("me"/"partner"/"shared" from the app's own enum) — kept simple since a
  -- bill's counterparty is often outside the household (e.g. "Felipe"), unlike
  -- transactions.paid_by which always points at a household member.
  party text not null default 'me',
  note text check (note is null or char_length(note) <= 500),
  recurrence public.recurrence_frequency,
  status public.pending_item_status not null default 'pending',
  settled_at timestamptz,
  settled_transaction_id uuid references public.transactions(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint settled_fields_together check (
    (status = 'pending' and settled_at is null and settled_transaction_id is null)
    or (status = 'settled' and settled_at is not null)
  )
);

create index pending_items_space_due_idx on public.pending_items(space_id, due_date) where status = 'pending';

alter table public.pending_items enable row level security;

create policy pending_items_member_all on public.pending_items for all to authenticated
  using (public.is_active_space_member(space_id, auth.uid()))
  with check (public.is_active_space_member(space_id, auth.uid()) and created_by = auth.uid());

grant select, insert, update, delete on public.pending_items to authenticated;
