"use client";

import { useState } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandPaletteProvider } from "./CommandPalette";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNavDrawer from "./MobileNavDrawer";
import FirstLoginTour from "./FirstLoginTour";
import { MosqueProvider } from "./MosqueProvider";
import BinaryBuildBanner from "./BinaryBuildBanner";
import type { MosqueProfile } from "../_lib/getCurrentMosque";

export default function CrmShell({
  mosque,
  children,
}: {
  mosque: MosqueProfile;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <MosqueProvider mosque={mosque}>
    <TooltipProvider delay={120}>
      <CommandPaletteProvider>
        <div
          className="relative flex min-h-screen bg-[#fffbf2] text-[#0A261E]"
          // Expose the mosque's brand colors as CSS vars so any descendant
          // (sidebar accents, badges, etc.) can recolor without prop-drilling.
          // Falls back to the Sahla default palette if the mosque hasn't
          // overridden them.
          style={
            {
              "--mosque-primary": mosque.primaryColor,
              "--mosque-accent": mosque.accentColor,
            } as React.CSSProperties
          }
        >
          {/* Subtle background grain — sits on the cream main canvas */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, #0A261E 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          />

          <Sidebar />
          <MobileNavDrawer open={mobileOpen} onOpenChange={setMobileOpen} />

          <div className="relative z-10 flex min-h-screen min-w-0 flex-1 flex-col">
            <BinaryBuildBanner />
            <TopBar onOpenMobileNav={() => setMobileOpen(true)} />
            <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
              <div className="mx-auto w-full max-w-[1400px]">{children}</div>
            </main>
          </div>

          <FirstLoginTour />

          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#FFFFFF",
                border: "1px solid rgba(10,38,30,0.08)",
                color: "#0A261E",
                fontSize: "13px",
              },
            }}
          />
        </div>
      </CommandPaletteProvider>
    </TooltipProvider>
    </MosqueProvider>
  );
}
