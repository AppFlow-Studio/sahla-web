import Link from "next/link";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const links = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "Case Study", href: "/customers/mas-si" },
  { label: "Waitlist", href: "/waitlist" },
];

export default function NotFound() {
  return (
    <div
      className={`${playfair.variable} flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center`}
      style={{
        backgroundColor: "#FFFBF2",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <p
        className="text-[13px] font-semibold uppercase tracking-[0.25em]"
        style={{ color: "#0A261E", opacity: 0.5 }}
      >
        404
      </p>
      <h1
        className="font-[family-name:var(--font-playfair)] text-[40px] leading-tight sm:text-[56px]"
        style={{ color: "#0A261E" }}
      >
        This page went missing
      </h1>
      <p
        className="max-w-md text-[15px] leading-relaxed"
        style={{ color: "#0A261E", opacity: 0.7 }}
      >
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Here are a few places to go instead.
      </p>
      <nav className="mt-2 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[14px] font-medium">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="underline-offset-4 transition-opacity hover:opacity-70 hover:underline"
            style={{ color: "#0A261E" }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
