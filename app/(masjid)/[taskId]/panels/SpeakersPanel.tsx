"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "../../components/ToastProvider";
import { INPUT_CLASS, LABEL_CLASS, BTN_PRIMARY_SM, BTN_GHOST_SM } from "@/lib/ui-classes";

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
    <div className="space-y-5">
      {/* Speaker List */}
      {speakers.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-white px-6 py-16 shadow-sm">
          <Mic2 size={48} className="mb-4 text-stone-200" strokeWidth={1} />
          <p className="text-[15px] font-medium text-stone-500">No speakers added yet</p>
          <p className="mt-1 text-[13px] text-stone-400">
            Add your imams and speakers so they can be linked to programs and jummah
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {speakers.map((speaker) => (
              <motion.div
                key={speaker.speaker_id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="group flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-sm transition-colors hover:bg-stone-50/60"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                  {speaker.speaker_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-stone-900">{speaker.speaker_name}</p>
                  {speaker.speaker_creds?.length > 0 && (
                    <p className="truncate text-[11px] text-stone-500">
                      {speaker.speaker_creds.join(" · ")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteSpeaker(speaker.speaker_id)}
                  className="rounded-md p-1.5 text-stone-300 opacity-0 transition-all hover:bg-stone-100 hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 size={15} />
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
            className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
          >
            <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
              <p className="text-[14px] font-semibold text-stone-900">New Speaker</p>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className={LABEL_CLASS}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Imam Ahmad"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Credentials (comma-separated)</label>
                <input
                  type="text"
                  value={creds}
                  onChange={(e) => setCreds(e.target.value)}
                  placeholder="e.g., PhD Islamic Studies, Hafiz"
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={addSpeaker} disabled={saving} className={BTN_PRIMARY_SM}>
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {saving ? "Adding..." : "Add Speaker"}
                </button>
                <button onClick={() => setShowForm(false)} className={BTN_GHOST_SM}>
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
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white py-3.5 text-[13px] font-medium text-stone-600 transition-all hover:border-stone-400 hover:bg-stone-50"
        >
          <Plus size={15} />
          Add Speaker
        </button>
      )}
    </div>
  );
}
