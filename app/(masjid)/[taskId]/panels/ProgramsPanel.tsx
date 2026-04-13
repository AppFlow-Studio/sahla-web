"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Upload, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "../../components/ToastProvider";
import CSVImport from "../../components/CSVImport";
import { Dropdown } from "@/app/(admin)/components/Dropdown";
import { cn } from "@/lib/utils";
import { INPUT_CLASS, LABEL_CLASS, BTN_PRIMARY_SM, BTN_GHOST_SM } from "@/lib/ui-classes";

type ContentItem = {
  id: number;
  content_id: string;
  name: string;
  description: string | null;
  speakers: string[];
  days: string[];
  start_time: string | null;
  gender: string;
  is_kids: boolean;
  is_paid: boolean;
  price: number;
};

type Speaker = { speaker_id: string; speaker_name: string };

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CSV_FIELDS = [
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  { key: "speaker", label: "Speaker" },
  { key: "days", label: "Days (comma-separated)" },
  { key: "start_time", label: "Start Time" },
  { key: "gender", label: "Gender" },
  { key: "is_kids", label: "Kids Program" },
  { key: "is_paid", label: "Paid" },
  { key: "price", label: "Price" },
];

const GENDER_OPTIONS = [
  { value: "All", label: "All Genders" },
  { value: "Brothers", label: "Brothers" },
  { value: "Sisters", label: "Sisters" },
];

export default function ProgramsPanel({
  mosqueId,
  initialPrograms,
  speakers,
}: {
  mosqueId: string;
  initialPrograms: ContentItem[];
  speakers: Speaker[];
}) {
  const { showToast } = useToast();
  const [programs, setPrograms] = useState(initialPrograms);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCSV, setShowCSV] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [gender, setGender] = useState("All");
  const [isKids, setIsKids] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");

  const speakerOptions = useMemo(
    () => [
      { value: "", label: "None" },
      ...speakers.map((s) => ({ value: s.speaker_name, label: s.speaker_name })),
    ],
    [speakers]
  );

  function resetForm() {
    setName(""); setDescription(""); setSelectedSpeaker(""); setSelectedDays([]);
    setStartTime(""); setGender("All"); setIsKids(false); setIsPaid(false); setPrice("");
    setShowForm(false);
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function addProgram() {
    if (!name.trim()) { showToast("Program name is required", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "program",
          name,
          description: description || null,
          speakers: selectedSpeaker ? [selectedSpeaker] : [],
          days: selectedDays,
          start_time: startTime || null,
          gender,
          is_kids: isKids,
          is_paid: isPaid,
          price: isPaid ? parseFloat(price) || 0 : 0,
          markComplete: programs.length >= 2,
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      const newItem = await res.json();
      setPrograms((prev) => [newItem, ...prev]);
      resetForm();
      showToast("Program added", "success");
    } catch { showToast("Failed to add program", "error"); }
    finally { setSaving(false); }
  }

  async function deleteProgram(contentId: string) {
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/content?contentId=${contentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setPrograms((prev) => prev.filter((p) => p.content_id !== contentId));
      showToast("Program removed", "success");
    } catch { showToast("Failed to remove", "error"); }
  }

  const thresholdMet = programs.length >= 3;

  return (
    <div className="space-y-5">
      {/* Threshold Callout */}
      <div
        className={cn(
          "flex items-start gap-2.5 rounded-lg border px-4 py-3",
          thresholdMet
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        )}
      >
        {thresholdMet ? (
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
        ) : (
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
        )}
        <p className={cn(
          "text-[12px]",
          thresholdMet ? "text-emerald-800" : "text-amber-800"
        )}>
          {thresholdMet
            ? `${programs.length} programs added — your Discover tab will look great!`
            : `Add at least 3 programs (${programs.length}/3) — users need content to explore`}
        </p>
      </div>

      {/* Program List */}
      {programs.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {programs.map((prog) => (
              <motion.div
                key={prog.content_id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="group flex items-start gap-4 rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-sm transition-colors hover:bg-stone-50/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-stone-900">{prog.name}</p>
                  {prog.description && (
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-stone-500">{prog.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {prog.days?.map((d) => (
                      <span key={d} className="rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                        {d}
                      </span>
                    ))}
                    {prog.start_time && (
                      <span className="text-[10px] text-stone-400">{prog.start_time}</span>
                    )}
                    {prog.gender !== "All" && (
                      <span className="rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                        {prog.gender}
                      </span>
                    )}
                    {prog.is_kids && (
                      <span className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                        Kids
                      </span>
                    )}
                    {prog.is_paid && (
                      <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        ${prog.price}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteProgram(prog.content_id)}
                  className="rounded-md p-1.5 text-stone-300 opacity-0 transition-all hover:bg-stone-100 hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {programs.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-white px-6 py-16 shadow-sm">
          <BookOpen size={48} className="mb-4 text-stone-200" strokeWidth={1} />
          <p className="text-[15px] font-medium text-stone-500">No programs yet</p>
          <p className="mt-1 text-[13px] text-stone-400">Add recurring classes, halaqas, and study circles</p>
        </div>
      )}

      {/* Add Program Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
          >
            <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
              <p className="text-[14px] font-semibold text-stone-900">New Program</p>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <label className={LABEL_CLASS}>Program Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Weekly Tafsir Class"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description (optional)"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition-colors placeholder:text-stone-400 hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>Speaker</label>
                  <Dropdown
                    value={selectedSpeaker}
                    onChange={(v) => setSelectedSpeaker(String(v))}
                    options={speakerOptions}
                    className="w-full"
                    minWidth={0}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={cn(INPUT_CLASS, "tabular-nums")}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d) => {
                    const isSelected = selectedDays.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() => toggleDay(d)}
                        className={cn(
                          "h-8 rounded-md border px-3 text-[11px] font-medium transition-all",
                          isSelected
                            ? "border-stone-900 bg-stone-900 text-white"
                            : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                        )}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className={LABEL_CLASS}>Gender</label>
                  <Dropdown
                    value={gender}
                    onChange={(v) => setGender(String(v))}
                    options={GENDER_OPTIONS}
                    minWidth={140}
                  />
                </div>
                <label className="flex items-center gap-2 text-[12px] text-stone-600 mt-5">
                  <input
                    type="checkbox"
                    checked={isKids}
                    onChange={(e) => setIsKids(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-400"
                  />
                  Kids program
                </label>
                <label className="flex items-center gap-2 text-[12px] text-stone-600 mt-5">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-400"
                  />
                  Paid
                </label>
                {isPaid && (
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="$0.00"
                    min="0"
                    step="0.01"
                    className="mt-5 h-10 w-24 rounded-lg border border-stone-200 bg-white px-3 text-[12px] tabular-nums text-stone-900 shadow-sm outline-none transition-colors hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={addProgram} disabled={saving} className={BTN_PRIMARY_SM}>
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {saving ? "Adding..." : "Add Program"}
                </button>
                <button onClick={resetForm} className={BTN_GHOST_SM}>
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      {!showForm && (
        <div className="flex gap-2.5">
          <button
            onClick={() => setShowForm(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white py-3.5 text-[13px] font-medium text-stone-600 transition-all hover:border-stone-400 hover:bg-stone-50"
          >
            <Plus size={15} />
            Add Program
          </button>
          <button
            onClick={() => setShowCSV(true)}
            className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3.5 text-[13px] font-medium text-stone-600 shadow-sm transition-all hover:bg-stone-50 hover:text-stone-900"
          >
            <Upload size={14} />
            Import CSV
          </button>
        </div>
      )}

      {showCSV && (
        <CSVImport
          type="program"
          mosqueId={mosqueId}
          dbFields={CSV_FIELDS}
          onImported={(count) => {
            showToast(`Imported ${count} programs`, "success");
            setShowCSV(false);
            fetch(`/api/mosques/${mosqueId}/content?type=program`)
              .then((r) => r.json())
              .then((data) => setPrograms(data))
              .catch(() => {});
          }}
          onClose={() => setShowCSV(false)}
        />
      )}
    </div>
  );
}
