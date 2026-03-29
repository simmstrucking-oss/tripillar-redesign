"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Primary nav — visible at all times on desktop
const primaryLinks = [
  { href: "/about",        label: "About" },
  { href: "/program",      label: "Programs" },
  { href: "/facilitators", label: "Facilitators" },
  { href: "/institutions", label: "Institutions" },
  { href: "https://solo.tripillarstudio.com", label: "Solo Companion", external: true },
  { href: "/contact",      label: "Contact" },
];

// Secondary nav — collapsed into "More" dropdown on desktop, shown in mobile menu
const moreLinks = [
  { href: "/our-approach",   label: "Our Approach" },
  { href: "/memorial-wall",  label: "Memorial Wall" },
  { href: "/content",        label: "Content" },
  { href: "/support",        label: "Support" },
];

export default function Navbar() {
  const [open, setOpen]         = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname                = usePathname();
  const touchedRef              = useRef(false);
  const moreRef                 = useRef<HTMLLIElement>(null);

  const toggle = useCallback(() => setOpen((p) => !p), []);

  // Close mobile menu on navigation
  useEffect(() => { setOpen(false); setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close "More" dropdown on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (!open) return;
    const prevent = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-menu-scroll]")) return;
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

  const allMobileLinks = [...primaryLinks, ...moreLinks];
  const moreActive = moreLinks.some(l => l.href === pathname);

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

        {/* Logo */}
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

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-0.5">
          {primaryLinks.map((link) => (
            <li key={link.href}>
              {link.external ? (
                <a href={link.href} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-2 text-sm rounded-md transition-colors text-muted hover:text-navy whitespace-nowrap">
                  {link.label}
                </a>
              ) : (
                <Link href={link.href}
                  className={`px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                    pathname === link.href ? "text-gold font-medium" : "text-muted hover:text-navy"
                  }`}>
                  {link.label}
                </Link>
              )}
            </li>
          ))}

          {/* More dropdown */}
          <li className="relative" ref={moreRef as React.RefObject<HTMLLIElement>}>
            <button
              onClick={() => setMoreOpen(p => !p)}
              className={`flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                moreActive ? "text-gold font-medium" : "text-muted hover:text-navy"
              }`}
            >
              More
              <svg className={`w-3.5 h-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-card-border py-1 z-50">
                {moreLinks.map(link => (
                  <Link key={link.href} href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      pathname === link.href ? "text-gold font-medium" : "text-muted hover:text-navy hover:bg-stone-50"
                    }`}>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </li>

          {/* Facilitator Login CTA */}
          <li className="ml-2">
            <Link href="/facilitators/login"
              className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap"
              style={{ background: '#A0843A', color: '#F8F4EE', letterSpacing: '0.04em' }}>
              Facilitator Login
            </Link>
          </li>
        </ul>

        {/* Hamburger */}
        <button type="button" onClick={handleClick} onTouchEnd={handleTouchEnd}
          aria-label="Toggle menu" aria-expanded={open}
          className="md:hidden relative z-[60] flex items-center justify-center w-12 h-12 -mr-2 rounded-md text-navy"
          style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>
          <span className="pointer-events-none relative w-5 h-5">
            <span className="absolute left-0 block w-5 h-[2px] bg-current"
              style={{ top: open ? "9px" : "3px", transform: open ? "rotate(45deg)" : "rotate(0)",
                transition: "top 250ms cubic-bezier(0.4,0,0.2,1), transform 250ms cubic-bezier(0.4,0,0.2,1) 50ms" }} />
            <span className="absolute left-0 top-[9px] block w-5 h-[2px] bg-current"
              style={{ opacity: open ? 0 : 1, transform: open ? "scaleX(0)" : "scaleX(1)",
                transition: "opacity 200ms ease, transform 200ms ease" }} />
            <span className="absolute left-0 block w-5 h-[2px] bg-current"
              style={{ top: open ? "9px" : "15px", transform: open ? "rotate(-45deg)" : "rotate(0)",
                transition: "top 250ms cubic-bezier(0.4,0,0.2,1), transform 250ms cubic-bezier(0.4,0,0.2,1) 50ms" }} />
          </span>
        </button>
      </nav>

      {/* Mobile overlay */}
      <div className="md:hidden fixed inset-0 top-16 z-40 bg-white"
        style={{
          opacity: open ? 1 : 0,
          transform: open ? "translate3d(0,0,0)" : "translate3d(0,-12px,0)",
          transition: open
            ? "opacity 450ms cubic-bezier(0.16,1,0.3,1), transform 450ms cubic-bezier(0.16,1,0.3,1)"
            : "opacity 250ms ease-in, transform 250ms ease-in",
          pointerEvents: open ? "auto" : "none",
          willChange: "opacity, transform",
        }}>
        <div data-menu-scroll className="border-t border-card-border h-full flex flex-col justify-center px-6 py-8 overflow-y-auto">
          <ul className="flex flex-col gap-0.5">
            {allMobileLinks.map((link, i) => (
              <li key={link.href}
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? "translate3d(0,0,0)" : "translate3d(0,16px,0)",
                  transition: open
                    ? `opacity 400ms cubic-bezier(0.16,1,0.3,1) ${100 + i * 35}ms, transform 400ms cubic-bezier(0.16,1,0.3,1) ${100 + i * 35}ms`
                    : "opacity 150ms ease-in, transform 150ms ease-in",
                  willChange: "opacity, transform",
                }}>
                {(link as any).external ? (
                  <a href={link.href} target="_blank" rel="noopener noreferrer"
                    className="block py-3 text-lg border-b border-card-border/60 transition-colors duration-200 text-navy hover:text-gold">
                    {link.label}
                  </a>
                ) : (
                  <Link href={link.href}
                    className={`block py-3 text-lg border-b border-card-border/60 transition-colors duration-200 ${
                      pathname === link.href ? "text-gold font-medium" : "text-navy hover:text-gold"
                    }`}>
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-6"
            style={{
              opacity: open ? 1 : 0,
              transform: open ? "translate3d(0,0,0)" : "translate3d(0,16px,0)",
              transition: open
                ? `opacity 400ms cubic-bezier(0.16,1,0.3,1) ${100 + allMobileLinks.length * 35}ms, transform 400ms cubic-bezier(0.16,1,0.3,1) ${100 + allMobileLinks.length * 35}ms`
                : "opacity 150ms ease-in, transform 150ms ease-in",
            }}>
            <Link href="/facilitators/login"
              className="block w-full text-center py-3 text-base font-semibold rounded-md transition-colors"
              style={{ background: '#A0843A', color: '#F8F4EE', letterSpacing: '0.04em' }}>
              Facilitator Login
            </Link>
          </div>
          <p className="text-muted/50 text-xs text-center mt-auto pt-8 pb-4"
            style={{
              opacity: open ? 1 : 0,
              transition: open
                ? `opacity 400ms cubic-bezier(0.16,1,0.3,1) ${100 + (allMobileLinks.length + 1) * 35}ms`
                : "opacity 150ms ease-in",
            }}>
            Tri-Pillars Studio™ · Live and Grieve™
          </p>
        </div>
      </div>
    </header>
  );
}
