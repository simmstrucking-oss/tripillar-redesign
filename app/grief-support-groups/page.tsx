import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "Grief Support Groups Near Me | Live and Grieve™",
  description:
    "Looking for a grief support group? Live and Grieve™ is a 52-week structured program that draws on five research frameworks and the Wolfelt companioning philosophical influence. No group near you? Start at solo.tripillarstudio.com.",
  openGraph: {
    title: "Grief Support Groups Near Me | Live and Grieve™",
    description:
      "Looking for a grief support group? Live and Grieve™ is a 52-week structured program that draws on five research frameworks and the Wolfelt companioning philosophical influence.",
    url: "https://tripillarstudio.com/grief-support-groups",
    siteName: "Tri-Pillars™",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Grief Support Groups Near Me" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grief Support Groups Near Me | Live and Grieve™",
    description:
      "Looking for a grief support group? Live and Grieve™ is a 52-week structured program that draws on five research frameworks and the Wolfelt companioning philosophical influence.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://tripillarstudio.com/grief-support-groups" },
};

export default function GriefSupportGroupsPage() {
  return (
    <>
      <JsonLd schema={breadcrumbSchema([
        { name: "Home", url: "https://www.tripillarstudio.com" },
        { name: "Grief Support Groups", url: "https://www.tripillarstudio.com/grief-support-groups" }
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
            Grief Support Groups
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            Looking for a grief support group?
          </h1>
          <p className="text-xl text-muted max-w-2xl leading-relaxed">
            Not all grief support is the same. Here is what to look for — and what Live and Grieve™ offers.
          </p>
        </div>
      </section>

      {/* What makes it different */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6">
            What a good grief support group actually does.
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            A grief support group is not a therapy group. It does not require a licensed clinician to lead. What it requires is structure, a research foundation, and a facilitator who knows how to hold space — not fix, not lead out of grief, but walk alongside.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            Live and Grieve™ is a 52-week structured grief education program delivered in closed cohort groups of 6–12. It draws on five research frameworks and the Wolfelt companioning philosophical influence.
          </p>
          <p className="text-muted leading-relaxed">
            Groups meet weekly. Cohorts are closed — the same people, building trust over time. In-person or virtual, through the Virtual Facilitation Addendum included with every license.
          </p>
        </FadeIn>
      </section>

      {/* What to look for */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl sm:text-4xl text-navy">
                What to look for in a grief support group.
              </h2>
            </div>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { heading: "A research foundation", body: "Not the five stages. Contemporary grief research — the Dual Process Model, Worden's Tasks of Mourning, Continuing Bonds Theory — grounded in what researchers actually know about how grief moves." },
              { heading: "Structured over time", body: "A single session does not hold grief. Structured, closed cohort groups over weeks and months create the safety and continuity that grief requires." },
              { heading: "A companion, not a fixer", body: "The right facilitator does not try to move you through grief faster. They walk beside. Present. Non-judgmental. Witnessing, not solving." },
              { heading: "Space for all kinds of loss", body: "Grief is not only death. It is the end of a relationship, a diagnosis, a pregnancy, a role. A good group does not narrow who is allowed to grieve." },
              { heading: "No clinical license required to attend", body: "Grief education is not therapy. You should not need a referral, a diagnosis, or a co-pay. It should be accessible to anyone carrying a loss." },
              { heading: "A path forward, not an endpoint", body: "The goal is not to get over grief. It is to integrate it — to carry it in a way that still allows for life. That takes time and structure." },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 60}>
                <div className="bg-card-bg border border-card-border rounded-xl p-6 h-full">
                  <div className="w-8 h-0.5 bg-gold mb-4" />
                  <h3 className="font-serif text-lg text-navy mb-3">{item.heading}</h3>
                  <p className="text-muted text-sm leading-relaxed">{item.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* No group near you */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="bg-card-bg border border-card-border rounded-2xl p-10 text-center">
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              No Group Near You?
            </p>
            <h2 className="font-serif text-3xl text-navy mb-4">
              The Solo Companion brings the group to you.
            </h2>
            <p className="text-muted mb-8 leading-relaxed max-w-xl mx-auto">
              The Solo Companion is the full Live and Grieve™ Book 1 experience, built for individuals working through grief on their own. The same research and philosophical foundation. The same structured 13-week arc. No group required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="https://solo.tripillarstudio.com"
                className="bg-gold text-white font-semibold px-8 py-3 rounded-md hover:bg-gold-light transition-colors text-sm"
              >
                Start Solo — $24.99
              </Link>
              <Link
                href="/facilitators"
                className="border border-card-border text-muted hover:text-navy hover:border-navy/30 px-8 py-3 rounded-md text-sm transition-colors"
              >
                Bring a group to your community →
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Program overview */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              The Full Program
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
              Live and Grieve™ — 52 weeks. Five research frameworks and Wolfelt companioning philosophy. One community.
            </h2>
            <p className="text-muted mb-8 leading-relaxed">
              For organizations — hospice, faith communities, schools, nonprofits, employers — Live and Grieve™ offers a licensable, facilitator-led program built on the same research and philosophical foundation. Hampshire County, West Virginia pilot launching May 2026.
            </p>
            <Link
              href="/program/adult"
              className="bg-gold text-white font-semibold px-8 py-3 rounded-md hover:bg-gold-light transition-colors text-sm"
            >
              See the Adult Program →
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
