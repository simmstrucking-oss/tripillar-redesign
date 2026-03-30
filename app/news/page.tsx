import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Field News | Tri-Pillars™',
  description: 'The latest news and program updates from Tri-Pillars™.',
};

interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  published_at: string;
}

async function getNewsPosts(): Promise<Post[]> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
  const res = await fetch(`${base}/api/blog?category=News`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function NewsPage() {
  const posts = await getNewsPosts();

  return (
    <>
      <section className="relative min-h-[40vh] flex items-end pb-12 pt-32 overflow-hidden bg-navy bg-texture">
        <div className="absolute inset-0 z-0" style={{ background: 'radial-gradient(ellipse at 60% 30%, rgba(201,168,76,0.08) 0%, transparent 60%)' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">News</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            Field <span className="gold-text">News</span>
          </h1>
        </div>
      </section>

      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted text-lg">No news posts yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                <article className="bg-card-bg border border-card-border rounded-2xl p-8 card-hover">
                  <span className="text-muted text-xs">
                    {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <h2 className="font-serif text-2xl text-navy group-hover:text-gold transition-colors mb-2 mt-2">{post.title}</h2>
                  {post.excerpt && <p className="text-muted text-sm leading-relaxed">{post.excerpt}</p>}
                  <p className="text-gold text-sm font-medium mt-4">Read more →</p>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
