create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  best_score int4 not null default 0,
  settings jsonb not null default '{}',
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "users can read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "anyone can read leaderboard" on public.profiles
  for select using (true);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
