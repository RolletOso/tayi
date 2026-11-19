-- Admin allow-list and policies for the live Tayi schema.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
create or replace function public.is_tayi_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()); $$;
revoke all on function public.is_tayi_admin() from public;
grant execute on function public.is_tayi_admin() to authenticated;
drop policy if exists "Admins read own membership" on public.admin_users;
create policy "Admins read own membership" on public.admin_users
  for select to authenticated using (user_id = auth.uid());
grant select on public.admin_users to authenticated;
do $$
declare t text;
begin
  foreach t in array array['places','place_aliases','stops','place_stops','legs','fares','community_reports'] loop
    execute format('drop policy if exists "Tayi admins manage records" on public.%I', t);
    execute format('create policy "Tayi admins manage records" on public.%I for all to authenticated using (public.is_tayi_admin()) with check (public.is_tayi_admin())', t);
  end loop;
end $$;
grant select, insert, update, delete on public.places, public.place_aliases, public.stops,
  public.place_stops, public.legs, public.fares, public.community_reports to authenticated;