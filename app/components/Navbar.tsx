import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="absolute top-0 right-0 left-0 z-50 flex items-center justify-between px-8 py-5">
      <div className="font-[family-name:var(--font-display)] text-xl tracking-wide text-dark-green">
        Sahla
      </div>
      <Link
        href="/login"
        className="rounded-full border border-dark-green/15 bg-surface px-5 py-2 text-sm font-medium tracking-wide text-dark-green shadow-sm transition-all hover:border-dark-green/25 hover:shadow-md"
      >
        Log In
      </Link>
    </nav>
  );
}
