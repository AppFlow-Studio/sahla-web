"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Globe2,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dropdown-menu";
import PageHeader from "../../_components/PageHeader";
import EmptyState from "../../_components/EmptyState";
import ConfirmInline from "../../_components/ConfirmInline";
import ReelUploadForm from "./ReelUploadForm";
import { useReels, type Reel, type ReelsScope } from "../../_hooks/useReels";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function ReelsClient() {
  const { reels, isLoading, scope, setScope, remove, prependReel } = useReels();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const isEmpty = !isLoading && reels.length === 0;

  function handleUploaded(reel: Reel) {
    prependReel(reel);
    setDialogOpen(false);
  }

  function handleDelete(reel: Reel) {
    remove(reel.id);
    setConfirmId(null);
    toast.success(`${reel.title || "Reel"} removed`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Reels"
        description="Short vertical videos that play in your mosque app's Discover tab. Uploads go live immediately."
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus size={14} />
            Upload reel
          </Button>
        }
      />

      {/* Scope toggle */}
      <ScopeCard scope={scope} onChange={setScope} />

      {isEmpty ? (
        <EmptyState
          title="No reels uploaded yet"
          description="Upload a short vertical video. It plays in your app's Discover tab the moment you save."
          ghostRowCaption="Friday reminder · 0:42"
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus size={14} />
              Upload your first reel
            </Button>
          }
        />
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence initial={false}>
            {reels.map((reel) => (
              <motion.li
                key={reel.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="overflow-hidden rounded-2xl border border-[#0A261E]/8 bg-white"
              >
                {confirmId === reel.id ? (
                  <div className="p-4">
                    <ConfirmInline
                      open
                      message={`Remove "${reel.title || "this reel"}"?`}
                      onConfirm={() => handleDelete(reel)}
                      onCancel={() => setConfirmId(null)}
                    />
                  </div>
                ) : (
                  <>
                    <div className="relative aspect-[9/16] w-full bg-stone-900">
                      <video
                        src={reel.videoUrl}
                        preload="metadata"
                        controls
                        playsInline
                        className="h-full w-full object-cover"
                      />
                      {!reel.isPublished ? (
                        <span className="absolute left-2 top-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                          Draft
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-start gap-2 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-[13px] font-semibold text-[#0A261E]">
                          {reel.title || "Untitled reel"}
                        </p>
                        {reel.caption ? (
                          <p className="line-clamp-2 text-[11.5px] text-[#0A261E]/55">
                            {reel.caption}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[10.5px] text-[#0A261E]/45">
                          {new Date(reel.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label="Reel actions"
                          className="-mr-1 flex h-8 w-8 items-center justify-center rounded-md text-[#0A261E]/60 hover:bg-[#0A261E]/[0.05]"
                        >
                          <MoreHorizontal size={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => setConfirmId(reel.id)}
                            className="text-red-600 data-[highlighted]:text-red-600"
                          >
                            <Trash2 size={13} /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => (!open ? setDialogOpen(false) : null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-[#0A261E]">
              Upload a reel
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#0A261E]/60">
              Vertical 9:16 plays best. Reels are live in the mobile app the moment they finish uploading.
            </DialogDescription>
          </DialogHeader>
          <ReelUploadForm
            onUploaded={handleUploaded}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function ScopeCard({
  scope,
  onChange,
}: {
  scope: ReelsScope;
  onChange: (s: ReelsScope) => void;
}) {
  const options: Array<{
    value: ReelsScope;
    label: string;
    description: string;
    Icon: typeof Building2;
  }> = [
    {
      value: "own",
      label: "My Mosque Only",
      description: "Users see just the reels you upload.",
      Icon: Building2,
    },
    {
      value: "global",
      label: "Include Global Reels",
      description: "Your reels plus reels from every Sahla mosque.",
      Icon: Globe2,
    },
  ];

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-[#0A261E]/8 bg-white">
      <header className="border-b border-[#0A261E]/6 px-5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/55">
          Feed scope
        </p>
        <p className="mt-0.5 text-[12.5px] text-[#0A261E]/65">
          Decide what plays in your app&apos;s Reels tab.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
        {options.map((opt) => {
          const active = scope === opt.value;
          const Icon = opt.Icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                active
                  ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                  : "border-[#0A261E]/10 bg-white hover:border-[#0A261E]/20"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  active
                    ? "bg-emerald-500 text-white"
                    : "bg-[#0A261E]/[0.06] text-[#0A261E]/60"
                )}
              >
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[#0A261E]">
                  {opt.label}
                </p>
                <p className="mt-0.5 text-[11.5px] text-[#0A261E]/55">
                  {opt.description}
                </p>
              </div>
              <div
                className={cn(
                  "mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                  active ? "border-emerald-600" : "border-[#0A261E]/25"
                )}
              >
                {active && (
                  <div className="h-2 w-2 rounded-full bg-emerald-600" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

