import FadeIn from "@/components/FadeIn";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources | Tri-Pillars™",
  description:
    "Video lessons, research citations, caregiver guides, and crisis resources from Tri-Pillars™ LLC.",
  openGraph: {
    title: "Resources | Tri-Pillars™",
    description:
      "Video lessons, research citations, caregiver guides, and crisis resources from Tri-Pillars™ LLC.",
    url: "https://www.tripillarstudio.com/content/resources",
    siteName: "Tri-Pillars™",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Resources | Tri-Pillars™" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resources | Tri-Pillars™",
    description:
      "Video lessons, research citations, caregiver guides, and crisis resources from Tri-Pillars™ LLC.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://www.tripillarstudio.com/content/resources" },
};

const citations = [
  { authors: "Stroebe, M. & Schut, H.", year: "1999", title: "The Dual Process Model of Coping with Bereavement", journal: "Death Studies, 23(3), 197-224" },
  { authors: "Worden, J. W.", year: "2009", title: "Grief Counseling and Grief Therapy: A Handbook for the Mental Health Practitioner", journal: "4th Edition, Springer Publishing" },
  { authors: "Klass, D., Silverman, P. R., & Nickman, S.", year: "1996", title: "Continuing Bonds: New Understandings of Grief", journal: "Taylor & Francis" },
  { authors: "Neimeyer, R. A.", year: "2001", title: "Meaning Reconstruction and the Experience of Loss", journal: "American Psychological Association" },
  { authors: "Neff, K. D.", year: "2011", title: "Self-Compassion: The Proven Power of Being Kind to Yourself", journal: "William Morrow" },
  { authors: "Wolfelt, A. D.", year: "2006", title: "Companioning the Bereaved: A Soulful Guide for Counselors and Caregivers", journal: "Companion Press" },
];

const crisis = [
  { name: "988 Suicide & Crisis Lifeline", action: "Call or text 988", desc: "Free, confidential, 24/7 support for people in distress." },
  { name: "Crisis Text Line", action: "Text HOME to 741741", desc: "Free crisis counseling via text message, available 24/7." },
  { name: "Emergency Services", action: "Call 911", desc: "For immediate danger to yourself or others." },
];

export default function ResourcesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[40vh] flex items-end pb-16 pt-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 60% 30%, rgba(201,168,76,0.07) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            Resources
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            Tools, research,{" "}
            <span className="gold-text">and where to turn.</span>
          </h1>
        </div>
      </section>

      {/* Video Library */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            Video Library
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
            60 lessons across 6 modules.
          </h2>
          <p className="text-muted leading-relaxed mb-6 max-w-2xl">
            Our full video library is available on YouTube. These lessons cover
            each of the five research frameworks and companioning philosophy, practical facilitation guidance,
            and real conversations about what grief looks like.
          </p>
          <a
            href="https://www.youtube.com/@liveandgrieve_3"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm"
          >
            Visit the YouTube Channel →
          </a>
        </FadeIn>
      </section>

      {/* Research */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Research Foundation
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-10">
              The research and philosophical foundations behind Live and Grieve.
            </h2>
          </FadeIn>

          <div className="space-y-4">
            {citations.map((c, i) => (
              <FadeIn key={i} delay={i * 60}>
                <div className="bg-card-bg border border-card-border shadow-sm rounded-xl p-6">
                  <p className="text-navy font-medium text-sm mb-1">
                    {c.authors} ({c.year})
                  </p>
                  <p className="font-serif text-lg text-navy mb-1">
                    {c.title}
                  </p>
                  <p className="text-muted text-xs">{c.journal}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* For Caregivers */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                For Caregivers
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6">
                Supporting a grieving child.
              </h2>
              <p className="text-muted leading-relaxed mb-6">
                Children grieve differently than adults. They process loss
                through play, behavior, and questions that catch us off guard.
                Our youth program is designed for this, and it includes built-in
                caregiver support so the adults in a child&apos;s life know how
                to help.
              </p>
              <Link
                href="/program/youth"
                className="inline-block bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm"
              >
                See the Youth Program →
              </Link>
            </div>
            <div className="bg-card-bg border border-card-border rounded-2xl p-8">
              <h3 className="font-serif text-xl text-navy mb-4">
                What caregivers learn:
              </h3>
              <ul className="space-y-3 text-muted text-sm">
                <li className="flex items-start gap-3"><span className="text-gold mt-0.5 flex-shrink-0">◆</span> How grief shows up at different ages</li>
                <li className="flex items-start gap-3"><span className="text-gold mt-0.5 flex-shrink-0">◆</span> When behavior is grief and when it is something else</li>
                <li className="flex items-start gap-3"><span className="text-gold mt-0.5 flex-shrink-0">◆</span> How to talk about death without making it worse</li>
                <li className="flex items-start gap-3"><span className="text-gold mt-0.5 flex-shrink-0">◆</span> Setting boundaries while staying present</li>
              </ul>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Crisis Resources */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                Crisis Resources
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
                If you or someone you know needs help now.
              </h2>
            </div>
          </FadeIn>

          <div className="space-y-4">
            {crisis.map((r, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="bg-card-bg border border-card-border shadow-sm rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-serif text-lg text-navy mb-1">{r.name}</h3>
                    <p className="text-muted text-sm">{r.desc}</p>
                  </div>
                  <p className="text-gold font-semibold text-sm whitespace-nowrap">
                    {r.action}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
