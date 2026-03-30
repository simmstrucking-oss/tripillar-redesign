import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Post {
  id: string;
  title: string;
  slug: string;
  category: string;
  body: string;
  excerpt: string;
  published_at: string;
}

function getBase() {
  return process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000');
}

async function getPost(slug: string): Promise<Post | null> {
  const res = await fetch(`${getBase()}/api/blog/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post Not Found | Tri-Pillars™' };
  return {
    title: `${post.title} | Tri-Pillars™`,
    description: post.excerpt || undefined,
  };
}

export async function generateStaticParams() {
  try {
    const base = getBase();
    const res = await fetch(`${base}/api/blog`, { cache: 'no-store' });
    if (!res.ok) return [];
    const posts: Post[] = await res.json();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

const categoryColors: Record<string, string> = {
  'News': 'bg-blue-100 text-blue-800',
  'Grief Education': 'bg-purple-100 text-purple-800',
  'Program Updates': 'bg-green-100 text-green-800',
  'Pilot Stories': 'bg-amber-100 text-amber-800',
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <>
      <section className="pt-32 pb-12 max-w-3xl mx-auto px-4 sm:px-6">
        <Link href="/blog" className="text-gold text-sm font-medium hover:underline mb-6 inline-block">
          ← Back to Blog
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${categoryColors[post.category] ?? 'bg-gray-100 text-gray-800'}`}>
            {post.category}
          </span>
          <span className="text-muted text-xs">
            {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-navy leading-tight mb-8">
          {post.title}
        </h1>
      </section>

      <section className="pb-24 max-w-3xl mx-auto px-4 sm:px-6">
        <article
          className="prose prose-lg prose-navy max-w-none"
          style={{ color: '#2D3142', lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
      </section>
    </>
  );
}
