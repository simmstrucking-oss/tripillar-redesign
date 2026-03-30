import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import type { Metadata } from "next";
import { SiteImage } from "@/components/SiteImage";

export const metadata: Metadata = {
  title: "Youth Program | Live and Grieve Youth™",
  description:
    "A 13-session grief support program for children and teens, offered through schools and youth organizations.",
};

const tracks = [
  {
    name: "Elementary Track",
    ages: "Ages 8–12",
    desc: "Concrete, age-appropriate language and activities. This track uses story, art, and play-based approaches to help younger children understand and express loss in ways that match how they actually process the world.",
    highlights: [
      "Shorter, activity-rich sessions",
      "Caregiver check-ins built in",
      "Story and art-based processing",
    ],
  },
  {
    name: "Middle & High School Track",
    ages: "Ages 13–17",
    desc: "Teens need more than reassurance. They need space to process without performance. This track creates honest, peer-connected dialogue that respects where adolescents actually are.",
    highlights: [
      "Peer-led discussion elements",
      "Identity and meaning explored",
      "Flexible, honest emotional space",
    ],
  },
];

const phases = [
  {
    number: "01",
    title: "Establishing Safety",
    desc: "Sessions 1–2. Building trust within the group, establishing norms, and creating a space where young people know their feelings belong.",
  },
  {
    number: "02",
    title: "Understanding Loss",
    desc: "Sessions 3–5. Age-appropriate frameworks for what grief is and isn't. No timelines. No right answers. Just honest exploration.",
  },
  {
    number: "03",
    title: "Expressing Grief",
    desc: "Sessions 6–8. Activities and prompts that give young people tools to externalize what can feel internal and overwhelming.",
  },
  {
    number: "04",
    title: "Remembering & Honoring",
    desc: "Sessions 9–11. Continuing bonds: maintaining a healthy connection to who was lost, through memory and ritual.",
  },
  {
    number: "05",
    title: "Moving Forward Together",
    desc: "Sessions 12–13. Integration and closure. Celebrating what was shared and building confidence for life going forward.",
  },
];

const orgTypes = [
  {
    icon: "🏫",
    name: "K–12 Schools",
    desc: "School counselors and social workers trained to lead sessions within the school day or after school.",
  },
  {
    icon: "⛪",
    name: "Youth Ministries",
    desc: "Faith communities with existing youth programming, adding structured grief support alongside spiritual care.",
  },
  {
    icon: "🏠",
    name: "Foster & Group Homes",
    desc: "Youth who have experienced placement changes often carry compound grief. This program meets them there.",
  },
  {
    icon: "🤝",
    name: "Community Programs",
    desc: "Boys & Girls Clubs, YMCAs, after-school programs. Organizations already embedded in young people's lives.",
  },
];

export default function YouthProgramPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end pb-16 pt-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 60%, rgba(201,168,76,0.07) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-block bg-gold/10 border border-gold/15 text-gold text-xs px-3 py-1 rounded-full mb-6 font-medium uppercase tracking-widest">
            Youth Program
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            Live and Grieve Youth<sup className="text-2xl ml-0.5">™</sup>
          </h1>
          <p className="text-xl text-muted max-w-2xl leading-relaxed">
            13 age-appropriate sessions designed to help children and teenagers
            navigate loss in the communities where they already belong.
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
              Grief doesn&apos;t check ID at the door.
            </h2>
            <SiteImage src="/images/youth-walking.jpg" alt="Youth walking together" maxWidth={600} />
            <p className="text-muted leading-relaxed mb-4">
              Children and teenagers grieve deeply, but they rarely have
              access to support that actually speaks their language and meets
              them where they are.
            </p>
            <p className="text-muted leading-relaxed mb-4">
              Live and Grieve Youth™ is a 13-session program offered through
              schools, faith communities, foster care systems, and youth
              organizations. It runs in two tracks: one for elementary-age
              children and one for middle and high school students.
            </p>
            <p className="text-muted leading-relaxed">
              Facilitators receive training tailored to working with young
              people. Parents and caregivers are kept informed and supported
              throughout.
            </p>
          </FadeIn>

          <FadeIn delay={150}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Sessions", value: "13" },
                { label: "Age Tracks", value: "2" },
                { label: "Format", value: "Small Group" },
                { label: "Session Length", value: "~60 Min" },
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

      {/* Two tracks */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                Two Tracks
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy">
                Built for how kids actually grieve.
              </h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6">
            {tracks.map((track, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div className="card-hover bg-card-bg border border-card-border shadow-sm rounded-2xl p-8 h-full flex flex-col">
                  <div className="inline-block bg-gold/10 border border-gold/15 text-gold text-xs px-3 py-1 rounded-full mb-4 font-medium">
                    {track.ages}
                  </div>
                  <h3 className="font-serif text-2xl text-navy mb-4">
                    {track.name}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed mb-6 flex-1">
                    {track.desc}
                  </p>
                  <ul className="space-y-2">
                    {track.highlights.map((h, j) => (
                      <li
                        key={j}
                        className="flex items-center gap-2 text-sm text-muted"
                      >
                        <span className="text-gold text-xs">◆</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Program structure */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Program Structure
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy">
              Five phases. One arc.
            </h2>
          </div>
        </FadeIn>

        <div className="max-w-3xl mx-auto space-y-4">
          {phases.map((phase, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full border border-gold/30 flex items-center justify-center">
                  <span className="text-gold text-xs font-bold">{phase.number}</span>
                </div>
                <div className="bg-card-bg border border-card-border rounded-xl p-6 flex-1">
                  <h3 className="font-serif text-lg text-navy mb-2">
                    {phase.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed">
                    {phase.desc}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Who it serves */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                Where It Lives
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy">
                Support where young people already are.
              </h2>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {orgTypes.map((org, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="bg-card-bg border border-card-border shadow-sm rounded-xl p-6 h-full flex flex-col items-center text-center">
                  <div className="text-3xl mb-3">{org.icon}</div>
                  <h3 className="font-serif text-lg text-navy mb-3">
                    {org.name}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed">
                    {org.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Caregiver section */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              For Caregivers
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6 leading-snug">
              You&apos;re part of this too.
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              Parents, guardians, and caregivers are integral to the program.
              We know that when a child is grieving, the adults around them
              often are too.
            </p>
            <p className="text-muted leading-relaxed mb-4">
              Facilitators provide regular updates to caregivers without
              compromising the trust built in sessions. We also offer guidance
              for how to support your child at home: the conversations, the
              rituals, the language that helps.
            </p>
            <p className="text-muted leading-relaxed">
              You don&apos;t have to have the perfect words. You just have to
              be present. We can help with the rest.
            </p>
          </FadeIn>

          <FadeIn delay={150}>
            <div className="bg-card-bg border border-card-border rounded-2xl p-8">
              <h3 className="font-serif text-2xl text-navy mb-4">
                Bring this program to your organization.
              </h3>
              <p className="text-muted mb-6 text-sm leading-relaxed">
                If you work with children or youth and want to offer Live and
                Grieve Youth™, let&apos;s connect. We&apos;ll walk you through
                licensing, training, and what your community will need.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/institutions"
                  className="bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm text-center"
                >
                  Licensing Information
                </Link>
                <Link
                  href="/contact"
                  className="border border-card-border text-muted hover:text-navy hover:border-navy/30 px-6 py-3 rounded-md text-sm text-center transition-colors"
                >
                  Get in Touch
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
