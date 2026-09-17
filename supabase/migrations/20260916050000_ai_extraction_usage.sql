-- Tracks how many AI extraction requests each user made per day, so the
-- ai-extract-transaction edge function can cap abuse. Cost per request is
-- negligible (Gemini 3.1 Flash-Lite) — this is a safety net, not a cost control.
-- Only the edge function (service role) ever touches this table.
create table public.ai_extraction_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  count int not null default 0,
  primary key (user_id, day)
);

alter table public.ai_extraction_usage enable row level security;

-- Atomically bumps today's count for a user and returns the new total. Security
-- definer so the edge function's service-role call always succeeds regardless of RLS.
create function public.increment_ai_extraction_usage(p_user_id uuid, p_day date)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.ai_extraction_usage (user_id, day, count)
  values (p_user_id, p_day, 1)
  on conflict (user_id, day) do update set count = ai_extraction_usage.count + 1
  returning count;
$$;
