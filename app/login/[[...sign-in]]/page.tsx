import { SignIn } from "@clerk/nextjs";
import Link from "next/link";


export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-dark-green">
      {/* Gradient overlay — matching hero */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(26,107,66,0.4) 0%, transparent 55%), " +
            "radial-gradient(ellipse at 20% 80%, rgba(154,123,46,0.1) 0%, transparent 45%), " +
            "radial-gradient(circle at 80% 70%, rgba(26,107,66,0.12) 0%, transparent 40%)",
        }}
      />

      {/* Geometric pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0L80 40L40 80L0 40Z' fill='none' stroke='%23fff' stroke-width='0.5'/%3E%3Cpath d='M40 10L70 40L40 70L10 40Z' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3Ccircle cx='40' cy='40' r='15' fill='none' stroke='%23fff' stroke-width='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "220px 220px",
        }}
      />

      {/* Gold hairline at top */}
      <div className="absolute top-0 right-0 left-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent 0%, #B8922A 30%, #d4af37 50%, #B8922A 70%, transparent 100%)" }} />

      <div className="relative z-10 flex flex-col items-center gap-10">
        {/* Arabic logo */}
        <Link href="/" className="transition-opacity duration-300 hover:opacity-80">
          <img src="/sahla-logo.png" alt="Sahla" className="h-14 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
        </Link>

        {/* Diamond divider */}
        <div className="flex items-center gap-3.5">
          <div className="h-[1px] w-10" style={{ background: "linear-gradient(90deg, transparent, rgba(217,196,160,0.5))" }} />
          <div className="h-1.5 w-1.5 rotate-45 bg-gold" />
          <div className="h-[1px] w-10" style={{ background: "linear-gradient(90deg, rgba(217,196,160,0.5), transparent)" }} />
        </div>

        <SignIn
          routing="path"
          path="/login"
          fallbackRedirectUrl="/launch"
          appearance={{
            variables: {
              colorPrimary: "#fffbf2",
              colorText: "#fffbf2",
              colorTextSecondary: "rgba(255,251,242,0.6)",
              colorBackground: "#0e2b22",
              colorInputBackground: "rgba(255,251,242,0.1)",
              colorInputText: "#fffbf2",
              colorNeutral: "#fffbf2",
              colorTextOnPrimaryBackground: "#0A261E",
            },
            elements: {
              footerAction: { display: "none" },
              card: {
                backgroundColor: "#0e2b22",
                border: "1px solid rgba(217,196,160,0.15)",
                borderRadius: "20px",
                boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)",
              },
              headerTitle: {
                color: "#fffbf2",
              },
              headerSubtitle: {
                color: "rgba(255,251,242,0.55)",
              },
              socialButtonsBlockButton: {
                backgroundColor: "rgba(255,251,242,0.06)",
                border: "1px solid rgba(255,251,242,0.1)",
                color: "#fffbf2",
                borderRadius: "12px",
              },
              socialButtonsBlockButtonText: {
                color: "rgba(255,251,242,0.8)",
              },
              formFieldLabel: {
                color: "rgba(255,251,242,0.7)",
              },
              formFieldInput: {
                backgroundColor: "rgba(255,251,242,0.1)",
                border: "1px solid rgba(255,251,242,0.15)",
                color: "#fffbf2",
                borderRadius: "12px",
              },
              formFieldInput__identifier: {
                color: "#fffbf2",
              },
              formButtonPrimary: {
                background: "#fffbf2",
                color: "#0A261E",
                borderRadius: "999px",
                fontWeight: "600",
                boxShadow: "0 20px 40px -16px rgba(255,251,242,0.18)",
              },
              dividerLine: {
                backgroundColor: "rgba(217,196,160,0.15)",
              },
              dividerText: {
                color: "rgba(255,251,242,0.4)",
              },
              identityPreview: {
                backgroundColor: "rgba(255,251,242,0.06)",
                borderColor: "rgba(255,251,242,0.1)",
              },
              identityPreviewText: {
                color: "#fffbf2",
              },
              identityPreviewEditButton: {
                color: "#d4af37",
              },
              formFieldAction: {
                color: "#d4af37",
              },
              footerActionLink: {
                color: "#d4af37",
              },
              alert: {
                color: "#fffbf2",
              },
              alertText: {
                color: "#fffbf2",
              },
              otpCodeFieldInput: {
                backgroundColor: "rgba(255,251,242,0.06)",
                border: "1px solid rgba(255,251,242,0.12)",
                color: "#fffbf2",
              },
              formResendCodeLink: {
                color: "#d4af37",
              },
              backLink: {
                color: "#d4af37",
              },
            },
          }}
        />
      </div>
    </div>
  );
}
