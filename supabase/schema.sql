-- Run once in Supabase SQL editor. All access goes through the server's service-role key,
-- so RLS is on with no policies: anon/public keys can't read or write anything.

create table if not exists inquiries (
  id bigint generated always as identity primary key,
  service text not null,
  name text not null,
  email text not null,
  company text,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists testimonials (
  id bigint generated always as identity primary key,
  name text not null,
  org text,
  quote text not null,
  approved boolean not null default false,
  declined boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists tags (
  name text primary key,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id bigint generated always as identity primary key,
  title text not null,
  link text,
  tag text not null references tags (name) on update cascade on delete restrict,
  description text not null,
  image_url text,
  image_path text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists team (
  id bigint generated always as identity primary key,
  name text not null,
  role text not null,
  link text,
  photo_url text,
  photo_path text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

-- For databases created before the testimonial archive existed:
alter table testimonials add column if not exists declined boolean not null default false;

alter table inquiries enable row level security;
alter table testimonials enable row level security;
alter table tags enable row level security;
alter table projects enable row level security;
alter table team enable row level security;

-- Public bucket: images readable by URL, writes only via service role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('projects', 'projects', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;
