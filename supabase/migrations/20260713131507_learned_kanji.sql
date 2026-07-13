-- learned_kanji: one row per user per learned kanji character.
-- Written to be idempotent so it applies cleanly whether or not the table was
-- already created by hand in the SQL Editor.

create table if not exists public.learned_kanji (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  character   text not null,
  kanji       jsonb not null,
  created_at  timestamptz not null default now(),
  unique (user_id, character)
);

-- Enabling RLS is a no-op if it's already on.
alter table public.learned_kanji enable row level security;

-- Each user can only read/write their own rows.
drop policy if exists "own rows - select" on public.learned_kanji;
create policy "own rows - select" on public.learned_kanji
  for select using (auth.uid() = user_id);

drop policy if exists "own rows - insert" on public.learned_kanji;
create policy "own rows - insert" on public.learned_kanji
  for insert with check (auth.uid() = user_id);

drop policy if exists "own rows - delete" on public.learned_kanji;
create policy "own rows - delete" on public.learned_kanji
  for delete using (auth.uid() = user_id);
