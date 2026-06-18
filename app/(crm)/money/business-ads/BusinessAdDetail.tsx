"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Megaphone,
  MapPin,
  Mail,
  Phone,
  User,
  Receipt,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Ban,
  Check,
  X,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatMoneyCents,
  formatUsd,
  fullDate,
  durationSince,
} from "../../_lib/format";
import { PLACEMENT_LABELS } from "./BusinessAdForm";
import type { BusinessAd } from "../../_hooks/useBusinessAds";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Shared layoutId so the card image morphs into the detail hero. */
export const adImageLayoutId = (id: string) => `biz-ad-image-${id}`;

/** Ad lifecycle status → badge. Shared with the cards list. */
export const STATUS_META: Record<string, { label: string; className: string }> = {
  pending_payment: { label: "Awaiting payment", className: "bg-[#0A261E]/[0.06] text-[#0A261E]/55" },
  submitted: { label: "Needs review", className: "bg-amber-100 text-amber-700" },
  approved: { label: "Live", className: "bg-emerald-100 text-emerald-700" },
  past_due: { label: "Past due", className: "bg-red-100 text-red-700" },
  canceled: { label: "Canceled", className: "bg-[#0A261E]/[0.06] text-[#0A261E]/55" },
  declined: { label: "Declined", className: "bg-red-100 text-red-700" },
};

/** Billing (subscription) status → label. */
const SUB_STATUS_META: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-100 text-emerald-700" },
  past_due: { label: "Past due", className: "bg-red-100 text-red-700" },
  canceled: { label: "Canceled", className: "bg-[#0A261E]/[0.06] text-[#0A261E]/55" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
};

type Props = {
  ad: BusinessAd;
  onClose: () => void;
  onEdit: (ad: BusinessAd) => void;
  onApprove: (ad: BusinessAd) => void;
  onDecline: (ad: BusinessAd) => void;
  onCancel: (ad: BusinessAd) => void;
  onDelete: (ad: BusinessAd) => void;
};

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[#0A261E]/8 bg-white px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#0A261E]/45">
        {label}
      </p>
      <p className="mt-2 font-display text-[24px] leading-none text-[#0A261E]">
        {value}
      </p>
      {sub ? <p className="mt-1.5 text-[11px] text-[#0A261E]/50">{sub}</p> : null}
    </div>
  );
}

export default function BusinessAdDetail({
  ad,
  onClose,
  onEdit,
  onApprove,
  onDecline,
  onCancel,
  onDelete,
}: Props) {
  const statusMeta = STATUS_META[ad.status];
  const subMeta = ad.subscriptionStatus
    ? SUB_STATUS_META[ad.subscriptionStatus]
    : null;

  // Esc to close + lock background scroll while the page is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Page background fades in/out independently of the morphing image. */}
      <motion.div
        className="fixed inset-0 bg-[#fffbf2]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
      />

      <div className="relative mx-auto max-w-3xl px-5 pb-24 pt-6">
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: EASE, delay: 0.05 }}
          className="mb-5 flex items-center justify-between gap-3"
        >
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-[#0A261E]/70 transition-colors hover:bg-[#0A261E]/[0.05] hover:text-[#0A261E]"
          >
            <ArrowLeft size={16} /> Business Ads
          </button>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(ad)}>
              <Pencil size={13} /> Edit
            </Button>
            {ad.status === "submitted" ? (
              <>
                <Button
                  size="sm"
                  onClick={() => onApprove(ad)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check size={13} /> Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDecline(ad)}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X size={13} /> Decline
                </Button>
              </>
            ) : null}
            {ad.status === "approved" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(ad)}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Ban size={13} /> Take down
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(ad)}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 size={13} /> Remove
            </Button>
          </div>
        </motion.div>

        {/* Hero — shared element that morphs from the card image */}
        {ad.imageUrl ? (
          <motion.img
            layoutId={adImageLayoutId(ad.id)}
            src={ad.imageUrl}
            alt={ad.businessName}
            transition={{ duration: 0.45, ease: EASE }}
            className="aspect-video w-full rounded-2xl object-cover shadow-[0_20px_60px_-24px_rgba(10,38,30,0.35)]"
          />
        ) : (
          <motion.div
            layoutId={adImageLayoutId(ad.id)}
            transition={{ duration: 0.45, ease: EASE }}
            className="flex aspect-video w-full items-center justify-center rounded-2xl bg-[#0A261E]/[0.04] text-[#0A261E]/35"
          >
            <Megaphone size={40} />
          </motion.div>
        )}

        {/* Everything below the image fades up after the morph */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, ease: EASE, delay: 0.08 }}
          className="mt-6 space-y-7"
        >
          {/* Title + status */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[28px] leading-tight text-[#0A261E]">
                {ad.businessName}
              </h1>
              {statusMeta ? (
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${statusMeta.className}`}
                >
                  {statusMeta.label}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-[13px] text-[#0A261E]/55">
              Added {fullDate(ad.createdAt)}
              {ad.placement
                ? ` · ${PLACEMENT_LABELS[ad.placement] ?? ad.placement}`
                : ""}
            </p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric
              label="Revenue"
              value={formatUsd(Math.round(ad.totalPaidCents / 100))}
              sub={`${ad.paymentCount} ${ad.paymentCount === 1 ? "payment" : "payments"}`}
            />
            <Metric
              label="Subscribed for"
              value={durationSince(ad.subscribedSince)}
              sub={
                ad.subscribedSince
                  ? `since ${fullDate(ad.subscribedSince)}`
                  : "no subscription"
              }
            />
            <Metric
              label="Last payment"
              value={ad.lastPaymentAt ? fullDate(ad.lastPaymentAt) : "—"}
              sub={ad.lastPaymentAt ? "most recent invoice" : "never paid"}
            />
          </div>

          {/* Billing status */}
          <div className="rounded-xl border border-[#0A261E]/8">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="flex items-center gap-2 text-[13px] text-[#0A261E]">
                <CalendarClock size={15} className="text-[#0A261E]/45" />
                Billing
              </span>
              {subMeta ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${subMeta.className}`}
                >
                  {subMeta.label}
                </span>
              ) : (
                <span className="text-[12px] text-[#0A261E]/45">No subscription</span>
              )}
            </div>
            {ad.hasMissedPayment ? (
              <div className="flex items-start gap-2 border-t border-[#0A261E]/8 bg-red-50/60 px-4 py-3 text-[12.5px] text-red-700">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>
                  Last payment failed — the subscription is past due. It&apos;s in
                  Stripe&apos;s grace period before automatic cancellation.
                </span>
              </div>
            ) : ad.subscriptionStatus === "active" ? (
              <div className="flex items-center gap-2 border-t border-[#0A261E]/8 px-4 py-3 text-[12.5px] text-emerald-700">
                <CheckCircle2 size={15} className="shrink-0" />
                Payments are up to date.
              </div>
            ) : null}
          </div>

          {/* Payment history */}
          <div>
            <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0A261E]/45">
              <Receipt size={12} /> Payment history
            </p>
            {ad.payments.length > 0 ? (
              <ul className="divide-y divide-[#0A261E]/6 rounded-xl border border-[#0A261E]/8 bg-white">
                {ad.payments.map((p) => {
                  const failed = p.status !== "paid";
                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-[12.5px]"
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${
                            failed
                              ? "bg-red-100 text-red-700"
                              : p.kind === "first"
                              ? "bg-[#fffbf2] text-[#B8922A]"
                              : "bg-[#0A261E]/[0.06] text-[#0A261E]/65"
                          }`}
                        >
                          {failed ? "Failed" : p.kind === "first" ? "First" : "Renewal"}
                        </span>
                        <span className="text-[#0A261E]/55">{fullDate(p.paidAt)}</span>
                      </span>
                      <span
                        className={`font-semibold ${
                          failed ? "text-red-700 line-through" : "text-[#0A261E]"
                        }`}
                      >
                        {formatMoneyCents(p.amountCents, p.currency)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed border-[#0A261E]/12 px-4 py-6 text-center text-[12.5px] text-[#0A261E]/45">
                No payments recorded yet.
              </p>
            )}
          </div>

          {/* Contact */}
          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0A261E]/45">
              Contact
            </p>
            <div className="space-y-2 rounded-xl border border-[#0A261E]/8 bg-white px-4 py-3.5 text-[13px] text-[#0A261E]/70">
              {ad.contactName ? (
                <p className="flex items-center gap-2.5">
                  <User size={13} className="shrink-0 text-[#0A261E]/40" />
                  {ad.contactName}
                </p>
              ) : null}
              {ad.businessAddress ? (
                <p className="flex items-start gap-2.5">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-[#0A261E]/40" />
                  <span>{ad.businessAddress}</span>
                </p>
              ) : null}
              {ad.contactEmail ? (
                <p className="flex items-center gap-2.5">
                  <Mail size={13} className="shrink-0 text-[#0A261E]/40" />
                  {ad.contactEmail}
                </p>
              ) : null}
              {ad.contactPhone ? (
                <p className="flex items-center gap-2.5">
                  <Phone size={13} className="shrink-0 text-[#0A261E]/40" />
                  {ad.contactPhone}
                </p>
              ) : null}
              {!ad.contactName &&
              !ad.businessAddress &&
              !ad.contactEmail &&
              !ad.contactPhone ? (
                <p className="text-[#0A261E]/40">No contact details on file.</p>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
