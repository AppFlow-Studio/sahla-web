"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";

type AddLeadResponse = {
  ok?: boolean;
  error?: string;
  mosqueName?: string;
  contactName?: string;
  contactEmail?: string;
  orgId?: string;
  portalUrl?: string;
  inviteStatus?: string;
};

type ModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (mosqueName: string) => void;
};

type SuccessData = {
  mosqueName: string;
  contactName: string;
  contactEmail: string;
  orgId: string;
  portalUrl: string;
  inviteStatus: string;
};

const COPY_STATUS_LINE = "Invite sent — they'll set their own password";

const Modal = ({ open, onClose, onSuccess }: ModalProps) => {
  const [mosque, setMosque] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [copied, setCopied] = useState(false);
  const wasOpenRef = useRef(false);

  // Only reset when the modal opens (false → true), not on every render with open=true.
  // Also avoids fighting with success state after submit.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setStep("form");
      setSuccessData(null);
      setCopied(false);
      setErrorMessage(null);
    }
    wasOpenRef.current = open;
  }, [open]);

  if (!open) return null;

  function resetForm() {
    setMosque("");
    setCity("");
    setStateValue("");
    setContactName("");
    setContactEmail("");
    setPhone("");
    setNotes("");
    setErrorMessage(null);
    setStep("form");
    setSuccessData(null);
    setCopied(false);
  }

  function handleCancel() {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }

  async function handleCopyPortalLink() {
    if (!successData) return;

    const copyText = `Portal: ${successData.portalUrl}
Admin Email: ${successData.contactEmail}
Status: ${COPY_STATUS_LINE}`;

    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMessage("Unable to copy to clipboard.");
    }
  }

  function handleDone() {
    if (!successData) return;
    const createdName = successData.mosqueName;
    resetForm();
    onClose();
    onSuccess(createdName);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mosqueName = mosque.trim();
    const trimmedContactName = contactName.trim();
    const trimmedContactEmail = contactEmail.trim();

    if (!mosqueName) {
      setErrorMessage("Mosque name is required.");
      return;
    }
    if (!trimmedContactName) {
      setErrorMessage("Contact name is required.");
      return;
    }
    if (!trimmedContactEmail) {
      setErrorMessage("Contact email is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/pipeline/create-account", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mosqueName,
          city: city.trim() || undefined,
          state: stateValue.trim() || undefined,
          contactName: trimmedContactName,
          contactEmail: trimmedContactEmail,
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const raw = await res.text();
      let body: AddLeadResponse = {};
      if (raw.trim()) {
        try {
          body = JSON.parse(raw) as AddLeadResponse;
        } catch {
          throw new Error(
            `Server returned non-JSON (${res.status}). Check the terminal or Network tab.`
          );
        }
      } else if (!res.ok) {
        throw new Error(`Request failed (${res.status}) with an empty response.`);
      }

      if (!res.ok || !body.ok) {
        throw new Error(body.error ?? `Request failed (${res.status}).`);
      }

      const nextSuccess: SuccessData = {
        mosqueName: body.mosqueName ?? mosqueName,
        contactName: body.contactName ?? trimmedContactName,
        contactEmail: body.contactEmail ?? trimmedContactEmail,
        orgId: body.orgId ?? "",
        portalUrl: body.portalUrl ?? "crm.sahla.app",
        inviteStatus: body.inviteStatus ?? "Invite sent via Clerk",
      };
      setSuccessData(nextSuccess);
      setStep("success");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create account."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isCreateDisabled =
    isSubmitting ||
    mosque.trim().length === 0 ||
    contactName.trim().length === 0 ||
    contactEmail.trim().length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-8 shadow-2xl">
        {/* Avoid mode="wait": it can leave zero children between exit/enter → blank white panel */}
        <AnimatePresence initial={false}>
          {step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">
                    Create Mosque Account
                  </h2>
                  <p className="mt-2 text-base text-slate-500">
                    This creates a login for the mosque admin to access crm.sahla.app.
                  </p>
                </div>

                {errorMessage ? (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="mb-5 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-900">
                  This creates a login for the mosque admin. They&apos;ll use these credentials to
                  sign into{" "}
                  <a
                    href="https://crm.sahla.app"
                    className="font-medium text-green-800 underline underline-offset-2"
                  >
                    crm.sahla.app
                  </a>{" "}
                  and start the onboarding flow.
                </div>

                <div className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="mosque" className="text-sm font-medium text-neutral-800">
                      Mosque Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="mosque"
                      type="text"
                      placeholder="e.g. Masjid Al-Noor"
                      value={mosque}
                      onChange={(e) => setMosque(e.target.value)}
                      className="h-12 rounded-xl border border-neutral-200 px-4 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="city" className="text-sm font-medium text-neutral-800">
                        City
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-12 rounded-xl border border-neutral-200 px-4 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="state" className="text-sm font-medium text-neutral-800">
                        State
                      </label>
                      <input
                        id="state"
                        type="text"
                        value={stateValue}
                        onChange={(e) => setStateValue(e.target.value)}
                        className="h-12 rounded-xl border border-neutral-200 px-4 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                      />
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-4">
                    <p className="text-sm font-medium text-neutral-700">Point of Contact</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="contactName" className="text-sm font-medium text-neutral-800">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contactName"
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="h-12 rounded-xl border border-neutral-200 px-4 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="contactEmail" className="text-sm font-medium text-neutral-800">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="h-12 rounded-xl border border-neutral-200 px-4 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="phone" className="text-sm font-medium text-neutral-800">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 rounded-xl border border-neutral-200 px-4 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="notes" className="text-sm font-medium text-neutral-800">
                      Notes (optional)
                    </label>
                    <textarea
                      id="notes"
                      placeholder="Internal notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-24 rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 resize-none"
                    />
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreateDisabled}
                    className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6 flex items-center gap-4">
                <motion.div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.15, 1] }}
                  transition={{
                    duration: 0.45,
                    times: [0, 0.55, 1],
                    ease: ["easeOut", "easeOut"],
                  }}
                >
                  ✓
                </motion.div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
                    {successData?.mosqueName}
                  </h2>
                  <p className="text-sm text-slate-600">
                    Account created for {successData?.contactName}
                  </p>
                </div>
              </div>

              <motion.div
                className="mb-4 rounded-xl border border-neutral-700 bg-neutral-900 p-4 text-sm text-neutral-100"
                initial={{ opacity: 0.85 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
              >
                <p className="mb-1">
                  Portal:{" "}
                  <span className="font-mono text-green-300">{successData?.portalUrl}</span>
                </p>
                <p className="mb-1">
                  Admin: <span className="font-mono">{successData?.contactEmail}</span>
                </p>
                <p>
                  Status: <span className="font-mono">{successData?.inviteStatus}</span>
                </p>
              </motion.div>

              <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                {successData?.contactName} will receive an email invite from Clerk to set up their
                account. They&apos;ll create their own password.
              </div>

              {errorMessage ? (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCopyPortalLink}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    copied
                      ? "bg-green-600 text-white"
                      : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {copied ? "✓ Copied" : "Copy Portal Link"}
                </button>
                <button
                  type="button"
                  onClick={handleDone}
                  className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Modal;
