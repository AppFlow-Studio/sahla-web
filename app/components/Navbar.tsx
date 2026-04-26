"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, LogIn, LogOut } from "lucide-react";

const navLinks = [
  { label: "Why Sahla", href: "/why-sahla" },
  { label: "Pricing", href: "/pricing" },
  { label: "Case Study", href: "/customers/mas-si" },
  { label: "FAQ", href: "/faq" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded, orgId } = useAuth();
  const { signOut } = useClerk();
  const [scrolled, setScrolled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSahlaAdmin =
    isLoaded &&
    isSignedIn &&
    !!orgId &&
    orgId === process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

  // The /about hero sits on a cream background, so the default white nav
  // chrome washes out. While the navbar is still transparent (i.e. before
  // the dark-green scrolled state kicks in) we flip menu/logo/admin colors
  // to dark-green so they're visible against the page itself.
  const isLightHero = pathname === "/about" && !scrolled;

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 50);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <>
      {/* Thin gold accent line at very top */}
      <div className="fixed top-0 right-0 left-0 z-[60] h-[2px]" style={{ background: "linear-gradient(90deg, transparent 0%, #B8922A 30%, #d4af37 50%, #B8922A 70%, transparent 100%)" }} />

      <motion.nav
        className="fixed top-[2px] right-0 left-0 z-50 transition-all duration-700"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        style={{
          backgroundColor: scrolled ? "rgba(10, 38, 30, 0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(1.4)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,251,242,0.06)" : "1px solid transparent",
        }}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          {/* Left — Menu button + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                isLightHero
                  ? "text-dark-green/70 hover:text-dark-green"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Menu size={20} />
            </button>

            <Link href="/" className="transition-opacity duration-300 hover:opacity-80">
              <img
                src="/sahla-logo.png"
                alt="Sahla"
                className="h-10 w-auto"
                style={{ filter: isLightHero ? "none" : "brightness(0) invert(1)" }}
              />
            </Link>
          </div>

          {/* Right — CTA buttons */}
          <div className="flex items-center gap-3">
            {isSahlaAdmin && (
              <Link
                href="/overview"
                className={`hidden items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-all duration-300 sm:inline-flex ${
                  isLightHero
                    ? "border border-dark-green/20 text-dark-green hover:bg-dark-green/[0.06]"
                    : "border border-white/15 text-white hover:bg-white/[0.06]"
                }`}
              >
                Go to App
                <ArrowRight size={14} />
              </Link>
            )}
            <Link href="/waitlist" className="group relative overflow-hidden rounded-full bg-white px-6 py-2.5 text-[13px] font-semibold text-dark-green transition-all duration-300 hover:shadow-lg hover:shadow-white/15">
              <span className="relative z-10">Join the Waitlist</span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-accent/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Sidebar overlay + panel */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[70] bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSidebarOpen(false)}
            />

            {/* Side panel */}
            <motion.aside
              className="fixed top-0 left-0 z-[80] flex h-full w-[85vw] max-w-[320px] flex-col bg-[#0A261E]"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-sand/[0.06] px-6 py-5">
                <Link href="/" onClick={() => setSidebarOpen(false)} className="transition-opacity duration-300 hover:opacity-80">
                  <img src="/sahla-logo.png" alt="Sahla" className="h-9 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 transition-colors hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="flex flex-col gap-1">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setSidebarOpen(false)}
                        className="group flex items-center justify-between rounded-xl px-3 py-3.5 text-[15px] font-medium text-white/60 transition-all duration-200 hover:bg-white/[0.04] hover:text-white"
                      >
                        {link.label}
                        <ArrowRight size={14} className="text-white/0 transition-all duration-200 group-hover:translate-x-1 group-hover:text-white/30" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Bottom */}
              <div className="border-t border-sand/[0.06] px-6 py-6">
                <Link
                  href="/waitlist"
                  onClick={() => setSidebarOpen(false)}
                  className="flex w-full items-center justify-center rounded-full bg-sand px-6 py-3 text-[13px] font-semibold text-dark-green transition-all duration-300 hover:bg-white"
                >
                  Join the Waitlist
                </Link>

                {isSahlaAdmin && (
                  <Link
                    href="/overview"
                    onClick={() => setSidebarOpen(false)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-sand/15 px-6 py-3 text-[13px] font-semibold text-sand transition-all duration-300 hover:bg-sand/[0.06]"
                  >
                    Go to App
                    <ArrowRight size={14} />
                  </Link>
                )}

                {isLoaded && isSignedIn ? (
                  <button
                    onClick={() => { signOut({ redirectUrl: "/" }); setSidebarOpen(false); }}
                    className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-sand/10 px-6 py-3 text-[13px] font-medium text-sand/50 transition-all duration-300 hover:border-sand/20 hover:text-sand"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                ) : isLoaded ? (
                  <Link
                    href="/login"
                    onClick={() => setSidebarOpen(false)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-sand/10 px-6 py-3 text-[13px] font-medium text-sand/50 transition-all duration-300 hover:border-sand/20 hover:text-sand"
                  >
                    <LogIn size={14} />
                    Sign In
                  </Link>
                ) : null}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
