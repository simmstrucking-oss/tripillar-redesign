import FadeIn from "@/components/FadeIn";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Programs | Tri-Pillars™",
  description:
    "Live and Grieve offers a 52-week adult program and a 13-session youth program, both built on contemporary grief research.",
};

export default function ProgramPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end pb-16 pt-32 overflow-hidden bg-navy bg-texture">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 60% 30%, rgba(201,168,76,0.08) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            Programs
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Structured support{" "}
            <span className="gold-text">that meets people where they are.</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl leading-relaxed">
            Two programs, one philosophy: grief deserves time, community, and
            evidence-based care.
          </p>
        </div>
      </section>

      {/* Two programs */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-8">
          <FadeIn>
            <div className="book1-accent bg-card-bg border border-card-border shadow-sm rounded-2xl p-8 h-full flex flex-col">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                Adult Program
              </p>
              <h2 className="font-serif text-3xl text-navy mb-4">
                Live and Grieve™
              </h2>
              <ul className="space-y-2 text-muted text-sm mb-6 flex-1">
                <li className="flex items-start gap-2"><span className="text-gold">◆</span> 52 weeks of structured support</li>
                <li className="flex items-start gap-2"><span className="text-gold">◆</span> 4 quarterly workbooks, 60 facilitated sessions</li>
                <li className="flex items-start gap-2"><span className="text-gold">◆</span> Groups of 6 to 12 participants</li>
                <li className="flex items-start gap-2"><span className="text-gold">◆</span> Built on 6 peer-reviewed frameworks</li>
                <li className="flex items-start gap-2"><span className="text-gold">◆</span> 3 facilitator certification tracks</li>
              </ul>
              <Link
                href="/program/adult"
                className="inline-block bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm text-center"
              >
                Learn More →
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="book3-accent bg-card-bg border border-card-border shadow-sm rounded-2xl p-8 h-full flex flex-col">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                Youth Program
              </p>
              <h2 className="font-serif text-3xl text-navy mb-4">
                Live and Grieve Youth™
              </h2>
              <ul className="space-y-2 text-muted text-sm mb-6 flex-1">
                <li className="flex items-start gap-2"><span className="text-gold">◆</span> 13 facilitated sessions</li>
                <li className="flex items-start gap-2"><span className="text-gold">◆</span> Elementary and Middle-High tracks</li>
                <li className="flex items-start gap-2"><span className="text-gold">◆</span> Age-appropriate, developmentally informed</li>
                <li className="flex items-start gap-2"><span className="text-gold">◆</span> Caregiver support built in</li>
                <li className="flex items-start gap-2"><span className="text-gold">◆</span> Facilitator certification available</li>
              </ul>
              <Link
                href="/program/youth"
                className="inline-block bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm text-center"
              >
                Learn More →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* More coming */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              What&apos;s Next
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6">
              More programs are coming.
            </h2>
            <p className="text-muted leading-relaxed mb-8">
              We are developing specialized tracks for first responders,
              healthcare workers, and communities affected by collective
              tragedy. If your organization has a need we haven&apos;t addressed
              yet, we want to hear from you.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-gold text-white font-semibold px-8 py-3.5 rounded-md hover:bg-gold-light transition-colors text-sm"
            >
              Get in Touch →
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
