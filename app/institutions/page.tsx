import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import type { Metadata } from "next";
import { SiteImage } from "@/components/SiteImage";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "For Institutions | Live and Grieve™",
  description:
    "License Live and Grieve™ for your organization. Train your facilitators. Offer sustainable grief support to your community.",
  openGraph: {
    title: "For Institutions | Live and Grieve™",
    description:
      "License Live and Grieve™ for your organization. Train your facilitators. Offer sustainable grief support to your community.",
    url: "https://www.tripillarstudio.com/institutions",
    siteName: "Tri-Pillars™",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "For Institutions | Live and Grieve™" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "For Institutions | Live and Grieve™",
    description:
      "License Live and Grieve™ for your organization. Train your facilitators. Offer sustainable grief support to your community.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://www.tripillarstudio.com/institutions" },
};

const orgTypes = [
  {
    icon: "🏥",
    name: "Healthcare Systems",
    desc: "Hospitals, hospices, and integrated care networks looking to extend grief support beyond discharge, for patients, families, and staff.",
  },
  {
    icon: "⛪",
    name: "Faith Communities",
    desc: "Churches, synagogues, mosques, and other congregations wanting to offer structured, evidence-informed grief support alongside spiritual care.",
  },
  {
    icon: "🏛",
    name: "Schools & Universities",
    desc: "Educational institutions responding to student loss, providing lasting support structures rather than one-time crisis response.",
  },
  {
    icon: "💼",
    name: "Employers & Workplaces",
    desc: "Organizations investing in employee wellbeing, recognizing that grief affects performance, retention, and culture.",
  },
];

const included = [
  {
    title: "Full Curriculum Access",
    desc: "Access to all program materials: books, session guides, facilitator handbooks, and participant resources for all licensed programs.",
  },
  {
    title: "Facilitator Training",
    desc: "Comprehensive training for the people you designate to lead sessions. No clinical license required. We train for presence and process.",
  },
  {
    title: "Implementation Support",
    desc: "Guidance as you launch and sustain the program, from initial setup through your first full cohort.",
  },
  {
    title: "Community of Practice",
    desc: "Access to our facilitator network for shared learning, peer support, and updates as the program evolves.",
  },
];

const tiers = [
  {
    name: "Community",
    price: "Contact for Pricing",
    desc: "For community organizations, faith communities, and nonprofits ready to run ongoing cohorts and build internal capacity.",
    includes: [
      "Up to 2 facilitators trained",
      "Adult or youth program",
      "Full curriculum access",
      "Implementation support",
    ],
    highlight: false,
  },
  {
    name: "Standard Organization",
    price: "Contact for Pricing",
    desc: "For healthcare systems, schools, and mid-size organizations running both adult and youth programs.",
    includes: [
      "Up to 4 facilitators trained",
      "Adult and youth programs",
      "Annual curriculum updates",
      "Quarterly support calls",
      "Facilitator Hub access",
    ],
    highlight: true,
  },
  {
    name: "Multi-Site",
    price: "Contact for Pricing",
    desc: "For larger systems or networks embedding grief support across multiple sites or divisions.",
    includes: [
      "Unlimited facilitator training",
      "Multi-site deployment",
      "Custom onboarding",
      "Dedicated support contact",
      "Co-branding options available",
    ],
    highlight: false,
  },
];

const steps = [
  {
    number: "01",
    title: "Reach Out",
    desc: "Tell us about your organization and the community you serve. We&apos;ll schedule a conversation to understand your needs and goals.",
  },
  {
    number: "02",
    title: "Determine Fit",
    desc: "Together, we&apos;ll figure out which program tier and which tracks (adult, youth, or both) are the right starting point for your context.",
  },
  {
    number: "03",
    title: "Train Your Facilitators",
    desc: "Your designated facilitators complete our training program. We give them everything they need: the curriculum, the skills, and the confidence.",
  },
  {
    number: "04",
    title: "Launch Your First Cohort",
    desc: "You open the program to your community. We stay close as you get started, offering support and answering questions along the way.",
  },
];

export default function InstitutionsPage() {
  return (
    <>
      <JsonLd schema={breadcrumbSchema([
        { name: "Home", url: "https://www.tripillarstudio.com" },
        { name: "Institutions", url: "https://www.tripillarstudio.com/institutions" }
      ])} />
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end pb-16 pt-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(201,168,76,0.07) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            For Organizations
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            Bring Live and Grieve<sup className="text-2xl ml-0.5">™</sup> to
            your organization.
          </h1>
          <p className="text-xl text-muted max-w-2xl leading-relaxed">
            Train your people. Serve your community. Build the kind of
            sustained grief support that makes a real difference.
          </p>
        </div>
      </section>

      {/* Who it serves */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Who We Work With
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-8">
              Built for organizations that serve people.
            </h2>
            <SiteImage src="/images/wayne-jamie-table.jpg" alt="Wayne and Jamie Simms meeting with institutional partners" maxWidth={600} />
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {orgTypes.map((org, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="card-hover bg-card-bg border border-card-border rounded-xl p-6 h-full flex flex-col">
                <div className="text-3xl mb-3">{org.icon}</div>
                <h3 className="font-serif text-lg text-navy mb-3">
                  {org.name}
                </h3>
                <p className="text-muted text-sm leading-relaxed flex-1">
                  {org.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* What you receive */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                What&apos;s Included
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy">
                Everything you need to get started and keep going.
              </h2>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-6">
            {included.map((item, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="flex gap-5 items-start bg-card-bg border border-card-border shadow-sm rounded-xl p-6">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
                      <span className="text-gold text-xs">✓</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-navy mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Licensing tiers */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Licensing
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
              Start where it makes sense.
            </h2>
            <p className="text-muted max-w-xl mx-auto">
              All licensing starts with a conversation. We want to understand your
              context before making a recommendation. Pricing is intentionally
              accessible, especially for nonprofits.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div
                className={`card-hover rounded-2xl p-8 h-full flex flex-col border ${
                  tier.highlight
                    ? "bg-gold/5 border-gold/30"
                    : "bg-card-bg border-card-border"
                }`}
              >
                {tier.highlight && (
                  <div className="inline-block bg-gold/10 text-gold text-xs px-3 py-1 rounded-full mb-4 font-medium w-fit">
                    Most Popular
                  </div>
                )}
                <h3 className="font-serif text-2xl text-navy mb-2">
                  {tier.name}
                </h3>
                <p className="text-gold/70 text-xs mb-4">{tier.price}</p>
                <p className="text-muted text-sm leading-relaxed mb-6">
                  {tier.desc}
                </p>
                <ul className="space-y-2.5 flex-1 mb-8">
                  {tier.includes.map((item, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-muted"
                    >
                      <span className="text-gold text-xs mt-0.5 flex-shrink-0">◆</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className={`text-center px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                    tier.highlight
                      ? "bg-gold text-white hover:bg-gold-light"
                      : "border border-card-border text-muted hover:text-navy hover:border-navy/30"
                  }`}
                >
                  Contact Us
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* How to get started */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                Getting Started
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy">
                Four steps to your first cohort.
              </h2>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border border-gold/30 flex items-center justify-center mx-auto mb-4">
                    <span className="text-gold text-sm font-bold">{step.number}</span>
                  </div>
                  <h3 className="font-serif text-lg text-navy mb-3">
                    {step.title}
                  </h3>
                  <p
                    className="text-muted text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: step.desc }}
                  />
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Youth section */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                Youth Program Licensing
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6 leading-snug">
                Extend support to the young people in your community.
              </h2>
              <p className="text-muted leading-relaxed mb-4">
                Live and Grieve Youth™ can be added to any institutional
                license. Schools, faith communities, and youth organizations
                often find both tracks (elementary and middle/high school)
                serve different populations within their community.
              </p>
              <p className="text-muted leading-relaxed mb-8">
                Youth program facilitation includes specialized training on
                working with children and adolescents in grief, caregiver
                communication, and age-appropriate group facilitation.
              </p>
              <Link
                href="/program/youth"
                className="inline-flex items-center gap-2 text-gold text-sm font-medium hover:gap-3 transition-all"
              >
                Learn about the youth program →
              </Link>
            </div>

            <div className="bg-card-bg border border-card-border rounded-2xl p-8">
              <h3 className="font-serif text-2xl text-navy mb-6">
                Ready to talk?
              </h3>
              <p className="text-muted mb-6 text-sm leading-relaxed">
                The best next step is a conversation. Tell us about your
                organization and we&apos;ll figure out together what makes sense.
              </p>
              <Link
                href="/contact"
                className="block bg-gold text-white font-semibold px-6 py-3.5 rounded-md hover:bg-gold-light transition-colors text-sm text-center"
              >
                Schedule a Conversation
              </Link>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
