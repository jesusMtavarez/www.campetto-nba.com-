-- Esegui questo script in Supabase > SQL Editor per salvare i dati profilo.
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  favorites jsonb not null default '[]'::jsonb,
  roster jsonb not null default '{}'::jsonb,
  joined boolean not null default false,
  notification_preferences jsonb not null default '{"inApp":true,"browser":false}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_profiles
  add column if not exists notification_preferences jsonb not null default '{"inApp":true,"browser":false}'::jsonb;

alter table public.user_profiles enable row level security;

-- I progetti con esposizione automatica disattivata richiedono permessi
-- espliciti. Le policy RLS qui sotto limitano sempre l'accesso al proprietario.
revoke all on table public.user_profiles from anon;
revoke all on table public.user_profiles from authenticated;
grant select, insert, update on table public.user_profiles to authenticated;

do $$
begin
if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'Users can read their own Campetto profile') then
create policy "Users can read their own Campetto profile"
  on public.user_profiles for select to authenticated
  using (auth.uid() = user_id);
end if;

if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'Users can create their own Campetto profile') then
create policy "Users can create their own Campetto profile"
  on public.user_profiles for insert to authenticated
  with check (auth.uid() = user_id);
end if;

if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'Users can update their own Campetto profile') then
create policy "Users can update their own Campetto profile"
  on public.user_profiles for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
end if;
end;
$$;
