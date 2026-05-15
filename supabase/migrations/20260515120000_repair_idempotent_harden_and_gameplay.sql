create table if not exists public.leaderboard_public (
  id uuid primary key references public.profiles (id) on delete cascade,
  display_name text,
  best_score int4 not null default 0,
  best_scores jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.leaderboard_public enable row level security;

drop policy if exists leaderboard_public_select_all on public.leaderboard_public;

create policy leaderboard_public_select_all
  on public.leaderboard_public
  for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on public.leaderboard_public from anon, authenticated;
grant select on public.leaderboard_public to anon, authenticated;

create or replace function public.sync_profile_best_score_from_json()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  max_v int;
begin
  select coalesce(max((value #>> '{}')::int), 0)
  into max_v
  from jsonb_each(coalesce(new.best_scores, '{}'::jsonb));
  new.best_score := greatest(coalesce(new.best_score, 0), max_v);
  return new;
end;
$$;

drop trigger if exists trg_profiles_best_score_json on public.profiles;
create trigger trg_profiles_best_score_json
  before insert or update of best_scores on public.profiles
  for each row
  execute procedure public.sync_profile_best_score_from_json();

create or replace function public.sync_leaderboard_public_from_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.leaderboard_public (id, display_name, best_score, best_scores, updated_at)
  values (new.id, new.display_name, new.best_score, new.best_scores, now())
  on conflict (id) do update set
    display_name = excluded.display_name,
    best_score = excluded.best_score,
    best_scores = excluded.best_scores,
    updated_at = excluded.updated_at;
  return new;
end;
$$;

drop trigger if exists trg_profiles_leaderboard_public on public.profiles;
create trigger trg_profiles_leaderboard_public
  after insert or update of display_name, best_score, best_scores on public.profiles
  for each row
  execute procedure public.sync_leaderboard_public_from_profiles();

insert into public.leaderboard_public (id, display_name, best_score, best_scores, updated_at)
select id, display_name, best_score, best_scores, coalesce(updated_at, now())
from public.profiles
on conflict (id) do update set
  display_name = excluded.display_name,
  best_score = excluded.best_score,
  best_scores = excluded.best_scores,
  updated_at = excluded.updated_at;

drop policy if exists "anyone can read leaderboard" on public.profiles;

create table if not exists public.daily_challenges (
  challenge_date date primary key,
  seed text not null
);

alter table public.daily_challenges enable row level security;

drop policy if exists daily_challenges_read on public.daily_challenges;

create policy daily_challenges_read
  on public.daily_challenges
  for select
  to anon, authenticated
  using (true);

grant select on public.daily_challenges to anon, authenticated;

create table if not exists public.game_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode_id text not null,
  grid_size int4 not null,
  score int4 not null,
  max_tile int4 not null,
  duration_ms int4 not null,
  move_count int4 not null default 0,
  merges_total int4 not null default 0,
  replay_seed text not null,
  replay_moves jsonb not null default '[]'::jsonb,
  challenge_date date,
  is_completed boolean not null default true,
  ended_by text,
  created_at timestamptz not null default now(),
  constraint game_runs_ended_by_chk check (
    ended_by is null or ended_by in ('board', 'timer', 'moves')
  )
);

create index if not exists game_runs_user_mode_size_score_idx
  on public.game_runs (user_id, mode_id, grid_size, is_completed, score desc);

alter table public.game_runs enable row level security;

drop policy if exists game_runs_select_own on public.game_runs;
drop policy if exists game_runs_insert_own on public.game_runs;

create policy game_runs_select_own
  on public.game_runs
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy game_runs_insert_own
  on public.game_runs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.game_runs to authenticated;

create table if not exists public.run_replays (
  run_id uuid primary key references public.game_runs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  replay_json jsonb not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists run_replays_user_idx on public.run_replays (user_id);

alter table public.run_replays enable row level security;

drop policy if exists run_replays_select_own on public.run_replays;
drop policy if exists run_replays_insert_own on public.run_replays;
drop policy if exists run_replays_update_own on public.run_replays;

create policy run_replays_select_own
  on public.run_replays
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy run_replays_insert_own
  on public.run_replays
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.game_runs gr
      where gr.id = run_id and gr.user_id = auth.uid()
    )
  );

create policy run_replays_update_own
  on public.run_replays
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.game_runs gr
      where gr.id = run_id and gr.user_id = auth.uid()
    )
  );

grant select, insert, update on public.run_replays to authenticated;

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  xp int4 not null default 0,
  level int4 not null default 1,
  last_played_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

drop policy if exists user_progress_select_own on public.user_progress;
drop policy if exists user_progress_insert_own on public.user_progress;
drop policy if exists user_progress_update_own on public.user_progress;

create policy user_progress_select_own
  on public.user_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy user_progress_insert_own
  on public.user_progress
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy user_progress_update_own
  on public.user_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.user_progress to authenticated;

create table if not exists public.achievement_defs (
  id text primary key,
  title text not null,
  description text not null default '',
  xp_reward int4 not null default 0
);

alter table public.achievement_defs enable row level security;

drop policy if exists achievement_defs_read on public.achievement_defs;

create policy achievement_defs_read
  on public.achievement_defs
  for select
  to anon, authenticated
  using (true);

grant select on public.achievement_defs to anon, authenticated;

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id text not null references public.achievement_defs (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

drop policy if exists user_achievements_select_own on public.user_achievements;
drop policy if exists user_achievements_insert_own on public.user_achievements;

create policy user_achievements_select_own
  on public.user_achievements
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy user_achievements_insert_own
  on public.user_achievements
  for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.user_achievements to authenticated;

create table if not exists public.mission_defs (
  id text primary key,
  title text not null,
  xp_reward int4 not null default 0
);

alter table public.mission_defs enable row level security;

drop policy if exists mission_defs_read on public.mission_defs;

create policy mission_defs_read
  on public.mission_defs
  for select
  to anon, authenticated
  using (true);

grant select on public.mission_defs to anon, authenticated;

create table if not exists public.user_mission_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  mission_id text not null references public.mission_defs (id) on delete cascade,
  mission_date date not null,
  progress int4 not null default 0,
  completed_at timestamptz,
  primary key (user_id, mission_id, mission_date)
);

alter table public.user_mission_state enable row level security;

drop policy if exists user_mission_state_own on public.user_mission_state;

create policy user_mission_state_own
  on public.user_mission_state
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.user_mission_state to authenticated;

insert into public.daily_challenges (challenge_date, seed)
values
  ('2026-05-14', '2026-05-14-lucide-merge'),
  ('2026-05-15', '2026-05-15-lucide-merge'),
  ('2026-05-16', '2026-05-16-lucide-merge')
on conflict (challenge_date) do nothing;

insert into public.achievement_defs (id, title, description, xp_reward)
values
  ('first_session', 'First session', 'Completed a recorded game.', 25),
  ('score_1k', 'One thousand points', 'Scored at least 1000 points in one session.', 30),
  ('merge_10', 'Merger', 'At least 10 merges in one session.', 20)
on conflict (id) do nothing;

insert into public.mission_defs (id, title, xp_reward)
values
  ('daily_play', 'Play today', 40),
  ('daily_score', '500 points', 35)
on conflict (id) do nothing;

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to postgres, service_role, authenticated;

create or replace function private.record_player_progress(
  p_user_id uuid,
  p_score int4,
  p_max_tile int4,
  p_duration_ms int4,
  p_merge_count int4,
  p_mode_id text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  delta int4;
  today date := (timezone('utc', now()))::date;
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  delta := greatest(1, least(2000, coalesce(p_score, 0) / 25 + greatest(0, coalesce(p_merge_count, 0))));

  insert into public.user_progress (user_id, xp, level, last_played_at, updated_at)
  values (p_user_id, delta, 1 + (delta / 500), now(), now())
  on conflict (user_id) do update set
    xp = public.user_progress.xp + excluded.xp,
    level = 1 + ((public.user_progress.xp + excluded.xp) / 500),
    last_played_at = now(),
    updated_at = now();

  insert into public.user_achievements (user_id, achievement_id)
  values (p_user_id, 'first_session')
  on conflict do nothing;

  if coalesce(p_score, 0) >= 1000 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'score_1k')
    on conflict do nothing;
  end if;

  if coalesce(p_merge_count, 0) >= 10 then
    insert into public.user_achievements (user_id, achievement_id)
    values (p_user_id, 'merge_10')
    on conflict do nothing;
  end if;

  insert into public.user_mission_state (user_id, mission_id, mission_date, progress, completed_at)
  values (p_user_id, 'daily_play', today, 1, now())
  on conflict (user_id, mission_id, mission_date) do update set
    progress = greatest(public.user_mission_state.progress, 1),
    completed_at = coalesce(public.user_mission_state.completed_at, excluded.completed_at);

  if coalesce(p_score, 0) >= 500 then
    insert into public.user_mission_state (user_id, mission_id, mission_date, progress, completed_at)
    values (p_user_id, 'daily_score', today, p_score, now())
    on conflict (user_id, mission_id, mission_date) do update set
      progress = greatest(public.user_mission_state.progress, excluded.progress),
      completed_at = case
        when excluded.progress >= 500 then coalesce(public.user_mission_state.completed_at, now())
        else public.user_mission_state.completed_at
      end;
  end if;
end;
$$;

revoke all on function private.record_player_progress(uuid, int4, int4, int4, int4, text) from public;
grant execute on function private.record_player_progress(uuid, int4, int4, int4, int4, text) to authenticated;

create or replace function public.record_player_progress(
  p_user_id uuid,
  p_score int4,
  p_max_tile int4,
  p_duration_ms int4,
  p_merge_count int4,
  p_mode_id text
)
returns void
language sql
security invoker
set search_path = public, pg_temp
as $$
  select private.record_player_progress(
    p_user_id,
    p_score,
    p_max_tile,
    p_duration_ms,
    p_merge_count,
    p_mode_id
  );
$$;

revoke all on function public.record_player_progress(uuid, int4, int4, int4, int4, text) from public;
grant execute on function public.record_player_progress(uuid, int4, int4, int4, int4, text) to authenticated;

alter table public.game_runs add column if not exists session_stats jsonb not null default '{}'::jsonb;
