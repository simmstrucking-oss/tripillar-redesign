import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grief Facilitator Certification | Live and Grieve™",
  description:
    "Become a certified Live and Grieve™ grief facilitator. 14 contact hours. No clinical license required. Grounded in six peer-reviewed frameworks — three theoretical, three applied practice. Group Use License available for individual certified facilitators running a single cohort.",
};

export default function GriefFacilitatorCertificationPage() {
  return (
    <>
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
            Grief Facilitator Certification
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            How to become a grief facilitator.
          </h1>
          <p className="text-xl text-muted max-w-2xl leading-relaxed">
            No clinical license required. 14 contact hours. Grounded in six peer-reviewed frameworks.
          </p>
        </div>
      </section>

      {/* What it is */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6">
            Grief facilitation is not therapy.
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            A grief facilitator is not a clinician. They do not diagnose, treat, or manage a clinical condition. They create a structured, safe space for grief to be witnessed — by trained community members who know how to hold space without trying to fix it.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            Live and Grieve™ Certified Facilitators complete 14 contact hours of book-specific training and gain access to the full program — Facilitator Hub, session guides, outcome tracking tools, and ongoing support. Three certification tracks: Community (no clinical credential required), Professional, and Ministry.
          </p>
          <p className="text-muted leading-relaxed">
            Live and Grieve™ is grounded in six peer-reviewed frameworks. Three theoretical frameworks structure the program arc. Three applied practice frameworks shape every session.
          </p>
        </FadeIn>
      </section>

      {/* Tracks */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl sm:text-4xl text-navy">
                Three certification tracks.
              </h2>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                track: "Community",
                desc: "For community leaders, peer supporters, volunteers, and anyone without a clinical credential. No professional license required. The most accessible entry point.",
                credential: "No clinical credential required",
              },
              {
                track: "Professional",
                desc: "For social workers, counselors, nurses, chaplains, and other professionals who want to integrate structured grief facilitation into their existing practice.",
                credential: "Any professional credential accepted",
              },
              {
                track: "Ministry",
                desc: "For pastors, deacons, lay ministers, and faith community leaders who want to bring structured grief support to their congregation.",
                credential: "Faith community context",
              },
            ].map((t, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="bg-card-bg border border-card-border rounded-2xl p-8 h-full">
                  <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">{t.credential}</p>
                  <h3 className="font-serif text-2xl text-navy mb-4">{t.track} Track</h3>
                  <p className="text-muted leading-relaxed text-sm">{t.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <h2 className="font-serif text-3xl text-navy mb-8">What certification includes.</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "14 contact hours of book-specific training",
              "Physical program materials",
              "Access to the Facilitator Hub",
              "Session guides for all 13 weeks",
              "Pre- and post-program outcome tracking tools",
              "Critical Incident reporting protocol",
              "Digital signatures (Code of Conduct, Group Use License, Cert Acknowledgment)",
              "Annual renewal at $150/year",
              "Certified Facilitator ID (LG-C-YYYY-XXXX format)",
              "Ongoing support from Tri-Pillars™ LLC",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-muted">
                <span className="text-gold mt-0.5 flex-shrink-0">◆</span>
                {item}
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* Group Use License */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="bg-card-bg border border-gold/20 rounded-2xl p-10">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                For Individual Facilitators
              </p>
              <h2 className="font-serif text-3xl text-navy mb-4">
                Group Use License — no organization required.
              </h2>
              <p className="text-muted leading-relaxed mb-6">
                If you are a certified facilitator in private practice, faith ministry, or community leadership and want to run a single cohort without an organizational Institutional License Agreement, the Group Use License is built for you. Lower barrier. Single cohort. Full program access.
              </p>
              <p className="text-muted leading-relaxed mb-6">
                This is a separate product from institutional licensing — designed for individual certified facilitators who want to bring Live and Grieve™ to their community on their own terms.
              </p>
              <Link
                href="/facilitators"
                className="bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm"
              >
                Learn about facilitator certification →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <h2 className="font-serif text-3xl text-navy mb-8">Certification pricing.</h2>
          <div className="space-y-4">
            {[
              { label: "Adult program certification", price: "$450 per person, per book", note: "14 contact hours. Books 1–4 available." },
              { label: "Youth program certification (LGY)", price: "$325 per track", note: "Elementary or Middle/High. Licensed school counselors and social workers." },
              { label: "Annual renewal", price: "$150/year", note: "Keeps Hub access and program materials current." },
              { label: "Trainer certification", price: "$1,500 per book", note: "Authorizes regional training delivery. Trainers set their own delivery fees." },
            ].map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-card-bg border border-card-border rounded-xl gap-2">
                <div>
                  <p className="font-serif text-navy font-semibold">{item.label}</p>
                  <p className="text-muted text-sm">{item.note}</p>
                </div>
                <p className="text-gold font-semibold text-sm whitespace-nowrap">{item.price}</p>
              </div>
            ))}
          </div>
          <p className="text-muted text-xs mt-4">Note: HOPE (Tufts) charges $1,500 for 5–6 hours to certify a 1-hour workshop. Live and Grieve™ charges $450 for 14 hours to deliver a 52-week program. Below the $500 nonprofit purchasing approval threshold.</p>
        </FadeIn>
      </section>

      {/* Solo CTA */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Experience the Program First
            </p>
            <h2 className="font-serif text-3xl text-navy mb-4">
              Start with the Solo Companion.
            </h2>
            <p className="text-muted mb-8 leading-relaxed">
              Want to experience the Live and Grieve™ program before certifying? The Solo Companion brings Book 1 to your phone. The same six-framework foundation. The same structure. $24.99 or three payments of $9.99.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-gold text-white font-semibold px-8 py-3 rounded-md hover:bg-gold-light transition-colors text-sm"
              >
                Get in touch →
              </Link>
              <Link
                href="https://solo.tripillarstudio.com"
                className="border border-card-border text-muted hover:text-navy hover:border-navy/30 px-8 py-3 rounded-md text-sm transition-colors"
              >
                Solo Companion — $24.99
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
