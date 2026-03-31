import FadeIn from "@/components/FadeIn";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live and Grieve™ Program Overview | Tri-Pillars™",
  description:
    "Live and Grieve™ is a 52-week structured grief education program grounded in six peer-reviewed frameworks. Three theoretical frameworks structure the program arc. Three applied practice frameworks shape every session. Adult program, youth program, and Solo Companion. Hampshire County WV pilot launching May 2026.",
};

export default function ProgramPage() {
  return (
    <>
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
          <p className="text-xl text-muted max-w-2xl leading-relaxed">
            A 52-week structured grief education program grounded in six peer-reviewed frameworks. Three theoretical frameworks structure the program arc. Three applied practice frameworks shape every session.
          </p>
        </div>
      </section>

      {/* Framework foundation */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="bg-card-bg border border-gold/20 rounded-2xl p-8">
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">Research Foundation</p>
            <p className="font-serif text-xl text-navy leading-relaxed mb-6">
              Live and Grieve™ is grounded in six peer-reviewed frameworks. Three theoretical frameworks structure the program arc. Three applied practice frameworks shape every session.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gold/60 text-xs uppercase tracking-wider mb-2">Layer 1 — Theoretical</p>
                <ul className="space-y-1 text-sm text-muted">
                  <li>Dual Process Model (Stroebe &amp; Schut)</li>
                  <li>Tasks of Mourning (Worden)</li>
                  <li>Continuing Bonds Theory (Klass, Silverman &amp; Nickman)</li>
                </ul>
              </div>
              <div>
                <p className="text-gold/60 text-xs uppercase tracking-wider mb-2">Layer 2 — Applied Practice</p>
                <ul className="space-y-1 text-sm text-muted">
                  <li>Meaning Reconstruction (Neimeyer)</li>
                  <li>Self-Compassion (Neff)</li>
                  <li>Companioning the Bereaved (Wolfelt)</li>
                </ul>
              </div>
            </div>
            <Link href="/our-approach" className="inline-block mt-6 text-gold text-sm font-medium hover:underline">
              Learn about all six frameworks →
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* Three products */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">The Program Ecosystem</p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy">Three ways to access Live and Grieve™.</h2>
            </div>
          </FadeIn>

          <div className="grid lg:grid-cols-3 gap-8">
            <FadeIn>
              <div className="bg-card-bg border border-card-border rounded-2xl p-8 h-full flex flex-col">
                <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">Adult Program</p>
                <h3 className="font-serif text-2xl text-navy mb-4">Live and Grieve™</h3>
                <p className="text-muted text-sm leading-relaxed mb-6 flex-1">
                  52 weeks. Four books. Closed cohorts of 6–12. Three facilitator tracks: Community, Professional, Ministry. No clinical license required to deliver. In-person or virtual — the Virtual Facilitation Addendum is included with every license.
                </p>
                <ul className="space-y-1 text-xs text-muted mb-6">
                  <li>◆ 13 sessions per quarter, 4 quarters</li>
                  <li>◆ Licensed facilitator certification: $450/book</li>
                  <li>◆ Organizational licensing: $1,500–$7,500/yr</li>
                  <li>◆ Hampshire County WV pilot — May 2026</li>
                </ul>
                <Link href="/program/adult" className="bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm text-center">
                  Adult Program →
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <div className="bg-card-bg border border-card-border rounded-2xl p-8 h-full flex flex-col">
                <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">Youth Program</p>
                <h3 className="font-serif text-2xl text-navy mb-4">Live and Grieve Youth™</h3>
                <p className="text-muted text-sm leading-relaxed mb-6 flex-1">
                  13 sessions. Two age-differentiated tracks: Elementary (Ages 8–12, activity-led, groups 6–8) and Middle/High (Ages 13–17, dialogue-led, groups 6–10). Licensed school counselors and social workers. Family Bridge connects grieving caregivers to the adult program.
                </p>
                <ul className="space-y-1 text-xs text-muted mb-6">
                  <li>◆ NACG alignment documentation (GOV-007)</li>
                  <li>◆ Certification: $325/track</li>
                  <li>◆ Community $1,200 / Standard $1,800 / Multi-site $7,000</li>
                  <li>◆ Family Bridge adult gateway built in</li>
                </ul>
                <Link href="/program/youth" className="bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm text-center">
                  Youth Program →
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="bg-card-bg border border-card-border rounded-2xl p-8 h-full flex flex-col">
                <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">Individual Access</p>
                <h3 className="font-serif text-2xl text-navy mb-4">Solo Companion</h3>
                <p className="text-muted text-sm leading-relaxed mb-6 flex-1">
                  The full Live and Grieve™ Book 1 experience built for individuals. No group required. No facilitator required. The same six-framework foundation, the same 13-week arc — on your phone, on your schedule.
                </p>
                <ul className="space-y-1 text-xs text-muted mb-6">
                  <li>◆ solo.tripillarstudio.com</li>
                  <li>◆ $24.99 one-time or $9.99 × 3</li>
                  <li>◆ Group Supplement via facilitator code</li>
                  <li>◆ Every group participant is a warm lead post-cohort</li>
                </ul>
                <Link href="https://solo.tripillarstudio.com" className="bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm text-center">
                  Start Solo — $24.99
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Who it is for */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-8">Who Live and Grieve™ is for.</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { heading: "Hospice and palliative care", body: "42 CFR 418.88 requires 13 months of bereavement services post-death. Live and Grieve™ is a 52-week peer-facilitated program that satisfies this requirement. No licensed clinician required to deliver." },
              { heading: "Community Action Agencies", body: "Community-based grief support with no clinical requirement. CSBG-eligible programming. The Hampshire County WV pilot is CAA-delivered." },
              { heading: "Faith communities", body: "Pastoral caregivers, lay ministers, and deacons can deliver the program through the Community track. Ministry certification available." },
              { heading: "School districts", body: "Live and Grieve Youth™ is NACG-aligned, age-differentiated, and comes with a Family Bridge that connects grieving caregivers to the adult program." },
              { heading: "Employers and EAPs", body: "$225B in annual grief productivity losses. Structured grief education is a measurable wellness benefit. Virtual delivery available nationally." },
              { heading: "Bereaved individuals", body: "The Solo Companion brings Book 1 directly to individuals. No group required. No facilitator. $24.99 or three payments of $9.99." },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 60}>
                <div className="border-l-2 border-gold/30 pl-6">
                  <h3 className="font-serif text-lg text-navy mb-2">{item.heading}</h3>
                  <p className="text-muted text-sm leading-relaxed">{item.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* Hampshire pilot */}
      <section className="py-16 bg-section-alt">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="bg-card-bg border border-card-border rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1">
                <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">Pilot Program</p>
                <h3 className="font-serif text-2xl text-navy mb-3">Hampshire County, WV — May 2026</h3>
                <p className="text-muted leading-relaxed text-sm">
                  The first Live and Grieve™ pilot launches through a Community Action Agency in Hampshire County, West Virginia in May 2026. Three social workers. Pre- and post-program outcome tracking. Documented outcomes by late 2026.
                </p>
              </div>
              <Link href="/contact" className="flex-shrink-0 border border-card-border text-muted hover:text-navy hover:border-navy/30 px-6 py-3 rounded-md text-sm transition-colors">
                Get in touch →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* CTAs */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <FadeIn>
          <h2 className="font-serif text-3xl text-navy mb-4">Ready to bring Live and Grieve™ to your community?</h2>
          <p className="text-muted mb-8">Download the free guide, start the Solo Companion, or get in touch about organizational licensing.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/free-guide" className="bg-gold text-white font-semibold px-8 py-3 rounded-md hover:bg-gold-light transition-colors text-sm">
              Download the Free Guide
            </Link>
            <Link href="https://solo.tripillarstudio.com" className="border border-card-border text-muted hover:text-navy hover:border-navy/30 px-8 py-3 rounded-md text-sm transition-colors">
              Solo Companion — $24.99
            </Link>
            <Link href="/contact" className="border border-card-border text-muted hover:text-navy hover:border-navy/30 px-8 py-3 rounded-md text-sm transition-colors">
              Get in touch →
            </Link>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
