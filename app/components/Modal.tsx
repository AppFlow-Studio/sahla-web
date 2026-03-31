import { useState, type FormEvent } from "react";

type AddLeadResponse = {
  ok?: boolean;
  error?: string;
  mosqueName?: string;
};

type ModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (mosqueName: string) => void;
};

const Modal = ({ open, onClose, onSuccess }: ModalProps) => {
  const [mosque, setMosque] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const mosqueName = mosque.trim();

    if (!mosqueName) {
      setErrorMessage("Mosque name is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/pipeline/add", {
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
      const body = (await res.json()) as AddLeadResponse;

      if (!res.ok || !body.ok) {
        throw new Error(body.error ?? "Failed to add lead.");
      }

      const addedName = body.mosqueName ?? mosqueName;
      resetForm();
      onClose();
      onSuccess(addedName);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to add lead."
      );
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white p-8 shadow-2xl"
      >
        <div className="mb-6">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Add Lead
          </h2>
          <p className="mt-2 text-base text-slate-500">
            Quickly capture a mosque you connected with
          </p>
        </div>
  
        {errorMessage ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
  
        <div className="space-y-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="mosque"
              className="text-sm font-medium text-neutral-800"
            >
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
              <label
                htmlFor="city"
                className="text-sm font-medium text-neutral-800"
              >
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
              <label
                htmlFor="state"
                className="text-sm font-medium text-neutral-800"
              >
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
  
          <div className="flex flex-col gap-2">
            <label
              htmlFor="contactName"
              className="text-sm font-medium text-neutral-800"
            >
              Contact Name
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
            <label
              htmlFor="contactEmail"
              className="text-sm font-medium text-neutral-800"
            >
              Contact Email
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
            <label
              htmlFor="notes"
              className="text-sm font-medium text-neutral-800"
            >
              Notes
            </label>
            <textarea
              id="notes"
              placeholder="How did you connect?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[130px] rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 resize-none"
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
            disabled={isSubmitting}
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Adding..." : "Add Lead"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Modal;