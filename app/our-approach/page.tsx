import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Approach | Tri-Pillars™",
  description:
    "Our framework draws on three evidence-based models to create grief support that actually reflects how people grieve.",
};

const frameworks = [
  {
    number: "01",
    title: "Dual Process Model",
    authors: "Stroebe & Schut",
    desc: "Grief doesn't move in a straight line. It oscillates. People naturally move between confronting loss and focusing on life restoration. Our program honors this rhythm rather than fighting it. There's no right amount of time to spend in either place.",
    highlight: "Oscillation is healthy, not avoidance.",
  },
  {
    number: "02",
    title: "Tasks of Mourning",
    authors: "William Worden",
    desc: "Rather than passive \"stages\" we move through, Worden's model recognizes grief as active work. Accepting loss, processing its pain, adjusting to a changed world, and finding ways to carry the person forward. These are things we do, not things that happen to us.",
    highlight: "Grief is active, not passive.",
  },
  {
    number: "03",
    title: "Continuing Bonds",
    authors: "Klass, Silverman & Nickman",
    desc: "Grief doesn't end because the relationship does. Maintaining a connection to someone who has died, through memory, ritual, and meaning, is not unhealthy attachment. It's a normal part of love that outlasts life.",
    highlight: "The goal isn't to let go. It's to carry them differently.",
  },
];

const comparison = [
  {
    old: "Five stages (denial, anger, bargaining, depression, acceptance)",
    newApproach: "Oscillating, non-linear, task-based support",
  },
  {
    old: "You should \"move on\" or \"find closure\"",
    newApproach: "Continuing bonds with those we've lost",
  },
  {
    old: "One-on-one clinical therapy as the only option",
    newApproach: "Community-based facilitator support",
  },
  {
    old: "Grief as a temporary crisis with an endpoint",
    newApproach: "Grief as an ongoing part of life that changes shape",
  },
  {
    old: "Time heals everything",
    newApproach: "What you do with time shapes how you carry loss",
  },
];

const outcomes = [
  {
    metric: "Reduced Isolation",
    desc: "Participants report feeling less alone in their grief and more connected to their community.",
  },
  {
    metric: "Increased Resilience",
    desc: "Tools for daily living and practical coping strategies that extend beyond the program.",
  },
  {
    metric: "Meaning-Making",
    desc: "Movement toward integrating loss into your ongoing life, not leaving it behind.",
  },
  {
    metric: "Facilitator Confidence",
    desc: "Partner organizations develop internal capacity to support grief long after the program ends.",
  },
];

const serves = [
  "Adults navigating loss of a spouse, parent, child, or close friend",
  "Individuals experiencing disenfranchised grief (loss of a pet, pregnancy, relationship)",
  "Children and teens who need age-appropriate support",
  "Communities recovering from collective tragedy",
  "Organizations wanting sustainable grief support capacity",
];

export default function OurApproachPage() {
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
            Our Approach
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Grief doesn&apos;t move in stages.{" "}
            <span className="gold-text">Neither does our program.</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl leading-relaxed">
            We built Live and Grieve™ on the best of contemporary grief
            research, not the model that was never meant for the bereaved in
            the first place.
          </p>
        </div>
      </section>

      {/* Problem with stage model */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          <FadeIn>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6 leading-snug">
              Why the five stages fall short.
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              The five stages of grief (denial, anger, bargaining, depression,
              acceptance) have helped millions name their experience. But they
              were designed by Elisabeth Kübler-Ross to describe the experience
              of people facing terminal illness, not those left behind.
            </p>
            <p className="text-muted leading-relaxed mb-4">
              When applied to bereavement, they create a false expectation:
              that grief is linear, that acceptance is the destination, and
              that anything else is failure.
            </p>
            <p className="text-muted leading-relaxed">
              Research over the past four decades tells a different story. Grief
              is non-linear, deeply personal, and lifelong. The people we love
              don&apos;t stop mattering to us because they&apos;re gone.
            </p>
          </FadeIn>

          <FadeIn delay={150}>
            <blockquote className="bg-card-bg border border-gold/15 rounded-2xl p-8 h-full flex flex-col justify-center">
              <div className="text-gold/30 font-serif text-6xl leading-none mb-2">&ldquo;</div>
              <p className="font-serif text-xl text-navy leading-relaxed mb-6">
                Grief is not something you resolve. It&apos;s something you learn to
                carry, and eventually, it becomes part of who you are.
              </p>
              <footer className="flex items-center gap-3">
                <div className="w-8 h-px bg-gold/40" />
                <cite className="text-gold text-sm font-medium not-italic">
                  Wayne &amp; Jamie Simms, Founders
                </cite>
              </footer>
            </blockquote>
          </FadeIn>
        </div>
      </section>

      {/* Three frameworks */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                The Tri&#8209;Pillars™ Framework
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
                Three models. One integrated approach.
              </h2>
              <p className="text-muted max-w-2xl mx-auto">
                Each framework brings something essential. Together, they form
                the backbone of Live and Grieve™.
              </p>
            </div>
          </FadeIn>

          <div className="space-y-6">
            {frameworks.map((fw, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="card-hover bg-card-bg border border-card-border shadow-sm rounded-2xl p-8 grid md:grid-cols-[80px_1fr_260px] gap-6 items-start">
                  <div className="font-serif text-4xl text-gold/40 font-bold">
                    {fw.number}
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-navy mb-1">
                      {fw.title}
                    </h3>
                    <p className="text-gold/60 text-xs uppercase tracking-wider mb-3">
                      {fw.authors}
                    </p>
                    <p className="text-muted leading-relaxed">
                      {fw.desc}
                    </p>
                  </div>
                  <div className="bg-gold/10 border border-gold/15 rounded-xl p-4">
                    <p className="text-gold text-sm font-medium leading-snug">
                      {fw.highlight}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              The Difference
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy">
              Old model vs. our approach.
            </h2>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="text-left py-4 pr-6 text-muted font-medium uppercase tracking-wider text-xs w-1/2">
                    Traditional Model
                  </th>
                  <th className="text-left py-4 text-gold font-medium uppercase tracking-wider text-xs w-1/2">
                    Live and Grieve™ Approach
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-card-border hover:bg-white/2 transition-colors"
                  >
                    <td className="py-4 pr-6 text-muted">{row.old}</td>
                    <td className="py-4 text-charcoal">{row.newApproach}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      </section>

      {/* Outcomes */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                What We Measure
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy">
                How we know it&apos;s working.
              </h2>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {outcomes.map((o, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="bg-card-bg border border-card-border shadow-sm rounded-xl p-6 h-full">
                  <div className="w-8 h-0.5 bg-gold mb-4" />
                  <h3 className="font-serif text-lg text-navy mb-3">
                    {o.metric}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed">
                    {o.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Who it serves */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Who It Serves
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6 leading-snug">
              Grief visits everyone. Our program follows.
            </h2>
            <ul className="space-y-3">
              {serves.map((item, i) => (
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
                Ready to learn more?
              </h3>
              <p className="text-muted mb-6 text-sm leading-relaxed">
                Download our free guide: <em>&ldquo;What Grief Research Actually
                Says, And Why It Changes Everything&rdquo;</em>, and see how
                our three frameworks work together.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/contact"
                  className="bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm text-center"
                >
                  Get the Free Guide
                </Link>
                <Link
                  href="/program/adult"
                  className="border border-card-border text-muted hover:text-navy hover:border-navy/30 px-6 py-3 rounded-md text-sm text-center transition-colors"
                >
                  See the Adult Program →
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
