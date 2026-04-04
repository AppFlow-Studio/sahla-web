"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../components/ToastProvider";

type JummahSlot = {
  time: string;
  khateeb_name: string;
  topic: string;
};

type JummahRecord = {
  id: number;
  mosque_id: string;
  prayer_time: string;
  topic: string | null;
  capacity_status: string | null;
};

type MosqueData = {
  id: string;
};

export default function JummahSetupPanel({
  mosque,
  existingJummah,
}: {
  mosque: MosqueData;
  existingJummah: JummahRecord[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [slotCount, setSlotCount] = useState(
    existingJummah.length > 0 ? existingJummah.length : 1
  );

  const [slots, setSlots] = useState<JummahSlot[]>(() => {
    if (existingJummah.length > 0) {
      return existingJummah.map((j) => ({
        time: j.prayer_time || "12:15",
        khateeb_name: "",
        topic: j.topic || "",
      }));
    }
    return [{ time: "12:15", khateeb_name: "", topic: "" }];
  });

  const [capacityEnabled, setCapacityEnabled] = useState(
    existingJummah.some((j) => j.capacity_status != null)
  );

  function handleSlotCountChange(count: number) {
    setSlotCount(count);
    setSlots((prev) => {
      if (count > prev.length) {
        const newSlots = [...prev];
        for (let i = prev.length; i < count; i++) {
          newSlots.push({ time: "13:00", khateeb_name: "", topic: "" });
        }
        return newSlots;
      }
      return prev.slice(0, count);
    });
  }

  function updateSlot(index: number, updates: Partial<JummahSlot>) {
    setSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, ...updates } : slot))
    );
  }

  async function handleSave() {
    if (slots.some((s) => !s.time)) {
      showToast("All jummah slots need a time", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/mosques/${mosque.id}/jummah`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slots: slots.map((s) => ({
            time: s.time,
            khateeb_name: s.khateeb_name || null,
            topic: s.topic || null,
            capacity_status: capacityEnabled ? "open" : null,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast("Jummah setup saved", "success");
      router.refresh();
    } catch {
      showToast("Failed to save jummah setup", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Number of Jummah Prayers */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <p className="mb-1 text-[14px] font-semibold text-stone-900">
          Number of Jummah Prayers
        </p>
        <p className="mb-3 text-[12px] text-stone-400">
          How many Friday prayers does your mosque offer?
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => handleSlotCountChange(n)}
              className={`rounded-lg px-5 py-2 text-[13px] font-medium transition-colors ${
                slotCount === n
                  ? "bg-emerald-600 text-white"
                  : "border border-stone-300 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Jummah Slots */}
      <AnimatePresence initial={false}>
        {slots.map((slot, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-stone-200 bg-white p-6"
          >
            <p className="mb-4 text-[14px] font-semibold text-stone-900">
              Jummah {slotCount > 1 ? `#${i + 1}` : "Prayer"}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-stone-600">
                  Time
                </label>
                <input
                  type="time"
                  value={slot.time}
                  onChange={(e) => updateSlot(i, { time: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-[13px] tabular-nums text-stone-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-stone-600">
                  Khateeb
                </label>
                <input
                  type="text"
                  value={slot.khateeb_name}
                  onChange={(e) => updateSlot(i, { khateeb_name: e.target.value })}
                  placeholder="Imam name"
                  className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-[12px] font-medium text-stone-600">
                  Topic (optional)
                </label>
                <input
                  type="text"
                  value={slot.topic}
                  onChange={(e) => updateSlot(i, { topic: e.target.value })}
                  placeholder="This week's khutbah topic"
                  className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Capacity Toggle */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-stone-900">Capacity Tracking</p>
            <p className="text-[12px] text-stone-400">
              Show capacity status to users before Jummah
            </p>
          </div>
          <button
            onClick={() => setCapacityEnabled(!capacityEnabled)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              capacityEnabled ? "bg-emerald-500" : "bg-stone-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                capacityEnabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save & Complete"}
        </button>
      </div>
    </div>
  );
}
