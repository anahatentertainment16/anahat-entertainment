-- Admin-managed tags. projects.tag must name one; a tag in use can't be deleted.
create table if not exists tags (
  name text primary key,
  created_at timestamptz not null default now()
);
alter table tags enable row level security;

-- Seed from tags already typed on projects, so the foreign key holds.
insert into tags (name) select distinct tag from projects on conflict do nothing;

alter table projects drop constraint if exists projects_tag_fkey;
alter table projects add constraint projects_tag_fkey
  foreign key (tag) references tags (name) on update cascade on delete restrict;
