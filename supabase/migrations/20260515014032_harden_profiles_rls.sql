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
