"use client";

import { useState } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandPaletteProvider } from "./CommandPalette";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNavDrawer from "./MobileNavDrawer";

export default function CrmShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <TooltipProvider delay={120}>
      <CommandPaletteProvider>
        <div className="flex min-h-screen bg-[#fffbf2] text-[#0A261E]">
          <Sidebar />
          <MobileNavDrawer open={mobileOpen} onOpenChange={setMobileOpen} />

          <div className="flex min-h-screen min-w-0 flex-1 flex-col">
            <TopBar onOpenMobileNav={() => setMobileOpen(true)} />
            <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
              <div className="mx-auto w-full max-w-[1400px]">{children}</div>
            </main>
          </div>

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
  );
}
