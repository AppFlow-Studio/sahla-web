"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail } from "lucide-react";

type Props = {
  open: boolean;
  mosqueName: string;
  contactName: string | null;
  contactEmail: string | null;
  onSkip: () => void;
  onSend: () => Promise<void> | void;
};

export default function OnboardingInviteModal({
  open,
  mosqueName,
  contactName,
  contactEmail,
  onSkip,
  onSend,
}: Props) {
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSendClick() {
    setErrorMessage(null);
    setIsSending(true);
    try {
      await onSend();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to send invitation."
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleSkipClick() {
    if (isSending) return;
    onSkip();
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
          onClick={handleSkipClick}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <Mail size={20} strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold tracking-tight text-neutral-900">
                  Send onboarding invitation?
                </h2>
                <p className="mt-0.5 text-[13px] text-slate-500">
                  {mosqueName} just moved to Onboarding.
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[13px] text-neutral-700">
              {contactEmail ? (
                <>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                    Recipient
                  </p>
                  <p className="mt-1 font-medium text-neutral-900">
                    {contactName ?? "Mosque contact"}
                  </p>
                  <p className="font-mono text-[12px] text-neutral-600">
                    {contactEmail}
                  </p>
                </>
              ) : (
                <p className="italic text-neutral-500">
                  No contact email on file for this mosque. You&apos;ll need to add one
                  before sending.
                </p>
              )}
            </div>

            {errorMessage && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleSkipClick}
                disabled={isSending}
                className="rounded-xl px-4 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={handleSendClick}
                disabled={!contactEmail || isSending}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSending ? "Sending…" : "Send invitation"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
