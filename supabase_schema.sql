-- ============================================
-- Media Task Manager - Supabase Schema
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- 1. TEAMS
create table if not exists teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  color_accent text not null default '#C8102E',
  created_at timestamptz default now()
);

-- 2. MEMBERS (with password for login)
create table if not exists members (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  password text not null,
  avatar_index int default 0,
  team_id uuid references teams(id) on delete set null,
  created_at timestamptz default now()
);

-- 3. TASKS
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  team_id uuid references teams(id) on delete set null,
  status text default 'Open' check (status in ('Open', 'In Review', 'Approved', 'Rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. SUBMISSIONS
create table if not exists submissions (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  submitted_link text not null,
  submitted_at timestamptz default now(),
  status text default 'In Review' check (status in ('In Review', 'Approved', 'Rejected'))
);

-- 5. NOTIFICATIONS
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  message text,
  member_id uuid references members(id) on delete set null,
  task_id uuid references tasks(id) on delete cascade,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- Enable Row Level Security (RLS) but allow
-- anon key full access for this app
-- ============================================

alter table teams enable row level security;
alter table members enable row level security;
alter table tasks enable row level security;
alter table submissions enable row level security;
alter table notifications enable row level security;

-- Allow anon full CRUD on all tables
create policy "anon_all_teams" on teams for all using (true) with check (true);
create policy "anon_all_members" on members for all using (true) with check (true);
create policy "anon_all_tasks" on tasks for all using (true) with check (true);
create policy "anon_all_submissions" on submissions for all using (true) with check (true);
create policy "anon_all_notifications" on notifications for all using (true) with check (true);

-- ============================================
-- If you already have the tables and just need
-- to add the password column, run this instead:
-- ============================================
-- alter table members add column if not exists password text;
-- alter table members add constraint members_name_unique unique (name);
