import FadeIn from "@/components/FadeIn";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "Live and Grieve™ Program Overview | Tri-Pillars™",
  description:
    "Live and Grieve™ is a structured grief education program for adults, youth, and individuals. 52-week adult program, 13-session youth program, and Solo Companion. Draws on five research frameworks and the Wolfelt companioning philosophical influence. Hampshire County WV pilot launching May 2026.",
  openGraph: {
    title: "Live and Grieve™ Program Overview | Tri-Pillars™",
    description:
      "Live and Grieve™ is a structured grief education program for adults, youth, and individuals. 52-week adult program, 13-session youth program, and Solo Companion.",
    url: "https://www.tripillarstudio.com/program",
    siteName: "Tri-Pillars™",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Live and Grieve™ Program Overview" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live and Grieve™ Program Overview | Tri-Pillars™",
    description:
      "Live and Grieve™ is a structured grief education program for adults, youth, and individuals. 52-week adult program, 13-session youth program, and Solo Companion.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://www.tripillarstudio.com/program" },
};

const programBreadcrumbSchema = breadcrumbSchema([
  { name: "Home", url: "https://www.tripillarstudio.com" },
  { name: "Program", url: "https://www.tripillarstudio.com/program" }
]);

export default function ProgramPage() {
  return (
    <>
      <JsonLd schema={programBreadcrumbSchema} />
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end pb-16 pt-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 60% 30%, rgba(201,168,76,0.07) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            Program Overview
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            Live and Grieve™
          </h1>
          <p className="text-xl text-muted max-w-2xl leading-relaxed mb-8">
            A structured grief education program for adults, youth, and individuals.
          </p>
          <a
            href="#programs"
            className="bg-gold text-white font-semibold px-8 py-3 rounded-md hover:bg-gold-light transition-colors text-sm inline-block"
          >
            Explore Programs
          </a>
        </div>
      </section>

      {/* Three programs */}
      <section id="programs" className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">The Programs</p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy">Three ways to access Live and Grieve™.</h2>
            </div>
          </FadeIn>

          {/* Adult program */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <FadeIn>
              <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">Adult Program</p>
              <h3 className="font-serif text-3xl text-navy mb-4">Live and Grieve™</h3>
              <p className="text-muted leading-relaxed mb-4">
                52 weeks. Four books. Closed cohorts of 6–12 people, meeting weekly. Three facilitator tracks: Community, Professional, and Ministry. No clinical license required to deliver. In-person or virtual — the Virtual Facilitation Addendum is included with every license.
              </p>
              <p className="text-muted leading-relaxed mb-6">
                Designed for hospice organizations, community action agencies, faith communities, employers, and nonprofits that want to bring structured, research-grounded grief support to the people they serve.
              </p>
              <ul className="space-y-1 text-sm text-muted mb-8">
                <li className="flex gap-2"><span className="text-gold">◆</span>13 sessions per quarter, 4 quarters</li>
                <li className="flex gap-2"><span className="text-gold">◆</span>Facilitator certification: $450/book</li>
                <li className="flex gap-2"><span className="text-gold">◆</span>Organizational licensing: $1,500–$7,500/yr</li>
                <li className="flex gap-2"><span className="text-gold">◆</span>Satisfies 42 CFR 418.88 hospice bereavement requirement</li>
              </ul>
              <Link href="/program/adult" className="bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm">
                Learn more →
              </Link>
            </FadeIn>
            <FadeIn delay={100}>
              <div className="bg-card-bg border border-card-border rounded-2xl p-8">
                <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">Who it serves</p>
                <ul className="space-y-3 text-sm text-muted">
                  {["Hospice and palliative care organizations", "Community Action Agencies", "Faith communities (Community + Ministry tracks)", "Employers and EAPs", "Nonprofits and foundations", "Veterans organizations"].map((item, i) => (
                    <li key={i} className="flex gap-2"><span className="text-gold mt-0.5">◆</span>{item}</li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>

          {/* Visual break */}
          <div className="my-4 rounded-2xl overflow-hidden">
            <Image src="/images/hands-holding-cup.jpg" alt="Quiet moment of reflection — hands holding a warm cup" width={1200} height={500} className="w-full object-cover max-h-64" />
          </div>

          {/* Youth program */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <FadeIn delay={100} className="order-last lg:order-first">
              <div className="bg-card-bg border border-card-border rounded-2xl p-8">
                <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">Two age tracks</p>
                <div className="space-y-4">
                  <div>
                    <p className="font-serif text-navy font-semibold mb-1">Elementary — Ages 8–12</p>
                    <p className="text-muted text-sm">Activity-led. Groups of 6–8. Grief Weather Card Set, When Grief Arrives Card, structured drawing and reflection activities.</p>
                  </div>
                  <div className="border-t border-card-border pt-4">
                    <p className="font-serif text-navy font-semibold mb-1">Middle / High — Ages 13–17</p>
                    <p className="text-muted text-sm">Dialogue-led. Groups of 6–10. Evidence-based frameworks adapted for adolescent development. Structured discussion and written reflection.</p>
                  </div>
                  <div className="border-t border-card-border pt-4">
                    <p className="font-serif text-navy font-semibold mb-1">Family Bridge</p>
                    <p className="text-muted text-sm">Every LGY caregiver communication includes a pathway to the adult Live and Grieve™ program. Grieving caregivers of LGY participants become warm leads for adult cohorts.</p>
                  </div>
                </div>
              </div>
            </FadeIn>
            <FadeIn>
              <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">Youth Program</p>
              <h3 className="font-serif text-3xl text-navy mb-4">Live and Grieve Youth™</h3>
              <p className="text-muted leading-relaxed mb-4">
                13 sessions. Two age-differentiated tracks. Elementary (Ages 8–12, activity-led) and Middle/High (Ages 13–17, dialogue-led). Delivered through schools, faith communities, and youth-serving organizations by licensed school counselors and social workers.
              </p>
              <p className="text-muted leading-relaxed mb-6">
                The Family Bridge component creates a pathway for grieving caregivers of LGY participants to access the adult Live and Grieve™ program — connecting both generations in the same community.
              </p>
              <ul className="space-y-1 text-sm text-muted mb-8">
                <li className="flex gap-2"><span className="text-gold">◆</span>NACG alignment documentation included (GOV-007)</li>
                <li className="flex gap-2"><span className="text-gold">◆</span>Certification: $325/track</li>
                <li className="flex gap-2"><span className="text-gold">◆</span>Community $1,200 / Standard $1,800 / Multi-site $7,000</li>
              </ul>
              <Link href="/program/youth" className="bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm">
                Learn more →
              </Link>
            </FadeIn>
          </div>

          {/* Solo Companion */}
          <div className="bg-card-bg border border-gold/20 rounded-2xl p-10">
            <FadeIn>
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">For Individuals</p>
                  <h3 className="font-serif text-3xl text-navy mb-4">The Solo Companion</h3>
                  <p className="text-muted leading-relaxed mb-4">
                    The full Live and Grieve™ Book 1 experience, self-guided and available now. No group required. No facilitator required. The same research and philosophical foundation. The same 13-week structure. On your phone, on your schedule.
                  </p>
                  <p className="text-muted leading-relaxed mb-6">
                    Available now at solo.tripillarstudio.com. $24.99 one-time or three payments of $9.99.
                  </p>
                  <Link href="https://solo.tripillarstudio.com" className="bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm">
                    Begin — $24.99 →
                  </Link>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden">
                    <Image src="/images/solo-window-reflection.jpg" alt="Person in quiet reflection by window" width={600} height={400} className="w-full object-cover" />
                  </div>
                  <div className="space-y-2">
                    {["Book 1 — 13 weeks — self-guided", "$24.99 one-time or $9.99 × 3 installments", "Group Supplement available via facilitator code", "Every group participant is a warm lead post-cohort", "LGY caregivers directed here through Family Bridge"].map((item, i) => (
                      <div key={i} className="flex gap-2 text-sm text-muted">
                        <span className="text-gold mt-0.5 flex-shrink-0">◆</span>{item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Research foundation */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">Research Foundation</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6">Five frameworks. Two layers.</h2>
          <p className="text-muted leading-relaxed mb-8">
            Live and Grieve™ draws on five research frameworks and the Wolfelt companioning philosophical influence.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-card-bg border border-card-border rounded-xl p-6">
              <p className="text-gold/60 text-xs uppercase tracking-wider mb-3">Layer 1 — Theoretical (Program Arc)</p>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex gap-2"><span className="text-gold">◆</span>Dual Process Model — Stroebe &amp; Schut</li>
                <li className="flex gap-2"><span className="text-gold">◆</span>Tasks of Mourning — Worden</li>
                <li className="flex gap-2"><span className="text-gold">◆</span>Continuing Bonds Theory — Klass, Silverman &amp; Nickman</li>
              </ul>
            </div>
            <div className="bg-card-bg border border-card-border rounded-xl p-6">
              <p className="text-gold/60 text-xs uppercase tracking-wider mb-3">Layer 2 — Applied Practice (Session Delivery)</p>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex gap-2"><span className="text-gold">◆</span>Meaning Reconstruction — Neimeyer</li>
                <li className="flex gap-2"><span className="text-gold">◆</span>Self-Compassion — Neff</li>
                <li className="flex gap-2"><span className="text-gold">◆</span>Companioning the Bereaved — Wolfelt</li>
              </ul>
            </div>
          </div>
          <Link href="/our-approach" className="text-gold text-sm font-medium hover:underline">
            Learn about all five frameworks and the companioning philosophy →
          </Link>
        </FadeIn>
      </section>

      {/* Hampshire pilot */}
      <section className="py-8 max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="bg-card-bg border border-card-border rounded-2xl p-8">
            <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">Pilot Program</p>
            <p className="font-serif text-xl text-navy leading-relaxed">
              Our first pilot launches through a Community Action Agency in Hampshire County, West Virginia in May 2026.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* Dual closing CTAs */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="bg-card-bg border border-card-border rounded-2xl p-8 text-center">
                <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">For Organizations</p>
                <h3 className="font-serif text-2xl text-navy mb-4">Bring Live and Grieve™ to your organization.</h3>
                <p className="text-muted text-sm mb-6 leading-relaxed">Hospice, schools, faith communities, employers, nonprofits. Licensing, certification, and virtual delivery available nationally.</p>
                <Link href="/institutions" className="bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm block text-center">
                  Learn more →
                </Link>
              </div>
              <div className="bg-card-bg border border-card-border rounded-2xl p-8 text-center">
                <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">For Individuals</p>
                <h3 className="font-serif text-2xl text-navy mb-4">Start with the free guide.</h3>
                <p className="text-muted text-sm mb-6 leading-relaxed">&ldquo;The 7 Things Nobody Tells You About Grief&rdquo; — written by Wayne and Jamie Simms. Free. No opt-out required.</p>
                <Link href="/free-guide" className="bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm block text-center">
                  Download the Free Guide
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
