import FadeIn from "@/components/FadeIn";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Tri-Pillars™",
  description:
    "Wayne and Jamie Simms write about grief, research, and what they are building at Tri-Pillars.",
};

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[40vh] flex items-end pb-16 pt-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 60% 30%, rgba(201,168,76,0.07) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            Blog
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            Writing from{" "}
            <span className="gold-text">Wayne and Jamie.</span>
          </h1>
        </div>
      </section>

      {/* Blog post */}
      <section className="py-24 max-w-3xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <article>
            <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">
              March 2026
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6 leading-snug">
              Why We Stopped Believing in the Five Stages of Grief, and What
              We Built Instead
            </h2>
            <div className="prose prose-lg max-w-none text-muted space-y-5 leading-relaxed">
              <p>
                In 1969, Elisabeth Kübler-Ross published <em>On Death and
                Dying</em>. She described five emotional responses she observed
                in terminally ill patients: denial, anger, bargaining,
                depression, and acceptance. The book was groundbreaking. It gave
                language to something that had been unspeakable.
              </p>
              <p>
                But it was never about bereavement. It was about the
                experience of dying, not the experience of being left behind.
              </p>
              <p>
                Somewhere along the way, those five stages migrated. They became
                the dominant model for understanding grief in popular culture,
                in hospitals, in churches, and in therapist offices. People were
                told they would move through stages in order, arrive at
                acceptance, and be healed.
              </p>
              <p>
                That is not what the research shows.
              </p>
              <p>
                In the decades since, grief researchers like Margaret Stroebe
                and Henk Schut developed the Dual Process Model, which
                describes grief as an oscillation between confronting loss and
                rebuilding daily life. William Worden reframed grief as active
                work, not passive stages. Dennis Klass, Phyllis Silverman, and
                Steven Nickman demonstrated that maintaining a continuing bond
                with the deceased is healthy and normal.
              </p>
              <p>
                None of this is fringe science. These are the models taught in
                graduate programs and cited in peer-reviewed journals. But they
                have not reached the communities that need them most.
              </p>
              <p>
                That is what Live and Grieve is for. We took the best of what
                contemporary research says and built a 52-week, facilitator-led,
                community-based program that meets people where they are. Not
                with a checklist. Not with a timeline. With presence, structure,
                and the conviction that grief deserves better than what most
                people are getting.
              </p>
              <p className="text-navy font-medium">
                Wayne and Jamie Simms are the founders of Tri-Pillars Studio
                and creators of the Live and Grieve™ program.
              </p>
            </div>
          </article>
        </FadeIn>
      </section>
    </>
  );
}
