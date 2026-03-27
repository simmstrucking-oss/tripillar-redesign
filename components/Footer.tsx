"use client";

import { useState } from "react";
import Link from "next/link";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-navy border-t border-navy/10">
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
          {submitted ? (
            <p className="text-gold-light text-sm font-medium">
              Thank you. We&apos;ll be in touch.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 bg-white/10 border border-white/15 rounded-md px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-gold/50 transition-colors"
              />
              <button
                type="submit"
                className="bg-gold text-white font-semibold text-sm px-6 py-2.5 rounded-md hover:bg-gold-light transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <span className="font-serif text-lg font-bold text-white">
              Tri&#8209;Pillars<sup className="text-xs text-gold-light">™</sup> Studio
            </span>
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
          <p>&copy; {new Date().getFullYear()} Tri&#8209;Pillars™ Studio. All rights reserved.</p>
          <p>Live and Grieve™ and Live and Grieve Youth™ are trademarks of Tri&#8209;Pillars™ Studio.</p>
        </div>
      </div>
    </footer>
  );
}
