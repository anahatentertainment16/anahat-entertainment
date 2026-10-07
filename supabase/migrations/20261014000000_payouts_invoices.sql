-- Charges the studio owes its staff (set by super admins), and invoices the studio sends clients.
-- Both keep text snapshots (names, project labels) so the money record survives a deleted admin or project.

create table if not exists payouts (
  id bigint generated always as identity primary key,
  staff_id text not null,          -- Clerk user id
  staff_name text not null,        -- snapshot at creation
  client_id bigint references clients (id) on delete set null,
  project_label text,              -- "Client / Project" snapshot, null = not tied to a project
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  status text not null default 'due' check (status in ('due', 'paid')),
  paid_on date,
  created_by text not null,
  created_at timestamptz not null default now()
);
create index if not exists payouts_staff_idx on payouts (staff_id, status);
alter table payouts enable row level security;

create table if not exists invoices (
  id bigint generated always as identity primary key,
  number text not null unique,     -- INV-2026-0001
  client_id bigint references clients (id) on delete set null,
  bill_name text not null,         -- snapshot of the client at creation
  bill_email text not null,
  project_label text not null,
  issued_on date not null default current_date,
  due_on date,
  items jsonb not null default '[]'::jsonb, -- [{ "description": text, "qty": number, "rate": number }]
  tax_rate numeric(5, 2) not null default 0 check (tax_rate >= 0 and tax_rate <= 100),
  notes text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'void')),
  created_by text not null,
  created_at timestamptz not null default now()
);
create index if not exists invoices_client_idx on invoices (client_id);
alter table invoices enable row level security;
