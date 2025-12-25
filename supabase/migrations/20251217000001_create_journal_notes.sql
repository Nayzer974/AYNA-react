-- Journal notes (per-user) storage
-- Ensures that notes are owned by a user and protected by RLS.

create extension if not exists "pgcrypto";

create table if not exists public.journal_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_journal_notes_user_id on public.journal_notes(user_id);
create index if not exists idx_journal_notes_created_at on public.journal_notes(created_at desc);

alter table public.journal_notes enable row level security;

-- Only owner can read
create policy "journal_notes_select_own"
  on public.journal_notes
  for select
  using (auth.uid() = user_id);

-- Only owner can insert
create policy "journal_notes_insert_own"
  on public.journal_notes
  for insert
  with check (auth.uid() = user_id);

-- Only owner can update
create policy "journal_notes_update_own"
  on public.journal_notes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Only owner can delete
create policy "journal_notes_delete_own"
  on public.journal_notes
  for delete
  using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_journal_notes_updated_at on public.journal_notes;
create trigger trg_journal_notes_updated_at
before update on public.journal_notes
for each row execute function public.set_updated_at();


