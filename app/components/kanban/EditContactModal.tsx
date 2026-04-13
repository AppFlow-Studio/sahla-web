"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, email: string) => void;
  initialName: string;
  initialEmail: string;
  mosqueName: string;
  mosqueId: string;
};

export default function EditContactModal({
  open,
  onClose,
  onSave,
  initialName,
  initialEmail,
  mosqueName,
  mosqueId,
}: Props) {
  const [contactName, setContactName] = useState(initialName);
  const [contactEmail, setContactEmail] = useState(initialEmail);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setContactName(initialName);
      setContactEmail(initialEmail);
      setErrorMessage(null);
    }
    wasOpenRef.current = open;
  }, [open, initialName, initialEmail]);

  if (!open) return null;

  function handleCancel() {
    if (isSubmitting) return;
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = contactName.trim();
    const email = contactEmail.trim();

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/pipeline/edit-contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mosqueId,
          contactName: name || null,
          contactEmail: email || null,
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? `Request failed (${res.status}).`);
      }

      onClose();
      onSave(name, email);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to update contact.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldClass =
    "rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 caret-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="scheme-light w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 text-neutral-900 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold text-neutral-900">
            Edit contact
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {mosqueName || "Update contact details for this mosque."}
          </p>

          {errorMessage ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="edit-contact-name"
                className="text-sm font-medium text-neutral-800"
              >
                Contact name
              </label>
              <input
                id="edit-contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Ahmed Ali"
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="edit-contact-email"
                className="text-sm font-medium text-neutral-800"
              >
                Contact email
              </label>
              <input
                id="edit-contact-email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g. ahmed@example.com"
                className={fieldClass}
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
              disabled={isSubmitting}
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
