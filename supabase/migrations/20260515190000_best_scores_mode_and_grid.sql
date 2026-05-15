create or replace function public.migrate_best_scores_jsonb(bs jsonb)
returns jsonb
language sql
stable
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_object_agg(nk, mv)
      from (
        select
          case
            when e.key ~ '^[456]$' and jsonb_typeof(e.value) = 'number' then 'classic|' || e.key
            else e.key
          end as nk,
          max((e.value #>> '{}')::int) as mv
        from jsonb_each(coalesce(bs, '{}'::jsonb)) e
        group by 1
      ) s
    ),
    '{}'::jsonb
  );
$$;

update public.profiles
set best_scores = public.migrate_best_scores_jsonb(best_scores)
where best_scores is not null
  and best_scores <> '{}'::jsonb;

drop function if exists public.migrate_best_scores_jsonb(jsonb);

insert into public.leaderboard_public (id, display_name, best_score, best_scores, updated_at)
select id, display_name, best_score, best_scores, coalesce(updated_at, now())
from public.profiles
on conflict (id) do update set
  display_name = excluded.display_name,
  best_score = excluded.best_score,
  best_scores = excluded.best_scores,
  updated_at = excluded.updated_at;
