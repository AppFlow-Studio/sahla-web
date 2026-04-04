"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../components/ToastProvider";
import CSVImport from "../../components/CSVImport";

type ContentItem = {
  id: number;
  content_id: string;
  name: string;
  description: string | null;
  speakers: string[];
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  gender: string;
  is_kids: boolean;
  is_paid: boolean;
  price: number;
};

type Speaker = {
  speaker_id: string;
  speaker_name: string;
};

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

export default function EventsPanel({
  mosqueId,
  initialEvents,
  speakers,
}: {
  mosqueId: string;
  initialEvents: ContentItem[];
  speakers: Speaker[];
}) {
  const { showToast } = useToast();
  const [events, setEvents] = useState(initialEvents);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCSV, setShowCSV] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [gender, setGender] = useState("All");
  const [isKids, setIsKids] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("");

  function resetForm() {
    setName(""); setDescription(""); setSelectedSpeaker(""); setStartDate("");
    setEndDate(""); setStartTime(""); setGender("All"); setIsKids(false); setIsPaid(false); setPrice("");
    setShowForm(false);
  }

  async function addEvent() {
    if (!name.trim()) { showToast("Event name is required", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "event",
          name,
          description: description || null,
          speakers: selectedSpeaker ? [selectedSpeaker] : [],
          start_date: startDate || null,
          end_date: endDate || null,
          start_time: startTime || null,
          gender,
          is_kids: isKids,
          is_paid: isPaid,
          price: isPaid ? parseFloat(price) || 0 : 0,
          markComplete: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      const newItem = await res.json();
      setEvents((prev) => [newItem, ...prev]);
      resetForm();
      showToast("Event added", "success");
    } catch { showToast("Failed to add event", "error"); }
    finally { setSaving(false); }
  }

  async function deleteEvent(contentId: string) {
    try {
      const res = await fetch(`/api/mosques/${mosqueId}/content?contentId=${contentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setEvents((prev) => prev.filter((e) => e.content_id !== contentId));
      showToast("Event removed", "success");
    } catch { showToast("Failed to remove", "error"); }
  }

  return (
    <div className="space-y-6">
      {/* Event List */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.content_id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-4 rounded-xl border border-stone-200 bg-white px-5 py-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-stone-900">{event.name}</p>
                {event.description && (
                  <p className="mt-0.5 text-[11px] text-stone-400 line-clamp-1">{event.description}</p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {event.start_date && (
                    <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] text-stone-500">
                      {new Date(event.start_date).toLocaleDateString()}
                    </span>
                  )}
                  {event.start_time && (
                    <span className="text-[10px] text-stone-400">{event.start_time}</span>
                  )}
                  {event.gender !== "All" && (
                    <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] text-purple-600">{event.gender}</span>
                  )}
                  {event.is_kids && (
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600">Kids</span>
                  )}
                  {event.is_paid && (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600">${event.price}</span>
                  )}
                </div>
              </div>
              <button onClick={() => deleteEvent(event.content_id)} className="text-stone-300 hover:text-red-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {events.length === 0 && !showForm && (
          <div className="rounded-xl border-2 border-dashed border-stone-200 bg-white p-12 text-center">
            <p className="text-[14px] text-stone-500">No events added yet</p>
            <p className="mt-1 text-[12px] text-stone-400">Add community events, fundraisers, and gatherings</p>
          </div>
        )}
      </div>

      {/* Add Event Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5"
          >
            <p className="mb-3 text-[13px] font-semibold text-stone-900">New Event</p>
            <div className="space-y-3">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Event name"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-stone-600">Speaker</label>
                  <select value={selectedSpeaker} onChange={(e) => setSelectedSpeaker(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-[12px] text-stone-700 focus:outline-none">
                    <option value="">None</option>
                    {speakers.map((s) => <option key={s.speaker_id} value={s.speaker_name}>{s.speaker_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-stone-600">Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-[12px] tabular-nums text-stone-700 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-stone-600">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-[12px] text-stone-700 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-stone-600">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-[12px] text-stone-700 focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-4">
                <select value={gender} onChange={(e) => setGender(e.target.value)}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-[12px] text-stone-700 focus:outline-none">
                  <option value="All">All Genders</option>
                  <option value="Brothers">Brothers</option>
                  <option value="Sisters">Sisters</option>
                </select>
                <label className="flex items-center gap-2 text-[12px] text-stone-600">
                  <input type="checkbox" checked={isKids} onChange={(e) => setIsKids(e.target.checked)} className="rounded" /> Kids
                </label>
                <label className="flex items-center gap-2 text-[12px] text-stone-600">
                  <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} className="rounded" /> Paid
                </label>
                {isPaid && (
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$0.00" min="0" step="0.01"
                    className="w-24 rounded-lg border border-stone-300 bg-white px-3 py-2 text-[12px] tabular-nums text-stone-700 focus:outline-none" />
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={addEvent} disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-emerald-700 disabled:opacity-40">
                  {saving ? "Adding..." : "Add Event"}
                </button>
                <button onClick={resetForm} className="rounded-lg border border-stone-300 px-4 py-2 text-[12px] text-stone-600 hover:bg-stone-50">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      {!showForm && (
        <div className="flex gap-3">
          <button onClick={() => setShowForm(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white py-3 text-[13px] font-medium text-stone-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Event
          </button>
          <button onClick={() => setShowCSV(true)}
            className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3 text-[13px] font-medium text-stone-600 hover:bg-stone-50 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
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
