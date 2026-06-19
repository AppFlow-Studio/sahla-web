"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Save,
  Bell,
  Users,
  Calendar,
  Clock,
  Star,
  Trash2,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "../../_components/PageHeader";
import HelpButton from "../../_components/HelpButton";
import ConfirmInline from "../../_components/ConfirmInline";
import { useMembers } from "../../_hooks/useMembers";
import {
  useNotifications,
  type NotificationTemplate,
  type SendAudienceType,
} from "../../_hooks/useNotifications";
import { useContent } from "../../_hooks/useContent";
import { relativeShort } from "../../_lib/format";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function NotificationsClient() {
  const { templates, history, send, saveTemplate, removeTemplate } =
    useNotifications();
  const { data: members } = useMembers();
  const { data: programs } = useContent("program");
  const { data: events } = useContent("event");

  // Deep-link prefill — e.g. the Member Insights "Draft a nudge" button lands
  // here with ?title=&body= so the composer opens on a ready-to-review draft.
  const searchParams = useSearchParams();
  const [title, setTitle] = useState(() => searchParams.get("title") ?? "");
  const [body, setBody] = useState(() => searchParams.get("body") ?? "");
  const [audience, setAudience] = useState<SendAudienceType>("all");
  const [audienceTarget, setAudienceTarget] = useState<string>("all-members");
  const [scheduleNow, setScheduleNow] = useState(true);
  const [scheduleDate, setScheduleDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [scheduleTime, setScheduleTime] = useState("19:00");
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [confirmRemoveTpl, setConfirmRemoveTpl] = useState<string | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const recipientCount = useMemo(() => {
    if (audience === "all") return members.filter((m) => m.hasPushToken).length;
    if (audience === "program") {
      const prog = programs.find((p) => p.id === audienceTarget);
      return prog?.currentCount ?? 0;
    }
    const evt = events.find((e) => e.id === audienceTarget);
    return evt?.currentCount ?? 0;
  }, [audience, audienceTarget, members, programs, events]);

  const audienceLabel = useMemo(() => {
    if (audience === "all") return `Everyone (${recipientCount})`;
    if (audience === "program") {
      const prog = programs.find((p) => p.id === audienceTarget);
      return prog ? `${prog.name} RSVPs (${recipientCount})` : "Program RSVPs";
    }
    const evt = events.find((e) => e.id === audienceTarget);
    return evt ? `${evt.name} RSVPs (${recipientCount})` : "Event RSVPs";
  }, [audience, audienceTarget, recipientCount, programs, events]);

  function clearForm() {
    setTitle("");
    setBody("");
    setActiveTemplateId(null);
    setSaveAsTemplate(false);
    setTemplateName("");
  }

  function applyTemplate(tpl: NotificationTemplate) {
    setActiveTemplateId(tpl.id);
    setTitle(tpl.title);
    setBody(tpl.body);
    // 'tag' templates predate real segments — fall back to Everyone.
    setAudience(
      tpl.audience === "program" || tpl.audience === "event"
        ? tpl.audience
        : "all"
    );
    setAudienceTarget("all-members");
    toast.success(`Loaded template: ${tpl.name}`);
  }

  function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast.error("Add a title and body before sending.");
      return;
    }
    if (saveAsTemplate && !templateName.trim()) {
      toast.error("Name the template before saving.");
      return;
    }
    if (saveAsTemplate) {
      saveTemplate({
        name: templateName,
        title,
        body,
        audience,
        audienceLabel,
      });
      toast.success(`Template saved: ${templateName}`);
    }
    // Combine the date + time pickers into an ISO instant; immediate sends
    // pass no schedule. The server treats anything in the past as immediate.
    const scheduledFor = scheduleNow
      ? null
      : new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

    // The success/error toast is fired from the mutation once the server
    // responds with the real delivery counts.
    send({
      title,
      body,
      audienceType: audience,
      audienceTarget: audience === "all" ? null : audienceTarget,
      audienceLabel,
      templateId: activeTemplateId,
      scheduledFor,
    });
    clearForm();
  }

  return (
    <>
      <PageHeader
        eyebrow="Mosque Setup"
        title="Notifications"
        description="Compose, send, and reuse push notifications. Templates let you fire common messages with one click."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Left: compose */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#0A261E]/8 bg-white p-5 md:p-6">
            <h2 className="text-[14px] font-semibold text-[#0A261E]">
              Compose a notification
            </h2>
            <p className="text-[12.5px] text-[#0A261E]/55">
              Use {"{{handlebars}}"} to template — they auto-fill at send time.
            </p>

            <div className="mt-4 space-y-4">
              <Field label="Title" required>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Jummah today, in shaa Allah"
                />
              </Field>
              <Field
                label="Message"
                required
                helpText="Keep it short — push notifications are most effective under 120 characters."
              >
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="Khutbah at 1:15pm. Prayer at 1:45pm. Park in the back lot."
                />
                <p className="mt-1 text-right text-[11px] text-[#0A261E]/45 tabular-nums">
                  {body.length} / 200
                </p>
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Send to" required>
                  <Select
                    value={audience}
                    onValueChange={(v) => {
                      const next = (v ?? "all") as SendAudienceType;
                      setAudience(next);
                      setAudienceTarget("all-members");
                    }}
                  >
                    <SelectTrigger>
                      <Users size={13} className="text-[#0A261E]/45" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Every member</SelectItem>
                      <SelectItem value="program">Program RSVPs</SelectItem>
                      <SelectItem value="event">Event RSVPs</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                {audience === "program" || audience === "event" ? (
                  <Field
                    label={audience === "program" ? "Which program" : "Which event"}
                    required
                  >
                    <Select
                      value={audienceTarget}
                      onValueChange={(v) =>
                        setAudienceTarget(v ?? "all-members")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pick one" />
                      </SelectTrigger>
                      <SelectContent>
                        {(audience === "program" ? programs : events).map(
                          (p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({p.currentCount})
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </Field>
                ) : null}
              </div>

              {/* Schedule */}
              <div className="rounded-xl border border-[#0A261E]/8 bg-[#fffbf2]/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[#0A261E]">
                      Send right now
                    </p>
                    <p className="text-[12px] text-[#0A261E]/55">
                      Toggle off to schedule for later.
                    </p>
                  </div>
                  <Switch
                    checked={scheduleNow}
                    onCheckedChange={setScheduleNow}
                  />
                </div>
                <AnimatePresence initial={false}>
                  {!scheduleNow ? (
                    <motion.div
                      key="schedule-fields"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: EASE }}
                      className="mt-4 grid gap-3 md:grid-cols-2 overflow-hidden"
                    >
                      <Field label="Date">
                        <div className="relative">
                          <Calendar
                            size={13}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0A261E]/45"
                          />
                          <Input
                            type="date"
                            className="pl-9"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                          />
                        </div>
                      </Field>
                      <Field label="Time">
                        <div className="relative">
                          <Clock
                            size={13}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0A261E]/45"
                          />
                          <Input
                            type="time"
                            className="pl-9"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                          />
                        </div>
                      </Field>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Save as template */}
              <div className="rounded-xl border border-[#0A261E]/8 bg-[#fffbf2]/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[#0A261E]">
                      Save as a template
                    </p>
                    <p className="text-[12px] text-[#0A261E]/55">
                      Reuse this notification with one click later.
                    </p>
                  </div>
                  <Switch
                    checked={saveAsTemplate}
                    onCheckedChange={setSaveAsTemplate}
                  />
                </div>
                <AnimatePresence initial={false}>
                  {saveAsTemplate ? (
                    <motion.div
                      key="template-name"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: EASE }}
                      className="mt-4 overflow-hidden"
                    >
                      <Input
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Template name (e.g. 'Jummah reminder')"
                      />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between border-t border-[#0A261E]/6 pt-4">
                <div className="text-[12px] text-[#0A261E]/65">
                  Will reach{" "}
                  <span className="font-semibold text-[#0A261E]">
                    {recipientCount.toLocaleString()}
                  </span>{" "}
                  {recipientCount === 1 ? "person" : "people"}
                </div>
                <Button onClick={handleSend}>
                  {scheduleNow ? (
                    <>
                      <Send size={14} />
                      Send now
                    </>
                  ) : (
                    <>
                      <CalendarClock size={14} />
                      Schedule
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Recent history */}
          <div className="rounded-2xl border border-[#0A261E]/8 bg-white">
            <header className="flex items-center justify-between border-b border-[#0A261E]/6 px-5 py-3">
              <div>
                <h2 className="text-[13px] font-semibold text-[#0A261E]">
                  Sent recently
                </h2>
                <p className="text-[11.5px] text-[#0A261E]/55">
                  Last {history.length} notifications
                </p>
              </div>
              <Bell size={15} className="text-[#0A261E]/40" />
            </header>
            <ul className="divide-y divide-[#0A261E]/6">
              <AnimatePresence initial={false}>
                {history.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="px-5 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fffbf2]">
                        <Bell size={13} className="text-[#B8922A]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-[#0A261E]">
                          {item.title}
                        </p>
                        <p className="line-clamp-1 text-[11.5px] text-[#0A261E]/55">
                          {item.body}
                        </p>
                        <div className="mt-1 flex items-center gap-2.5 text-[11px] text-[#0A261E]/45">
                          <span>{item.audienceLabel}</span>
                          <span aria-hidden>·</span>
                          <span>{relativeShort(item.sentAt)}</span>
                          {item.openRate > 0 ? (
                            <>
                              <span aria-hidden>·</span>
                              <span>
                                {Math.round(item.openRate * 100)}% opened
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </section>

        {/* Right: templates */}
        <aside className="rounded-2xl border border-[#0A261E]/8 bg-white">
          <header className="flex items-center justify-between border-b border-[#0A261E]/6 px-5 py-3">
            <div>
              <h2 className="text-[13px] font-semibold text-[#0A261E]">
                Templates
              </h2>
              <p className="text-[11.5px] text-[#0A261E]/55">
                Click to load into the form
              </p>
            </div>
            <Star size={15} className="text-[#B8922A]" />
          </header>
          <ul className="divide-y divide-[#0A261E]/6">
            <AnimatePresence initial={false}>
              {templates.map((tpl) => {
                const active = activeTemplateId === tpl.id;
                if (confirmRemoveTpl === tpl.id) {
                  return (
                    <motion.li key={tpl.id} layout className="px-3 py-2">
                      <ConfirmInline
                        open
                        message={`Delete template "${tpl.name}"?`}
                        onConfirm={() => {
                          removeTemplate(tpl.id);
                          setConfirmRemoveTpl(null);
                          toast.success("Template removed");
                        }}
                        onCancel={() => setConfirmRemoveTpl(null)}
                      />
                    </motion.li>
                  );
                }
                return (
                  <motion.li
                    key={tpl.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: EASE }}
                    className={cn(
                      "group relative px-5 py-3 transition-colors",
                      active ? "bg-[#fffbf2]" : "hover:bg-[#fffbf2]/60"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="block w-full text-left"
                    >
                      <p
                        className={cn(
                          "text-[13px] font-semibold",
                          active ? "text-[#0A261E]" : "text-[#0A261E]/85"
                        )}
                      >
                        {tpl.name}
                      </p>
                      <p className="line-clamp-1 text-[11.5px] text-[#0A261E]/55">
                        {tpl.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[10.5px] text-[#0A261E]/40">
                        <span>{tpl.audienceLabel}</span>
                        <span aria-hidden>·</span>
                        <span>Used {tpl.usageCount}×</span>
                        {tpl.lastUsedAt ? (
                          <>
                            <span aria-hidden>·</span>
                            <span>{relativeShort(tpl.lastUsedAt)}</span>
                          </>
                        ) : null}
                      </div>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete template ${tpl.name}`}
                      onClick={() => setConfirmRemoveTpl(tpl.id)}
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-[#0A261E]/35 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    >
                      <Trash2 size={13} />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          <div className="border-t border-[#0A261E]/6 px-5 py-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center"
              onClick={() => {
                setSaveAsTemplate(true);
                setTemplateName("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Save size={13} />
              Save current message as template
            </Button>
          </div>
        </aside>
      </div>
    </>
  );
}

function Field({
  label,
  helpText,
  required,
  children,
}: {
  label: string;
  helpText?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-[12.5px] font-semibold text-[#0A261E]">
          {label}
          {required ? (
            <span aria-hidden className="ml-0.5 text-[#B8922A]">
              *
            </span>
          ) : null}
        </Label>
        {helpText ? <HelpButton text={helpText} /> : null}
      </div>
      {children}
    </div>
  );
}
