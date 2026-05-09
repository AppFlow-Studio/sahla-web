"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Mic2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import PageHeader from "../../_components/PageHeader";
import EmptyState from "../../_components/EmptyState";
import ConfirmInline from "../../_components/ConfirmInline";
import SpeakerForm, { type SpeakerFormValues } from "./SpeakerForm";
import { useSpeakers } from "../../_hooks/useSpeakers";
import { relativeShort } from "../../_lib/format";
import type { Speaker } from "../../_mock/speakers";

const EASE = [0.16, 1, 0.3, 1] as const;

type DialogState =
  | { mode: "closed" }
  | { mode: "add" }
  | { mode: "edit"; speaker: Speaker };

export default function SpeakersClient() {
  const { data: speakers, add, update, remove } = useSpeakers();
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return speakers;
    return speakers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.credentials.toLowerCase().includes(q)
    );
  }, [speakers, query]);

  function handleSubmit(values: SpeakerFormValues) {
    if (dialog.mode === "add") {
      add({
        name: values.name,
        credentials: values.credentials,
        bio: values.bio ?? "",
        photoUrl: values.photoUrl || generatePlaceholderPhoto(values.name),
        email: values.email,
      });
      toast.success(`${values.name} added`);
    } else if (dialog.mode === "edit") {
      update(dialog.speaker.id, {
        name: values.name,
        credentials: values.credentials,
        bio: values.bio ?? "",
        photoUrl: values.photoUrl || dialog.speaker.photoUrl,
        email: values.email,
      });
      toast.success(`${values.name} updated`);
    }
    setDialog({ mode: "closed" });
  }

  function handleDelete(id: string, name: string) {
    remove(id);
    setConfirmId(null);
    toast.success(`${name} removed`);
  }

  const isEmpty = speakers.length === 0;
  const noResults = !isEmpty && filtered.length === 0;

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Speakers"
        description="Build a registry once — reuse them across Programs, Events, and Jummah."
        action={
          <Button onClick={() => setDialog({ mode: "add" })}>
            <Plus size={14} />
            Add speaker
          </Button>
        }
      />

      {isEmpty ? (
        <EmptyState
          title="No speakers yet"
          description="Add your imam, board members, and visiting scholars once. They'll auto-populate every Program, Event, and Jummah you schedule."
          ghostRowCaption="Sheikh Omar Suleiman · President, Yaqeen Institute"
          videoUrl="https://www.loom.com/share/example"
          videoLabel="Watch how speakers work"
          action={
            <Button onClick={() => setDialog({ mode: "add" })}>
              <Plus size={14} />
              Add your first speaker
            </Button>
          }
        />
      ) : (
        <>
          {/* Search bar */}
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-md flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0A261E]/40"
              />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or credentials…"
                className="pl-9"
              />
            </div>
            <p className="text-[12.5px] text-[#0A261E]/55">
              {filtered.length} {filtered.length === 1 ? "speaker" : "speakers"}
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-[#0A261E]/8 bg-white md:block">
            <div className="grid grid-cols-[1fr_140px_120px_56px] items-center gap-4 border-b border-[#0A261E]/8 bg-[#fffbf2] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/55">
              <div>Speaker</div>
              <div>Programs led</div>
              <div>Last spoke</div>
              <div className="sr-only">Actions</div>
            </div>

            {noResults ? (
              <div className="px-6 py-12 text-center text-[13px] text-[#0A261E]/55">
                No speakers match &quot;{query}&quot;.
              </div>
            ) : (
              <ul>
                <AnimatePresence initial={false}>
                  {filtered.map((speaker) => (
                    <motion.li
                      key={speaker.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: EASE }}
                      className="border-b border-[#0A261E]/6 last:border-b-0"
                    >
                      {confirmId === speaker.id ? (
                        <div className="px-5 py-3">
                          <ConfirmInline
                            open
                            message={`Remove ${speaker.name} from your registry?`}
                            onConfirm={() => handleDelete(speaker.id, speaker.name)}
                            onCancel={() => setConfirmId(null)}
                          />
                        </div>
                      ) : (
                        <div className="group grid grid-cols-[1fr_140px_120px_56px] items-center gap-4 px-5 py-3 transition-colors hover:bg-[#fffbf2]/60">
                          <button
                            type="button"
                            onClick={() => setDialog({ mode: "edit", speaker })}
                            className="flex min-w-0 items-center gap-3 text-left"
                          >
                            <SpeakerAvatar speaker={speaker} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13.5px] font-semibold text-[#0A261E]">
                                {speaker.name}
                              </p>
                              <p className="line-clamp-1 text-[12px] text-[#0A261E]/55">
                                {speaker.credentials}
                              </p>
                            </div>
                          </button>
                          <div className="text-[13px] tabular-nums text-[#0A261E]/75">
                            {speaker.programsCount}
                          </div>
                          <div className="text-[12.5px] text-[#0A261E]/55">
                            {relativeShort(speaker.lastSpokeAt)}
                          </div>
                          <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                aria-label="Speaker actions"
                                className="flex h-8 w-8 items-center justify-center rounded-md text-[#0A261E]/60 transition-colors hover:bg-[#0A261E]/[0.05] hover:text-[#0A261E]"
                              >
                                <MoreHorizontal size={16} />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onSelect={() =>
                                    setDialog({ mode: "edit", speaker })
                                  }
                                >
                                  <Pencil size={13} />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => setConfirmId(speaker.id)}
                                  className="text-red-600 data-[highlighted]:text-red-600"
                                >
                                  <Trash2 size={13} />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>

          {/* Mobile card list */}
          <ul className="space-y-2 md:hidden">
            <AnimatePresence initial={false}>
              {filtered.map((speaker) => (
                <motion.li
                  key={speaker.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="rounded-xl border border-[#0A261E]/8 bg-white p-4"
                >
                  {confirmId === speaker.id ? (
                    <ConfirmInline
                      open
                      message={`Remove ${speaker.name}?`}
                      onConfirm={() => handleDelete(speaker.id, speaker.name)}
                      onCancel={() => setConfirmId(null)}
                    />
                  ) : (
                    <div className="flex items-start gap-3">
                      <SpeakerAvatar speaker={speaker} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-[#0A261E]">
                          {speaker.name}
                        </p>
                        <p className="line-clamp-2 text-[12px] text-[#0A261E]/60">
                          {speaker.credentials}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-[11.5px] text-[#0A261E]/55">
                          <span>{speaker.programsCount} programs</span>
                          <span>·</span>
                          <span>{relativeShort(speaker.lastSpokeAt)}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label="Speaker actions"
                          className="-mr-1 flex h-8 w-8 items-center justify-center rounded-md text-[#0A261E]/60 hover:bg-[#0A261E]/[0.05]"
                        >
                          <MoreHorizontal size={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onSelect={() => setDialog({ mode: "edit", speaker })}
                          >
                            <Pencil size={13} /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => setConfirmId(speaker.id)}
                            className="text-red-600 data-[highlighted]:text-red-600"
                          >
                            <Trash2 size={13} /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}

      {/* Add / Edit dialog */}
      <Dialog
        open={dialog.mode !== "closed"}
        onOpenChange={(open) => (!open ? setDialog({ mode: "closed" }) : null)}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-[#0A261E]">
              {dialog.mode === "edit" ? "Edit speaker" : "Add a speaker"}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#0A261E]/60">
              {dialog.mode === "edit"
                ? "Updates apply everywhere this speaker appears."
                : "Once added, they're available across Programs, Events, and Jummah."}
            </DialogDescription>
          </DialogHeader>
          <SpeakerForm
            defaultValues={dialog.mode === "edit" ? dialog.speaker : undefined}
            onCancel={() => setDialog({ mode: "closed" })}
            onSubmit={handleSubmit}
            submitLabel={dialog.mode === "edit" ? "Save changes" : "Add speaker"}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function SpeakerAvatar({ speaker }: { speaker: Speaker }) {
  if (speaker.photoUrl) {
    return (
      <img
        src={speaker.photoUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white"
        loading="lazy"
      />
    );
  }
  const initials = speaker.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A261E]/8 text-[12px] font-semibold text-[#0A261E]/70 ring-2 ring-white">
      <Mic2 size={14} className="opacity-0" />
      <span className="-ml-3">{initials}</span>
    </div>
  );
}

function generatePlaceholderPhoto(name: string) {
  // Stable hash → seed for the placeholder service so the same name always
  // returns the same image during this session.
  const seeds = [
    "photo-1507003211169-0a1dd7228f2d",
    "photo-1500648767791-00dcc994a43e",
    "photo-1573497019940-1c28c88b4f3e",
    "photo-1599566150163-29194dcaad36",
    "photo-1568602471122-7832951cc4c5",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const seed = seeds[Math.abs(h) % seeds.length];
  return `https://images.unsplash.com/${seed}?auto=format&fit=facearea&facepad=2.5&w=160&h=160&q=80`;
}
