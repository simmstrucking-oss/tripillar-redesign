import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "The Dual Process Model of Grief Explained | Live and Grieve™",
  description:
    "The Dual Process Model (Stroebe & Schut) is one of the three theoretical frameworks that structure the Live and Grieve™ program arc. Live and Grieve™ draws on five research frameworks and the Wolfelt companioning philosophical influence.",
};

export default function DualProcessModelPage() {
  return (
    <>
      <JsonLd schema={breadcrumbSchema([
        { name: "Home", url: "https://www.tripillarstudio.com" },
        { name: "Dual Process Model", url: "https://www.tripillarstudio.com/dual-process-model" }
      ])} />
      {/* Hero */}
      <section className="relative min-h-[55vh] flex items-end pb-16 pt-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 60% 30%, rgba(201,168,76,0.07) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            One of the three theoretical frameworks that structure the Live and Grieve™ program arc
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            The Dual Process Model of grief.
          </h1>
          <p className="text-xl text-muted max-w-2xl leading-relaxed">
            Grief does not move in stages. It oscillates. Stroebe &amp; Schut, 1999.
          </p>
        </div>
      </section>

      {/* What it is */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6">
            What the Dual Process Model says.
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            Developed by Margaret Stroebe and Henk Schut in 1999, the Dual Process Model (DPM) proposes that grief does not move in a linear sequence of stages. Instead, bereaved people naturally oscillate between two orientations — and that oscillation is not a sign of dysfunction. It is grief working correctly.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            <strong className="text-navy">Loss-oriented coping</strong> involves focusing on the loss itself — crying, thinking about the person who died, processing the pain of what happened. This is what most people picture when they think about grief.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            <strong className="text-navy">Restoration-oriented coping</strong> involves focusing on the secondary consequences of loss — taking on new roles, navigating life changes, finding distraction, attending to the daily demands of living. This is not avoidance. It is necessary.
          </p>
          <p className="text-muted leading-relaxed">
            The DPM holds that oscillation between these two orientations is adaptive. People naturally move back and forth — sometimes in the same day. There is no right amount of time to spend in either. There is no correct sequence.
          </p>
        </FadeIn>
      </section>

      {/* Why it matters */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl sm:text-4xl text-navy">
                Why the DPM changes how we support grief.
              </h2>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                heading: "It ends the pressure to 'move on'",
                body: "If grief is oscillating — not progressing — there is no destination called 'over it.' The DPM gives people permission to carry grief and live at the same time. That is not failure. That is how it works.",
              },
              {
                heading: "It explains why grief comes in waves",
                body: "People often feel confused or frightened when grief returns after a period of relative calm. The DPM explains this as normal oscillation — not regression. Understanding that reframes the experience entirely.",
              },
              {
                heading: "It validates restoration-oriented coping",
                body: "Taking a break from grief — laughing, working, planning — is not disloyal to the person who died. The DPM names it as healthy and necessary. That distinction matters enormously to grieving people who feel guilty for having good days.",
              },
              {
                heading: "It applies to every kind of loss",
                body: "The DPM was developed for bereavement but applies to all significant loss — relationships, health, roles, community. The oscillating pattern appears across loss types, which is why Live and Grieve™ uses it as a foundational framework.",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="bg-card-bg border border-card-border rounded-xl p-8">
                  <div className="w-8 h-0.5 bg-gold mb-4" />
                  <h3 className="font-serif text-xl text-navy mb-3">{item.heading}</h3>
                  <p className="text-muted leading-relaxed">{item.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Six frameworks context */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <h2 className="font-serif text-3xl text-navy mb-6">
            One of five research frameworks, plus Wolfelt companioning philosophy.
          </h2>
          <p className="text-muted leading-relaxed mb-6">
            Live and Grieve™ draws on five research frameworks and the Wolfelt companioning philosophical influence.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-card-bg border border-card-border rounded-xl p-6">
              <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">Layer 1 — Theoretical</p>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex gap-2"><span className="text-gold">◆</span><span><strong className="text-navy">Dual Process Model</strong> — Stroebe &amp; Schut</span></li>
                <li className="flex gap-2"><span className="text-gold">◆</span><span>Tasks of Mourning — Worden</span></li>
                <li className="flex gap-2"><span className="text-gold">◆</span><span>Continuing Bonds Theory — Klass, Silverman &amp; Nickman</span></li>
              </ul>
            </div>
            <div className="bg-card-bg border border-card-border rounded-xl p-6">
              <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">Layer 2 — Applied Practice</p>
              <ul className="space-y-2 text-sm text-muted">
                <li className="flex gap-2"><span className="text-gold">◆</span><span>Meaning Reconstruction — Neimeyer</span></li>
                <li className="flex gap-2"><span className="text-gold">◆</span><span>Self-Compassion — Neff</span></li>
                <li className="flex gap-2"><span className="text-gold">◆</span><span>Companioning the Bereaved — Wolfelt</span></li>
              </ul>
            </div>
          </div>
          <Link href="/our-approach" className="text-gold text-sm font-medium hover:underline">
            Learn about all five frameworks and the companioning philosophy →
          </Link>
        </FadeIn>
      </section>

      {/* Solo CTA */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Experience It
            </p>
            <h2 className="font-serif text-3xl text-navy mb-4">
              The program built on this research.
            </h2>
            <p className="text-muted mb-8 leading-relaxed">
              &ldquo;The 7 Things Nobody Tells You About Grief&rdquo; — free from Wayne and Jamie Simms. Includes the Dual Process Model and all five research frameworks in plain language. No group near you? Start at solo.tripillarstudio.com — $24.99 or three payments of $9.99.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/free-guide"
                className="bg-gold text-white font-semibold px-8 py-3 rounded-md hover:bg-gold-light transition-colors text-sm"
              >
                Download the Free Guide
              </Link>
              <Link
                href="https://solo.tripillarstudio.com"
                className="border border-card-border text-muted hover:text-navy hover:border-navy/30 px-8 py-3 rounded-md text-sm transition-colors"
              >
                Solo Companion — $24.99 →
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
