"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/ToastProvider";

const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "America/Honolulu", label: "Hawaii (HT)" },
];

type MosqueData = {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  timezone: string | null;
};

const FIELDS = ["name", "address", "city", "state", "phone", "email", "timezone"] as const;

export default function MosqueProfilePanel({ mosque }: { mosque: MosqueData }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: mosque.name || "",
    address: mosque.address || "",
    city: mosque.city || "",
    state: mosque.state || "",
    phone: "",
    email: "",
    timezone: mosque.timezone || "America/New_York",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const filledCount = FIELDS.filter((f) => form[f].trim() !== "").length;

  async function handleSave(markComplete = false) {
    setSaving(true);
    try {
      const res = await fetch(`/api/mosques/${mosque.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(markComplete ? { markComplete: "mosque_profile" } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      showToast(markComplete ? "Mosque profile completed" : "Profile saved", "success");
      router.refresh();
    } catch {
      showToast("Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.round((filledCount / FIELDS.length) * 100)}%` }}
          />
        </div>
        <span className="text-[12px] font-medium tabular-nums text-stone-500">
          {filledCount}/{FIELDS.length} fields
        </span>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1 block text-[12px] font-medium text-stone-600">
              Mosque Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g., Islamic Center of Brooklyn"
              className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="col-span-2">
            <label className="mb-1 block text-[12px] font-medium text-stone-600">
              Street Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="e.g., 123 Main Street"
              className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-stone-600">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="Brooklyn"
              className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-stone-600">State</label>
            <input
              type="text"
              value={form.state}
              onChange={(e) => updateField("state", e.target.value)}
              placeholder="NY"
              className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-stone-600">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="(718) 555-0100"
              className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-stone-600">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="info@masjid.org"
              className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-[13px] text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="col-span-2">
            <label className="mb-1 block text-[12px] font-medium text-stone-600">Timezone</label>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 mb-2">
              <p className="text-[11px] text-amber-700">
                Your prayer notification system depends on this setting.
              </p>
            </div>
            <select
              value={form.timezone}
              onChange={(e) => updateField("timezone", e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-[13px] text-stone-900 focus:border-emerald-500 focus:outline-none"
            >
              {US_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          className="rounded-lg border border-stone-300 px-5 py-2.5 text-[13px] font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving || filledCount < 4}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-[13px] font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          Mark Complete
        </button>
      </div>
    </div>
  );
}
