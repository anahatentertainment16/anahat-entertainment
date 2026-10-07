-- Caller IP on public form rows, for the per-IP rate limit in app/api/inquiries and app/api/testimonials.
alter table inquiries add column if not exists ip text;
alter table testimonials add column if not exists ip text;
create index if not exists inquiries_ip_created_at on inquiries (ip, created_at);
create index if not exists testimonials_ip_created_at on testimonials (ip, created_at);
