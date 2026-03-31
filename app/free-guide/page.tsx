"use client";

import { useState } from "react";
import Link from "next/link";
import type { Metadata } from "next";

// Note: metadata must come from a separate server component or layout for client pages
// This page is client-rendered for the form interaction

const PDF_URL =
  "https://wuwgbdjgsgtsmuctuhpt.supabase.co/storage/v1/object/public/public-resources/free-guide/live-and-grieve-grief-research-guide.pdf";

type FormState = "idle" | "loading" | "success" | "already_subscribed" | "invalid_email" | "error";

export default function FreeGuidePage() {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setFormState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/free-guide-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "invalid_email") {
          setFormState("invalid_email");
          setErrorMsg(data.message || "Please enter a valid email address.");
        } else {
          setFormState("error");
          setErrorMsg(data.message || "Something went wrong. Please try again.");
        }
        return;
      }

      if (data.status === "already_subscribed") {
        setFormState("already_subscribed");
      } else {
        setFormState("success");
        setEmail("");
      }
    } catch {
      setFormState("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  const showDownload = formState === "success" || formState === "already_subscribed";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 60% 20%, rgba(184,148,47,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            Free Resource
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-navy leading-tight mb-6">
            What Grief Research{" "}
            <span className="text-gold">Actually Says</span>
          </h1>
          <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
            A plain-language guide to three decades of peer-reviewed grief
            research — and why it changes how we support people through loss.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-start">

          {/* Left: What's inside */}
          <div>
            <h2 className="font-serif text-2xl text-navy mb-6">
              What&apos;s in the guide
            </h2>

            <ul className="space-y-5">
              {[
                {
                  title: "Why the five stages were never meant for the bereaved",
                  desc: "Kübler-Ross described the experience of dying patients — not grieving families. The misapplication has caused real harm.",
                },
                {
                  title: "The Dual Process Model",
                  desc: "The most widely accepted framework in contemporary grief research. Grief oscillates — it doesn't progress in stages.",
                },
                {
                  title: "Tasks of Mourning",
                  desc: "Worden's reframe: grief is active work, not passive endurance. Four tasks that actually describe what adaptation looks like.",
                },
                {
                  title: "Continuing Bonds Theory",
                  desc: "The goal is not to let go. Research supports maintaining connection with the deceased as healthy and adaptive.",
                },
                {
                  title: "Meaning Reconstruction, Self-Compassion, and the Companioning Model",
                  desc: "Five more frameworks that shape how Live and Grieve™ is built — and what good grief support actually looks like.",
                },
                {
                  title: "What this means for how we support people",
                  desc: "Practical implications for communities, facilitators, chaplains, counselors, and anyone who walks alongside loss.",
                },
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2.5 shrink-0" />
                  <div>
                    <p className="text-navy font-semibold text-sm">{item.title}</p>
                    <p className="text-muted text-sm mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 p-5 bg-card-bg border border-card-border rounded-xl">
              <p className="text-sm text-muted leading-relaxed italic">
                &ldquo;We built Live and Grieve™ on every framework in this
                guide. If you want to understand why we built it the way we
                did — this is the place to start.&rdquo;
              </p>
              <p className="text-gold text-xs font-medium mt-3">
                — Wayne &amp; Jamie Simms, Tri-Pillars™ LLC
              </p>
            </div>
          </div>

          {/* Right: Form / Download */}
          <div className="lg:sticky lg:top-28">
            <div className="bg-card-bg border border-card-border rounded-2xl p-8">
              {showDownload ? (
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="font-serif text-xl text-navy mb-2">
                    {formState === "already_subscribed"
                      ? "You're already on the list."
                      : "You're on the list."}
                  </h3>
                  <p className="text-muted text-sm mb-6">
                    {formState === "already_subscribed"
                      ? "Your guide is ready to download."
                      : "Check your inbox for a welcome email. Your guide is ready now."}
                  </p>
                  <a
                    href={PDF_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full bg-gold text-white font-semibold px-6 py-3.5 rounded-md hover:bg-gold-light transition-colors text-sm text-center"
                  >
                    Download the Guide (PDF)
                  </a>
                  <p className="text-muted/60 text-xs mt-3">7 pages · Free · No login required</p>
                </div>
              ) : (
                <>
                  <h3 className="font-serif text-xl text-navy mb-2">
                    Get the free guide
                  </h3>
                  <p className="text-muted text-sm mb-6 leading-relaxed">
                    Enter your email and we&apos;ll send you updates on the
                    program. Your guide downloads immediately.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formState !== "idle") setFormState("idle");
                        }}
                        placeholder="your@email.com"
                        disabled={formState === "loading"}
                        className="w-full border border-card-border bg-white rounded-md px-4 py-3 text-sm text-navy placeholder-muted/50 focus:outline-none focus:border-gold/50 transition-colors disabled:opacity-50"
                      />
                      {(formState === "invalid_email" || formState === "error") && (
                        <p className="text-red-500 text-xs mt-1.5">{errorMsg}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={formState === "loading"}
                      className="w-full bg-gold text-white font-semibold px-6 py-3.5 rounded-md hover:bg-gold-light transition-colors text-sm disabled:opacity-60"
                    >
                      {formState === "loading" ? "One moment…" : "Get the Free Guide"}
                    </button>
                  </form>

                  <p className="text-muted/60 text-xs mt-4 text-center">
                    No spam. Unsubscribe any time.
                  </p>

                  <div className="mt-6 pt-5 border-t border-card-border">
                    <p className="text-xs text-muted/70 leading-relaxed">
                      Already have it?{" "}
                      <a
                        href={PDF_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold underline underline-offset-2 hover:text-gold-light"
                      >
                        Download directly
                      </a>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-navy bg-texture py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl text-white mb-4">
            Want to bring Live and Grieve™ to your community?
          </h2>
          <p className="text-white/60 text-sm mb-8 leading-relaxed">
            The guide explains the research. The program puts it into practice.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/institutions"
              className="bg-gold text-white font-semibold px-8 py-3.5 rounded-md hover:bg-gold-light transition-colors text-sm"
            >
              For Institutions
            </Link>
            <Link
              href="/facilitators"
              className="border border-white/20 text-white/80 hover:text-white hover:border-white/40 font-medium px-8 py-3.5 rounded-md transition-colors text-sm"
            >
              Become a Facilitator
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
