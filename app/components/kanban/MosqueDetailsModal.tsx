"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { PipelineMosqueDetails } from "@/app/api/pipeline/mosque/[id]/route";

type Props = {
  open: boolean;
  onClose: () => void;
  mosqueId: string;
  /** Initial field values from the kanban card — used as a fallback while the
   *  GET request is in flight so the modal opens with content instead of a
   *  loading skeleton. Final values come from the server fetch. */
  initial: {
    mosqueName: string;
    city: string;
    state: string | null;
    contactName: string;
    contactEmail: string | null;
  };
  onSaved: (changes: {
    mosqueName: string;
    city: string;
    state: string | null;
    contactName: string;
    contactEmail: string | null;
  }) => void;
};

const fieldClass =
  "rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 caret-neutral-900 outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200";

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 14) return `${day}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function MosqueDetailsModal({
  open,
  onClose,
  mosqueId,
  initial,
  onSaved,
}: Props) {
  const router = useRouter();
  const [details, setDetails] = useState<PipelineMosqueDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mosqueName, setMosqueName] = useState(initial.mosqueName);
  const [city, setCity] = useState(initial.city);
  const [state, setState] = useState(initial.state ?? "");
  const [contactName, setContactName] = useState(initial.contactName);
  const [contactEmail, setContactEmail] = useState(initial.contactEmail ?? "");
  const [newNote, setNewNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Re-fetch on open so stale data from prior opens doesn't leak.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setSaveError(null);
    setNewNote("");
    fetch(`/api/pipeline/mosque/${encodeURIComponent(mosqueId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? `Failed to load (${res.status})`);
        }
        return (await res.json()) as PipelineMosqueDetails;
      })
      .then((data) => {
        if (cancelled) return;
        setDetails(data);
        setMosqueName(data.mosque.name ?? "");
        setCity(data.mosque.city ?? "");
        setState(data.mosque.state ?? "");
        setContactName(data.pipeline?.contact_name ?? initial.contactName ?? "");
        setContactEmail(
          data.pipeline?.contact_email ?? initial.contactEmail ?? ""
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Couldn't load mosque."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, mosqueId, initial.contactName, initial.contactEmail]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError(null);

    const trimmedName = mosqueName.trim();
    if (!trimmedName) {
      setSaveError("Mosque name is required.");
      setSaving(false);
      return;
    }

    const initialDetails = details;
    const mosqueChanged =
      trimmedName !== (initialDetails?.mosque.name ?? "").trim() ||
      city.trim() !== (initialDetails?.mosque.city ?? "").trim() ||
      state.trim() !== (initialDetails?.mosque.state ?? "").trim();

    const contactChanged =
      contactName.trim() !== (initialDetails?.pipeline?.contact_name ?? "").trim() ||
      contactEmail.trim() !== (initialDetails?.pipeline?.contact_email ?? "").trim();

    const noteToAdd = newNote.trim();

    try {
      const requests: Promise<Response>[] = [];

      if (mosqueChanged) {
        requests.push(
          fetch(`/api/mosques/${encodeURIComponent(mosqueId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: trimmedName,
              city: city.trim() || null,
              state: state.trim() || null,
            }),
          })
        );
      }

      if (contactChanged) {
        requests.push(
          fetch("/api/pipeline/edit-contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mosqueId,
              contactName: contactName.trim() || null,
              contactEmail: contactEmail.trim() || null,
            }),
          })
        );
      }

      if (noteToAdd) {
        requests.push(
          fetch("/api/pipeline/note", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mosqueId, note: noteToAdd }),
          })
        );
      }

      if (requests.length === 0) {
        onClose();
        return;
      }

      const results = await Promise.all(requests);
      const failed = results.find((r) => !r.ok);
      if (failed) {
        const body = (await failed.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? `Save failed (${failed.status})`);
      }

      onSaved({
        mosqueName: trimmedName,
        city: city.trim(),
        state: state.trim() || null,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim() || null,
      });
      // Re-fetch the server-rendered pipeline so mosque-row changes (name,
      // city, state) update across all cards without a full page reload.
      router.refresh();
      onClose();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Couldn't save changes."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (saving) return;
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={handleCancel}
    >
      <div
        className="scheme-light max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-black/10 bg-white p-6 text-neutral-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <header className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Lead details
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                For internal tracking only. Edit anything below and hit Save.
              </p>
            </div>
            {loading ? (
              <span className="text-[11px] text-neutral-400">Loading…</span>
            ) : null}
          </header>

          {loadError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {loadError}
            </div>
          ) : null}

          {saveError ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-neutral-800">
                Mosque name <span className="text-red-500">*</span>
              </label>
              <input
                value={mosqueName}
                onChange={(e) => setMosqueName(e.target.value)}
                className={fieldClass}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-800">
                  City
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-800">
                  State
                </label>
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-neutral-800">
                Contact name
              </label>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Ahmed Ali"
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-neutral-800">
                Contact email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g. ahmed@example.com"
                className={fieldClass}
              />
            </div>

            {/* Notes — read-only history + a textarea to append a new one */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-neutral-800">
                Notes
              </label>
              {details && details.notes.length > 0 ? (
                <ul className="mb-2 space-y-1.5 rounded-lg border border-neutral-200 bg-neutral-50 p-2 text-[12.5px] text-neutral-700">
                  {details.notes.slice(0, 5).map((n) => (
                    <li
                      key={n.id}
                      className="rounded border border-neutral-200/60 bg-white px-2 py-1.5"
                    >
                      <p className="whitespace-pre-wrap">{n.content}</p>
                      <p className="mt-1 text-[10.5px] text-neutral-400">
                        {n.author_name ? `${n.author_name} · ` : ""}
                        {relTime(n.created_at)}
                      </p>
                    </li>
                  ))}
                  {details.notes.length > 5 ? (
                    <li className="px-2 text-[11px] text-neutral-400">
                      + {details.notes.length - 5} older note
                      {details.notes.length - 5 === 1 ? "" : "s"}
                    </li>
                  ) : null}
                </ul>
              ) : null}
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={
                  details && details.notes.length > 0
                    ? "Add another note…"
                    : "Add your first note (optional)…"
                }
                rows={3}
                className={`${fieldClass} resize-y`}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
