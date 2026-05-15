update public.achievement_defs
set title = 'First session', description = 'Completed a recorded game.'
where id = 'first_session';

update public.achievement_defs
set title = 'One thousand points', description = 'Scored at least 1000 points in one session.'
where id = 'score_1k';

update public.achievement_defs
set title = 'Merger', description = 'At least 10 merges in one session.'
where id = 'merge_10';

update public.mission_defs set title = 'Play today' where id = 'daily_play';
update public.mission_defs set title = '500 points' where id = 'daily_score';
