-- saveLearnedKanji()/syncLearnedFromCloud() use upsert(onConflict:'user_id,character'),
-- which needs UPDATE permission. The initial migration only granted
-- select/insert/delete, so re-saving an already-learned kanji failed silently
-- (surfacing only as a console.error).
drop policy if exists "own rows - update" on public.learned_kanji;
create policy "own rows - update" on public.learned_kanji
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
