"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type LeadResponse = {
  ok?: boolean;
  error?: string;
  mosqueName?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (mosqueName: string) => void;
};

/**
 * Internal pipeline capture only: saves a row in Lead. No Clerk org or invite.
 */
export default function AddLeadModal({ open, onClose, onSuccess }: Props) {
  const [mosque, setMosque] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
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
    setNotes("");
    setErrorMessage(null);
  }

  function handleCancel() {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const mosqueName = mosque.trim();
    if (!mosqueName) {
      setErrorMessage("Mosque name is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/pipeline/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mosqueName,
          city: city.trim() || undefined,
          state: stateValue.trim() || undefined,
          contactName: contactName.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const raw = await res.text();
      let body: LeadResponse = {};
      if (raw.trim()) {
        try {
          body = JSON.parse(raw) as LeadResponse;
        } catch {
          throw new Error(`Server returned non-JSON (${res.status}).`);
        }
      }
      if (!res.ok || !body.ok) {
        throw new Error(body.error ?? `Request failed (${res.status}).`);
      }

      const name = body.mosqueName ?? mosqueName;
      resetForm();
      onClose();
      onSuccess(name);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save lead."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldClass =
    "rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 caret-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
      <div className="scheme-light w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 text-neutral-900 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold text-neutral-900">Add lead</h2>
          <p className="mt-1 text-sm text-slate-600">
            For internal tracking only. Does not create a Clerk account or send an invite.
          </p>

          {errorMessage ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="lead-mosque" className="text-sm font-medium text-neutral-800">
                Mosque name <span className="text-red-500">*</span>
              </label>
              <input
                id="lead-mosque"
                value={mosque}
                onChange={(e) => setMosque(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="lead-city" className="text-sm font-medium text-neutral-800">
                  City
                </label>
                <input
                  id="lead-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="lead-state" className="text-sm font-medium text-neutral-800">
                  State
                </label>
                <input
                  id="lead-state"
                  value={stateValue}
                  onChange={(e) => setStateValue(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="lead-contact" className="text-sm font-medium text-neutral-800">
                Contact name
              </label>
              <input
                id="lead-contact"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="lead-email" className="text-sm font-medium text-neutral-800">
                Contact email
              </label>
              <input
                id="lead-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="lead-notes" className="text-sm font-medium text-neutral-800">
                Notes
              </label>
              <textarea
                id="lead-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={`${fieldClass} resize-none`}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !mosque.trim()}
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "Save lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
