"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Plus, Loader2 } from "lucide-react";
import { useToast } from "../../components/ToastProvider";
import { humanizeRequirement } from "@/lib/stripe-requirements";

type StripeStatus = {
  status: "not_connected" | "pending" | "connected" | "issues";
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  requirements?: {
    currently_due: string[];
    past_due: string[];
  };
  business_profile?: {
    name: string | null;
  };
};

const BTN_STRIPE = "flex w-full items-center justify-center gap-2 rounded-xl bg-[#635BFF] py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#5851DB] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40";

export default function StripeConnectPanel({
  mosqueId,
  initialStatus,
  stripeReturn,
}: {
  mosqueId: string;
  initialStatus: StripeStatus;
  stripeReturn?: string;
}) {
  const { showToast } = useToast();
  const [status, setStatus] = useState(initialStatus);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Handle return from Stripe
  useEffect(() => {
    if (stripeReturn === "success" || stripeReturn === "refresh") {
      if (stripeReturn === "refresh") {
        showToast("Stripe session expired, checking status...", "error");
      }
      fetch(`/api/mosques/${mosqueId}/stripe/status`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) {
            setStatus(data);
            if (data.status === "connected") {
              showToast("Stripe account connected!", "success");
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/stripe/connect`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (data.already_connected) {
        setStatus({ ...status, status: "connected", charges_enabled: true });
        showToast("Stripe account is already connected!", "success");
        setConnecting(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      showToast("Failed to initiate Stripe connection", "error");
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/stripe/disconnect`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      setStatus({ status: "not_connected" });
      setShowDisconnectConfirm(false);
      showToast("Stripe disconnected", "success");
    } catch {
      showToast("Failed to disconnect", "error");
    } finally {
      setDisconnecting(false);
    }
  }

  // ─── Not Connected ───
  if (status.status === "not_connected") {
    return (
      <div className="space-y-5">
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
            <p className="text-[14px] font-semibold text-stone-900">Connect Your Stripe Account</p>
            <p className="mt-0.5 text-[12px] text-stone-500">
              Stripe handles payments securely. Donations, paid programs, and ad revenue flow directly to your bank account.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <p className="text-[13px] font-semibold text-stone-900">I have a Stripe account</p>
            <p className="mt-1 text-[12px] text-stone-500">
              You&apos;ll log in to Stripe and authorize the connection. Takes about 2 minutes.
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <Plus size={18} className="text-blue-600" />
            </div>
            <p className="text-[13px] font-semibold text-stone-900">I need to create one</p>
            <p className="mt-1 text-[12px] text-stone-500">
              Stripe will guide you through setup. You&apos;ll need your EIN and bank details. ~10 minutes.
            </p>
          </div>
        </div>

        {/* Nonprofit Callout */}
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-[12px] font-semibold text-amber-900">Nonprofit Discount Available</p>
            <p className="mt-0.5 text-[11px] text-amber-700">
              If your mosque is a 501(c)(3), select &quot;Nonprofit organization&quot; during Stripe setup
              to qualify for reduced processing fees (2.2% vs 2.9%).
            </p>
          </div>
        </div>

        <button onClick={handleConnect} disabled={connecting} className={BTN_STRIPE}>
          {connecting && <Loader2 size={14} className="animate-spin" />}
          {connecting ? "Redirecting to Stripe..." : "Connect with Stripe"}
        </button>
      </div>
    );
  }

  // ─── Pending ───
  if (status.status === "pending") {
    const requirements = status.requirements?.currently_due ?? [];
    return (
      <div className="space-y-5">
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50 shadow-sm">
          <div className="px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-200">
                <AlertCircle size={18} className="text-amber-700" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-amber-900">Stripe Setup Incomplete</p>
                <p className="mt-0.5 text-[12px] text-amber-700">
                  Complete your Stripe onboarding to start accepting payments.
                </p>
              </div>
            </div>
            {requirements.length > 0 && (
              <div className="mt-4 border-t border-amber-200/60 pt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-800">Still needed</p>
                <ul className="space-y-1.5">
                  {[...new Set(requirements.map(humanizeRequirement))].map((req) => (
                    <li key={req} className="flex items-center gap-2 text-[12px] text-amber-700">
                      <span className="h-1 w-1 rounded-full bg-amber-500" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <button onClick={handleConnect} disabled={connecting} className={BTN_STRIPE}>
          {connecting && <Loader2 size={14} className="animate-spin" />}
          {connecting ? "Redirecting..." : "Continue Setup on Stripe"}
        </button>
      </div>
    );
  }

  // ─── Connected ───
  if (status.status === "connected") {
    return (
      <div className="space-y-5">
        <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 shadow-sm">
          <div className="px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-200">
                <CheckCircle2 size={18} className="text-emerald-700" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-emerald-900">Stripe Account Connected</p>
                {status.business_profile?.name && (
                  <p className="mt-0.5 text-[12px] text-emerald-700">{status.business_profile.name}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-[12px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-700">Charges enabled</span>
              </div>
              {status.payouts_enabled && (
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700">Payouts enabled</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white px-6 py-5 text-[12px] text-stone-500 shadow-sm">
          <p>
            Your mosque can now receive donations, program payments, and business ad revenue
            through the app. Funds are deposited directly to your bank account via Stripe.
          </p>
        </div>

        {/* Disconnect */}
        {showDisconnectConfirm ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="mb-3 text-[12px] text-red-700">
              Are you sure? This will disable all payments through the app. Your Stripe account
              will not be deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[12px] font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {disconnecting && <Loader2 size={12} className="animate-spin" />}
                {disconnecting ? "Disconnecting..." : "Yes, Disconnect"}
              </button>
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                className="rounded-lg px-4 py-2 text-[12px] font-medium text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDisconnectConfirm(true)}
            className="text-[11px] text-stone-400 transition-colors hover:text-red-500"
          >
            Disconnect Stripe account
          </button>
        )}
      </div>
    );
  }

  // ─── Issues ───
  const pastDue = status.requirements?.past_due ?? [];
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-red-200 bg-red-50 shadow-sm">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-200">
              <AlertTriangle size={18} className="text-red-700" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-red-900">Stripe Account Needs Attention</p>
              <p className="mt-0.5 text-[12px] text-red-700">
                Stripe requires additional information to keep your account active.
              </p>
            </div>
          </div>
          {pastDue.length > 0 && (
            <div className="mt-4 border-t border-red-200/60 pt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-red-800">Action required</p>
              <ul className="space-y-1.5">
                {[...new Set(pastDue.map(humanizeRequirement))].map((req) => (
                  <li key={req} className="flex items-center gap-2 text-[12px] text-red-700">
                    <span className="h-1 w-1 rounded-full bg-red-500" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <button onClick={handleConnect} disabled={connecting} className={BTN_STRIPE}>
        {connecting && <Loader2 size={14} className="animate-spin" />}
        {connecting ? "Redirecting..." : "Resolve Issues on Stripe"}
      </button>
    </div>
  );
}
