-- Plain-text record of everything removed when a super admin deletes an admin, a client,
-- a client project or a portfolio project. Downloadable from /admin/archive.
create table if not exists archives (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('admin', 'client', 'client_project', 'portfolio_project')),
  title text not null,
  body text not null,
  deleted_by text not null, -- "Name <email>" of the super admin, kept as text since staff can be deleted too
  created_at timestamptz not null default now()
);
create index if not exists archives_created_idx on archives (created_at desc);
alter table archives enable row level security;
