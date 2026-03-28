import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import Starfield from "../../components/Starfield";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#040a07]">
      <Starfield />

      {/* Nebula gradient */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute top-1/2 left-1/2 h-[120vh] w-[120vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(26,58,42,0.2) 0%, rgba(13,31,21,0.1) 30%, transparent 60%)",
          }}
        />
      </div>

      <div className="z-10 flex flex-col items-center gap-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-[#d9c4a0]"
        >
          Sahla
        </Link>
        <SignIn
          routing="path"
          path="/login"
          fallbackRedirectUrl="/overview"
          appearance={{
            elements: {
              footerAction: { display: "none" },
            },
          }}
        />
      </div>
    </div>
  );
}
