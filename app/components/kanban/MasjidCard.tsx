"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import type { KanbanCard as KanbanCardModel, Stage } from "./types";
import EditContactModal from "./EditContactModal";

type Props = {
  card: KanbanCardModel;
  onMoveNext?: () => void;
  onNoteAdded?: (note: string) => void;
  onContactEdited?: (name: string, email: string) => void;
  onCreateAccount?: () => void;
};

function formatLocation(city: string, state: string | null | undefined) {
  const c = city.trim();
  const s = state?.trim();
  if (c && s) return `${c}, ${s}`;
  if (c) return c;
  if (s) return s;
  return "";
}

function formatRelativeShort(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (sec < 60) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 14) return `${day}d`;
  const wk = Math.floor(day / 7);
  if (wk < 8) return `${wk}w`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 20.5v-1c0-2.75 2.25-5 5-5h3c2.75 0 5 2.25 5 5v1" />
    </svg>
  );
}

/**
 * Fixed-height line for alignment across cards; empty lines stay blank (no dashes).
 * Email / org sit in this column under the name, flush with the name’s left edge.
 */
function MetaLine({
  children,
  className,
}: {
  children?: ReactNode;
  className: string;
}) {
  return (
    <div className={`line-clamp-1 min-h-3.75 min-w-0 leading-[1.35] ${className}`}>
      {children}
    </div>
  );
}

const iconRail =
  "flex w-[18px] shrink-0 justify-center pt-[3px] text-green/38 [&_svg]:shrink-0";

/** Distinct hues per pipeline stage so columns read at a glance (not just green opacity steps). */
const stageBorderClass: Record<Stage, string> = {
  lead: "border-l-slate-400",
  contacted: "border-l-sky-500",
  demo: "border-l-violet-500",
  contract: "border-l-amber-500",
  onboarding: "border-l-cyan-600",
  live: "border-l-lime-500",
};

function badgeClasses(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days > 14) return "bg-red-500 text-white";
  if (days >= 7) return "border border-amber-400 text-amber-500";
  return "border border-green/20 text-green/60";
}

const STAGE_ORDER: Stage[] = ["lead", "contacted", "demo", "contract", "onboarding", "live"];

type MenuItem = { id: string; label: string; icon: React.ReactNode };

const baseMenuItems: MenuItem[] = [
  {
    id: "move",
    label: "Move to Next Stage",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    ),
  },
  {
    id: "note",
    label: "Add Note",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M8 7h8M8 12h5" />
      </svg>
    ),
  },
  {
    id: "edit",
    label: "Edit Contact",
    icon: (
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M17 3l4 4L7 21H3v-4L17 3z" />
      </svg>
    ),
  },
];

const createAccountItem: MenuItem = {
  id: "create_account",
  label: "Create Account",
  icon: (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
};

export default function MasjidCard({ card, onMoveNext, onNoteAdded, onContactEdited, onCreateAccount }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const title = card.mosqueName.trim();
  const location = formatLocation(card.city, card.state);
  const contactName = card.contactName.trim();
  const contactEmail = (card.contactEmail ?? "").trim();
  const referredBy = (card.referredBy ?? "").trim();
  const relative = formatRelativeShort(card.updatedAt);
  const isLastStage = card.stage === STAGE_ORDER[STAGE_ORDER.length - 1];
  // Show "Create Account" for leads that don't have a Clerk org yet
  // (their mosqueId is a UUID, not an org_ prefixed Clerk ID)
  const hasClerkOrg = String(card.mosqueId).startsWith("org_");
  const menuItems: MenuItem[] = [
    ...baseMenuItems,
    ...(!hasClerkOrg && onCreateAccount ? [createAccountItem] : []),
  ];

  function handleMenuAction(id: string) {
    setIsMenuOpen(false);
    if (id === "move" && onMoveNext) onMoveNext();
    if (id === "note") setIsAddingNote(true);
    if (id === "edit") setIsEditingContact(true);
    if (id === "create_account" && onCreateAccount) onCreateAccount();
  }

  async function handleSaveNote() {
    const text = noteText.trim();
    if (!text) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/pipeline/note", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mosqueId: String(card.mosqueId ?? card.id), note: text }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to save note.");
      }
      onNoteAdded?.(text);
      setNoteText("");
      setIsAddingNote(false);
    } catch {
      // stay in form so user can retry
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelNote() {
    setNoteText("");
    setIsAddingNote(false);
  }

  return (
    <article
      className={`group relative flex h-44 w-full flex-col rounded-2xl border border-l-[3px] ${stageBorderClass[card.stage]} border-green/[0.09] bg-white p-4 text-left shadow-[0_1px_2px_rgba(10,38,30,0.05)] transition-shadow hover:shadow-md`}
      aria-label={title ? `${title}, pipeline card` : "Pipeline card"}
    >
      {isAddingNote ? (
        <div className="flex flex-1 flex-col gap-2" onPointerDown={(e) => e.stopPropagation()}>
          <h3 className="line-clamp-1 text-[13px] font-bold text-green">
            {title || "Add Note"}<span className="ml-1.5 text-[11px] font-normal text-green/40">— Add Note</span>
          </h3>
          <textarea
            className="flex-1 resize-none rounded-lg border border-green/15 bg-tan/30 px-2.5 py-2 text-[12px] text-green placeholder:text-green/30 focus:border-green/30 focus:outline-none"
            placeholder="Type your note..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-full px-3 py-1 text-[11px] font-medium text-green/50 transition-colors hover:text-green"
              onClick={handleCancelNote}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-full bg-green px-3 py-1 text-[11px] font-medium text-tan transition-opacity hover:opacity-90 disabled:opacity-50"
              onClick={handleSaveNote}
              disabled={isSaving || !noteText.trim()}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex min-h-5 items-start justify-between gap-2">
              {title ? (
                <h3 className="line-clamp-2 text-[14px] font-bold leading-snug tracking-tight text-green">
                  {title}
                </h3>
              ) : <span />}
              <div ref={menuRef} className="relative shrink-0">
                <button
                  type="button"
                  className="cursor-pointer rounded-md p-0.5 text-green/40 opacity-0 transition-opacity hover:text-green/70 group-hover:opacity-100"
                  aria-label="Card options"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen((prev) => !prev);
                  }}
                >
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <circle cx="5" cy="12" r="1.75" />
                    <circle cx="12" cy="12" r="1.75" />
                    <circle cx="19" cy="12" r="1.75" />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-green/10 bg-white py-1 shadow-lg">
                    {menuItems.map((item) => {
                      const disabled = item.id === "move" && isLastStage;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={disabled}
                          className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors ${
                            disabled
                              ? "cursor-not-allowed text-green/25"
                              : "cursor-pointer text-green hover:bg-tan/60"
                          }`}
                          onClick={() => {
                            if (!disabled) handleMenuAction(item.id);
                          }}
                        >
                          <span className="shrink-0">{item.icon}</span>
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className={iconRail} aria-hidden>
                <IconMapPin />
              </span>
              {location ? (
                <MetaLine className="pt-0.5 text-[11px] text-green/[0.52]">
                  {location}
                </MetaLine>
              ) : (
                <MetaLine className="pt-0.5 text-[11px] italic text-amber-400">
                  No location added
                </MetaLine>
              )}
            </div>

            {(contactName || contactEmail) ? (
              <div className="flex items-start gap-2">
                <span className={iconRail} aria-hidden>
                  <IconUser />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-px">
                  {contactName ? (
                    <MetaLine className="pt-0.5 text-[12px] font-semibold leading-snug text-green">
                      {contactName}
                    </MetaLine>
                  ) : null}
                  {contactEmail ? (
                    <MetaLine className="text-[11px] text-green/[0.48]">
                      {contactEmail}
                    </MetaLine>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <span className="flex w-4.5 shrink-0 justify-center pt-1.25" aria-hidden>
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                </span>
                <span className="pt-0.5 text-[11px] font-medium text-amber-400">No contact assigned</span>
              </div>
            )}
          </div>

          <hr className="mt-auto w-full shrink-0 border-t border-green/20" />

          <div className="mt-3 flex shrink-0 items-center justify-between gap-3">
            {referredBy ? (
              <p className="line-clamp-2 min-w-0 flex-1 text-[11px] leading-snug text-green/[0.52]">
                {referredBy}
              </p>
            ) : (
              <p className="min-w-0 flex-1 text-[11px] italic text-green/30">
                No notes yet
              </p>
            )}
            {relative ? (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold tabular-nums ${badgeClasses(card.updatedAt)}`}>
                {relative}
              </span>
            ) : null}
          </div>
        </>
      )}
      <EditContactModal
        open={isEditingContact}
        onClose={() => setIsEditingContact(false)}
        onSave={(name, email) => {
          setIsEditingContact(false);
          onContactEdited?.(name, email);
        }}
        initialName={contactName}
        initialEmail={contactEmail}
        mosqueName={title}
        mosqueId={String(card.mosqueId ?? card.id)}
      />
    </article>
  );
}
