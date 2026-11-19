-- Tayi admin allow-list. Add the Auth user UUID after creating the admin user.
create table if not exists public.admin_users(user_id uuid primary key references auth.users(id) on delete cascade,created_at timestamptz not null default now());
alter table public.admin_users enable row level security;
create or replace function public.is_tayi_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.admin_users where user_id=auth.uid()); $$;
revoke all on function public.is_tayi_admin() from public;
grant execute on function public.is_tayi_admin() to authenticated;
create policy "Admins read own membership" on public.admin_users for select to authenticated using(user_id=auth.uid());
grant select on public.admin_users to authenticated;
do $$ declare t text; begin foreach t in array array['cities','places','stops','place_stops','legs','fares','reports'] loop execute format('create policy "Tayi admins manage %I" on public.%I for all to authenticated using(public.is_tayi_admin()) with check(public.is_tayi_admin())',t,t); end loop; end $$;
grant select,insert,update,delete on public.cities,public.places,public.stops,public.place_stops,public.legs,public.fares,public.reports to authenticated;