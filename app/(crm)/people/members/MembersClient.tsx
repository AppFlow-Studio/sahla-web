"use client";

import { useMemo, useState, useEffect } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  Search,
  Mail,
  EyeOff,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellOff,
  UserPlus,
  Download,
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
import PageHeader from "../../_components/PageHeader";
import StatCard from "../../_components/StatCard";
import { useMembers, type Member } from "../../_hooks/useMembers";
import { maskEmail, relativeShort } from "../../_lib/format";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
type PushFilter = "all" | "yes" | "no";

export default function MembersClient() {
  const { data: members } = useMembers();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [pushFilter, setPushFilter] = useState<PushFilter>("all");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "lastActiveAt", desc: true },
  ]);
  const [revealedEmails, setRevealedEmails] = useState<Record<string, boolean>>(
    {}
  );

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    let rows = members;
    if (debouncedQuery) {
      rows = rows.filter(
        (m) =>
          m.name.toLowerCase().includes(debouncedQuery) ||
          m.email.toLowerCase().includes(debouncedQuery)
      );
    }
    if (pushFilter !== "all") {
      const want = pushFilter === "yes";
      rows = rows.filter((m) => m.hasPushToken === want);
    }
    return rows;
  }, [members, debouncedQuery, pushFilter]);

  const stats = useMemo(() => {
    const total = members.length;
    const newThisMonth = members.filter(
      (m) =>
        Date.now() - new Date(m.signupAt).getTime() < 30 * 86_400_000
    ).length;
    const withPush = members.filter((m) => m.hasPushToken).length;
    const activeRecently = members.filter(
      (m) =>
        m.lastActiveAt &&
        Date.now() - new Date(m.lastActiveAt).getTime() < 30 * 86_400_000
    ).length;
    return { total, newThisMonth, withPush, activeRecently };
  }, [members]);

  const columns = useMemo<ColumnDef<Member>[]>(
    () => [
      {
        id: "name",
        header: "Member",
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 py-1">
            <Avatar name={row.original.name} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[13.5px] font-semibold text-[#0A261E]">
                  {row.original.name}
                </p>
                {row.original.membershipKind === "new" ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
                    New
                  </span>
                ) : null}
              </div>
              <EmailCell
                email={row.original.email}
                revealed={!!revealedEmails[row.original.id]}
                onReveal={() =>
                  setRevealedEmails((prev) => ({
                    ...prev,
                    [row.original.id]: true,
                  }))
                }
              />
            </div>
          </div>
        ),
      },
      {
        id: "signupAt",
        header: "Joined",
        accessorKey: "signupAt",
        cell: ({ getValue }) => (
          <span className="text-[12.5px] text-[#0A261E]/65">
            {relativeShort(getValue<string>())}
          </span>
        ),
      },
      {
        id: "lastActiveAt",
        header: "Last active",
        accessorKey: "lastActiveAt",
        sortingFn: (a, b) => {
          const av = a.original.lastActiveAt
            ? new Date(a.original.lastActiveAt).getTime()
            : 0;
          const bv = b.original.lastActiveAt
            ? new Date(b.original.lastActiveAt).getTime()
            : 0;
          return av - bv;
        },
        cell: ({ row }) => (
          <span className="text-[12.5px] text-[#0A261E]/65">
            {relativeShort(row.original.lastActiveAt)}
          </span>
        ),
      },
      {
        id: "rsvpCount",
        header: "RSVPs",
        accessorKey: "rsvpCount",
        cell: ({ getValue }) => (
          <span className="text-[13px] tabular-nums text-[#0A261E]/85">
            {getValue<number>()}
          </span>
        ),
      },
      {
        id: "hasPushToken",
        header: "Push",
        accessorKey: "hasPushToken",
        cell: ({ getValue }) =>
          getValue<boolean>() ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700"
              aria-label="Push enabled"
            >
              <Bell size={10} />
              On
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-[#0A261E]/[0.06] px-2 py-0.5 text-[10.5px] font-semibold text-[#0A261E]/55"
              aria-label="Push disabled"
            >
              <BellOff size={10} />
              Off
            </span>
          ),
      },
    ],
    [revealedEmails]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    initialState: { pagination: { pageSize: 12 } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Members"
        description="Everyone who has signed in to your mosque app. Read-only — they sign up themselves."
        action={
          <Button
            variant="outline"
            onClick={() =>
              toast("CSV export coming with the next release", {
                description: "We'll add it once filters are wired to the database.",
              })
            }
          >
            <Download size={14} />
            Export CSV
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total members" value={stats.total} />
        <StatCard label="New this month" value={stats.newThisMonth} />
        <StatCard label="Push enabled" value={stats.withPush} />
        <StatCard label="Active 30d" value={stats.activeRecently} />
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <div className="relative max-w-md flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0A261E]/40"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="pl-9"
            />
          </div>
          <Select value={pushFilter} onValueChange={(v) => setPushFilter(v as PushFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All members</SelectItem>
              <SelectItem value="yes">Push enabled</SelectItem>
              <SelectItem value="no">Push disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-[12.5px] text-[#0A261E]/55">
          {table.getFilteredRowModel().rows.length} of {members.length}
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-[#0A261E]/8 bg-white md:block">
        <table className="w-full text-left">
          <thead className="border-b border-[#0A261E]/8 bg-[#fffbf2]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const sort = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(
                        "px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0A261E]/55",
                        sortable && "cursor-pointer select-none"
                      )}
                      onClick={
                        sortable
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {sortable ? (
                          <span className="text-[#0A261E]/30">
                            {sort === "asc" ? (
                              <ChevronUp size={12} strokeWidth={2.5} />
                            ) : sort === "desc" ? (
                              <ChevronDown size={12} strokeWidth={2.5} />
                            ) : (
                              <ChevronDown size={12} strokeWidth={1.5} className="opacity-40" />
                            )}
                          </span>
                        ) : null}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-16 text-center"
                >
                  <EmptyMembers />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="border-b border-[#0A261E]/6 last:border-b-0 transition-colors hover:bg-[#fffbf2]/60"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {table.getPageCount() > 1 ? (
          <div className="flex items-center justify-between border-t border-[#0A261E]/8 bg-[#fffbf2]/50 px-5 py-2.5 text-[12px]">
            <p className="text-[#0A261E]/55">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[#0A261E]/65 transition-colors hover:bg-[#0A261E]/[0.05] disabled:opacity-30"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[#0A261E]/65 transition-colors hover:bg-[#0A261E]/[0.05] disabled:opacity-30"
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Mobile cards */}
      <ul className="space-y-2 md:hidden">
        {table.getRowModel().rows.length === 0 ? (
          <li className="rounded-xl border border-[#0A261E]/8 bg-white p-6">
            <EmptyMembers />
          </li>
        ) : (
          table.getRowModel().rows.map((row) => {
            const m = row.original;
            return (
              <motion.li
                key={row.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, ease: EASE }}
                className="rounded-xl border border-[#0A261E]/8 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={m.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[14px] font-semibold text-[#0A261E]">
                        {m.name}
                      </p>
                      {m.membershipKind === "new" ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
                          New
                        </span>
                      ) : null}
                    </div>
                    <EmailCell
                      email={m.email}
                      revealed={!!revealedEmails[m.id]}
                      onReveal={() =>
                        setRevealedEmails((p) => ({ ...p, [m.id]: true }))
                      }
                    />
                    <div className="mt-2 flex items-center gap-3 text-[11.5px] text-[#0A261E]/55">
                      <span>Joined {relativeShort(m.signupAt)}</span>
                      <span>·</span>
                      <span>{m.rsvpCount} RSVPs</span>
                      <span>·</span>
                      <span>{m.hasPushToken ? "Push on" : "Push off"}</span>
                    </div>
                  </div>
                </div>
              </motion.li>
            );
          })
        )}

        {table.getPageCount() > 1 ? (
          <li className="flex items-center justify-between rounded-xl border border-[#0A261E]/8 bg-[#fffbf2] px-3 py-2 text-[12px]">
            <span className="text-[#0A261E]/55">
              Page {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#0A261E]/65 disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#0A261E]/65 disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </li>
        ) : null}
      </ul>
    </>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0A261E]/8 text-[11.5px] font-semibold text-[#0A261E]/70">
      {initials}
    </div>
  );
}

function EmailCell({
  email,
  revealed,
  onReveal,
}: {
  email: string;
  revealed: boolean;
  onReveal: () => void;
}) {
  return revealed ? (
    <p className="line-clamp-1 text-[11.5px] text-[#0A261E]/55">
      <Mail size={10} className="mr-1 inline opacity-60" />
      {email}
    </p>
  ) : (
    <button
      type="button"
      onClick={onReveal}
      className="group inline-flex items-center gap-1 text-[11.5px] text-[#0A261E]/55 transition-colors hover:text-[#0A261E]"
      aria-label="Reveal email"
    >
      <EyeOff size={10} className="opacity-60 group-hover:opacity-100" />
      <span className="font-mono tracking-tight">{maskEmail(email)}</span>
      <span className="text-[10px] text-[#B8922A] opacity-0 transition-opacity group-hover:opacity-100">
        click to reveal
      </span>
    </button>
  );
}

function EmptyMembers() {
  return (
    <div className="mx-auto max-w-sm">
      <div
        aria-hidden
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#fffbf2]"
      >
        <UserPlus size={20} className="text-[#B8922A]" />
      </div>
      <h3 className="font-display text-[18px] text-[#0A261E]">
        No members match this filter
      </h3>
      <p className="mt-1 text-[13px] text-[#0A261E]/60">
        Members appear here when they sign up in your mosque app. Try clearing
        the search or push filter.
      </p>
    </div>
  );
}
