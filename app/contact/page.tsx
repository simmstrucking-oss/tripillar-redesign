"use client";

import { useState } from "react";
import FadeIn from "@/components/FadeIn";
import Link from "next/link";

const whoIncludes = [
  {
    title: "Individuals & Families",
    desc: "If you're navigating personal loss or looking for a group near you, let us know. We'll point you in the right direction.",
    include: [
      "Your general location",
      "What kind of support you're looking for",
      "Any time constraints or preferences",
    ],
  },
  {
    title: "Organizations",
    desc: "If you'd like to bring Live and Grieve™ or Live and Grieve Youth™ to your institution, we'd love to hear about your community.",
    include: [
      "Organization name and type",
      "Who you serve",
      "Whether you're interested in adult, youth, or both programs",
    ],
  },
  {
    title: "Facilitators",
    desc: "If you're already working in grief support and want to learn more about our training or join our facilitator network, reach out.",
    include: [
      "Your background and current role",
      "What draws you to this program",
      "Any questions about the training",
    ],
  },
  {
    title: "Media & Research",
    desc: "For press inquiries, academic research, or speaking requests, please reach out directly.",
    include: [
      "Your publication, institution, or organization",
      "Nature of the request",
      "Any deadlines we should know about",
    ],
  },
];

type FormState = "idle" | "loading" | "sent" | "error";

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
  general?: string;
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inquiryType, setInquiryType] = useState("general");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");
    setErrors({});

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          inquiry_type: inquiryType,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "validation") {
          setErrors({ [data.field]: data.message });
          setFormState("idle");
        } else if (data.error === "invalid_email") {
          setErrors({ email: data.message });
          setFormState("idle");
        } else {
          setErrors({ general: data.message || "Something went wrong. Please try again." });
          setFormState("error");
        }
        return;
      }

      setFormState("sent");
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
      setFormState("error");
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-end pb-16 pt-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 40% 50%, rgba(201,168,76,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            Contact
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-muted max-w-2xl leading-relaxed">
            We&apos;re a small team and we read every message. Whether you&apos;re
            grieving, supporting someone who is, or want to bring this work
            into your community, we want to hear from you.
          </p>
        </div>
      </section>

      {/* Contact info + form */}
      <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-6 font-medium">
              Reach Us Directly
            </p>

            <div className="space-y-8 mb-10">
              {/* Wayne */}
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold/10 border border-gold/15 flex items-center justify-center">
                  <span className="text-gold text-xs font-bold">W</span>
                </div>
                <div>
                  <p className="text-navy font-medium mb-1">Wayne Simms</p>
                  <a
                    href="mailto:wayne@tripillarstudio.com"
                    className="text-gold/80 hover:text-gold text-sm transition-colors block mb-1"
                  >
                    wayne@tripillarstudio.com
                  </a>
                  <p className="text-muted text-xs">Co-Founder</p>
                </div>
              </div>

              {/* Jamie */}
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold/10 border border-gold/15 flex items-center justify-center">
                  <span className="text-gold text-xs font-bold">J</span>
                </div>
                <div>
                  <p className="text-navy font-medium mb-1">Jamie Simms</p>
                  <a
                    href="mailto:jamie@tripillarstudio.com"
                    className="text-gold/80 hover:text-gold text-sm transition-colors block mb-1"
                  >
                    jamie@tripillarstudio.com
                  </a>
                  <p className="text-muted text-xs">Co-Founder</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold/10 border border-gold/15 flex items-center justify-center">
                  <span className="text-gold text-xs">📞</span>
                </div>
                <div>
                  <p className="text-navy font-medium mb-1">Phone</p>
                  <a
                    href="tel:2703028814"
                    className="text-gold/80 hover:text-gold text-sm transition-colors"
                  >
                    (270) 302&#8209;8814
                  </a>
                </div>
              </div>
            </div>

            {/* Location + Pilot */}
            <div className="bg-card-bg border border-card-border rounded-xl p-6">
              <h3 className="font-serif text-lg text-navy mb-3">
                Where We Are
              </h3>
              <p className="text-muted text-sm leading-relaxed mb-4">
                We&apos;re based in Kentucky, but our work reaches nationally. If
                you&apos;re looking for a partner wherever you are, we&apos;d love to
                talk.
              </p>
              <div className="border-t border-card-border pt-4">
                <p className="text-gold text-xs uppercase tracking-wider mb-2 font-medium">
                  Inaugural Pilot
                </p>
                <p className="text-muted text-sm">
                  May 2026. Hampshire County Community Action Center,
                  West Virginia
                </p>
              </div>
            </div>
          </FadeIn>

          {/* Contact Form */}
          <FadeIn delay={150}>
            <p className="text-gold text-xs uppercase tracking-widest mb-6 font-medium">
              Send a Message
            </p>

            {formState === "sent" ? (
              <div className="bg-card-bg border border-card-border rounded-2xl p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-serif text-xl text-navy mb-2">Message sent.</h3>
                <p className="text-muted text-sm leading-relaxed">
                  Thank you, {name.split(" ")[0]}. Wayne and Jamie read every message personally. They&apos;ll be in touch soon.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
                    {errors.general}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1.5 uppercase tracking-wide">
                      Name <span className="text-gold">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
                      placeholder="Your name"
                      disabled={formState === "loading"}
                      className={`w-full border rounded-md px-4 py-2.5 text-sm text-navy placeholder-muted/50 bg-white focus:outline-none focus:border-gold/50 transition-colors disabled:opacity-50 ${errors.name ? "border-red-400" : "border-card-border"}`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy mb-1.5 uppercase tracking-wide">
                      Email <span className="text-gold">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                      placeholder="your@email.com"
                      disabled={formState === "loading"}
                      className={`w-full border rounded-md px-4 py-2.5 text-sm text-navy placeholder-muted/50 bg-white focus:outline-none focus:border-gold/50 transition-colors disabled:opacity-50 ${errors.email ? "border-red-400" : "border-card-border"}`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-navy mb-1.5 uppercase tracking-wide">
                    Inquiry Type
                  </label>
                  <select
                    value={inquiryType}
                    onChange={(e) => setInquiryType(e.target.value)}
                    disabled={formState === "loading"}
                    className="w-full border border-card-border rounded-md px-4 py-2.5 text-sm text-navy bg-white focus:outline-none focus:border-gold/50 transition-colors disabled:opacity-50"
                  >
                    <option value="general">General</option>
                    <option value="individual">Individual / Family</option>
                    <option value="institution">Institution / Organization</option>
                    <option value="facilitator">Facilitator</option>
                    <option value="media">Media / Research</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-navy mb-1.5 uppercase tracking-wide">
                    Message <span className="text-gold">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); setErrors(prev => ({ ...prev, message: undefined })); }}
                    placeholder="Tell us how we can help…"
                    rows={5}
                    disabled={formState === "loading"}
                    className={`w-full border rounded-md px-4 py-2.5 text-sm text-navy placeholder-muted/50 bg-white focus:outline-none focus:border-gold/50 transition-colors disabled:opacity-50 resize-none ${errors.message ? "border-red-400" : "border-card-border"}`}
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={formState === "loading"}
                  className="w-full bg-gold text-white font-semibold px-6 py-3.5 rounded-md hover:bg-gold-light transition-colors text-sm disabled:opacity-60"
                >
                  {formState === "loading" ? "Sending…" : "Send Message"}
                </button>

                <p className="text-muted/60 text-xs text-center">
                  We respond personally to every message, typically within 1–2 business days.
                </p>
              </form>
            )}
          </FadeIn>
        </div>
      </section>

      {/* What to include */}
      <section className="py-16 bg-section-alt">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium text-center">
              What to Include
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl text-navy mb-10 text-center">
              Depending on who you are
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {whoIncludes.map((item, i) => (
                <div key={i} className="bg-card-bg border border-card-border rounded-xl p-6">
                  <h3 className="font-serif text-lg text-navy mb-2">{item.title}</h3>
                  <p className="text-muted text-sm leading-relaxed mb-4">{item.desc}</p>
                  <ul className="space-y-1.5">
                    {item.include.map((tip, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-muted">
                        <span className="text-gold/60 mt-0.5 flex-shrink-0">◆</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Free guide reminder */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeIn>
            <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
              Free Resource
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl text-navy mb-4">
              Want to learn more before reaching out?
            </h2>
            <p className="text-muted mb-6 leading-relaxed">
              Download our free guide, <em>&ldquo;What Grief Research Actually
              Says&rdquo;</em> — a plain-language summary of the research behind
              our approach. No email required to download.
            </p>
            <Link
              href="/free-guide"
              className="inline-block bg-gold text-white font-semibold px-8 py-3.5 rounded-md hover:bg-gold-light transition-colors text-sm"
            >
              Get the Free Guide
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Crisis resources */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="rounded-2xl border border-card-border p-8 bg-section-alt">
            <p className="text-muted text-xs uppercase tracking-widest mb-4 font-medium">
              If You Need Immediate Help
            </p>
            <h3 className="font-serif text-xl text-navy mb-4">
              Crisis Resources
            </h3>
            <p className="text-muted text-sm mb-6 leading-relaxed">
              Our program is a grief support community, not a crisis service.
              If you or someone you know is in immediate danger or experiencing
              a mental health crisis, please reach out to these resources right
              away.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <a href="tel:988" className="flex items-center gap-3 bg-card-bg border border-card-border rounded-xl p-4 hover:border-gold/15 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold text-xs">📞</span>
                </div>
                <div>
                  <p className="text-navy text-sm font-medium">988</p>
                  <p className="text-muted text-xs">Suicide &amp; Crisis Lifeline</p>
                </div>
              </a>
              <div className="flex items-center gap-3 bg-card-bg border border-card-border rounded-xl p-4">
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold text-xs">💬</span>
                </div>
                <div>
                  <p className="text-navy text-sm font-medium">Crisis Text Line</p>
                  <p className="text-muted text-xs">Text HOME to 741741</p>
                </div>
              </div>
              <a href="tel:911" className="flex items-center gap-3 bg-card-bg border border-card-border rounded-xl p-4 hover:border-gold/15 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-gold text-xs">🚨</span>
                </div>
                <div>
                  <p className="text-navy text-sm font-medium">911</p>
                  <p className="text-muted text-xs">Emergency Services</p>
                </div>
              </a>
            </div>
          </div>
        </FadeIn>
      </section>
    </>
  );
}
