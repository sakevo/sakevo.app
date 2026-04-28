-- SAKEVO initial schema
-- Run this in the Supabase SQL editor (or via supabase db push).

-- =========================================================
-- Profiles (extends auth.users)
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  locale text not null default 'de',
  tier text not null default 'free' check (tier in ('free', 'pro')),
  projects_used int not null default 0,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Projects
-- =========================================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('sneaker', 'clothing')),
  mode text not null check (mode in ('custom', 'restore', 'both')),
  language text not null default 'de',
  style_hint text,
  original_image_path text not null,
  status text not null default 'pending' check (status in ('pending', 'analyzing', 'rendering', 'done', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_idx on public.projects(user_id, created_at desc);

-- =========================================================
-- Analyses (one per project, latest run)
-- =========================================================
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  model_used text not null,
  input_tokens int,
  output_tokens int,
  result_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists analyses_project_idx on public.analyses(project_id);

-- =========================================================
-- Mockups (generated custom-design images)
-- =========================================================
create table if not exists public.mockups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  idea_index int not null,
  prompt text not null,
  image_path text,
  status text not null default 'pending' check (status in ('pending', 'done', 'error')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists mockups_project_idx on public.mockups(project_id);

-- =========================================================
-- Restoration steps (denormalized from analysis JSON for queries)
-- =========================================================
create table if not exists public.restoration_steps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  step_no int not null,
  title text not null,
  instruction text not null,
  materials text[],
  warning text,
  difficulty text
);

create index if not exists restoration_project_idx on public.restoration_steps(project_id, step_no);

-- =========================================================
-- Auto-create profile when a new auth.user is inserted
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
  for each row execute function public.handle_new_user();

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.analyses enable row level security;
alter table public.mockups enable row level security;
alter table public.restoration_steps enable row level security;

-- Profiles: user sees and updates only their own
drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- Projects: owner-only
drop policy if exists "projects_owner_all" on public.projects;
create policy "projects_owner_all" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Analyses / mockups / restoration_steps: through project ownership
drop policy if exists "analyses_via_project" on public.analyses;
create policy "analyses_via_project" on public.analyses
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

drop policy if exists "mockups_via_project" on public.mockups;
create policy "mockups_via_project" on public.mockups
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

drop policy if exists "restoration_via_project" on public.restoration_steps;
create policy "restoration_via_project" on public.restoration_steps
  for select using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- =========================================================
-- Storage buckets (run in Supabase dashboard if buckets do not exist)
-- =========================================================
-- Buckets to create manually (or via supabase CLI):
--   uploads  (private)  -- original user images
--   mockups  (private)  -- generated mockups
--
-- Storage policies: only owner can read their files.
-- The path convention is: <user_id>/<project_id>/<filename>
--
-- Example policy SQL (run after creating buckets):
--
-- create policy "uploads_owner_rw" on storage.objects
--   for all using (
--     bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text
--   ) with check (
--     bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text
--   );
--
-- create policy "mockups_owner_r" on storage.objects
--   for select using (
--     bucket_id = 'mockups' and (storage.foldername(name))[1] = auth.uid()::text
--   );
