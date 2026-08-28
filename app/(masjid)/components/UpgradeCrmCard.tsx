import { Check, MessageSquareText } from "lucide-react";
import BillingPortalButton from "@/app/components/BillingPortalButton";

const FEATURES = [
  "Members directory with last-active + push status",
  "Programs & Events with capacity + paid RSVPs",
  "Donations dashboard with anonymized top donors",
  "Notifications + reusable templates",
  "Speaker registry shared across the app",
  "Real-time activity feed of everything happening",
];

/**
 * Upsell for mosques on the Core plan (app only, no CRM). Sends them into the
 * Stripe billing portal to switch plans — the same portal the CRM's
 * subscription settings use, reachable here without CRM access.
 */
export default function UpgradeCrmCard({
  mosqueId,
  priceLabel,
}: {
  mosqueId: string;
  /** Formatted monthly price of the Core + CRM plan, e.g. "$325". */
  priceLabel: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="bg-[#0A261E] px-6 py-6 text-[#fffbf2]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B8922A]">
          Optional upgrade
        </p>
        <p className="mt-1.5 text-[17px] font-semibold text-[#E8D5B0]">
          Add the admin dashboard
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#fffbf2]/70">
          You&apos;re on <span className="font-semibold text-[#fffbf2]">Sahla Core</span> — the
          app itself. The CRM lets you run it from the web: members, donations, prayer
          times, and notifications
          {priceLabel ? (
            <>
              {" "}
              — <span className="font-semibold text-[#fffbf2]">{priceLabel}/mo</span>
            </>
          ) : null}
          .
        </p>
      </div>

      <div className="px-6 py-5">
        <ul className="grid gap-2 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[12.5px] text-stone-600">
              <Check size={13} strokeWidth={2.5} className="mt-0.5 shrink-0 text-[#B8922A]" />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <BillingPortalButton
            mosqueId={mosqueId}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0A261E] px-4 py-2.5 text-[13px] font-semibold text-[#fffbf2] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <a
            href="mailto:support@sahla.co?subject=Adding%20the%20CRM%20to%20our%20plan"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-stone-200 px-4 py-2.5 text-[13px] font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-900"
          >
            <MessageSquareText size={13} />
            Ask a question
          </a>
        </div>
      </div>
    </div>
  );
}
