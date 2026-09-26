"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../components/ToastProvider";

type QueuedInvite = {
  name: string;
  email: string;
  role: string;
};

export default function InviteAdminsPanel({
  mosqueId,
  initialInvites,
}: {
  mosqueId: string;
  initialInvites: QueuedInvite[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [invites, setInvites] = useState(initialInvites);
  const [saving, setSaving] = useState(false);

  // New invite form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function addInvite() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      showToast("Name is required", "error");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showToast("Valid email is required", "error");
      return;
    }
    if (invites.some((i) => i.email === trimmedEmail)) {
      showToast("This email is already invited", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
      });
      if (!res.ok) throw new Error("Failed to queue invite");

      setInvites((prev) => [
        ...prev,
        { name: trimmedName, email: trimmedEmail, role: "org:admin" },
      ]);
      setName("");
      setEmail("");
      setShowForm(false);
      showToast("Invite queued", "success");
      router.refresh();
    } catch {
      showToast("Failed to queue invite", "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeInvite(emailToRemove: string) {
    try {
      const res = await fetch(
        `/api/mosques/${mosqueId}/invites?email=${encodeURIComponent(emailToRemove)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to remove invite");
      setInvites((prev) => prev.filter((i) => i.email !== emailToRemove));
      showToast("Invite removed", "success");
      router.refresh();
    } catch {
      showToast("Failed to remove invite", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Info callout */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 px-5 py-4">
        <p className="text-[13px] text-blue-800">
          Everyone you add here becomes a full admin: they get the admin menu
          inside your app and, on the Core + CRM plan, your mosque&apos;s CRM.
          Only add people you trust with those keys.
        </p>
        <p className="mt-2 text-[13px] text-blue-800">
          Invites are queued and sent when you Go Live.
        </p>
      </div>

      {/* Invite list */}
      {invites.length === 0 && !showForm ? (
        <div className="rounded-xl border-2 border-dashed border-stone-200 bg-white p-12 text-center">
          <p className="text-[14px] text-stone-500">No team members added yet</p>
          <p className="mt-1 text-[12px] text-stone-400">
            Invite the people who will help you run your mosque app
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {invites.map((invite) => (
              <motion.div
                key={invite.email}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-5 py-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {invite.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-stone-900">{invite.name}</p>
                    <span className="text-[9px] font-bold rounded px-1.5 py-0.5 bg-amber-100 text-amber-700">
                      Admin
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 truncate">{invite.email}</p>
                </div>
                <button
                  onClick={() => removeInvite(invite.email)}
                  className="text-stone-300 hover:text-red-500 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add invite form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5"
          >
            <p className="mb-3 text-[13px] font-semibold text-stone-900">New Admin</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-stone-600">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Ahmed Hassan"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-stone-600">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., ahmed@mosque.org"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={addInvite}
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  {saving ? "Adding..." : "Add Admin"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-[12px] text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white py-3 text-[13px] font-medium text-stone-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
          </svg>
          Add Admin
        </button>
      )}
    </div>
  );
}
