import FadeIn from "@/components/FadeIn";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content | Tri-Pillars™",
  description:
    "News, blog posts, and curated resources from the founders of Live and Grieve.",
};

const sections = [
  {
    label: "News",
    title: "Program updates and milestones.",
    desc: "Pilot launches, publishing updates, training announcements, and everything happening at Tri-Pillars.",
    href: "/content/news",
  },
  {
    label: "Blog",
    title: "Writing about grief and research.",
    desc: "Wayne and Jamie share what they have learned about grief, community, and what it takes to build something from loss.",
    href: "/content/blog",
  },
  {
    label: "Resources",
    title: "A curated library.",
    desc: "Video lessons, research citations, caregiver guides, and crisis resources. All in one place.",
    href: "/content/resources",
  },
];

export default function ContentPage() {
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

      {/* Three sections */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
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
      </section>
    </>
  );
}
