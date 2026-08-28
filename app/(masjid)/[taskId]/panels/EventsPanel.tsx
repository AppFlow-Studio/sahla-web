"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Plus, Upload, Trash2, Pencil, Loader2 } from "lucide-react";
import { useToast } from "../../components/ToastProvider";
import CSVImport from "../../components/CSVImport";
import TimePicker, { formatTimeLabel } from "../../components/TimePicker";
import CoverImageUpload from "../../components/CoverImageUpload";
import { Dropdown } from "@/app/(admin)/components/Dropdown";
import { cn } from "@/lib/utils";
import { INPUT_CLASS, LABEL_CLASS, BTN_PRIMARY_SM, BTN_GHOST_SM } from "@/lib/ui-classes";

type ContentItem = {
  id: number;
  content_id: string;
  name: string;
  description: string | null;
  image: string | null;
  speakers: string[];
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  gender: string;
  is_kids: boolean;
  is_paid: boolean;
  price: number;
};

type Speaker = { speaker_id: string; speaker_name: string };

const CSV_FIELDS = [
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  { key: "speaker", label: "Speaker" },
  { key: "start_date", label: "Start Date" },
  { key: "end_date", label: "End Date" },
  { key: "start_time", label: "Start Time" },
  { key: "gender", label: "Gender" },
  { key: "is_kids", label: "Kids Event" },
  { key: "is_paid", label: "Paid" },
  { key: "price", label: "Price" },
];

const GENDER_OPTIONS = [
  { value: "All", label: "All Genders" },
  { value: "Brothers", label: "Brothers" },
  { value: "Sisters", label: "Sisters" },
];

const NAME_MAX = 40;
const DESCRIPTION_MAX = 300;

export default function EventsPanel({
  mosqueId,
  initialEvents,
  speakers,
}: {
  mosqueId: string;
  initialEvents: ContentItem[];
  speakers: Speaker[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [events, setEvents] = useState(initialEvents);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  // content_id of the event being edited; null while adding a new one.
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  // One-time events finish on the day they start, so they carry a length in
  // hours instead of an end date.
  const [isOneTime, setIsOneTime] = useState(false);
  const [durationHours, setDurationHours] = useState("");
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

  // Preview of when a one-time event wraps up. Purely informational — the
  // length itself has nowhere to live on content_items, so only the same-day
  // end date is persisted.
  const oneTimeEndLabel = useMemo(() => {
    const hours = parseFloat(durationHours);
    if (!startTime || !Number.isFinite(hours) || hours <= 0) return null;
    const [h, m] = startTime.split(":").map(Number);
    const total = h * 60 + m + Math.round(hours * 60);
    if (total >= 24 * 60) return "Runs past midnight — set an end date instead";
    const end = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
      total % 60
    ).padStart(2, "0")}`;
    return `Ends around ${formatTimeLabel(end) ?? end}, same day`;
  }, [startTime, durationHours]);

  function resetForm() {
    setName(""); setDescription(""); setImage(null); setSelectedSpeaker(""); setStartDate("");
    setEndDate(""); setStartTime(""); setIsOneTime(false); setDurationHours("");
    setGender("All"); setIsKids(false); setIsPaid(false); setPrice("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(event: ContentItem) {
    setEditingId(event.content_id);
    setName(event.name ?? "");
    setDescription(event.description ?? "");
    setImage(event.image ?? null);
    setSelectedSpeaker(event.speakers?.[0] ?? "");
    setStartDate(event.start_date ?? "");
    setEndDate(event.end_date ?? "");
    // Times come back as HH:MM:SS; the picker works in HH:MM.
    setStartTime(event.start_time ? event.start_time.slice(0, 5) : "");
    // No end date, or one that matches the start, means it ran a single day.
    setIsOneTime(!event.end_date || event.end_date === event.start_date);
    setDurationHours("");
    setGender(event.gender ?? "All");
    setIsKids(event.is_kids);
    setIsPaid(event.is_paid);
    setPrice(event.is_paid ? String(event.price ?? "") : "");
    setShowForm(true);
  }

  async function saveEvent() {
    if (!name.trim()) { showToast("Event name is required", "error"); return; }
    setSaving(true);
    const fields = {
      name,
      description: description || null,
      image,
      speakers: selectedSpeaker ? [selectedSpeaker] : [],
      start_date: startDate || null,
      end_date: isOneTime ? startDate || null : endDate || null,
      start_time: startTime || null,
      gender,
      is_kids: isKids,
      is_paid: isPaid,
      price: isPaid ? parseFloat(price) || 0 : 0,
    };
    try {
      if (editingId) {
        const res = await fetch(
          `/api/mosques/${mosqueId}/content?contentId=${editingId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fields),
          }
        );
        if (!res.ok) throw new Error("Failed to save");
        const updated = await res.json();
        setEvents((prev) =>
          prev.map((e) => (e.content_id === editingId ? updated : e))
        );
        resetForm();
        showToast("Event updated", "success");
        return;
      }

      const res = await fetch(`/api/mosques/${mosqueId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "event", ...fields, markComplete: true }),
      });
      if (!res.ok) throw new Error("Failed to add");
      const newItem = await res.json();
      setEvents((prev) => [newItem, ...prev]);
      resetForm();
      showToast("Event added", "success");
      // The POST marks the `events` task complete server-side; refresh so the
      // sidebar checkmark lands now instead of on the next navigation.
      router.refresh();
    } catch {
      showToast(editingId ? "Failed to save event" : "Failed to add event", "error");
    }
    finally { setSaving(false); }
  }

  async function deleteEvent(contentId: string) {
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/content?contentId=${contentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setEvents((prev) => prev.filter((e) => e.content_id !== contentId));
      showToast("Event removed", "success");
      // Refresh so the sidebar picks up the un-mark when this was the last one.
      router.refresh();
    } catch { showToast("Failed to remove", "error"); }
  }

  return (
    <div className="space-y-5">
      {/* Event List */}
      {events.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {events.map((event) => (
              <motion.div
                key={event.content_id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="group flex items-start gap-4 rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-sm transition-colors hover:bg-stone-50/60"
              >
                {event.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.image}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg border border-stone-200 object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-stone-900">{event.name}</p>
                  {event.description && (
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-stone-500">{event.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {event.start_date && (
                      <span className="rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                        {new Date(event.start_date).toLocaleDateString()}
                      </span>
                    )}
                    {event.start_time && (
                      <span className="text-[10px] text-stone-400">
                        {formatTimeLabel(event.start_time) ?? event.start_time}
                      </span>
                    )}
                    {event.gender !== "All" && (
                      <span className="rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                        {event.gender}
                      </span>
                    )}
                    {event.is_kids && (
                      <span className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                        Kids
                      </span>
                    )}
                    {event.is_paid && (
                      <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        ${event.price}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    onClick={() => startEdit(event)}
                    aria-label={`Edit ${event.name}`}
                    className="rounded-md p-1.5 text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-700"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => deleteEvent(event.content_id)}
                    aria-label={`Remove ${event.name}`}
                    className="rounded-md p-1.5 text-stone-300 transition-colors hover:bg-stone-100 hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {events.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-stone-200 bg-white px-6 py-16 shadow-sm">
          <Calendar size={48} className="mb-4 text-stone-200" strokeWidth={1} />
          <p className="text-[15px] font-medium text-stone-500">No events yet</p>
          <p className="mt-1 text-[13px] text-stone-400">Add community events, fundraisers, and gatherings</p>
        </div>
      )}

      {/* Add Event Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
          >
            <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-4">
              <p className="text-[14px] font-semibold text-stone-900">
                {editingId ? "Edit Event" : "New Event"}
              </p>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div>
                <div className="flex items-center justify-between">
                  <label className={LABEL_CLASS}>Event Name</label>
                  <span
                    className={cn(
                      "mb-1.5 text-[10.5px] tabular-nums",
                      name.length >= NAME_MAX ? "text-red-500" : "text-stone-400"
                    )}
                  >
                    {name.length}/{NAME_MAX}
                  </span>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
                  maxLength={NAME_MAX}
                  placeholder="e.g., Ramadan Iftar"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className={LABEL_CLASS}>Description</label>
                  <span
                    className={cn(
                      "mb-1.5 text-[10.5px] tabular-nums",
                      description.length >= DESCRIPTION_MAX
                        ? "text-red-500"
                        : "text-stone-400"
                    )}
                  >
                    {description.length}/{DESCRIPTION_MAX}
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value.slice(0, DESCRIPTION_MAX))
                  }
                  maxLength={DESCRIPTION_MAX}
                  placeholder="Brief description (optional)"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition-colors placeholder:text-stone-400 hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-100"
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Cover Image</label>
                <CoverImageUpload
                  value={image}
                  mosqueId={mosqueId}
                  disabled={saving}
                  onChange={setImage}
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
                  <label className={LABEL_CLASS}>Time</label>
                  <TimePicker value={startTime} onChange={setStartTime} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-[12px] text-stone-600">
                <input
                  type="checkbox"
                  checked={isOneTime}
                  onChange={(e) => setIsOneTime(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-400"
                />
                One-time event — finishes the same day it starts
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  {isOneTime ? (
                    <>
                      <label className={LABEL_CLASS}>Length (hours)</label>
                      <input
                        type="number"
                        min="0.5"
                        max="24"
                        step="0.5"
                        value={durationHours}
                        onChange={(e) => setDurationHours(e.target.value)}
                        placeholder="e.g., 3"
                        className={INPUT_CLASS}
                      />
                    </>
                  ) : (
                    <>
                      <label className={LABEL_CLASS}>End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </>
                  )}
                </div>
              </div>
              {isOneTime && (
                <p className="-mt-2 text-[11px] text-stone-400">
                  {oneTimeEndLabel ??
                    "The event is saved as ending on its start date. Add a start time and length to see when it wraps up."}
                </p>
              )}
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
                  Kids event
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
                <button onClick={saveEvent} disabled={saving} className={BTN_PRIMARY_SM}>
                  {saving && <Loader2 size={13} className="animate-spin" />}
                  {saving
                    ? editingId ? "Saving..." : "Adding..."
                    : editingId ? "Save Changes" : "Add Event"}
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
            Add Event
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
          type="event"
          mosqueId={mosqueId}
          dbFields={CSV_FIELDS}
          onImported={(count) => {
            showToast(`Imported ${count} events`, "success");
            setShowCSV(false);
            fetch(`/api/mosques/${mosqueId}/content?type=event`)
              .then((r) => r.json())
              .then((data) => setEvents(data))
              .catch(() => {});
          }}
          onClose={() => setShowCSV(false)}
        />
      )}
    </div>
  );
}
