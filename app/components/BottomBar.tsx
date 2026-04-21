"use client";

export default function BottomBar() {
  return (
    <footer className="relative bg-[#fffbf2]">
      {/* Decorative top line */}
      <div className="absolute top-0 left-1/2 h-[1px] w-32 -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent, rgba(10,38,30,0.08), transparent)" }} />

      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-dark-green to-dark-green/90">
              <span className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>S</span>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-white/10" />
            </div>
            <span className="font-[family-name:var(--font-display)] text-lg tracking-wide text-dark-green/70">Sahla</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8">
            <a href="#showcase" className="text-[13px] text-dark-green/30 transition-colors duration-300 hover:text-dark-green/60">Features</a>
            <a href="#how-it-works" className="text-[13px] text-dark-green/30 transition-colors duration-300 hover:text-dark-green/60">How It Works</a>
            <a href="/login" className="text-[13px] text-dark-green/30 transition-colors duration-300 hover:text-dark-green/60">Get Started</a>
          </div>

          {/* Copyright */}
          <span className="text-[11px] tracking-wide text-dark-green/20">&copy; 2026 Sahla. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
