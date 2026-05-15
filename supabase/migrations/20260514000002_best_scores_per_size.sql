alter table public.profiles
  add column if not exists best_scores jsonb not null default '{}';
