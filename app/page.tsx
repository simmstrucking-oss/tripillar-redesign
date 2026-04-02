import Image from "next/image";
import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import PublicMetricsSection from "@/components/PublicMetricsSection";
import { SiteImage } from "@/components/SiteImage";

const differentiators = [
  {
    icon: "◈",
    title: "Rooted in Research",
    desc: "Six peer-reviewed frameworks guide everything we do — three theoretical frameworks that structure the program arc (Dual Process Model, Worden's Tasks of Mourning, Continuing Bonds) and three applied practice frameworks that shape every session (Meaning Reconstruction, Self-Compassion, Companioning). Not the five stages.",
  },
  {
    icon: "◈",
    title: "Community First",
    desc: "We partner with organizations people already trust. Grief support shows up where people already feel safe, not in an unfamiliar office across town.",
  },
  {
    icon: "◈",
    title: "Facilitator-Led",
    desc: "Trained facilitators bring structure and presence. No clinical license required. Just people who care and know how to hold space.",
  },
];

const programs = [
  {
    name: "Live and Grieve™",
    sub: "Adult Program",
    desc: "A year-long, four-book program for adults walking through loss. Weekly small groups, trained facilitators, and a pace that respects where you actually are.",
    href: "/program/adult",
    badge: "52 Weeks",
    external: false,
    linkText: "Learn more",
    icon: "/brand/B_Icon/B_Icon_256px_In_The_Quiet.png",
  },
  {
    name: "Live and Grieve Youth™",
    sub: "Youth Program",
    desc: "13 sessions for children and teens, offered through schools and youth organizations. Two age tracks, designed for how young people actually process grief.",
    href: "/program/youth",
    badge: "13 Sessions",
    external: false,
    linkText: "Learn more",
    icon: "/brand/B_Icon/B_Icon_256px_Through_The_Weight.png",
  },
  {
    name: "The Solo Companion",
    sub: "Self-Guided",
    desc: "The complete Book 1 experience, self-guided and on your schedule. For individuals who can't access a group or want to begin now.",
    href: "https://solo.tripillarstudio.com",
    badge: "13 Weeks, Self-Guided",
    external: true,
    linkText: "Begin now",
    icon: "/brand/B_Icon/B_Icon_256px_Toward_The_Light.png",
  },
];

const partners = [
  { icon: "🏛", label: "Schools & Universities" },
  { icon: "⛪", label: "Faith Communities" },
  { icon: "🏥", label: "Healthcare Systems" },
  { icon: "💼", label: "Workplace Programs" },
  { icon: "🤝", label: "Community Action Centers" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-section-alt">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(184,148,47,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(184,148,47,0.04) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center pt-24 pb-20">
          <div style={{ maxWidth: 'clamp(200px, 90vw, 280px)', margin: '0 auto 2rem' }}>
            <Image
              src="/brand/A_Stacked/A_Stacked_Large_Toward_The_Light_transparent.png"
              alt="Live and Grieve™ — Tri-Pillars LLC"
              width={280}
              height={280}
              className="w-full h-auto"
              priority
            />
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-navy leading-tight mb-6">
            You&apos;re not <br />
            <span className="gold-text">grieving wrong.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Grief isn&apos;t a problem to fix. It&apos;s something you carry. Our
            programs give communities the tools to walk alongside loss,
            together, for as long as it takes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/free-guide"
              className="bg-gold text-white font-semibold px-8 py-3.5 rounded-md hover:bg-gold-light transition-colors text-sm"
            >
              Download the Free Guide
            </Link>
            <Link
              href="/program/adult"
              className="border border-card-border text-muted hover:text-navy hover:border-navy/30 font-medium px-8 py-3.5 rounded-md transition-colors text-sm"
            >
              Explore Programs
            </Link>
          </div>
        </div>


      </section>

      {/* Why grief models fail */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              The Problem
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-navy mb-6 leading-snug">
              The five stages were never meant to be a roadmap.
            </h2>
            <p className="text-muted text-lg leading-relaxed">
              Elisabeth Kübler-Ross wrote those stages for people facing
              their <em>own</em> death, not for the people left behind. Decades
              later, we&apos;re still handing grieving people a checklist and
              wondering why they feel stuck.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              heading: "There's no timeline.",
              body: "No finish line, no expiration date. You don't outgrow love, and you don't outgrow the missing.",
            },
            {
              heading: "Silence makes it worse.",
              body: "When communities don't have language for grief, people carry it alone. That isolation compounds everything.",
            },
            {
              heading: "One size fits nobody.",
              body: "Kids grieve differently than adults. Culture matters. Support that ignores the person isn't really support.",
            },
          ].map((item, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="bg-card-bg border border-card-border rounded-xl p-6 h-full shadow-sm">
                <h3 className="font-serif text-xl text-navy mb-3 leading-snug">
                  {item.heading}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {item.body}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* What this program is */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                What We Do
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-navy mb-6 leading-snug">
                Grief support built for real life.
              </h2>
              <SiteImage src="/images/grief-support-circle.jpg" alt="Grief support circle gathering" maxWidth={600} />
              <p className="text-muted leading-relaxed mb-4">
                Live and Grieve™ brings structured, research-backed grief support
                into the places people already trust: schools, churches,
                hospitals, workplaces, community centers.
              </p>
              <p className="text-muted leading-relaxed mb-8">
                We train local facilitators to lead the program. They bring
                the presence. We provide the structure. What comes out of that
                feels human, because it is.
              </p>
              <Link
                href="/our-approach"
                className="inline-flex items-center gap-2 text-gold text-sm font-medium hover:gap-3 transition-all"
              >
                Read about our approach <span>→</span>
              </Link>
            </FadeIn>

            <FadeIn delay={150}>
              <blockquote className="bg-white border border-card-border border-l-4 border-l-gold/40 rounded-2xl p-8 relative shadow-sm">
                <div className="text-gold/30 font-serif text-6xl leading-none absolute top-4 left-6">
                  &ldquo;
                </div>
                <p className="font-serif text-xl text-navy leading-relaxed mb-6 mt-4 relative z-10">
                  Your presence is the medicine. The curriculum is the
                  structure. Together, that&apos;s where transformation happens.
                </p>
                <footer className="flex items-center gap-3">
                  <div className="w-8 h-px bg-gold/40" />
                  <cite className="text-gold-light text-sm font-medium not-italic">
                    Wayne &amp; Jamie Simms
                  </cite>
                </footer>
              </blockquote>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* YouTube Embed */}
      <section className="py-16 bg-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif text-navy mb-4">Hear from our founders</h2>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '12px', overflow: 'hidden' }}>
            <iframe
              src="https://www.youtube.com/embed/H-zcSdzm9jg?rel=0&modestbranding=1"
              title="Live and Grieve™ — founders introduction"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </section>

      {/* What makes it different */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              What Sets Us Apart
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy">
              Different by design.
            </h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {differentiators.map((item, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="card-hover bg-card-bg border border-card-border rounded-xl p-8 h-full flex flex-col shadow-sm">
                <div className="text-gold text-2xl mb-4">{item.icon}</div>
                <h3 className="font-serif text-xl text-navy mb-3">
                  {item.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed flex-1">
                  {item.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Two programs */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                The Programs
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy">
                For every stage of life.
              </h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {programs.map((p, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="card-hover bg-card-bg border border-card-border rounded-2xl p-8 h-full flex flex-col shadow-sm">
                  <div className="mb-4">
                    <Image src={p.icon} alt={p.name} width={64} height={64} className="w-16 h-16" />
                  </div>
                  <div className="inline-block bg-gold/10 text-gold text-xs font-semibold px-3 py-1 rounded-full mb-4 w-fit">
                    {p.badge}
                  </div>
                  <h3 className="font-serif text-2xl text-navy mb-1">
                    {p.name}
                  </h3>
                  <p className="text-muted text-sm mb-4">{p.sub}</p>
                  <p className="text-muted leading-relaxed mb-6 flex-1">
                    {p.desc}
                  </p>
                  {p.external ? (
                    <a
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-gold text-sm font-medium hover:gap-3 transition-all"
                    >
                      {p.linkText} <span>→</span>
                    </a>
                  ) : (
                    <Link
                      href={p.href}
                      className="inline-flex items-center gap-2 text-gold text-sm font-medium hover:gap-3 transition-all"
                    >
                      {p.linkText} <span>→</span>
                    </Link>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={300}>
            <p className="text-center text-muted text-xs mt-8">
              Large Print editions of the participant workbook are available on{" "}
              <a
                href="https://www.amazon.com/s?k=live+and+grieve+tri-pillars"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                Amazon
              </a>
              .
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Solo Companion feature */}
      <section className="py-24 bg-navy bg-texture">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <p className="text-gold text-xs uppercase tracking-widest mb-5 font-medium">
                The Solo Companion
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                Grief doesn&apos;t wait for a group to form.
              </h2>
              <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                The Solo Companion brings the full Live and Grieve™ Book 1 experience to your phone, your pace, your time.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="grid sm:grid-cols-3 gap-6 mb-12">
              {[
                { icon: "📖", text: "13 weeks of structured grief curriculum" },
                { icon: "✍️", text: "Journal, tracker, and weekly reflections" },
                { icon: "🤝", text: "Crisis resources always one tap away" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-6">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <p className="text-white/80 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="text-center">
              <p className="text-gold font-semibold text-lg mb-6">
                Start for $24.99 — or three payments of $9.99.
              </p>
              <a
                href="https://solo.tripillarstudio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-gold text-white font-bold px-10 py-4 rounded-md hover:bg-gold-light transition-colors text-base mb-6"
              >
                Begin Book 1 Today
              </a>
              <p className="text-white/50 text-sm">
                In a facilitated group? Ask your facilitator for your access code.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Partner organizations */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Who We Partner With
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
              Grief belongs in community.
            </h2>
            <p className="text-muted max-w-xl mx-auto">
              We bring Live and Grieve™ to the organizations where people already
              feel safe.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="flex flex-wrap justify-center gap-4">
            {partners.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 bg-card-bg border border-card-border rounded-full px-5 py-2.5 text-sm text-charcoal shadow-sm"
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="text-center mt-10">
            <Link
              href="/institutions"
              className="inline-flex items-center gap-2 border border-card-border text-muted hover:text-navy hover:border-navy/30 px-6 py-3 rounded-md text-sm transition-colors"
            >
              Partner with us →
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* Program Reach — live metrics (SSR + count-up) */}
      {/* showMetrics={false} — change to true when ready to display real data */}
      {false && <PublicMetricsSection />}

      {/* Founders story */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <SiteImage src="/images/wayne-jamie-outdoors.jpg" alt="Wayne and Jamie Simms with community partners" maxWidth={400} />
            </FadeIn>

            <FadeIn delay={150}>
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                Our Story
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6 leading-snug">
                Born from loss. Built for community.
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                Wayne and Jamie Simms didn&apos;t plan to build a grief
                program. They were just trying to survive their own. They lost
                their son Jacoby and their nephew Ian.
              </p>
              <p className="text-muted leading-relaxed mb-4">
                What they found wasn&apos;t enough. The resources felt clinical.
                The timelines were unrealistic. The language was cold. They
                wanted something warmer, something that told the truth: grief
                and life happen at the same time, not one after the other.
              </p>
              <p className="text-muted leading-relaxed mb-8">
                Live and Grieve™ is what they built. Not to replace professional
                care, but to create the kind of steady, community-rooted support
                that makes healing possible in the spaces between.
              </p>
              <div className="flex flex-wrap gap-4 mt-2">
                <Link
                  href="/our-approach"
                  className="inline-flex items-center gap-2 text-gold text-sm font-medium hover:gap-3 transition-all"
                >
                  All six frameworks →
                </Link>
                <Link
                  href="/grief-education"
                  className="inline-flex items-center gap-2 text-gold/70 text-sm font-medium hover:text-gold hover:gap-3 transition-all"
                >
                  What is grief education? →
                </Link>
                <Link
                  href="/dual-process-model"
                  className="inline-flex items-center gap-2 text-gold/70 text-sm font-medium hover:text-gold hover:gap-3 transition-all"
                >
                  The Dual Process Model →
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Free guide CTA */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="rounded-2xl bg-section-alt border border-card-border p-10 md:p-16 text-center relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                Free Resource
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
                What Grief Research Actually Says
              </h2>
              <p className="text-muted max-w-xl mx-auto mb-8 leading-relaxed">
                And why it changes everything. A free guide from the founders of
                Live and Grieve™ on the science behind a better way to support
                people through loss.
              </p>
              <Link
                href="/free-guide"
                className="inline-block bg-gold text-white font-semibold px-8 py-3.5 rounded-md hover:bg-gold-light transition-colors text-sm"
              >
                Get the Free Guide
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
