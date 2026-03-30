import FadeIn from "@/components/FadeIn";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a Facilitator | Live and Grieve™",
  description:
    "Become a Live and Grieve™ Certified Facilitator. No clinical license required — only preparation, presence, and a willingness to walk alongside people in their grief.",
};

const steps = [
  {
    number: "01",
    title: "Apply",
    desc: "Express interest through the contact form. Wayne or a Certified Trainer will reach out to discuss whether Live and Grieve™ is the right fit for you and your community.",
  },
  {
    number: "02",
    title: "Prepare",
    desc: "Complete pre-training preparation through the Facilitator Hub — the Inner Work Guide, the Participant Appropriateness Guide, and Week 1 of your Facilitator Manual. This is not optional. You need to have done this work before training day.",
  },
  {
    number: "03",
    title: "Train",
    desc: "Complete a two-day facilitator certification training — delivered virtually or in person by Wayne, Jamie, or a Certified Trainer. 14 contact hours. Assessment included.",
  },
  {
    number: "04",
    title: "Facilitate",
    desc: "Launch your first group. You will have full access to the Facilitator Hub — structured session guides, digital forms, consultation support, and a direct line to Tri-Pillars™ whenever you need it.",
  },
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
            Become a Live and Grieve<sup className="text-2xl ml-0.5">™</sup>{" "}
            Certified Facilitator
          </h1>
          <p className="text-xl text-muted max-w-2xl leading-relaxed">
            You don&apos;t need a clinical license. You need preparation,
            presence, and a willingness to walk alongside people in their
            grief.
          </p>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            Who This Is For
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-8 leading-snug">
            Who facilitators are.
          </h2>
          <p className="text-muted leading-relaxed text-lg max-w-3xl">
            Live and Grieve™ facilitators come from every background — social
            workers, chaplains, nurses, teachers, community organizers, and
            people who have walked through loss themselves and want to give
            others what they needed. What they share is not a credential. It
            is a calling to show up, consistently, for people who are
            grieving. If that describes you, this is for you.
          </p>
        </FadeIn>
      </section>

      {/* The Certification Process */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                The Certification Process
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy">
                Four steps from interest to facilitation.
              </h2>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="flex flex-col">
                  <div className="w-12 h-12 rounded-full border border-gold/30 flex items-center justify-center mb-5">
                    <span className="text-gold text-sm font-bold">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl text-navy mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed flex-1">
                    {step.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Your Facilitator Hub */}
      <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            Your Facilitator Hub
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-8 leading-snug">
            Everything you need, in one place.
          </h2>
          <p className="text-muted leading-relaxed text-lg max-w-3xl">
            Every certified facilitator gets access to the Live and
            Grieve™ Facilitator Hub — a private platform with everything you
            need to run your groups well. Session preparation materials,
            digital forms for incident reports and feedback, a private
            reflection log, cohort tracking, and direct consultation with
            Tri-Pillars™. It is not a resource library. It is your
            operational home base.
          </p>
        </FadeIn>
      </section>

      {/* Investment */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Investment
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-8 leading-snug">
              What certification costs.
            </h2>
            <p className="text-muted leading-relaxed text-lg max-w-3xl">
              Facilitator certification is $450 per person per book. This is
              typically paid by your organization as part of your licensing
              agreement — not by you individually. Annual renewal is $150. If
              you are an independent facilitator seeking a Group Use License,
              contact us to discuss your path.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center">
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Next Steps
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6">
              Ready to Take the Next Step?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center bg-gold text-white font-semibold px-8 py-3.5 rounded-md hover:bg-gold-light transition-colors text-sm"
              >
                Apply to Become a Facilitator
              </Link>
              <Link
                href="/login/facilitator"
                className="inline-flex items-center justify-center border border-card-border text-muted hover:text-navy hover:border-navy/30 px-8 py-3.5 rounded-md text-sm font-medium transition-colors"
              >
                Facilitator Login
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
