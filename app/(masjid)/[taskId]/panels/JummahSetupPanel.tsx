"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "../../components/ToastProvider";
import { cn } from "@/lib/utils";
import { INPUT_CLASS, LABEL_CLASS } from "@/lib/ui-classes";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type JummahSlot = { time: string; khateeb_name: string; topic: string };
type JummahRecord = {
  id: number;
  mosque_id: string;
  prayer_time: string;
  khateeb_name: string | null;
  topic: string | null;
  capacity_status: string | null;
};
type MosqueData = { id: string };

export default function JummahSetupPanel({
  mosque,
  existingJummah,
}: {
  mosque: MosqueData;
  existingJummah: JummahRecord[];
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const [slotCount, setSlotCount] = useState(
    existingJummah.length > 0 ? existingJummah.length : 1
  );

  const [slots, setSlots] = useState<JummahSlot[]>(() => {
    if (existingJummah.length > 0) {
      return existingJummah.map((j) => ({
        time: j.prayer_time || "12:15",
        khateeb_name: j.khateeb_name || "",
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

  const [status, setStatus] = useState<SaveStatus>("idle");
  const lastSavedRef = useRef<string>(
    JSON.stringify({
      slots: existingJummah.map((j) => ({
        time: j.prayer_time || "12:15",
        khateeb_name: j.khateeb_name || "",
        topic: j.topic || "",
      })),
      capacityEnabled: existingJummah.some((j) => j.capacity_status != null),
    })
  );
  const debounceRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  // Auto-save on any change, debounced. The backend marks jummah_setup
  // complete automatically on any successful save. `keepalive: true` keeps
  // the save alive across a Next-button navigation.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Don't save while any slot is missing a time — that's an invalid state
    // and would blank out existing data on the backend.
    if (slots.some((s) => !s.time)) return;

    const snapshot = JSON.stringify({ slots, capacityEnabled });
    if (snapshot === lastSavedRef.current) return;

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setStatus("saving");
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
          keepalive: true,
        });
        if (!res.ok) throw new Error("Failed to save");
        lastSavedRef.current = snapshot;
        setStatus("saved");
        router.refresh();
      } catch {
        setStatus("error");
        showToast("Couldn't save jummah setup", "error");
      }
    }, 700);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [slots, capacityEnabled, mosque.id, router, showToast]);

  return (
    <div className="space-y-5">
      {/* Number of Jummah Prayers */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
          <p className="text-[14px] font-semibold text-stone-900">Number of Jummah Prayers</p>
          <p className="mt-0.5 text-[12px] text-stone-500">
            How many Friday prayers does your mosque offer?
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="inline-flex items-center rounded-lg border border-stone-200 bg-white p-1 shadow-sm">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => handleSlotCountChange(n)}
                className={cn(
                  "rounded-md px-5 py-1.5 text-[13px] font-medium transition-all",
                  slotCount === n
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                )}
              >
                {n}
              </button>
            ))}
          </div>
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
            className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
          >
            <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
              <p className="text-[14px] font-semibold text-stone-900">
                Jummah {slotCount > 1 ? `#${i + 1}` : "Prayer"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 px-6 py-5">
              <div>
                <label className={LABEL_CLASS}>Time</label>
                <input
                  type="time"
                  value={slot.time}
                  onChange={(e) => updateSlot(i, { time: e.target.value })}
                  className={cn(INPUT_CLASS, "tabular-nums")}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Khateeb</label>
                <input
                  type="text"
                  value={slot.khateeb_name}
                  onChange={(e) => updateSlot(i, { khateeb_name: e.target.value })}
                  placeholder="Imam name"
                  className={INPUT_CLASS}
                />
              </div>
              <div className="col-span-2">
                <label className={LABEL_CLASS}>Topic (optional)</label>
                <input
                  type="text"
                  value={slot.topic}
                  onChange={(e) => updateSlot(i, { topic: e.target.value })}
                  placeholder="This week's khutbah topic"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Capacity Toggle */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <p className="text-[14px] font-semibold text-stone-900">Capacity Tracking</p>
            <p className="mt-0.5 text-[12px] text-stone-500">
              Show capacity status to users before Jummah
            </p>
          </div>
          <button
            onClick={() => setCapacityEnabled(!capacityEnabled)}
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors",
              capacityEnabled ? "bg-emerald-500" : "bg-stone-300"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left]",
                capacityEnabled ? "left-[18px]" : "left-0.5"
              )}
            />
          </button>
        </div>
      </div>

      {/* Auto-save status */}
      <div className="flex items-center justify-end text-[11.5px] text-stone-500">
        {status === "saving" ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 size={11} className="animate-spin" />
            Saving…
          </span>
        ) : status === "saved" ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <Check size={12} strokeWidth={2.5} />
            Saved
          </span>
        ) : status === "error" ? (
          <span className="text-red-600">Couldn&apos;t save — check your connection.</span>
        ) : (
          <span className="text-stone-400">Changes save automatically.</span>
        )}
      </div>
    </div>
  );
}
