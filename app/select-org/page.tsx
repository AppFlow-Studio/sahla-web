"use client";

import { OrganizationList, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function SelectOrgPage() {
  const { orgId } = useAuth();
  const hasRedirected = useRef(false);

  // Redirect once an org is active (either already set on mount, or just selected)
  useEffect(() => {
    if (orgId && !hasRedirected.current) {
      hasRedirected.current = true;
      window.location.href = "/dashboard";
    }
  }, [orgId]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f8f6f1]">
      {/* Subtle top accent */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-dark-green via-accent to-dark-green" />

      {/* Subtle pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%230A261E' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative flex w-full max-w-[420px] flex-col items-center px-6">
        {/* Logo */}
        <Link href="/" className="mb-4 transition-opacity duration-300 hover:opacity-80">
          <img src="/sahla-logo.png" alt="Sahla" className="h-16 w-auto" />
        </Link>

        <p className="mb-8 text-[13px] tracking-wide text-dark-green/40">Select your organization to continue</p>

        {/* Divider */}
        <div className="mb-8 flex w-full items-center gap-4">
          <div className="h-[1px] flex-1 bg-dark-green/8" />
          <div className="h-1 w-1 rotate-45 bg-dark-green/15" />
          <div className="h-[1px] flex-1 bg-dark-green/8" />
        </div>

        <OrganizationList
          hidePersonal={true}
          appearance={{
            variables: {
              colorPrimary: "#0A261E",
              colorText: "#0A261E",
              colorTextSecondary: "rgba(10,38,30,0.5)",
              colorBackground: "#ffffff",
              colorInputBackground: "#f8f6f1",
              colorInputText: "#0A261E",
              colorNeutral: "#0A261E",
              colorTextOnPrimaryBackground: "#fffbf2",
            },
            elements: {
              card: {
                backgroundColor: "#ffffff",
                border: "1px solid rgba(10,38,30,0.06)",
                borderRadius: "16px",
                boxShadow: "0 1px 3px rgba(10,38,30,0.04), 0 12px 40px -12px rgba(10,38,30,0.08)",
              },
              organizationListPreviewButton: {
                borderRadius: "12px",
              },
            },
          }}
        />

        {/* Footer */}
        <p className="mt-10 text-[11px] text-dark-green/25">&copy; 2026 Sahla</p>
      </div>
    </div>
  );
}
