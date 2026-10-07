-- Portfolio projects take any number of tags, including none.
create table if not exists project_tags (
  project_id bigint not null references projects (id) on delete cascade,
  tag text not null references tags (name) on update cascade on delete cascade, -- deleting a tag just untags
  primary key (project_id, tag)
);
alter table project_tags enable row level security;

insert into project_tags (project_id, tag) select id, tag from projects where tag is not null on conflict do nothing;

-- The old single tag is no longer read or written. Kept (nullable) so the site deployed before this
-- change keeps working; drop it once the new code is live:
--   alter table projects drop column tag;
alter table projects alter column tag drop not null;
