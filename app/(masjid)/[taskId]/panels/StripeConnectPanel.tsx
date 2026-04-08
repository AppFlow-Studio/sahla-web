"use client";

import { useState, useEffect } from "react";
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
      <div className="space-y-6">
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <p className="text-[14px] font-semibold text-stone-900">Connect Your Stripe Account</p>
          <p className="mt-1 text-[13px] text-stone-500">
            Stripe handles all payment processing securely. Donations, paid programs, and business
            ad payments will flow directly to your mosque&apos;s bank account.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-stone-900">I have a Stripe account</p>
            <p className="mt-1 text-[11px] text-stone-400">
              You&apos;ll log in to Stripe and authorize the connection. Takes about 2 minutes.
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-stone-900">I need to create one</p>
            <p className="mt-1 text-[11px] text-stone-400">
              Stripe will guide you through setup. You&apos;ll need your EIN and bank details. ~10 minutes.
            </p>
          </div>
        </div>

        {/* Nonprofit Callout */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[12px] font-medium text-amber-800">Nonprofit Discount Available</p>
          <p className="mt-1 text-[11px] text-amber-700">
            If your mosque is a 501(c)(3), select &quot;Nonprofit organization&quot; during Stripe
            setup to qualify for reduced processing fees (2.2% vs 2.9%).
          </p>
        </div>

        <button
          onClick={handleConnect}
          disabled={connecting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#635BFF] py-3 text-[14px] font-semibold text-white hover:bg-[#5851DB] disabled:opacity-40 transition-colors"
        >
          {connecting ? "Redirecting to Stripe..." : "Connect with Stripe"}
        </button>
      </div>
    );
  }

  // ─── Pending ───
  if (status.status === "pending") {
    const requirements = status.requirements?.currently_due ?? [];
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-200">
              <svg className="h-4 w-4 text-amber-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-amber-900">Stripe Setup Incomplete</p>
              <p className="mt-0.5 text-[12px] text-amber-700">
                Complete your Stripe onboarding to start accepting payments.
              </p>
            </div>
          </div>
          {requirements.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-medium text-amber-800 mb-2">Still needed:</p>
              <ul className="space-y-1">
                {[...new Set(requirements.map(humanizeRequirement))].map((req) => (
                  <li key={req} className="text-[11px] text-amber-700 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-amber-400" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#635BFF] py-3 text-[14px] font-semibold text-white hover:bg-[#5851DB] disabled:opacity-40 transition-colors"
        >
          {connecting ? "Redirecting..." : "Continue Setup on Stripe"}
        </button>
      </div>
    );
  }

  // ─── Connected ───
  if (status.status === "connected") {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-200">
              <svg className="h-4 w-4 text-emerald-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-emerald-900">Stripe Account Connected</p>
              {status.business_profile?.name && (
                <p className="mt-0.5 text-[12px] text-emerald-700">{status.business_profile.name}</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-[12px]">
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

        <div className="rounded-xl border border-stone-200 bg-white p-5 text-[12px] text-stone-500">
          <p>
            Your mosque can now receive donations, program payments, and business ad revenue
            through the app. Funds are deposited directly to your bank account via Stripe.
          </p>
        </div>

        {/* Disconnect */}
        {showDisconnectConfirm ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-[12px] text-red-700 mb-3">
              Are you sure? This will disable all payments through the app. Your Stripe account
              will not be deleted.
            </p>
            <div className="flex gap-2">
              <button onClick={handleDisconnect} disabled={disconnecting}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-red-700 disabled:opacity-40">
                {disconnecting ? "Disconnecting..." : "Yes, Disconnect"}
              </button>
              <button onClick={() => setShowDisconnectConfirm(false)}
                className="rounded-lg border border-stone-300 px-4 py-1.5 text-[12px] text-stone-600 hover:bg-stone-50">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDisconnectConfirm(true)}
            className="text-[11px] text-stone-400 hover:text-red-500 transition-colors"
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
    <div className="space-y-6">
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-200">
            <svg className="h-4 w-4 text-red-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-red-900">Stripe Account Needs Attention</p>
            <p className="mt-0.5 text-[12px] text-red-700">
              Stripe requires additional information to keep your account active.
            </p>
          </div>
        </div>
        {pastDue.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-medium text-red-800 mb-2">Action required:</p>
            <ul className="space-y-1">
              {[...new Set(pastDue.map(humanizeRequirement))].map((req) => (
                <li key={req} className="text-[11px] text-red-700 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-red-400" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#635BFF] py-3 text-[14px] font-semibold text-white hover:bg-[#5851DB] disabled:opacity-40 transition-colors"
      >
        {connecting ? "Redirecting..." : "Resolve Issues on Stripe"}
      </button>
    </div>
  );
}
