import FadeIn from "@/components/FadeIn";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a Facilitator | Tri-Pillars™",
  description:
    "Get certified to facilitate Live and Grieve groups. Community, Professional, and Ministry tracks available. No clinical license required.",
};

const adultTracks = [
  { name: "Community Track", desc: "For lay leaders, church volunteers, and community members who want to hold space for grieving people in their neighborhood." },
  { name: "Professional Track", desc: "For social workers, counselors, chaplains, and healthcare professionals adding structured grief support to their practice." },
  { name: "Ministry Track", desc: "For pastors, deacons, and ministry leaders integrating evidence-based grief care into their congregational work." },
];

const youthTracks = [
  { name: "Elementary Facilitator", desc: "Ages 5 to 11. Developmentally appropriate activities, caregiver communication, and creating safe spaces for young children." },
  { name: "Middle-High Facilitator", desc: "Ages 12 to 18. Navigating adolescent grief, peer dynamics, mandated reporter obligations, and boundary-setting." },
  { name: "Combined", desc: "Both tracks in a single certification for organizations serving the full K-12 range." },
];

const training = [
  "Trauma-informed facilitation techniques",
  "Group dynamics and safety protocols",
  "All six research frameworks in practice",
  "Holding space without overstepping",
  "Session-by-session guidance for the full program",
  "Handling difficult moments and crisis referrals",
];

export default function FacilitatorsPage() {
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
            Facilitator Certification
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            You don&apos;t need a license.{" "}
            <span className="gold-text">You need to care.</span>
          </h1>
          <p className="text-xl text-muted max-w-2xl leading-relaxed">
            Live and Grieve facilitators are trained laypeople, not therapists.
            The program provides the structure. The curriculum provides the
            content. You provide the presence.
          </p>
        </div>
      </section>

      {/* Adult Certification */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            Adult Program
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
            Adult facilitator certification.
          </h2>
          <p className="text-muted text-sm mb-4">
            Includes 2-day training, all materials, and ongoing support.
          </p>
          <p className="text-muted text-sm mb-4">
            Certification pricing available on inquiry. Contact us to discuss rates for your organization.
          </p>
          <Link
            href="/contact"
            className="inline-block border border-card-border text-muted hover:text-navy hover:border-navy/30 px-5 py-2.5 rounded-md text-sm transition-colors mb-10"
          >
            Contact Us →
          </Link>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {adultTracks.map((track, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="bg-card-bg border border-card-border shadow-sm rounded-xl p-6 h-full">
                <div className="w-8 h-0.5 bg-gold mb-4" />
                <h3 className="font-serif text-lg text-navy mb-3">{track.name}</h3>
                <p className="text-muted text-sm leading-relaxed">{track.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Youth Certification */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Youth Program
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
              Youth facilitator certification.
            </h2>
            <p className="text-muted text-sm mb-10">
              Pricing available on inquiry. Contact us for organizational rates.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {youthTracks.map((track, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="bg-card-bg border border-card-border shadow-sm rounded-xl p-6 h-full">
                  <div className="w-8 h-0.5 bg-gold mb-4" />
                  <h3 className="font-serif text-lg text-navy mb-3">{track.name}</h3>
                  <p className="text-muted text-sm leading-relaxed">{track.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* What You Learn */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Training
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6">
              What you learn in two days.
            </h2>
            <ul className="space-y-3">
              {training.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-muted text-sm">
                  <span className="text-gold mt-0.5 flex-shrink-0">◆</span>
                  {item}
                </li>
              ))}
            </ul>
          </FadeIn>

          <FadeIn delay={150}>
            <div className="bg-card-bg border border-card-border rounded-2xl p-8">
              <h3 className="font-serif text-2xl text-navy mb-4">
                Next training: Spring 2026
              </h3>
              <p className="text-muted mb-6 text-sm leading-relaxed">
                Our next facilitator certification event is in the last week
                of April 2026. Organizational cohort training is also available
                on request.
              </p>
              <Link
                href="/contact"
                className="inline-block bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm"
              >
                Get in Touch →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
