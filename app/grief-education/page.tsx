import Link from "next/link";
import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import { SiteImage } from "@/components/SiteImage";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "What Is Grief Education? | Live and Grieve™",
  description:
    "Grief education is structured, research-grounded support for people navigating loss. Live and Grieve™ is draws on five research frameworks and the Wolfelt companioning philosophical influence.",
};

export default function GriefEducationPage() {
  return (
    <>
      <JsonLd schema={breadcrumbSchema([
        { name: "Home", url: "https://www.tripillarstudio.com" },
        { name: "Grief Education", url: "https://www.tripillarstudio.com/grief-education" }
      ])} />
      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-end pb-16 pt-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 60% 30%, rgba(201,168,76,0.07) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            Grief Education
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            What is grief education?
          </h1>
          <p className="text-xl text-muted max-w-2xl leading-relaxed">
            Not therapy. Not crisis intervention. Structured, research-grounded support
            that helps people understand what they&apos;re carrying — and how to carry it.
          </p>
        </div>
      </section>

      {/* What it is */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <SiteImage src="/images/man-at-desk-grief.jpg" alt="Person experiencing grief at work" maxWidth={800} className="rounded-xl w-full object-cover mb-10" />
          <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6">
            Grief education is not the five stages.
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            For decades, the five stages of grief have shaped how most people understand loss. But those stages were designed to describe the experience of people facing terminal illness — not bereavement. Applied to grief, they create a false expectation: that grief is linear, that acceptance is the destination, and that anything else is failure.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            Grief education grounded in contemporary research tells a different story. Grief is non-linear, deeply personal, and lifelong. The people we love don&apos;t stop mattering because they&apos;re gone. A structured grief education program creates space to understand that — and to live alongside loss rather than trying to resolve it.
          </p>
          <p className="text-muted leading-relaxed">
            Live and Grieve™ is draws on five research frameworks and the Wolfelt companioning philosophical influence.
          </p>
        </FadeIn>
      </section>

      {/* Six frameworks */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                The Research Foundation
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
                Five frameworks + Wolfelt. Two layers.
              </h2>
              <p className="text-muted max-w-2xl mx-auto">
                Three theoretical frameworks govern how grief moves across 52 weeks.
                Three applied practice frameworks govern how every session is delivered.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-8">
            <FadeIn>
              <div className="bg-card-bg border border-card-border rounded-2xl p-8">
                <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                  Layer 1 — Theoretical
                </p>
                <ul className="space-y-4">
                  {[
                    { name: "Dual Process Model", authors: "Stroebe & Schut", note: "Grief oscillates between loss-orientation and restoration-orientation. Not stages — a rhythm." },
                    { name: "Tasks of Mourning", authors: "William Worden", note: "Grief is active work, not passive stages. Four tasks we do, not things that happen to us." },
                    { name: "Continuing Bonds Theory", authors: "Klass, Silverman & Nickman", note: "The goal is not to let go. It is to carry the relationship differently." },
                  ].map((fw, i) => (
                    <li key={i} className="border-b border-card-border pb-4 last:border-0 last:pb-0">
                      <p className="font-serif text-navy font-semibold">{fw.name}</p>
                      <p className="text-gold/60 text-xs uppercase tracking-wider mb-1">{fw.authors}</p>
                      <p className="text-muted text-sm leading-relaxed">{fw.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <div className="bg-card-bg border border-card-border rounded-2xl p-8">
                <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                  Layer 2 — Applied Practice
                </p>
                <ul className="space-y-4">
                  {[
                    { name: "Meaning Reconstruction", authors: "Robert Neimeyer", note: "Loss disrupts the stories we tell about our lives. Healing is rebuilding a narrative that still has direction." },
                    { name: "Self-Compassion", authors: "Kristin Neff", note: "Grieving people are often their own harshest critics. Kindness toward yourself is not optional — it is the work." },
                    { name: "Companioning the Bereaved", authors: "Alan Wolfelt", note: "Facilitators are companions, not fixers. Present, non-judgmental, walking beside — not leading out." },
                  ].map((fw, i) => (
                    <li key={i} className="border-b border-card-border pb-4 last:border-0 last:pb-0">
                      <p className="font-serif text-navy font-semibold">{fw.name}</p>
                      <p className="text-gold/60 text-xs uppercase tracking-wider mb-1">{fw.authors}</p>
                      <p className="text-muted text-sm leading-relaxed">{fw.note}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* What LG is */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6">
            Live and Grieve™ — a structured grief education program.
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            Live and Grieve™ is a 52-week, four-book structured grief education program delivered in closed cohort groups of 6–12 people. It is not therapy. It requires no licensed clinician to deliver. Facilitators are trained lay companions — community members, social workers, pastoral caregivers, faith leaders — who create a safe, structured space for grief to be witnessed.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            The program is delivered in-person or virtually through the Virtual Facilitation Addendum, which is included with every license. It is a national program with no geographic ceiling.
          </p>
          <p className="text-muted leading-relaxed">
            The first pilot launches in Hampshire County, West Virginia in May 2026.
          </p>
        </FadeIn>
      </section>

      {/* Photography */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-4">
        <div className="rounded-2xl overflow-hidden">
          <Image src="/images/open-window-light.jpg" alt="Light through an open window — openness and healing" width={1200} height={500} className="w-full object-cover max-h-64" />
        </div>
      </div>

      {/* Free Guide CTA */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Free Resource
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
              Download the free guide.
            </h2>
            <p className="text-muted mb-8 leading-relaxed">
              &ldquo;The 7 Things Nobody Tells You About Grief&rdquo; — written by Wayne and Jamie Simms, drawing on five research frameworks and the Wolfelt companioning philosophical influence. Free. No group near you? Start at solo.tripillarstudio.com — $24.99 or three payments of $9.99.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/free-guide"
                className="bg-gold text-white font-semibold px-8 py-3 rounded-md hover:bg-gold-light transition-colors text-sm"
              >
                Download the Free Guide
              </Link>
              <Link
                href="https://solo.tripillarstudio.com"
                className="border border-card-border text-muted hover:text-navy hover:border-navy/30 px-8 py-3 rounded-md text-sm transition-colors"
              >
                Solo Companion — $24.99 →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
