-- Clients now sign in with Clerk (publicMetadata.role = "client") and see every client row
-- whose email matches one of their verified emails. The secret-token portal links are retired.
alter table clients drop column if exists token;
update clients set email = lower(trim(email)) where email is not null;
alter table clients alter column email set not null;
create index if not exists clients_email_idx on clients (email);

-- What the client did on the portal, for their admin and super admins.
create table if not exists activity (
  id bigint generated always as identity primary key,
  client_id bigint not null references clients (id) on delete cascade,
  kind text not null check (kind in ('joined', 'visit', 'message', 'upload')),
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists activity_client_idx on activity (client_id, created_at desc);
alter table activity enable row level security;
