import FadeIn from "@/components/FadeIn";
import Link from "next/link";
import VideoGrid from "@/components/VideoGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content | Tri-Pillars™",
  description:
    "News, blog posts, and curated resources from the founders of Live and Grieve.",
  openGraph: {
    title: "Content | Tri-Pillars™",
    description:
      "News, blog posts, and curated resources from the founders of Live and Grieve.",
    url: "https://tripillarstudio.com/content",
    siteName: "Tri-Pillars™",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Content | Tri-Pillars™" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Content | Tri-Pillars™",
    description:
      "News, blog posts, and curated resources from the founders of Live and Grieve.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://tripillarstudio.com/content" },
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  published_at: string;
}

async function fetchPosts(category?: string): Promise<BlogPost[]> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');
    const url = category ? `${base}/api/blog?category=${category}` : `${base}/api/blog`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const sections = [
  {
    label: "News",
    title: "Program updates and milestones.",
    desc: "Pilot launches, publishing updates, training announcements, and everything happening at Tri-Pillars.",
    href: "/news",
  },
  {
    label: "Blog",
    title: "Writing about grief and research.",
    desc: "Wayne and Jamie share what they have learned about grief, community, and what it takes to build something from loss.",
    href: "/blog",
  },
  {
    label: "Resources",
    title: "A curated library.",
    desc: "Video lessons, research citations, caregiver guides, and crisis resources. All in one place.",
    href: "/content/resources",
  },
];

// First 8 lesson videos for the grid
const lessonVideos = [
  { id: "47mlI5PAHEU", lesson: "1.01", title: "What Grief Actually Is" },
  { id: "2t_RE1J6luc", lesson: "1.02", title: "Why Grief Doesn't Follow Stages" },
  { id: "8zrm_p7u1R8", lesson: "1.03", title: "The Body and Grief" },
  { id: "d1LoHh29_Bs", lesson: "1.04", title: "Grief and the People Around You" },
  { id: "e3SszONVfTQ", lesson: "1.05", title: "Continuing Your Bond" },
  { id: "9FvP1XCE8EA", lesson: "1.06", title: "Finding Meaning After Loss" },
  { id: "SnbhtN__n50", lesson: "1.07", title: "Self-Compassion in Grief" },
  { id: "nQxVj95tbOM", lesson: "1.08", title: "Grief and Community" },
];

const CHANNEL_URL = "https://www.youtube.com/@liveandgrieve_3";
const INTRO_VIDEO_ID = "VbDXjkq6oU0";

export default async function ContentPage() {
  const [newsPosts, blogPosts] = await Promise.all([
    fetchPosts('News'),
    fetchPosts(),
  ]);
  const latestNews = newsPosts.slice(0, 3);
  const latestBlog = blogPosts.slice(0, 3);
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-end pb-16 pt-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 60% 30%, rgba(201,168,76,0.07) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            Content
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            What we&apos;re learning,{" "}
            <span className="gold-text">building, and sharing.</span>
          </h1>
        </div>
      </section>

      {/* YouTube Hero Embed */}
      <section className="py-16 bg-navy bg-texture">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-8">
              <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">
                From the Founders
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl text-white mb-2">
                An introduction to Live and Grieve™
              </h2>
              <p className="text-white/60 text-sm">
                Jamie Simms, co-founder
              </p>
            </div>

            {/* 16:9 responsive embed */}
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                 style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={`https://www.youtube.com/embed/${INTRO_VIDEO_ID}?rel=0&modestbranding=1`}
                title="An introduction to Live and Grieve™ — Jamie Simms"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>

            <div className="text-center mt-6">
              <a
                href={CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/20 text-white/70 hover:text-white hover:border-white/40 px-6 py-2.5 rounded-md text-sm transition-colors"
              >
                <span>▶</span> View all 60 lessons on YouTube →
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Lesson Video Grid */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Video Library
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-3">
              Grief Education Videos
            </h2>
            <p className="text-muted text-sm max-w-xl mx-auto">
              Free grief education resources from the founders of Live and Grieve™. For the full curriculum, find a certified group near you or start the Solo Companion at solo.tripillarstudio.com.
            </p>
          </div>
        </FadeIn>

        <VideoGrid videos={lessonVideos} channelUrl={CHANNEL_URL} />
      </section>

      {/* Latest Blog Posts */}
      {latestBlog.length > 0 && (
        <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-gold text-xs uppercase tracking-widest mb-2 font-medium">Blog</p>
                <h2 className="font-serif text-2xl sm:text-3xl text-navy">Latest posts</h2>
              </div>
              <Link href="/blog" className="text-gold text-sm font-medium hover:underline">View All →</Link>
            </div>
          </FadeIn>
          <div className="space-y-6">
            {latestBlog.map((post, i) => (
              <FadeIn key={post.id} delay={i * 80}>
                <Link href={`/blog/${post.slug}`} className="block group">
                  <div className="bg-card-bg border border-card-border rounded-xl p-6 card-hover">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gold/10 text-gold">{post.category}</span>
                      <span className="text-muted text-xs">{new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <h3 className="font-serif text-xl text-navy group-hover:text-gold transition-colors">{post.title}</h3>
                    {post.excerpt && <p className="text-muted text-sm mt-1">{post.excerpt}</p>}
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {/* Latest News */}
      {latestNews.length > 0 && (
        <section className="py-20 bg-navy bg-texture">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <FadeIn>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-gold text-xs uppercase tracking-widest mb-2 font-medium">News</p>
                  <h2 className="font-serif text-2xl sm:text-3xl text-white">Field News</h2>
                </div>
                <Link href="/news" className="text-gold text-sm font-medium hover:underline">View All →</Link>
              </div>
            </FadeIn>
            <div className="space-y-6">
              {latestNews.map((post, i) => (
                <FadeIn key={post.id} delay={i * 80}>
                  <Link href={`/blog/${post.slug}`} className="block group">
                    <div className="border border-white/10 rounded-xl p-6 hover:border-gold/30 transition-colors">
                      <span className="text-white/50 text-xs">{new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <h3 className="font-serif text-xl text-white group-hover:text-gold transition-colors mt-1">{post.title}</h3>
                      {post.excerpt && <p className="text-white/60 text-sm mt-1">{post.excerpt}</p>}
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Three sections */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                Explore
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy">
                News, writing, and resources.
              </h2>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {sections.map((s, i) => (
              <FadeIn key={i} delay={i * 100}>
                <Link href={s.href} className="block group h-full">
                  <div className="bg-card-bg border border-card-border shadow-sm rounded-2xl p-8 h-full flex flex-col card-hover">
                    <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                      {s.label}
                    </p>
                    <h2 className="font-serif text-2xl text-navy mb-4 group-hover:text-gold transition-colors">
                      {s.title}
                    </h2>
                    <p className="text-muted text-sm leading-relaxed flex-1">
                      {s.desc}
                    </p>
                    <p className="text-gold text-sm font-medium mt-6">
                      Read more →
                    </p>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
