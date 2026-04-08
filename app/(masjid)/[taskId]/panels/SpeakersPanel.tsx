"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../components/ToastProvider";

type Speaker = {
  speaker_id: string;
  mosque_id: string;
  speaker_name: string;
  speaker_img: string | null;
  speaker_creds: string[];
};

export default function SpeakersPanel({
  mosqueId,
  initialSpeakers,
}: {
  mosqueId: string;
  initialSpeakers: Speaker[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [speakers, setSpeakers] = useState(initialSpeakers);
  const [saving, setSaving] = useState(false);

  // New speaker form
  const [name, setName] = useState("");
  const [creds, setCreds] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function addSpeaker() {
    if (!name.trim()) {
      showToast("Speaker name is required", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/speakers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speaker_name: name,
          speaker_creds: creds ? creds.split(",").map((c) => c.trim()) : [],
          markComplete: speakers.length === 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to add speaker");
      const newSpeaker = await res.json();
      setSpeakers((prev) => [newSpeaker, ...prev]);
      setName("");
      setCreds("");
      setShowForm(false);
      showToast("Speaker added", "success");
      router.refresh();
    } catch {
      showToast("Failed to add speaker", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSpeaker(speakerId: string) {
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/speakers?speakerId=${speakerId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setSpeakers((prev) => prev.filter((s) => s.speaker_id !== speakerId));
      showToast("Speaker removed", "success");
    } catch {
      showToast("Failed to remove speaker", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Speaker List */}
      {speakers.length === 0 && !showForm ? (
        <div className="rounded-xl border-2 border-dashed border-stone-200 bg-white p-12 text-center">
          <p className="text-[14px] text-stone-500">No speakers added yet</p>
          <p className="mt-1 text-[12px] text-stone-400">
            Add your imams and speakers so they can be linked to programs and jummah
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {speakers.map((speaker) => (
              <motion.div
                key={speaker.speaker_id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-5 py-4"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {speaker.speaker_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-stone-900">{speaker.speaker_name}</p>
                  {speaker.speaker_creds?.length > 0 && (
                    <p className="text-[11px] text-stone-400 truncate">
                      {speaker.speaker_creds.join(" · ")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteSpeaker(speaker.speaker_id)}
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

      {/* Add Speaker Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5"
          >
            <p className="mb-3 text-[13px] font-semibold text-stone-900">New Speaker</p>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-stone-600">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Imam Ahmad"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-stone-600">
                  Credentials (comma-separated)
                </label>
                <input
                  type="text"
                  value={creds}
                  onChange={(e) => setCreds(e.target.value)}
                  placeholder="e.g., PhD Islamic Studies, Hafiz"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addSpeaker}
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  {saving ? "Adding..." : "Add Speaker"}
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Speaker
        </button>
      )}
    </div>
  );
}
