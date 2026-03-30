create table if not exists blog_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  category text not null check (category in ('News', 'Grief Education', 'Program Updates', 'Pilot Stories')),
  body text not null default '',
  excerpt text default '' check (excerpt is null or char_length(excerpt) <= 200),
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_blog_posts_published on blog_posts(published, published_at desc);
create index if not exists idx_blog_posts_category on blog_posts(category);
create index if not exists idx_blog_posts_slug on blog_posts(slug);

alter table blog_posts enable row level security;
create policy "Public can read published posts" on blog_posts for select using (published = true);
create policy "Service role full access" on blog_posts using (true) with check (true);
