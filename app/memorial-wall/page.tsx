import FadeIn from "@/components/FadeIn";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Memorial Wall | Tri-Pillars™",
  description:
    "In whose memory Live and Grieve was built. A tribute to those we carry forward.",
};

const names = [
  { name: "Jacoby Gray", note: "In whose memory it all began" },
  { name: "Ian Hornagold", note: "Who made the work urgent" },
  { name: "Nan Simms", note: null },
  { name: "Pamela Jo Haycraft", note: null },
];

export default function MemorialWallPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end pb-16 pt-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(201,168,76,0.05) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            Memorial Wall
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            In whose memory{" "}
            <span className="gold-text">Live and Grieve was built.</span>
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            These are the people who made this work necessary. We carry them
            forward in every session, every workbook, every conversation.
          </p>
        </div>
      </section>

      {/* Names */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="space-y-8">
          {names.map((person, i) => (
            <FadeIn key={i} delay={i * 120}>
              <div className="text-center py-8 border-b border-card-border last:border-0">
                <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-2">
                  {person.name}
                </h2>
                {person.note && (
                  <p className="text-gold text-sm italic">{person.note}</p>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Add a name */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Add a Name
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6">
              Honor someone you carry.
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              Contributions of $50 or more add a name and optional photo to
              this wall. Every contribution goes directly toward expanding
              access to Live and Grieve programs.
            </p>
            <p className="text-muted text-sm mb-8">
              To add a name, email{" "}
              <a href="mailto:wayne@tripillarstudio.com" className="text-gold hover:underline">
                wayne@tripillarstudio.com
              </a>{" "}
              with the name, an optional photo, and your contribution receipt.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/support"
                className="inline-block bg-gold text-white font-semibold px-8 py-3.5 rounded-md hover:bg-gold-light transition-colors text-sm"
              >
                Support the Mission
              </Link>
              <Link
                href="/contact"
                className="inline-block border border-card-border text-muted hover:text-navy hover:border-navy/30 px-8 py-3.5 rounded-md text-sm transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
