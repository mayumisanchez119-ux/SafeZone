-- SafeZone lives alongside INNAEDO in one Supabase project, but uses only
-- names prefixed with safezone_. Run this once in the project SQL editor.
create table public.safezone_content (
  content_key text primary key check (content_key in ('sessions', 'instructors', 'combos')),
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.safezone_transactions (
  id uuid primary key default gen_random_uuid(),
  unique_code text not null unique,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table public.safezone_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.safezone_is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.safezone_admins where user_id = auth.uid()); $$;

revoke all on function public.safezone_is_admin() from public;
grant execute on function public.safezone_is_admin() to authenticated;

alter table public.safezone_content enable row level security;
alter table public.safezone_transactions enable row level security;
alter table public.safezone_admins enable row level security;

revoke all on table public.safezone_content from anon, authenticated;
revoke all on table public.safezone_transactions from anon, authenticated;
revoke all on table public.safezone_admins from anon, authenticated;
grant select on table public.safezone_content to anon, authenticated;
grant select, insert, update, delete on table public.safezone_content to authenticated;
grant select, insert, update, delete on table public.safezone_transactions to authenticated;

create policy "safezone public content read" on public.safezone_content
  for select to anon, authenticated using (true);
create policy "safezone staff manages content" on public.safezone_content
  for all to authenticated using (public.safezone_is_admin()) with check (public.safezone_is_admin());
create policy "safezone staff manages transactions" on public.safezone_transactions
  for all to authenticated using (public.safezone_is_admin()) with check (public.safezone_is_admin());
