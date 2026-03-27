import FadeIn from "@/components/FadeIn";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Tri-Pillars™",
  description:
    "Wayne and Jamie Simms built Live and Grieve after losing their son Jacoby and nephew Ian. Learn about the research and conviction behind the program.",
};

const values = [
  { title: "Compassion & Presence", desc: "Being with someone in their pain is not something to fix. It is the intervention." },
  { title: "Safety & Trust", desc: "People will not grieve openly until they believe the room can hold what they carry." },
  { title: "Trauma-Informed Care", desc: "Every session accounts for the reality that grief often coexists with trauma." },
  { title: "Continuing Bonds", desc: "The goal is never to let go. It is to find new ways to carry someone forward." },
  { title: "Inclusivity", desc: "Grief does not discriminate. Neither does this program." },
  { title: "Evidence-Informed Practice", desc: "Every component is grounded in peer-reviewed research, not tradition or assumption." },
];

const frameworks = [
  { name: "Dual Process Model", authors: "Stroebe & Schut, 1999", desc: "Grief oscillates between confronting loss and rebuilding daily life. Both are necessary." },
  { name: "Tasks of Mourning", authors: "Worden, 2009", desc: "Grief is active work: accepting, processing, adjusting, and finding a way to carry the person forward." },
  { name: "Continuing Bonds", authors: "Klass, Silverman & Nickman, 1996", desc: "Maintaining a relationship with the deceased is healthy, not a sign of unresolved grief." },
  { name: "Meaning Reconstruction", authors: "Neimeyer, 2001", desc: "Loss disrupts the stories we tell about our lives. Rebuilding meaning is central to adaptation." },
  { name: "Self-Compassion", authors: "Neff, 2011", desc: "Treating yourself with the same kindness you would offer a friend changes the trajectory of grief." },
  { name: "Companioning Model", authors: "Wolfelt, 2006", desc: "Walking alongside someone in grief rather than leading them through it." },
];

export default function AboutPage() {
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
            About Us
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            Built from loss.{" "}
            <span className="gold-text">Designed for the living.</span>
          </h1>
          <p className="text-xl text-muted max-w-2xl leading-relaxed">
            Tri-Pillars was founded by Wayne and Jamie Simms after the deaths of
            their son Jacoby and nephew Ian. What started as a search for
            something better became a program grounded in what research
            actually says about grief.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          <FadeIn>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6 leading-snug">
              Our story.
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              When Jacoby died, Wayne and Jamie did what most grieving families
              do. They looked for help. What they found was a patchwork of
              outdated stage models, short-term counseling, and well-meaning
              advice that assumed grief has an endpoint.
            </p>
            <p className="text-muted leading-relaxed mb-4">
              Then Ian died. And the search became urgent.
            </p>
            <p className="text-muted leading-relaxed">
              They spent years studying what contemporary grief researchers
              actually recommend: non-linear models, community-based support,
              continuing bonds with the people we lose. They built Live and
              Grieve to be the program they wished had existed.
            </p>
          </FadeIn>

          <FadeIn delay={150}>
            <blockquote className="bg-card-bg border border-gold/15 rounded-2xl p-8 h-full flex flex-col justify-center">
              <div className="text-gold/30 font-serif text-6xl leading-none mb-2">&ldquo;</div>
              <p className="font-serif text-xl text-navy leading-relaxed mb-6">
                We didn&apos;t build this because we had it figured out. We built
                it because nobody else was building what we needed.
              </p>
              <footer className="flex items-center gap-3">
                <div className="w-8 h-px bg-gold/40" />
                <cite className="text-gold text-sm font-medium not-italic">
                  Wayne &amp; Jamie Simms
                </cite>
              </footer>
            </blockquote>
          </FadeIn>
        </div>
      </section>

      {/* Core Conviction */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              The Core Conviction
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6">
              &ldquo;Live and Grieve&rdquo; is not a contradiction.
            </h2>
            <p className="text-muted max-w-2xl mx-auto leading-relaxed mb-4">
              The word &ldquo;and&rdquo; is the operative word. You do not grieve and
              then live. You do both at the same time, for the rest of your
              life. The program runs 52 weeks because that is a statement:
              grief deserves a full year of structured support, not six sessions
              and a follow-up call.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* What We Believe */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Our Values
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy">
              What we believe.
            </h2>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="bg-card-bg border border-card-border shadow-sm rounded-xl p-6 h-full">
                <div className="w-8 h-0.5 bg-gold mb-4" />
                <h3 className="font-serif text-lg text-navy mb-3">{v.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{v.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Research Foundation */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                Research Foundation
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
                Six frameworks. One integrated program.
              </h2>
              <p className="text-muted max-w-2xl mx-auto">
                Every component of Live and Grieve is rooted in peer-reviewed
                research.
              </p>
            </div>
          </FadeIn>

          <div className="space-y-4">
            {frameworks.map((fw, i) => (
              <FadeIn key={i} delay={i * 60}>
                <div className="card-hover bg-card-bg border border-card-border shadow-sm rounded-xl p-6 grid md:grid-cols-[220px_1fr] gap-4 items-start">
                  <div>
                    <h3 className="font-serif text-lg text-navy">{fw.name}</h3>
                    <p className="text-gold/60 text-xs">{fw.authors}</p>
                  </div>
                  <p className="text-muted text-sm leading-relaxed">{fw.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <FadeIn>
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            Mission
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6">
            Make evidence-based grief support accessible to every community.
          </h2>
          <p className="text-muted max-w-2xl mx-auto leading-relaxed mb-8">
            We believe every person who has experienced loss deserves a place
            where their grief is met with understanding, structure, and
            community. Not just for a few weeks, but for as long as they need it.
          </p>
          <Link
            href="/our-approach"
            className="inline-block bg-gold text-white font-semibold px-8 py-3.5 rounded-md hover:bg-gold-light transition-colors text-sm"
          >
            See Our Approach →
          </Link>
        </FadeIn>
      </section>
    </>
  );
}
