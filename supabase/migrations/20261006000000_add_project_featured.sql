-- Projects flagged here show on the home page; /projects lists every project.
alter table projects add column if not exists featured boolean not null default false;
