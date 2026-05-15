alter table public.game_runs
  add column if not exists session_stats jsonb not null default '{}'::jsonb;
