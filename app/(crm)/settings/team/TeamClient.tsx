"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ShieldCheck, UserPlus, Lock } from "lucide-react";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import PageHeader from "../../_components/PageHeader";
import { useMosque } from "../../_lib/mock-mosque";
import { cn } from "@/lib/utils";

type Role = "owner" | "admin" | "editor" | "viewer";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Pending = invited but not accepted */
  status: "active" | "pending";
  joinedAt: string;
};

const TEAM: TeamMember[] = [
  {
    id: "tm_01",
    name: "Ahmad Hamoudeh",
    email: "ahmadhamoudeh1999@gmail.com",
    role: "owner",
    status: "active",
    joinedAt: "2026-04-29",
  },
];

const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const ROLE_DESCRIPTION: Record<Role, string> = {
  owner: "Full control, including billing.",
  admin: "Everything except billing and team management.",
  editor: "Create and edit content, send notifications.",
  viewer: "Read-only.",
};

export default function TeamClient() {
  const mosque = useMosque();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("editor");

  function handleInvite() {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    toast("Multi-admin invites are coming soon", {
      description:
        "We'll email this person when team management ships in the next release.",
    });
    setInviteEmail("");
  }

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Team"
        description={`Add other admins from ${mosque.name}'s board so they can co-manage the CRM.`}
      />

      {/* Invite form */}
      <section className="mb-6 rounded-2xl border border-[#0A261E]/8 bg-white p-5">
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[13.5px] font-semibold text-[#0A261E]">
              Invite a team member
            </h2>
            <p className="text-[12px] text-[#0A261E]/55">
              They'll get an email invite. They can join with their existing
              account or create a new one.
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger
              type="button"
              className="inline-flex cursor-help items-center gap-1 rounded-full bg-[#B8922A]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#B8922A]"
            >
              <Lock size={10} />
              Coming soon
            </TooltipTrigger>
            <TooltipContent>
              Multi-admin support is being wired up — you can preview the flow.
            </TooltipContent>
          </Tooltip>
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
            />
          </div>
          <Select
            value={inviteRole}
            onValueChange={(v) => setInviteRole((v ?? "editor") as Role)}
          >
            <SelectTrigger>
              <ShieldCheck size={13} className="text-[#0A261E]/45" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABEL) as Role[])
                .filter((r) => r !== "owner")
                .map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABEL[role]} — {ROLE_DESCRIPTION[role]}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button onClick={handleInvite}>
            <UserPlus size={14} />
            Send invite
          </Button>
        </div>
      </section>

      {/* Team list */}
      <section className="rounded-2xl border border-[#0A261E]/8 bg-white">
        <header className="border-b border-[#0A261E]/6 px-5 py-3">
          <h2 className="text-[13px] font-semibold text-[#0A261E]">
            Current team
          </h2>
          <p className="text-[11.5px] text-[#0A261E]/55">
            {TEAM.length} {TEAM.length === 1 ? "person" : "people"}
          </p>
        </header>
        <ul className="divide-y divide-[#0A261E]/6">
          {TEAM.map((member, i) => (
            <motion.li
              key={member.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className="flex items-center gap-4 px-5 py-3.5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A261E] text-[13px] font-semibold text-[#fffbf2]">
                {member.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13.5px] font-semibold text-[#0A261E]">
                    {member.name}
                  </p>
                  <RoleBadge role={member.role} />
                </div>
                <p className="text-[11.5px] text-[#0A261E]/55">
                  {member.email} · joined {new Date(member.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              {member.role === "owner" ? (
                <span className="text-[11px] text-[#0A261E]/40">You</span>
              ) : null}
            </motion.li>
          ))}
        </ul>
      </section>
    </>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const cls: Record<Role, string> = {
    owner: "bg-[#B8922A]/15 text-[#B8922A]",
    admin: "bg-emerald-50 text-emerald-700",
    editor: "bg-[#0A261E]/[0.06] text-[#0A261E]/70",
    viewer: "bg-[#0A261E]/[0.06] text-[#0A261E]/55",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        cls[role]
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
