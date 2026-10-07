-- Client portals, the client <-> staff message thread, and todos.
-- Staff roles live in Clerk publicMetadata ({ role: "super_admin" | "admin", title }), so staff are
-- referenced here by Clerk user id (text, no foreign key).

create table if not exists clients (
  id bigint generated always as identity primary key,
  name text not null,
  email text,
  token uuid not null unique default gen_random_uuid(), -- the portal link /portal/<token>
  drive_url text,                                      -- Google Drive folder behind "Upload here"
  admin_id text,                                       -- Clerk user id of the assigned admin
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id bigint generated always as identity primary key,
  client_id bigint not null references clients (id) on delete cascade,
  author_id text, -- Clerk user id; null = written by the client on the portal
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists messages_client_idx on messages (client_id, created_at);

create table if not exists todos (
  id bigint generated always as identity primary key,
  title text not null,
  assignee_id text, -- Clerk user id; null = unassigned, super admins pick it up
  created_by text,  -- Clerk user id; null = suggested from a client message
  client_id bigint references clients (id) on delete set null,
  status text not null default 'open' check (status in ('suggested', 'open', 'done')),
  created_at timestamptz not null default now()
);
create index if not exists todos_assignee_idx on todos (assignee_id, status);

alter table clients enable row level security;
alter table messages enable row level security;
alter table todos enable row level security;
