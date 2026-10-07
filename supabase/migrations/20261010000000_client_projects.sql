-- One client can have several projects, each in a studio service domain (lib/services.ts slug).
-- A clients row is one project; rows sharing an email are the same client (one Clerk login).
alter table clients add column if not exists project text not null default 'Main project';
alter table clients add column if not exists domain text;
