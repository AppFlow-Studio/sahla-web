import Link from "next/link";
import { Check, ArrowRight, MessageSquareText, ExternalLink, LayoutDashboard } from "lucide-react";

const FEATURES = [
  "Members directory with last-active + push status",
  "Programs & Events with capacity + paid RSVPs",
  "Donations dashboard with anonymized top donors",
  "Notifications + reusable templates",
  "Speaker registry shared across the app",
  "Real-time activity feed of everything happening",
];

export default function NoCrmAccessPage() {
  return (
    <div className="min-h-screen bg-[#fffbf2] text-[#0A261E]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #0A261E 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 py-16">
        <div className="w-full overflow-hidden rounded-3xl border border-[#0A261E]/8 bg-white shadow-[0_18px_40px_-20px_rgba(10,38,30,0.18)]">
          <div className="bg-[#0A261E] px-8 py-10 text-[#fffbf2] md:px-10 md:py-12">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[#B8922A]">
              Upgrade required
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight text-[#E8D5B0] md:text-[34px]">
              The CRM lives on the Core + CRM plan
            </h1>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[#fffbf2]/75">
              Your current Sahla plan is{" "}
              <span className="font-semibold text-[#fffbf2]">Sahla Core</span> — your mosque app
              is fully live, but the admin dashboard is part of the Core + CRM tier at{" "}
              <span className="font-semibold text-[#fffbf2]">$325/mo</span>.
            </p>
          </div>

          <div className="px-8 py-8 md:px-10 md:py-10">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/55">
              What you get with Core + CRM
            </h2>
            <ul className="mt-4 grid gap-2 md:grid-cols-2">
              {FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-[13.5px] text-[#0A261E]/85"
                >
                  <Check
                    size={14}
                    strokeWidth={2.5}
                    className="mt-0.5 shrink-0 text-[#B8922A]"
                  />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 md:flex-row">
              <a
                href="https://billing.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0A261E] px-4 py-3 text-[13px] font-semibold text-[#fffbf2] transition-opacity hover:opacity-90"
              >
                Upgrade in Stripe
                <ExternalLink size={13} />
              </a>
              <Link
                href="/dashboard"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#0A261E]/12 bg-white px-4 py-3 text-[13px] font-semibold text-[#0A261E] transition-colors hover:bg-[#fffbf2]"
              >
                <LayoutDashboard size={13} />
                Back to mosque dashboard
              </Link>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[#0A261E]/8 pt-5 text-[12px] text-[#0A261E]/55">
              <a
                href="mailto:support@sahla.co"
                className="inline-flex items-center gap-1.5 hover:text-[#0A261E]"
              >
                <MessageSquareText size={12} />
                Questions? support@sahla.co
              </a>
              <Link href="/" className="inline-flex items-center gap-1.5 hover:text-[#0A261E]">
                Back to Sahla
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
