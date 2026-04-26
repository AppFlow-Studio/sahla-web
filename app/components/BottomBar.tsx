"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export default function BottomBar() {
  const { isLoaded, isSignedIn, orgId } = useAuth();
  const isSahlaAdmin =
    isLoaded &&
    isSignedIn &&
    !!orgId &&
    orgId === process.env.NEXT_PUBLIC_SAHLA_ORG_ID;

  return (
    <footer className="border-t border-sand/5 bg-[#050f0b] px-5 py-12 pb-10 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-[1200px]">
        {/* Top grid */}
        <div className="mb-14 grid gap-8 sm:grid-cols-2 sm:gap-12 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Intro */}
          <div>
            <div className="mb-3.5 flex items-center gap-3">
              <Image src={'/sahla-logo-arabic.svg'} alt='Sahla Logo' width={40} height={40} className="grid h-9 w-9 place-items-center rounded-[10px] font-[family-name:var(--font-display)] text-base text-sand shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_12px_rgba(26,107,66,0.35)]" style={{ background: "linear-gradient(135deg, #1a6b42, #2d5a3d)" }} />
               
              <span className="font-[family-name:var(--font-display)] text-[22px] tracking-[0.01em] text-sand">Sahla</span>
            </div>
            <p className="mt-4 max-w-[300px] text-[13.5px] leading-[1.7] text-sand/40">
              Fully branded iOS and Android apps for mosques. Your name in the App Store, your colors, your community.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-[18px] text-[12px] font-semibold uppercase tracking-[0.18em] text-sand/45">Product</h4>
            <div className="flex flex-col">
              <Link href="/why-sahla" className="py-[5px] text-[13.5px] text-sand/60 transition-colors duration-200 hover:text-sand">Why Sahla</Link>
              <Link href="/pricing" className="py-[5px] text-[13.5px] text-sand/60 transition-colors duration-200 hover:text-sand">Pricing</Link>
              <Link href="/faq" className="py-[5px] text-[13.5px] text-sand/60 transition-colors duration-200 hover:text-sand">FAQ</Link>
              <Link href="/customers/mas-si" className="py-[5px] text-[13.5px] text-sand/60 transition-colors duration-200 hover:text-sand">Case Study</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-[18px] text-[12px] font-semibold uppercase tracking-[0.18em] text-sand/45">Company</h4>
            <div className="flex flex-col">
              <Link href="/about" className="py-[5px] text-[13.5px] text-sand/60 transition-colors duration-200 hover:text-sand">About</Link>
              <Link href="/contact" className="py-[5px] text-[13.5px] text-sand/60 transition-colors duration-200 hover:text-sand">Contact</Link>
              <Link href="/waitlist" className="py-[5px] text-[13.5px] text-sand/60 transition-colors duration-200 hover:text-sand">Join the Waitlist</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-[18px] text-[12px] font-semibold uppercase tracking-[0.18em] text-sand/45">Legal</h4>
            <div className="flex flex-col">
              <Link href="/privacy" className="py-[5px] text-[13.5px] text-sand/60 transition-colors duration-200 hover:text-sand">Privacy Policy</Link>
              <Link href="/terms" className="py-[5px] text-[13.5px] text-sand/60 transition-colors duration-200 hover:text-sand">Terms of Service</Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-sand/5 pt-7 text-[12px] text-sand/30">
          <span>&copy; 2026 Sahla. All rights reserved.</span>
          <div className="flex items-center gap-[22px]">
            <Link href="/privacy" className="transition-colors duration-200 hover:text-sand/60">Privacy</Link>
            <Link href="/terms" className="transition-colors duration-200 hover:text-sand/60">Terms</Link>
            {isSahlaAdmin && (
              <Link
                href="/overview"
                className="text-sand/25 transition-colors duration-200 hover:text-sand/60"
              >
                Admin
              </Link>
            )}
            {isLoaded && !isSignedIn && (
              <Link
                href="/login"
                className="text-sand/25 transition-colors duration-200 hover:text-sand/60"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
