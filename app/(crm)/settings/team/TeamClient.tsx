"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  ShieldCheck,
  UserPlus,
  Loader2,
  MoreHorizontal,
  Trash2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from "../../_components/PageHeader";
import ConfirmInline from "../../_components/ConfirmInline";
import { useMosque } from "../../_lib/mock-mosque";
import type { CrmTeamMember } from "@/app/api/crm/team/route";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<"admin" | "member", string> = {
  admin: "Admin",
  member: "Member",
};

const ROLE_DESCRIPTION: Record<"admin" | "member", string> = {
  admin: "Full access — invite teammates, manage billing.",
  member: "Day-to-day CRM use; can't manage billing or invites.",
};

async function fetchTeam(): Promise<CrmTeamMember[]> {
  const res = await fetch("/api/crm/team", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load team (${res.status})`);
  const body = (await res.json()) as { members: CrmTeamMember[] };
  return body.members ?? [];
}

async function postInvite(
  email: string,
  role: "admin" | "member"
): Promise<void> {
  const res = await fetch("/api/crm/team", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to invite (${res.status})`);
  }
}

async function deleteMember(id: string): Promise<void> {
  const res = await fetch(`/api/crm/team?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Failed to remove (${res.status})`);
  }
}

export default function TeamClient() {
  const mosque = useMosque();
  const queryClient = useQueryClient();
  const queryKey = ["crm", "team", mosque.id] as const;

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const query = useQuery({
    queryKey,
    queryFn: fetchTeam,
    staleTime: 30_000,
    placeholderData: [],
  });

  const inviteMutation = useMutation({
    mutationFn: ({ email, role }: { email: string; role: "admin" | "member" }) =>
      postInvite(email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Invitation sent");
      setInviteEmail("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Couldn't send invite.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Removed");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Couldn't remove.");
    },
  });

  function handleInvite() {
    if (mosque.isHQ) {
      toast("HQ preview — sign in as a mosque admin to invite teammates.");
      return;
    }
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    inviteMutation.mutate({ email: inviteEmail.trim(), role: inviteRole });
  }

  const members = query.data ?? [];
  const inviting = inviteMutation.isPending;

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Team"
        description={`Add other admins from ${mosque.name}'s board so they can co-manage the CRM.`}
      />

      {/* Invite form */}
      <section className="mb-6 rounded-2xl border border-[#0A261E]/8 bg-white p-5">
        <header className="mb-3">
          <h2 className="text-[13.5px] font-semibold text-[#0A261E]">
            Invite a team member
          </h2>
          <p className="text-[12px] text-[#0A261E]/55">
            They&apos;ll get an email invite from Clerk. They join with their
            existing account or create a new one — then they land in the same
            CRM.
          </p>
        </header>

        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <div className="relative">
            <Mail
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0A261E]/40"
            />
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="board.member@mosque.org"
              className="pl-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInvite();
                }
              }}
            />
          </div>
          <Select
            value={inviteRole}
            onValueChange={(v) =>
              setInviteRole((v ?? "member") as "admin" | "member")
            }
          >
            <SelectTrigger>
              <ShieldCheck size={13} className="text-[#0A261E]/45" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">
                Member — {ROLE_DESCRIPTION.member}
              </SelectItem>
              <SelectItem value="admin">
                Admin — {ROLE_DESCRIPTION.admin}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleInvite} disabled={inviting}>
            {inviting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <UserPlus size={14} />
                Send invite
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Members */}
      <section className="rounded-2xl border border-[#0A261E]/8 bg-white">
        <header className="border-b border-[#0A261E]/6 px-5 py-3">
          <h2 className="text-[13px] font-semibold text-[#0A261E]">
            Current team
          </h2>
          <p className="text-[11.5px] text-[#0A261E]/55">
            {query.isLoading
              ? "Loading…"
              : `${members.length} ${members.length === 1 ? "person" : "people"}`}
          </p>
        </header>
        {query.isLoading ? (
          <div className="px-5 py-8 text-center text-[12.5px] text-[#0A261E]/55">
            <Loader2 size={14} className="mr-1.5 inline animate-spin" />
            Loading team…
          </div>
        ) : members.length === 0 ? (
          <div className="px-5 py-8 text-center text-[12.5px] text-[#0A261E]/55">
            No teammates yet. Invite someone above to get started.
          </div>
        ) : (
          <ul className="divide-y divide-[#0A261E]/6">
            {members.map((member, i) =>
              confirmRemoveId === member.id ? (
                <li key={member.id} className="px-3 py-2">
                  <ConfirmInline
                    open
                    message={`Remove ${member.name} from the team?`}
                    onConfirm={() => {
                      removeMutation.mutate(member.id);
                      setConfirmRemoveId(null);
                    }}
                    onCancel={() => setConfirmRemoveId(null)}
                  />
                </li>
              ) : (
                <motion.li
                  key={member.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="group flex items-center gap-4 px-5 py-3.5"
                >
                  <Avatar name={member.name} pending={member.status === "pending"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-semibold text-[#0A261E]">
                        {member.name}
                      </p>
                      <RoleBadge role={member.role} />
                      {member.status === "pending" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                          <Clock size={10} />
                          Pending
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11.5px] text-[#0A261E]/55">
                      {member.email}
                      {member.status === "active"
                        ? ` · joined ${new Date(member.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                        : ` · invited ${new Date(member.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`}
                    </p>
                  </div>
                  <div className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label="Team member actions"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[#0A261E]/60 transition-colors hover:bg-[#0A261E]/[0.05] hover:text-[#0A261E]"
                      >
                        <MoreHorizontal size={16} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onSelect={() => setConfirmRemoveId(member.id)}
                          className="text-red-600 data-[highlighted]:text-red-600"
                        >
                          <Trash2 size={13} />
                          {member.status === "pending" ? "Revoke invite" : "Remove"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.li>
              )
            )}
          </ul>
        )}
      </section>
    </>
  );
}

function Avatar({ name, pending }: { name: string; pending?: boolean }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-semibold text-[#fffbf2]",
        pending ? "bg-[#0A261E]/45" : "bg-[#0A261E]"
      )}
    >
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: "admin" | "member" }) {
  const cls =
    role === "admin"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-[#0A261E]/[0.06] text-[#0A261E]/70";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        cls
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
