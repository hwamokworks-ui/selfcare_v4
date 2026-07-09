-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query) for a new project.

create table user_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  water int not null default 8,
  steps int not null default 8000,
  sleep numeric not null default 8,
  kcal int not null default 2000,
  updated_at timestamptz not null default now()
);
alter table user_goals enable row level security;
create policy "own rows only" on user_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vid text not null,
  title text not null,
  cat text not null check (cat in ('yoga', 'meditation', 'stretch', 'breath')),
  created_at timestamptz not null default now()
);
alter table videos enable row level security;
create policy "own rows only" on videos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table daily_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  meals jsonb not null default '[]',
  water int not null default 0,
  steps int,
  sleep_h numeric,
  sleep_q int check (sleep_q between 1 and 5),
  weight numeric,
  mood int check (mood between 1 and 5),
  period jsonb,
  note jsonb, -- { diary, good, bad } 마음 기록 (오늘의 일기 / 잘한 일 / 잘못한 일)
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);
alter table daily_records enable row level security;
create policy "own rows only" on daily_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- If you already ran this script before the "note" (마음 기록) feature was added,
-- run one of these migrations once against your existing project instead of the create table above:
--   -- never ran any note migration yet:
--   alter table daily_records add column if not exists note jsonb;
--   -- already added "note" as a plain text column (no data saved in it yet):
--   alter table daily_records drop column if exists note;
--   alter table daily_records add column note jsonb;
