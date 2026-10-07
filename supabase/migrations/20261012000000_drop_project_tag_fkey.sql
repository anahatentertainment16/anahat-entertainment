-- The old projects.tag foreign key still blocks deleting any tag that column names.
-- project_tags is the source of truth now, so the old column needs no constraint.
alter table projects drop constraint if exists projects_tag_fkey;
