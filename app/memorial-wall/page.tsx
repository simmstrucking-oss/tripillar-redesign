import FadeIn from "@/components/FadeIn";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import MemorialForm from "./MemorialForm";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "Memorial Wall | Tri-Pillars™",
  description:
    "In whose memory Live and Grieve was built. A tribute to those we carry forward.",
  openGraph: {
    title: "Memorial Wall | Tri-Pillars™",
    description:
      "In whose memory Live and Grieve was built. A tribute to those we carry forward.",
    url: "https://tripillarstudio.com/memorial-wall",
    siteName: "Tri-Pillars™",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Memorial Wall | Tri-Pillars™" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Memorial Wall | Tri-Pillars™",
    description:
      "In whose memory Live and Grieve was built. A tribute to those we carry forward.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://tripillarstudio.com/memorial-wall" },
};

export const revalidate = 60; // revalidate every 60s so approvals go live quickly

async function getApprovedEntries() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
    .from("memorial_entries")
    .select("id, name, relationship, tribute")
    .eq("approved", true)
    .order("submitted_at", { ascending: true });

  if (error) {
    console.error("Memorial fetch error:", error);
    return [];
  }
  return data ?? [];
}

export default async function MemorialWallPage() {
  const entries = await getApprovedEntries();

  return (
    <>
      <JsonLd schema={breadcrumbSchema([
        { name: "Home", url: "https://www.tripillarstudio.com" },
        { name: "Memorial Wall", url: "https://www.tripillarstudio.com/memorial-wall" }
      ])} />
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
          {entries.map((person, i) => (
            <FadeIn key={person.id} delay={i * 120}>
              <div className="text-center py-8 border-b border-card-border last:border-0">
                <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-2">
                  {person.name}
                </h2>
                {person.relationship && (
                  <p className="text-muted text-sm mb-1">{person.relationship}</p>
                )}
                {person.tribute && (
                  <p className="text-gold text-sm italic">{person.tribute}</p>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Add a name */}
      <section className="py-24 bg-section-alt">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="text-center mb-10">
              <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
                Add a Name
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-4">
                Honor someone you carry.
              </h2>
              <p className="text-muted leading-relaxed">
                Submit a name to be added to this wall. All submissions are
                reviewed before publishing. Names are added as a tribute — no
                contribution required.
              </p>
            </div>

            <MemorialForm />
          </FadeIn>
        </div>
      </section>
    </>
  );
}
