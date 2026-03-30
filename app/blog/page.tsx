import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Tri-Pillars™',
  description: 'News, grief education, and program updates from Tri-Pillars™.',
};

interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  published_at: string;
}

async function getPosts(): Promise<Post[]> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
  const res = await fetch(`${base}/api/blog`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

const categoryColors: Record<string, string> = {
  'News': 'bg-blue-100 text-blue-800',
  'Grief Education': 'bg-purple-100 text-purple-800',
  'Program Updates': 'bg-green-100 text-green-800',
  'Pilot Stories': 'bg-amber-100 text-amber-800',
};

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <>
      <section className="relative min-h-[40vh] flex items-end pb-12 pt-32 overflow-hidden">
        <div className="absolute inset-0 z-0" style={{ background: 'radial-gradient(ellipse at 60% 30%, rgba(201,168,76,0.07) 0%, transparent 60%)' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">Blog</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-navy leading-tight mb-4">
            What we&apos;re learning and <span className="gold-text">sharing.</span>
          </h1>
        </div>
      </section>

      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted text-lg">No posts yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                <article className="bg-card-bg border border-card-border rounded-2xl p-8 card-hover">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${categoryColors[post.category] ?? 'bg-gray-100 text-gray-800'}`}>
                      {post.category}
                    </span>
                    <span className="text-muted text-xs">
                      {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl text-navy group-hover:text-gold transition-colors mb-2">{post.title}</h2>
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
