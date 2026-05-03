"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type SubmitState = "idle" | "loading" | "subscribed" | "already_subscribed" | "invalid_email" | "error";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setSubmitState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "invalid_email") {
          setSubmitState("invalid_email");
          setErrorMsg(data.message || "Please enter a valid email address.");
        } else {
          setSubmitState("error");
          setErrorMsg(data.message || "Something went wrong. Please try again.");
        }
        return;
      }

      if (data.status === "already_subscribed") {
        setSubmitState("already_subscribed");
      } else {
        setSubmitState("subscribed");
        setEmail("");
      }
    } catch {
      setSubmitState("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  return (
    <footer className="bg-navy bg-texture border-t border-navy/10">
      {/* Newsletter */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 border-b border-white/10">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="font-serif text-2xl text-white mb-2">
            Stay Connected
          </h3>
          <p className="text-white/60 text-sm mb-6">
            Occasional updates on the program, grief resources, and how to bring
            Live and Grieve™ to your community.
          </p>
          {submitState === "subscribed" ? (
            <p className="text-gold-light text-sm font-medium">
              You&apos;re on the list.
            </p>
          ) : submitState === "already_subscribed" ? (
            <p className="text-white/70 text-sm">
              You&apos;re already subscribed.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-2"
            >
              <div className="flex-1 flex flex-col gap-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (submitState !== "idle") setSubmitState("idle"); }}
                  placeholder="your@email.com"
                  disabled={submitState === "loading"}
                  className="bg-white/10 border border-white/15 rounded-md px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors disabled:opacity-50"
                />
                {(submitState === "invalid_email" || submitState === "error") && (
                  <p className="text-red-400 text-xs text-left">{errorMsg}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={submitState === "loading"}
                className="bg-gold text-white font-semibold text-sm px-6 py-2.5 rounded-md hover:bg-gold-light transition-colors whitespace-nowrap disabled:opacity-60 self-start sm:self-auto"
              >
                {submitState === "loading" ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <div style={{ maxWidth: '260px', marginBottom: '1rem' }}>
              <Image
                src="/brand/D_Rule/D_Rule_Toward_The_Light_transparent.png"
                alt="Live and Grieve™ — Tri-Pillars™ LLC"
                width={260}
                height={60}
                className="w-full h-auto"
              />
            </div>
            <p className="text-white/60 text-sm mt-3 leading-relaxed">
              Kentucky-based, nationally reaching. Grief support that honors
              where you are.
            </p>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">
              Programs
            </h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/program/adult" className="hover:text-gold-light transition-colors">Adult Program</Link></li>
              <li><Link href="/program/youth" className="hover:text-gold-light transition-colors">Youth Program</Link></li>
              <li><Link href="/our-approach" className="hover:text-gold-light transition-colors">Our Approach</Link></li>
              <li><Link href="/institutions" className="hover:text-gold-light transition-colors">For Institutions</Link></li>
              <li><a href="https://solo.tripillarstudio.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold-light transition-colors">Start the Solo Companion</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">
              For Facilitators
            </h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/login/facilitator" className="hover:text-gold-light transition-colors">Facilitator Login</Link></li>
              <li><Link href="/facilitators" className="hover:text-gold-light transition-colors">Become a Facilitator</Link></li>
              <li><Link href="/facilitators/hub" className="hover:text-gold-light transition-colors">Facilitator Hub</Link></li>
              <li><Link href="/login/organization" className="hover:text-gold-light transition-colors">Partner Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">
              Contact
            </h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="mailto:wayne@tripillarstudio.com" className="hover:text-gold-light transition-colors">wayne@tripillarstudio.com</a></li>
              <li><a href="mailto:jamie@tripillarstudio.com" className="hover:text-gold-light transition-colors">jamie@tripillarstudio.com</a></li>
              <li><a href="tel:2703028814" className="hover:text-gold-light transition-colors">(270) 302&#8209;8814</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3 uppercase tracking-wider">
              If You Need Help Now
            </h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="tel:988" className="hover:text-gold-light transition-colors">988 Suicide &amp; Crisis Lifeline</a></li>
              <li><span>Crisis Text Line: </span><span className="text-white/80">Text HOME to 741741</span></li>
              <li><a href="tel:911" className="hover:text-gold-light transition-colors">Emergency: 911</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} Tri&#8209;Pillars™ LLC. All rights reserved.</p>
          <p>Live and Grieve™ and Live and Grieve Youth™ are trademarks of Tri&#8209;Pillars™ LLC.</p>
        </div>
      </div>
    </footer>
  );
}
