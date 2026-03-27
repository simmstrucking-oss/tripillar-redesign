import FadeIn from "@/components/FadeIn";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support the Mission | Tri-Pillars™",
  description:
    "Help expand access to evidence-based grief support. Your contribution funds facilitator scholarships, pilot programs, and youth development.",
};

const funds = [
  { title: "Facilitator Training Scholarships", desc: "Covering certification costs for individuals and organizations that cannot afford the fee." },
  { title: "Pilot Program Expansion", desc: "Launching Live and Grieve in new communities, starting with the Hampshire County pilot in May 2026." },
  { title: "Youth Program Development", desc: "Building age-appropriate grief support for elementary and middle-high school students." },
  { title: "Program Access", desc: "Keeping workbook and materials costs as low as possible for participants." },
];

export default function SupportPage() {
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
            Support
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            Help us reach{" "}
            <span className="gold-text">more communities.</span>
          </h1>
          <p className="text-xl text-muted max-w-2xl leading-relaxed">
            Every dollar goes toward making evidence-based grief support
            available to people who need it and cannot access it.
          </p>
        </div>
      </section>

      {/* What it funds */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Where It Goes
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy">
              What your support funds.
            </h2>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 gap-6">
          {funds.map((f, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="bg-card-bg border border-card-border shadow-sm rounded-xl p-6 h-full">
                <div className="w-8 h-0.5 bg-gold mb-4" />
                <h3 className="font-serif text-lg text-navy mb-3">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* How to support */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              How to Give
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6">
              Any amount makes a difference.
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              Contributions of any amount support the mission. Contributions of
              $50 or more include the option to add a name and photo to our{" "}
              <Link href="/memorial-wall" className="text-gold hover:underline">
                Memorial Wall
              </Link>.
            </p>
            <p className="text-muted text-sm mb-8 bg-card-bg border border-card-border rounded-lg p-4 inline-block">
              Tri-Pillars LLC is not a 501(c)(3) nonprofit. Contributions are
              not tax-deductible.
            </p>
            <div className="block">
              <a
                href="https://buy.stripe.com/00w4gy9qD4RI5Hu5zZgYU00"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gold text-white font-semibold px-10 py-4 rounded-md hover:bg-gold-light transition-colors text-sm"
              >
                Contribute via Stripe →
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
