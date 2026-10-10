import Link from "next/link";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog | Tri-Pillars™",
  description: "News, grief education, and program updates from Tri-Pillars™.",
  openGraph: {
    title: "Blog | Tri-Pillars™",
    description: "News, grief education, and program updates from Tri-Pillars™.",
    url: "https://www.tripillarstudio.com/blog",
    siteName: "Tri-Pillars™",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Blog | Tri-Pillars™" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Tri-Pillars™",
    description: "News, grief education, and program updates from Tri-Pillars™.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://www.tripillarstudio.com/blog" },
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
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data, error } = await sb
      .from("blog_posts")
      .select("id, title, slug, category, excerpt, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

const categoryColors: Record<string, string> = {
  News: "bg-blue-100 text-blue-800",
  "Grief Education": "bg-purple-100 text-purple-800",
  "Program Updates": "bg-green-100 text-green-800",
  "Pilot Stories": "bg-amber-100 text-amber-800",
};

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <>
      <JsonLd schema={breadcrumbSchema([
        { name: "Home", url: "https://www.tripillarstudio.com" },
        { name: "Blog", url: "https://www.tripillarstudio.com/blog" }
      ])} />
      <section className="relative min-h-[40vh] flex items-end pb-12 pt-32 overflow-hidden">
        <div className="absolute inset-0 z-0" style={{ background: "radial-gradient(ellipse at 60% 30%, rgba(201,168,76,0.07) 0%, transparent 60%)" }} />
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
                <article className="border border-border rounded-lg p-6 hover:border-gold transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    {post.category && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryColors[post.category] ?? "bg-gray-100 text-gray-800"}`}>
                        {post.category}
                      </span>
                    )}
                    {post.published_at && (
                      <span className="text-xs text-muted">
                        {new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <h2 className="font-serif text-xl font-bold text-navy group-hover:text-gold transition-colors mb-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-muted text-sm leading-relaxed">{post.excerpt}</p>
                  )}
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
