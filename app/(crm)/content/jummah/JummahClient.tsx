"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Clock,
  Mic2,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from "../../_components/PageHeader";
import EmptyState from "../../_components/EmptyState";
import ConfirmInline from "../../_components/ConfirmInline";
import { useJummah, type CrmJummahSlot } from "../../_hooks/useJummah";
import { useSpeakers } from "../../_hooks/useSpeakers";

const EASE = [0.16, 1, 0.3, 1] as const;

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${m.toString().padStart(2, "0")} ${period}`;
}

export default function JummahClient() {
  const { data: slots, add, update, remove } = useJummah();
  const { data: speakers } = useSpeakers();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const sorted = [...slots].sort((a, b) =>
    a.prayerTime.localeCompare(b.prayerTime)
  );

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Jummah"
        description="Friday prayer slots — time, khateeb, and topic. Lives in your mosque app's Jummah screen."
        action={
          <Button onClick={() => setAdding(true)} disabled={adding}>
            <Plus size={14} />
            Add slot
          </Button>
        }
      />

      {adding ? (
        <div className="mb-4">
          <JummahForm
            speakers={speakers.map((s) => ({ id: s.id, name: s.name }))}
            onSubmit={(input) => {
              add(input);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : null}

      {sorted.length === 0 && !adding ? (
        <EmptyState
          title="No Jummah slots yet"
          description="Set the prayer time, pick the khateeb from your speaker registry, and add a topic. Members see this in the app's Jummah tab."
          ghostRowCaption="1:15 PM · Sheikh Omar · The fiqh of charity"
          action={
            <Button onClick={() => setAdding(true)}>
              <Plus size={14} />
              Add your first slot
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {sorted.map((slot) => (
              <motion.li
                key={slot.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: EASE }}
              >
                {confirmRemoveId === slot.id ? (
                  <ConfirmInline
                    open
                    message={`Remove the ${formatTime(slot.prayerTime)} jummah slot?`}
                    onConfirm={() => {
                      remove(slot.id);
                      setConfirmRemoveId(null);
                    }}
                    onCancel={() => setConfirmRemoveId(null)}
                  />
                ) : editingId === slot.id ? (
                  <JummahForm
                    initial={slot}
                    speakers={speakers.map((s) => ({ id: s.id, name: s.name }))}
                    submitLabel="Save changes"
                    onSubmit={(input) => {
                      update(slot.id, input);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <SlotRow
                    slot={slot}
                    onEdit={() => setEditingId(slot.id)}
                    onRemove={() => setConfirmRemoveId(slot.id)}
                  />
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </>
  );
}

function SlotRow({
  slot,
  onEdit,
  onRemove,
}: {
  slot: CrmJummahSlot;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="group flex items-center gap-4 rounded-xl border border-[#0A261E]/8 bg-white px-5 py-3.5 transition-colors hover:bg-[#fffbf2]/60">
      <div
        className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg font-display text-[14px] text-[#0A261E]"
        style={{ background: "var(--mosque-accent, #B8922A)" }}
      >
        {formatTime(slot.prayerTime)
          .replace(" AM", "")
          .replace(" PM", "")}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-[#0A261E]">
          {slot.topic || (
            <span className="italic text-[#0A261E]/45">No topic set</span>
          )}
        </p>
        <p className="text-[11.5px] text-[#0A261E]/55">
          <Mic2 size={10} className="mr-1 inline" />
          {slot.speakerName ?? (
            <span className="italic">No khateeb assigned</span>
          )}
        </p>
      </div>
      <div className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Slot actions"
            className="flex h-8 w-8 items-center justify-center rounded-md text-[#0A261E]/60 transition-colors hover:bg-[#0A261E]/[0.05] hover:text-[#0A261E]"
          >
            <MoreHorizontal size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil size={13} />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onRemove}
              className="text-red-600 data-[highlighted]:text-red-600"
            >
              <Trash2 size={13} />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}

function JummahForm({
  initial,
  speakers,
  onSubmit,
  onCancel,
  submitLabel = "Add slot",
}: {
  initial?: CrmJummahSlot;
  speakers: Array<{ id: string; name: string }>;
  onSubmit: (input: { prayerTime: string; topic?: string; speakerId?: string | null }) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [time, setTime] = useState(initial?.prayerTime ?? "13:00");
  const [topic, setTopic] = useState(initial?.topic ?? "");
  const [speakerId, setSpeakerId] = useState<string | null>(initial?.speakerId ?? null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ prayerTime: time, topic, speakerId });
      }}
      className="rounded-xl border border-[#0A261E]/10 bg-white p-4"
    >
      <div className="grid gap-3 md:grid-cols-[140px_180px_1fr_auto]">
        <div className="space-y-1">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-[#0A261E]/55">
            Time
          </Label>
          <div className="relative">
            <Clock
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#0A261E]/45"
            />
            <Input
              type="time"
              value={time}
              required
              onChange={(e) => setTime(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-[#0A261E]/55">
            Khateeb
          </Label>
          <Select
            value={speakerId ?? "__none"}
            onValueChange={(v) => setSpeakerId(v === "__none" ? null : (v ?? null))}
          >
            <SelectTrigger>
              <Mic2 size={12} className="text-[#0A261E]/45" />
              <SelectValue placeholder="From registry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— No khateeb —</SelectItem>
              {speakers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-[#0A261E]/55">
            Topic
          </Label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. The fiqh of charity"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            <X size={13} />
            Cancel
          </Button>
          <Button type="submit">
            <Check size={13} />
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

