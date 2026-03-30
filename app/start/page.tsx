"use client";

import Link from "next/link";

export default function StartPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F8F4EE", fontFamily: "Inter, sans-serif" }}>

      {/* Minimal header — logo only */}
      <header style={{ background: "#1c3028", padding: "1rem 1.5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Link href="/" style={{ fontFamily: "'Playfair Display', serif", color: "#B8942F", fontWeight: 700, fontSize: "1.15rem", textDecoration: "none", letterSpacing: "-0.01em" }}>
            Tri&#8209;Pillars<sup style={{ fontSize: "0.65rem", verticalAlign: "super" }}>™</sup> Studio
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: "#1c3028", padding: "4rem 1.5rem 3.5rem" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "#B8942F", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
            Live and Grieve™
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#F8F4EE", fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 700, lineHeight: 1.15, marginBottom: "1.25rem" }}>
            You don&apos;t have to carry this alone.
          </h1>
          <p style={{ color: "rgba(248,244,238,0.75)", fontSize: "1.05rem", lineHeight: 1.65, maxWidth: 560, margin: "0 auto" }}>
            Live and Grieve™ brings structured, research-backed grief support to people and communities. Find your path below.
          </p>
        </div>
      </section>

      {/* Three path cards */}
      <section style={{ padding: "3rem 1.5rem", flex: 1 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>

          {/* Card 1 — I'm grieving */}
          <div style={{ background: "#fff", border: "1px solid #e2ddd6", borderRadius: 12, padding: "2rem", display: "flex", flexDirection: "column" }}>
            <p style={{ color: "#B8942F", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              I&apos;m grieving
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#1c3028", fontSize: "1.35rem", fontWeight: 700, lineHeight: 1.3, marginBottom: "0.85rem" }}>
              For individuals
            </h2>
            <p style={{ color: "#5a5a6a", fontSize: "0.9rem", lineHeight: 1.65, marginBottom: "1.75rem", flex: 1 }}>
              Start the Solo Companion — 13 weeks of structured grief support at your own pace.
            </p>
            <a
              href="https://solo.tripillarstudio.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", background: "#1c3028", color: "#F8F4EE", fontWeight: 700, fontSize: "0.9rem", textAlign: "center", padding: "0.85rem 1rem", borderRadius: 7, textDecoration: "none", marginBottom: "0.85rem", transition: "opacity 0.2s" }}
            >
              Begin for $24.99
            </a>
            <a
              href="/program/adult"
              style={{ display: "block", textAlign: "center", color: "#B8942F", fontSize: "0.82rem", textDecoration: "none", fontWeight: 500 }}
            >
              Looking for a group? Learn more →
            </a>
          </div>

          {/* Card 2 — I lead an organization */}
          <div style={{ background: "#fff", border: "1px solid #e2ddd6", borderRadius: 12, padding: "2rem", display: "flex", flexDirection: "column" }}>
            <p style={{ color: "#B8942F", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              I lead an organization
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#1c3028", fontSize: "1.35rem", fontWeight: 700, lineHeight: 1.3, marginBottom: "0.85rem" }}>
              For communities
            </h2>
            <p style={{ color: "#5a5a6a", fontSize: "0.9rem", lineHeight: 1.65, marginBottom: "1.75rem", flex: 1 }}>
              Bring Live and Grieve™ to your community. Train your people. Serve those who are grieving.
            </p>
            <a
              href="/contact?inquiry_type=institution"
              style={{ display: "block", background: "#1c3028", color: "#F8F4EE", fontWeight: 700, fontSize: "0.9rem", textAlign: "center", padding: "0.85rem 1rem", borderRadius: 7, textDecoration: "none", marginBottom: "0.85rem" }}
            >
              Talk to us
            </a>
            <a
              href="/free-guide"
              style={{ display: "block", textAlign: "center", color: "#B8942F", fontSize: "0.82rem", textDecoration: "none", fontWeight: 500 }}
            >
              Download the free guide →
            </a>
          </div>

          {/* Card 3 — I want to facilitate */}
          <div style={{ background: "#fff", border: "1px solid #e2ddd6", borderRadius: 12, padding: "2rem", display: "flex", flexDirection: "column" }}>
            <p style={{ color: "#B8942F", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              I want to facilitate
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#1c3028", fontSize: "1.35rem", fontWeight: 700, lineHeight: 1.3, marginBottom: "0.85rem" }}>
              For facilitators
            </h2>
            <p style={{ color: "#5a5a6a", fontSize: "0.9rem", lineHeight: 1.65, marginBottom: "1.75rem", flex: 1 }}>
              Become a certified Live and Grieve™ facilitator. No clinical license required. Just the willingness to show up.
            </p>
            <Link
              href="/facilitators"
              style={{ display: "block", background: "#1c3028", color: "#F8F4EE", fontWeight: 700, fontSize: "0.9rem", textAlign: "center", padding: "0.85rem 1rem", borderRadius: 7, textDecoration: "none", marginBottom: "0.85rem" }}
            >
              Learn about certification
            </Link>
            <Link
              href="/contact"
              style={{ display: "block", textAlign: "center", color: "#B8942F", fontSize: "0.82rem", textDecoration: "none", fontWeight: 500 }}
            >
              Contact us →
            </Link>
          </div>
        </div>
      </section>

      {/* Solo Companion navy feature section — mirror of home page */}
      <section style={{ background: "#1c3028", padding: "4.5rem 1.5rem" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <p style={{ color: "#B8942F", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>
              The Solo Companion
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#F8F4EE", fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 700, lineHeight: 1.2, marginBottom: "1rem" }}>
              Grief doesn&apos;t wait for a group to form.
            </h2>
            <p style={{ color: "rgba(248,244,238,0.72)", fontSize: "1.05rem", lineHeight: 1.65, maxWidth: 540, margin: "0 auto" }}>
              The Solo Companion brings the full Live and Grieve™ Book 1 experience to your phone, your pace, your time.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
            {[
              { icon: "📖", text: "13 weeks of structured grief curriculum" },
              { icon: "✍️", text: "Journal, tracker, and weekly reflections" },
              { icon: "🤝", text: "Crisis resources always one tap away" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "1.25rem" }}>
                <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{item.icon}</span>
                <p style={{ color: "rgba(248,244,238,0.8)", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#B8942F", fontWeight: 600, fontSize: "1.05rem", marginBottom: "1.25rem" }}>
              Start for $24.99 — or three payments of $9.99.
            </p>
            <a
              href="https://solo.tripillarstudio.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-block", background: "#B8942F", color: "#fff", fontWeight: 700, fontSize: "1rem", padding: "0.9rem 2.5rem", borderRadius: 7, textDecoration: "none", marginBottom: "1rem" }}
            >
              Begin Book 1 Today
            </a>
            <p style={{ color: "rgba(248,244,238,0.45)", fontSize: "0.8rem", marginTop: "0.75rem" }}>
              In a facilitated group? Ask your facilitator for your access code.
            </p>
          </div>
        </div>
      </section>

      {/* Minimal footer */}
      <footer style={{ background: "#1c3028", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "1.5rem", textAlign: "center" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <Link href="/" style={{ fontFamily: "'Playfair Display', serif", color: "#B8942F", fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}>
            Tri&#8209;Pillars<sup style={{ fontSize: "0.6rem", verticalAlign: "super" }}>™</sup> Studio
          </Link>
        </div>
        <p style={{ color: "rgba(248,244,238,0.35)", fontSize: "0.75rem", margin: "0.25rem 0" }}>
          &copy; {new Date().getFullYear()} Tri&#8209;Pillars™ Studio. All rights reserved.
        </p>
        <a href="https://tripillarstudio.com" style={{ color: "rgba(248,244,238,0.4)", fontSize: "0.75rem", textDecoration: "none" }}>
          tripillarstudio.com
        </a>
      </footer>

    </div>
  );
}
