"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Nav structure ────────────────────────────────────────────────────────────
const programsLinks = [
  { href: "/program",                          label: "Adult Program" },
  { href: "https://solo.tripillarstudio.com",  label: "Solo Companion", external: true },
  { href: "/memorial-wall",                    label: "Memorial Wall" },
];

const resourcesLinks = [
  { href: "/content",         label: "Content" },
  { href: "/content/blog",    label: "Blog" },
  { href: "/content/news",    label: "News" },
  { href: "/content/resources", label: "Resources" },
  { href: "/support",         label: "Support" },
  { href: "/free-guide",      label: "Free Guide" },
];

// Simple links that need no dropdown
const simpleLinks = [
  { href: "/about",        label: "About" },
  { href: "/our-approach", label: "Our Approach" },
  { href: "/facilitators", label: "Facilitators" },
  { href: "/institutions", label: "Institutions" },
  { href: "/contact",      label: "Contact" },
];

// Login portal links (highest tier → lowest)
const loginLinks = [
  { href: "/login/organization", label: "Partner Portal",   sub: "Licensed Organizations",  icon: "🏛" },
  { href: "/login/trainer",      label: "Trainer Portal",   sub: "Certified Trainers",       icon: "🎓" },
  { href: "/login/facilitator",  label: "Facilitator Portal", sub: "Certified Facilitators", icon: "📋" },
  { href: "https://solo.tripillarstudio.com", label: "Solo Companion", sub: "Individual Participants", icon: "👤", external: true },
];

// Full mobile list (flat, no dropdowns)
const mobileLinks = [
  { href: "/about",                           label: "About" },
  { href: "/our-approach",                    label: "Our Approach" },
  { href: "/program",                         label: "Programs — Adult Program" },
  { href: "https://solo.tripillarstudio.com", label: "Programs — Solo Companion", external: true },
  { href: "/memorial-wall",                   label: "Programs — Memorial Wall" },
  { href: "/facilitators",                    label: "Facilitators" },
  { href: "/institutions",                    label: "Institutions" },
  { href: "/content",                         label: "Content" },
  { href: "/content/blog",                    label: "Content — Blog" },
  { href: "/content/news",                    label: "Content — News" },
  { href: "/content/resources",               label: "Content — Resources" },
  { href: "/support",                         label: "Support" },
  { href: "/free-guide",                      label: "Free Guide" },
  { href: "/contact",                         label: "Contact" },
];

// ─── Chevron icon ─────────────────────────────────────────────────────────────
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className="w-3 h-3 flex-shrink-0"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 200ms ease",
      }}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ─── Desktop dropdown ─────────────────────────────────────────────────────────
function DesktopDropdown({
  label,
  links,
  isActive,
}: {
  label: string;
  links: { href: string; label: string; external?: boolean }[];
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const pathname = usePathname();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <li className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap select-none ${
          isActive || open ? "text-gold font-medium" : "text-muted hover:text-navy"
        }`}
      >
        {label}
        <Chevron open={open} />
      </button>

      <div
        className="absolute left-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-card-border py-1.5 z-50"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-6px)",
          transition: "opacity 180ms ease, transform 180ms ease",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {links.map((link) =>
          link.external ? (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:text-navy hover:bg-stone-50 transition-colors"
            >
              {link.label}
              <svg className="w-3 h-3 opacity-40 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2.5 text-sm transition-colors ${
                pathname === link.href
                  ? "text-gold font-medium bg-stone-50"
                  : "text-muted hover:text-navy hover:bg-stone-50"
              }`}
            >
              {link.label}
            </Link>
          )
        )}
      </div>
    </li>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Navbar() {
  const [open, setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileLoginOpen, setMobileLoginOpen] = useState(false);
  const pathname            = usePathname();
  const touchedRef          = useRef(false);
  const loginDesktopRef     = useRef<HTMLLIElement | null>(null);

  const toggle = useCallback(() => setOpen((p) => !p), []);

  useEffect(() => { setOpen(false); setLoginOpen(false); setMobileLoginOpen(false); }, [pathname]);

  // Close login dropdown on outside click
  useEffect(() => {
    if (!loginOpen) return;
    const handler = (e: MouseEvent) => {
      if (loginDesktopRef.current && !loginDesktopRef.current.contains(e.target as Node)) setLoginOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [loginOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevent = (e: TouchEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("[data-menu-scroll]")) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => document.removeEventListener("touchmove", prevent);
  }, [open]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    touchedRef.current = true;
    toggle();
  }, [toggle]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (touchedRef.current) { touchedRef.current = false; return; }
    toggle();
  }, [toggle]);

  const programsActive = programsLinks.some((l) => l.href === pathname);
  const resourcesActive = resourcesLinks.some((l) => l.href === pathname);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${
        open
          ? "bg-white border-b border-card-border shadow-sm"
          : scrolled
            ? "bg-white/95 backdrop-blur-sm border-b border-card-border shadow-sm"
            : "bg-transparent"
      }`}
      style={{ transition: "background-color 300ms ease, border-color 300ms ease, box-shadow 300ms ease" }}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link
          href="/"
          onClick={(e) => {
            if (pathname === "/") { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }
          }}
          className="flex items-center gap-2.5 group flex-shrink-0"
        >
          <Image src="/logo.png" alt="Live and Grieve" width={28} height={42} className="h-9 w-auto" priority />
          <span className="font-serif text-xl font-bold text-navy group-hover:text-gold transition-colors">
            Tri&#8209;Pillars<sup className="text-xs text-gold">™</sup>
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <ul className="hidden md:flex items-center gap-0.5 flex-shrink-0">

          {/* About */}
          <li>
            <Link
              href="/about"
              className={`px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                pathname === "/about" ? "text-gold font-medium" : "text-muted hover:text-navy"
              }`}
            >
              About
            </Link>
          </li>

          {/* Our Approach */}
          <li>
            <Link
              href="/our-approach"
              className={`px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                pathname === "/our-approach" ? "text-gold font-medium" : "text-muted hover:text-navy"
              }`}
            >
              Our Approach
            </Link>
          </li>

          {/* Programs dropdown */}
          <DesktopDropdown label="Programs" links={programsLinks} isActive={programsActive} />

          {/* Resources dropdown */}
          <DesktopDropdown label="Resources" links={resourcesLinks} isActive={resourcesActive} />

          {/* Facilitators */}
          <li>
            <Link
              href="/facilitators"
              className={`px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                pathname === "/facilitators" ? "text-gold font-medium" : "text-muted hover:text-navy"
              }`}
            >
              Facilitators
            </Link>
          </li>

          {/* Institutions */}
          <li>
            <Link
              href="/institutions"
              className={`px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                pathname === "/institutions" ? "text-gold font-medium" : "text-muted hover:text-navy"
              }`}
            >
              Institutions
            </Link>
          </li>

          {/* Contact */}
          <li>
            <Link
              href="/contact"
              className={`px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                pathname === "/contact" ? "text-gold font-medium" : "text-muted hover:text-navy"
              }`}
            >
              Contact
            </Link>
          </li>

          {/* Login CTA dropdown */}
          <li className="ml-3 relative" ref={(el) => { loginDesktopRef.current = el; }}>
            <button
              onClick={() => setLoginOpen((p) => !p)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold text-sm transition-colors whitespace-nowrap"
              style={{
                background: "#B8942F",
                color: "#F8F4EE",
                paddingTop: "9px",
                paddingBottom: "9px",
                paddingLeft: "16px",
                paddingRight: "14px",
                minHeight: "40px",
                letterSpacing: "0.02em",
                boxShadow: "0 1px 3px rgba(184,148,47,0.35)",
              }}
            >
              Login
              <Chevron open={loginOpen} />
            </button>
            <div
              className="absolute right-0 top-full mt-1 w-56 rounded-xl shadow-lg py-1.5 z-50"
              style={{
                background: "#1B2B4B",
                opacity: loginOpen ? 1 : 0,
                transform: loginOpen ? "translateY(0)" : "translateY(-6px)",
                transition: "opacity 180ms ease, transform 180ms ease",
                pointerEvents: loginOpen ? "auto" : "none",
              }}
            >
              {loginLinks.map((link, i) => (
                <div key={link.href}>
                  {i > 0 && (
                    <div style={{ height: "1px", background: "rgba(201,168,76,0.25)", margin: "0 12px" }} />
                  )}
                  <a
                    href={link.href}
                    {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="block px-4 py-2.5 transition-colors"
                    style={{ borderLeft: "3px solid transparent" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderLeftColor = "#C9A84C"; e.currentTarget.style.background = "rgba(201,168,76,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderLeftColor = "transparent"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "14px" }}>{link.icon}</span>
                      <div>
                        <div style={{ color: "#F5F0E8", fontWeight: 600, fontSize: "13px", lineHeight: "1.3" }}>{link.label}</div>
                        <div style={{ color: "rgba(245,240,232,0.55)", fontSize: "11px", lineHeight: "1.3" }}>{link.sub}</div>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </li>
        </ul>

        {/* ── Hamburger ── */}
        <button
          type="button"
          onClick={handleClick}
          onTouchEnd={handleTouchEnd}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="md:hidden relative z-[60] flex items-center justify-center w-12 h-12 -mr-2 rounded-md text-navy"
          style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
        >
          <span className="pointer-events-none relative w-5 h-5">
            <span className="absolute left-0 block w-5 h-[2px] bg-current"
              style={{
                top: open ? "9px" : "3px",
                transform: open ? "rotate(45deg)" : "rotate(0)",
                transition: "top 250ms cubic-bezier(0.4,0,0.2,1), transform 250ms cubic-bezier(0.4,0,0.2,1) 50ms",
              }} />
            <span className="absolute left-0 top-[9px] block w-5 h-[2px] bg-current"
              style={{
                opacity: open ? 0 : 1,
                transform: open ? "scaleX(0)" : "scaleX(1)",
                transition: "opacity 200ms ease, transform 200ms ease",
              }} />
            <span className="absolute left-0 block w-5 h-[2px] bg-current"
              style={{
                top: open ? "9px" : "15px",
                transform: open ? "rotate(-45deg)" : "rotate(0)",
                transition: "top 250ms cubic-bezier(0.4,0,0.2,1), transform 250ms cubic-bezier(0.4,0,0.2,1) 50ms",
              }} />
          </span>
        </button>
      </nav>

      {/* ── Mobile overlay ── */}
      <div
        className="md:hidden fixed inset-0 top-16 z-40 bg-white"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translate3d(0,0,0)" : "translate3d(0,-12px,0)",
          transition: open
            ? "opacity 450ms cubic-bezier(0.16,1,0.3,1), transform 450ms cubic-bezier(0.16,1,0.3,1)"
            : "opacity 250ms ease-in, transform 250ms ease-in",
          pointerEvents: open ? "auto" : "none",
          willChange: "opacity, transform",
        }}
      >
        <div data-menu-scroll className="border-t border-card-border h-full flex flex-col px-6 py-6 overflow-y-auto">
          <ul className="flex flex-col gap-0.5 flex-1">
            {mobileLinks.map((link, i) => (
              <li
                key={link.href + link.label}
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? "translate3d(0,0,0)" : "translate3d(0,16px,0)",
                  transition: open
                    ? `opacity 400ms cubic-bezier(0.16,1,0.3,1) ${80 + i * 30}ms, transform 400ms cubic-bezier(0.16,1,0.3,1) ${80 + i * 30}ms`
                    : "opacity 150ms ease-in, transform 150ms ease-in",
                  willChange: "opacity, transform",
                }}
              >
                {(link as { external?: boolean }).external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block py-3 text-base border-b border-card-border/60 transition-colors text-navy hover:text-gold"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className={`block py-3 text-base border-b border-card-border/60 transition-colors ${
                      pathname === link.href ? "text-gold font-medium" : "text-navy hover:text-gold"
                    }`}
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {/* Mobile Login — gold button toggles portal options */}
          <div
            className="mt-6 pb-2"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? "translate3d(0,0,0)" : "translate3d(0,16px,0)",
              transition: open
                ? `opacity 400ms cubic-bezier(0.16,1,0.3,1) ${80 + mobileLinks.length * 30}ms, transform 400ms cubic-bezier(0.16,1,0.3,1) ${80 + mobileLinks.length * 30}ms`
                : "opacity 150ms ease-in, transform 150ms ease-in",
            }}
          >
            <button
              onClick={() => setMobileLoginOpen((p) => !p)}
              className="flex items-center justify-center gap-2 w-full rounded-xl font-semibold text-base whitespace-nowrap"
              style={{
                background: "#B8942F",
                color: "#F8F4EE",
                minHeight: "48px",
                letterSpacing: "0.02em",
                boxShadow: "0 2px 6px rgba(184,148,47,0.3)",
              }}
            >
              Login
              <Chevron open={mobileLoginOpen} />
            </button>
            {mobileLoginOpen && (
              <div className="mt-2 rounded-xl overflow-hidden" style={{ background: "#1B2B4B" }}>
                {loginLinks.map((link, i) => (
                  <div key={link.href}>
                    {i > 0 && (
                      <div style={{ height: "1px", background: "rgba(201,168,76,0.25)", margin: "0 16px" }} />
                    )}
                    <a
                      href={link.href}
                      {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="block px-5 py-3 transition-colors"
                      style={{ borderLeft: "3px solid transparent" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderLeftColor = "#C9A84C"; e.currentTarget.style.background = "rgba(201,168,76,0.1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderLeftColor = "transparent"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px" }}>{link.icon}</span>
                        <div>
                          <div style={{ color: "#F5F0E8", fontWeight: 600, fontSize: "14px", lineHeight: "1.3" }}>{link.label}</div>
                          <div style={{ color: "rgba(245,240,232,0.55)", fontSize: "12px", lineHeight: "1.3" }}>{link.sub}</div>
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p
            className="text-muted/40 text-xs text-center pt-4 pb-2"
            style={{
              opacity: open ? 1 : 0,
              transition: open
                ? `opacity 400ms ease ${80 + (mobileLinks.length + 1) * 30}ms`
                : "opacity 150ms ease-in",
            }}
          >
            Tri-Pillars Studio™ · Live and Grieve™
          </p>
        </div>
      </div>
    </header>
  );
}
