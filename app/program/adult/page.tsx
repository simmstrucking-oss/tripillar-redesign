import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import type { Metadata } from "next";
import Image from "next/image";
import { SiteImage } from "@/components/SiteImage";

export const metadata: Metadata = {
  title: "Adult Program | Live and Grieve™",
  description:
    "A 52-week, four-book grief program for adults. Structured. Compassionate. Community-based.",
};

const differentiators = [
  {
    title: "Long enough to actually work.",
    desc: "52 weeks reflects what research tells us: grief doesn't wrap up in eight sessions. The program gives participants space to move at a human pace without ever feeling left behind.",
  },
  {
    title: "Built for real facilitators.",
    desc: "You don't need a clinical license to lead this program. We train people already trusted in their communities: chaplains, social workers, community health workers, and others.",
  },
  {
    title: "Grounded in relationship.",
    desc: "The curriculum creates structure, but the transformation happens between people. Small group format ensures every voice matters and no one moves through grief alone.",
  },
];

const books = [
  {
    number: "Q1",
    title: "In The Quiet",
    weeks: "Weeks 1–13",
    desc: "Early grief is often silence and shock. This book meets participants there. It creates language, building trust in the group, and establishing that all of what they're feeling belongs.",
    theme: "Orientation & Acknowledgment",
    icon: "/brand/B_Icon/B_Icon_256px_In_The_Quiet.png",
  },
  {
    number: "Q2",
    title: "Through The Weight",
    weeks: "Weeks 14–26",
    desc: "The middle of grief is heavy. This book supports participants in processing the pain of loss. Learning to move within loss rather than waiting for it to lift.",
    theme: "Processing & Expression",
    icon: "/brand/B_Icon/B_Icon_256px_Through_The_Weight.png",
  },
  {
    number: "Q3",
    title: "Toward The Light",
    weeks: "Weeks 27–39",
    desc: "Grief begins to shift shape. Participants explore how life can continue alongside loss — not instead of it — and start to envision what comes next.",
    theme: "Adaptation & Meaning",
    icon: "/brand/B_Icon/B_Icon_256px_Toward_The_Light.png",
  },
  {
    number: "Q4",
    title: "With The Memory",
    weeks: "Weeks 40–52",
    desc: "Closing well means carrying forward. The final book focuses on maintaining bonds, honoring memory, and integrating grief into a life that continues.",
    theme: "Integration & Legacy",
    icon: "/brand/B_Icon/B_Icon_256px_With_The_Memory.png",
  },
];

const sessionFlow = [
  {
    step: "01",
    title: "Welcome & Grounding",
    desc: "A brief ritual opening that signals this space is safe, consistent, and separate from the rest of the week.",
  },
  {
    step: "02",
    title: "Check-In",
    desc: "Each participant briefly shares where they are. No pressure to be somewhere specific. The check-in builds trust and presence.",
  },
  {
    step: "03",
    title: "Curriculum Engagement",
    desc: "The week's material (reading, reflection prompts, or discussion), worked through together. The facilitator guides, the group discovers.",
  },
  {
    step: "04",
    title: "Open Sharing",
    desc: "Space for participants to respond to what came up. Facilitated but unhurried. This is where the real work often happens.",
  },
  {
    step: "05",
    title: "Closing & Care",
    desc: "A grounding close that honors what was shared and prepares participants to re-enter their week with what they need.",
  },
];

export default function AdultProgramPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end pb-16 pt-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 70% 40%, rgba(201,168,76,0.07) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-block bg-gold/10 border border-gold/15 text-gold text-xs px-3 py-1 rounded-full mb-6 font-medium uppercase tracking-widest">
            Adult Program
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            Live and Grieve<sup className="text-2xl ml-0.5">™</sup>
          </h1>
          <p className="text-xl text-muted max-w-2xl leading-relaxed">
            A 52-week, four-book journey through grief. Structured enough to
            hold you, and spacious enough to move at your own pace.
          </p>
        </div>
      </section>

      {/* Overview */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Program Overview
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6 leading-snug">
              A full year to walk alongside loss.
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              Live and Grieve™ is a 52-week small-group grief support program
              for adults. It runs in four quarterly books, each addressing a
              different dimension of the grief experience.
            </p>
            <p className="text-muted leading-relaxed mb-4">
              Groups meet weekly, guided by a trained facilitator embedded in
              your organization. The program is designed to be sustainable,
              not a one-time event, but an ongoing structure that communities
              can continue to offer year after year.
            </p>
            <p className="text-muted leading-relaxed">
              There&apos;s no clinical requirement to participate. The only
              requirement is showing up.
            </p>
          </FadeIn>

          <FadeIn delay={150}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Duration", value: "52 Weeks" },
                { label: "Format", value: "Small Group" },
                { label: "Books", value: "4 Volumes" },
                { label: "Session Length", value: "~90 Min" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-card-bg border border-card-border rounded-xl p-6 text-center"
                >
                  <div className="font-serif text-3xl text-gold mb-2">
                    {stat.value}
                  </div>
                  <div className="text-muted text-xs uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* What makes it different */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                What Makes It Different
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy">
                Designed for the long road.
              </h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {differentiators.map((d, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="card-hover bg-card-bg border border-card-border shadow-sm rounded-xl p-8 h-full flex flex-col">
                  <div className="w-8 h-0.5 bg-gold mb-4" />
                  <h3 className="font-serif text-xl text-navy mb-3 leading-snug">
                    {d.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed flex-1">
                    {d.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Program structure — 4 books */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Program Structure
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
              Four books. One journey.
            </h2>
            <p className="text-muted max-w-2xl mx-auto">
              Each quarterly book has its own arc, building on what came
              before, preparing for what comes next.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 gap-6">
          {books.map((book, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className={`card-hover bg-card-bg border border-card-border rounded-2xl p-8 h-full flex flex-col book${i + 1}-accent`}>
                <div className="mb-4">
                  <Image src={book.icon} alt={book.title} width={64} height={64} className="w-16 h-16" />
                </div>
                <div className="flex items-start justify-between mb-4">
                  <span className="font-serif text-3xl text-gold/40 font-bold">
                    {book.number}
                  </span>
                  <span className="text-xs text-muted bg-white/5 rounded-full px-3 py-1">
                    {book.weeks}
                  </span>
                </div>
                <h3 className="font-serif text-2xl text-navy mb-1">
                  &ldquo;{book.title}&rdquo;
                </h3>
                <p className="text-gold/60 text-xs uppercase tracking-wider mb-4">
                  {book.theme}
                </p>
                <p className="text-muted text-sm leading-relaxed flex-1">
                  {book.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Session flow */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                A Typical Session
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-8">
                Structure creates safety.
              </h2>
              <SiteImage src="/images/group-session-circle.jpg" alt="Live and Grieve™ group session in circle" maxWidth={600} />
            </div>
          </FadeIn>

          <div className="max-w-3xl mx-auto space-y-4">
            {sessionFlow.map((step, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full border border-gold/30 flex items-center justify-center">
                    <span className="text-gold text-xs font-bold">{step.step}</span>
                  </div>
                  <div className="bg-card-bg border border-card-border shadow-sm rounded-xl p-6 flex-1">
                    <h3 className="font-serif text-lg text-navy mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted text-sm leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Solo Companion CTA */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="rounded-2xl bg-card-bg border border-card-border p-10 md:p-16 shadow-sm">
            <div className="max-w-2xl">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                The Solo Companion
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-3 leading-snug">
                Can&apos;t join a group right now?
              </h2>
              <p className="text-xl text-muted mb-6 leading-relaxed">
                Work through Book 1 on your own.
              </p>
              <p className="text-muted leading-relaxed mb-8">
                The Solo Companion is a self-guided digital version of Live
                and Grieve™ Book 1. 13 weeks. All the curriculum. At your own
                pace.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <a
                  href="https://solo.tripillarstudio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gold text-white font-semibold px-8 py-3.5 rounded-md hover:bg-gold-light transition-colors text-sm"
                >
                  Start the Solo Companion
                </a>
              </div>
              <p className="text-muted text-sm mt-5">
                Have a facilitator code?{" "}
                <span className="text-navy">
                  Access is included with your group.
                </span>
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Large Print note */}
      <div className="pb-4 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <p className="text-muted text-xs text-center">
            Large Print editions of the Live and Grieve™ participant workbook are available on{" "}
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

      {/* CTA */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div
            className="rounded-2xl border border-gold/15 p-10 md:p-16 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(245,243,239,0.9) 100%)",
            }}
          >
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
              Ready to bring Live and Grieve™ to your community?
            </h2>
            <p className="text-muted max-w-xl mx-auto mb-8 leading-relaxed">
              Whether you&apos;re an organization looking to license the
              program or someone hoping to find a group near you,
              we&apos;d love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/institutions"
                className="bg-gold text-white font-semibold px-8 py-3.5 rounded-md hover:bg-gold-light transition-colors text-sm"
              >
                For Organizations
              </Link>
              <Link
                href="/contact"
                className="border border-card-border text-muted hover:text-navy hover:border-navy/30 px-8 py-3.5 rounded-md text-sm transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
