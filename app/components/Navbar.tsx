import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
      <div className="font-[family-name:var(--font-display)] text-xl tracking-wide text-[#d9c4a0]">
        Sahla
      </div>
      <Link
        href="/login"
        className="rounded-full border border-[#4a8c65]/40 bg-[#1a3a2a]/60 px-5 py-2 text-sm font-medium tracking-wide text-[#f0ebe3] backdrop-blur-sm transition-all hover:bg-[#2d5a3d]/60"
      >
        Log In
      </Link>
    </nav>
  );
}
