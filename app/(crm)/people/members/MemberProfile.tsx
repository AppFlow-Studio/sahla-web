"use client";

import { Copy, Check, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fullDate, durationSince } from "../../_lib/format";
import { useMemberDetail, type MemberDetail } from "../../_hooks/useMemberDetail";
import type { Member } from "../../_hooks/useMembers";

type Personalization = MemberDetail["personalization"];

const SPRING = { type: "spring", stiffness: 480, damping: 42, mass: 0.9 } as const;

export default function MemberProfile({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  const { data: detail, isLoading } = useMemberDetail(member.id);

  // Esc closes the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const name = detail?.name ?? member.name;
  const email = detail?.email ?? member.email;
  const signupAt = detail?.signupAt ?? member.signupAt;
  const p = detail?.personalization;
  const hasPersonalization =
    !!p &&
    (p.age != null ||
      p.gender != null ||
      p.isRevert != null ||
      p.hasChildren != null ||
      p.knowledge != null ||
      p.interests.length > 0 ||
      p.programsFor.length > 0 ||
      p.bestTimes.length > 0 ||
      p.morePrefs.length > 0);

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#FBF7EE]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-6 md:px-8">
        {/* Top bar */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            type="button"
            onClick={onClose}
            className="group inline-flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-[13.5px] font-medium text-[#0A261E]/65 transition-colors hover:bg-[#0A261E]/[0.05] hover:text-[#0A261E]"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            Members
          </button>
          <span className="inline-flex items-center rounded-full bg-[#0A261E]/[0.06] px-2.5 py-1 text-[11px] font-medium text-[#0A261E]/55">
            Read-only
          </span>
        </motion.div>

        {/* Header — the shared element morphs from the clicked row */}
        <div className="mt-6 flex items-center gap-4">
          <motion.div
            layoutId={`member-avatar-${member.id}`}
            transition={SPRING}
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-[19px] font-semibold text-[#F4EDDC]"
            style={{ backgroundColor: "#0A261E" }}
          >
            {initials(name)}
          </motion.div>
          <div className="min-w-0">
            <motion.h1
              layoutId={`member-name-${member.id}`}
              transition={SPRING}
              className="font-display text-[30px] leading-tight text-[#0A261E]"
            >
              {name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.12 }}
              className="mt-0.5 text-[14px] text-[#0A261E]/55"
            >
              Member since {fullDate(signupAt)} · {durationSince(signupAt)}
            </motion.p>
          </div>
        </div>

        {/* Content fades/slides up after the morph settles */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Three columns */}
          <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-8 border-t border-[#0A261E]/8 pt-7 md:grid-cols-3 md:divide-x md:divide-[#0A261E]/8">
            {/* Contact */}
            <section className="md:pr-2">
              <SectionLabel>Contact</SectionLabel>
              <div className="mt-3 space-y-2.5">
                <p className="text-[14px] text-[#0A261E]">{email}</p>
                <p className="text-[14px] text-[#0A261E]">
                  {detail?.phone ?? (isLoading ? <Shimmer w="w-28" /> : <Muted>No phone</Muted>)}
                </p>
              </div>
              <div className="mt-4 space-y-2 border-t border-[#0A261E]/8 pt-4 text-[13.5px]">
                <KvRow label="Push">
                  {detail ? (
                    detail.push.enabled ? (
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#0A261E]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        On{detail.push.device ? ` · ${detail.push.device}` : ""}
                      </span>
                    ) : (
                      <Muted>Off</Muted>
                    )
                  ) : member.hasPushToken ? (
                    <span className="font-medium text-[#0A261E]">On</span>
                  ) : (
                    <Muted>Off</Muted>
                  )}
                </KvRow>
                <KvRow label="Profile">
                  {detail ? (
                    <ProfileStatus status={detail.profileStatus} />
                  ) : (
                    <Muted>{isLoading ? "…" : "—"}</Muted>
                  )}
                </KvRow>
                <KvRow label="Last active">
                  <Muted>Not tracked</Muted>
                </KvRow>
              </div>
            </section>

            {/* Notifications */}
            <section className="md:px-5">
              <SectionLabel>Notifications</SectionLabel>
              <div className="mt-3 space-y-3">
                <NotifRow label="Program alerts" on={detail?.notifications.program} loading={isLoading && !detail} />
                <NotifRow label="Event alerts" on={detail?.notifications.event} loading={isLoading && !detail} />
                <NotifRow label="Prayer alerts" on={detail?.notifications.prayer} loading={isLoading && !detail} />
                <NotifRow label="Announcements" on={detail?.notifications.announcements} loading={isLoading && !detail} />
              </div>
            </section>

            {/* Activity */}
            <section className="md:pl-5">
              <SectionLabel>Activity</SectionLabel>
              <div className="mt-3 space-y-3 text-[14px]">
                <KvRow label="RSVPs">
                  <ActivityValue value={detail?.rsvpCount ?? member.rsvpCount} empty="None yet" />
                </KvRow>
                <KvRow label="Saved programs">
                  {detail ? (
                    <ActivityValue value={detail.savedProgramsCount} empty="None yet" />
                  ) : (
                    <Muted>{isLoading ? "…" : "—"}</Muted>
                  )}
                </KvRow>
                <KvRow label="Business ad">
                  {detail ? (
                    detail.businessAd ? (
                      <span className="font-medium text-[#0A261E]">{detail.businessAd.name}</span>
                    ) : (
                      <Muted>None</Muted>
                    )
                  ) : (
                    <Muted>{isLoading ? "…" : "—"}</Muted>
                  )}
                </KvRow>
              </div>
            </section>
          </div>

          {/* Personalization */}
          <div className="mt-8 border-t border-[#0A261E]/8 pt-6">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <SectionLabel>Personalization</SectionLabel>
              <span className="text-[12.5px] text-[#0A261E]/40">
                Shared by the member during onboarding
              </span>
            </div>

            {!detail && isLoading ? (
              <p className="mt-4 text-[13.5px] text-[#0A261E]/45">Loading…</p>
            ) : !hasPersonalization ? (
              <p className="mt-4 text-[13.5px] text-[#0A261E]/45">
                This member hasn&apos;t shared any personalization yet.
              </p>
            ) : (
              <>
                <div className="mt-5 flex flex-wrap gap-x-10 gap-y-5">
                  <Fact label="Age" value={p!.age != null ? String(p!.age) : "—"} />
                  <Fact label="Gender" value={p!.gender ?? "—"} />
                  <Fact
                    label="New Muslim"
                    value={p!.isRevert == null ? "—" : p!.isRevert ? "Yes" : "No"}
                  />
                  <Fact label="Family" value={familyValue(p!)} />
                  <Fact label="Knowledge" value={p!.knowledge ?? "—"} />
                </div>

                <ChipGroup label="Interests" items={p!.interests} />
                <ChipGroup label="Programs for" items={p!.programsFor} />
                <ChipGroup label="Best times" items={p!.bestTimes} />
                <ChipGroup label="More" items={p!.morePrefs} />
              </>
            )}
          </div>

          {/* Footer action */}
          <div className="mt-7">
            <CopyEmailButton email={email} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}

function familyValue(p: Personalization): string {
  if (p.childrenCount && p.childrenCount > 0) {
    return `${p.childrenCount} ${p.childrenCount === 1 ? "child" : "children"}`;
  }
  if (p.hasChildren === true) return "Has children";
  if (p.hasChildren === false) return "No children";
  return "—";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0A261E]/45">
      {children}
    </h3>
  );
}

function KvRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13.5px] text-[#0A261E]/60">{label}</span>
      <span className="text-right text-[13.5px]">{children}</span>
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-[#0A261E]/40">{children}</span>;
}

function Shimmer({ w }: { w: string }) {
  return <span className={cn("inline-block h-3.5 animate-pulse rounded bg-[#0A261E]/10", w)} />;
}

function ProfileStatus({ status }: { status: "complete" | "in_progress" | "not_started" }) {
  if (status === "complete") return <span className="font-medium text-emerald-700">Complete</span>;
  if (status === "in_progress") return <span className="font-medium text-[#B8922A]">In progress</span>;
  return <Muted>Not started</Muted>;
}

function ActivityValue({ value, empty }: { value: number; empty: string }) {
  return value > 0 ? (
    <span className="font-medium tabular-nums text-[#0A261E]">{value}</span>
  ) : (
    <Muted>{empty}</Muted>
  );
}

function NotifRow({ label, on, loading }: { label: string; on?: boolean; loading?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#0A261E]/6 pb-3 last:border-b-0 last:pb-0">
      <span className="text-[14px] text-[#0A261E]">{label}</span>
      {loading ? (
        <Shimmer w="w-9" />
      ) : on ? (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-700">
          On
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-[#0A261E]/[0.06] px-2.5 py-0.5 text-[12px] font-semibold text-[#0A261E]/50">
          Off
        </span>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/45">
        {label}
      </p>
      <p className="mt-1 text-[16px] font-medium text-[#0A261E]">{value}</p>
    </div>
  );
}

function ChipGroup({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/45">
        {label}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center rounded-full bg-[#E9F0EA] px-3.5 py-1.5 text-[13px] font-medium text-[#0A261E]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const valid = email && email !== "—";
  return (
    <button
      type="button"
      disabled={!valid}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
          toast.success("Email copied");
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Couldn't copy email");
        }
      }}
      className="inline-flex items-center gap-2 rounded-xl border border-[#0A261E]/12 px-4 py-2.5 text-[13.5px] font-medium text-[#0A261E] transition-colors hover:bg-[#0A261E]/[0.04] disabled:opacity-40"
    >
      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy email"}
    </button>
  );
}
