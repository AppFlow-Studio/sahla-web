"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell, RotateCcw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { render } from "@/supabase/functions/_shared/automated-notifications";
import type { AutomatedNotification } from "@/app/api/crm/notifications/automated/route";
import { useAutomatedNotifications } from "../../_hooks/useAutomatedNotifications";

const EASE = [0.16, 1, 0.3, 1] as const;

type Draft = { title: string; body: string; enabled: boolean };

/**
 * Editor for the notifications the app sends on its own — prayer reminders,
 * program and event reminders, the Quran nudge.
 *
 * Each card previews against example values as you type, because the wording
 * is full of {{variables}} and an admin has no other way to see what actually
 * lands on a phone.
 */
export default function AutomatedNotifications() {
  const { notifications, isLoading, error, save, reset } = useAutomatedNotifications();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  if (error) {
    return (
      <div className="rounded-2xl border border-[#0A261E]/8 bg-white p-5 text-[13px] text-[#0A261E]/60">
        Couldn&rsquo;t load these right now. {error.message}
      </div>
    );
  }

  const groups = notifications.reduce<Record<string, AutomatedNotification[]>>(
    (acc, n) => {
      (acc[n.group] ??= []).push(n);
      return acc;
    },
    {},
  );

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--mosque-surface,#fffbf2)]">
          <Zap size={14} className="text-[var(--mosque-accent,#B8922A)]" />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-[#0A261E]">
            Sent automatically
          </h2>
          <p className="text-[12.5px] text-[#0A261E]/55">
            These go out on their own — no one presses send. Change the wording to
            sound like your masjid, or switch one off.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-[#0A261E]/8 bg-white p-5 text-[13px] text-[#0A261E]/45">
          Loading…
        </div>
      ) : (
        Object.entries(groups).map(([group, items]) => (
          <div key={group} className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0A261E]/40">
              {group}
            </h3>
            {items.map((item) => (
              <NotificationCard
                key={item.key}
                item={item}
                draft={drafts[item.key]}
                onChange={(next) =>
                  setDrafts((d) => ({ ...d, [item.key]: next }))
                }
                onDiscard={() =>
                  setDrafts((d) => {
                    const next = { ...d };
                    delete next[item.key];
                    return next;
                  })
                }
                onSave={(draft) =>
                  save.mutate(
                    { key: item.key, ...draft },
                    {
                      onSuccess: () =>
                        setDrafts((d) => {
                          const next = { ...d };
                          delete next[item.key];
                          return next;
                        }),
                    },
                  )
                }
                onReset={() => reset.mutate(item.key)}
                saving={save.isPending}
              />
            ))}
          </div>
        ))
      )}
    </section>
  );
}

function NotificationCard({
  item,
  draft,
  onChange,
  onDiscard,
  onSave,
  onReset,
  saving,
}: {
  item: AutomatedNotification;
  draft?: Draft;
  onChange: (next: Draft) => void;
  onDiscard: () => void;
  onSave: (draft: Draft) => void;
  onReset: () => void;
  saving: boolean;
}) {
  const current: Draft = draft ?? {
    title: item.title,
    body: item.body,
    enabled: item.enabled,
  };
  const dirty =
    current.title !== item.title ||
    current.body !== item.body ||
    current.enabled !== item.enabled;

  // Variable chips insert at the caret of whichever field was last touched,
  // so clicking one mid-sentence does what it looks like it will.
  const lastFocused = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const insertVariable = (name: string) => {
    const el = lastFocused.current;
    const token = `{{${name}}}`;
    if (!el) {
      onChange({ ...current, body: `${current.body}${token}` });
      return;
    }
    const field = el instanceof HTMLTextAreaElement ? "body" : "title";
    const value = current[field];
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange({ ...current, [field]: next });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const values = Object.fromEntries(item.variables.map((v) => [v.name, v.example]));
  const preview = {
    title: render(current.title, values),
    body: render(current.body, values),
  };

  return (
    <motion.div
      layout
      transition={{ duration: 0.2, ease: EASE }}
      className="rounded-2xl border border-[#0A261E]/8 bg-white p-5"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-[13.5px] font-semibold text-[#0A261E]">
              {item.label}
            </h4>
            {item.customized ? (
              <span className="rounded-full bg-[var(--mosque-surface,#fffbf2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--mosque-accent,#B8922A)]">
                Edited
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-[12px] leading-relaxed text-[#0A261E]/55">
            {item.description}
          </p>
        </div>
        <label className="flex shrink-0 items-center gap-2 pt-0.5">
          <span className="text-[11.5px] text-[#0A261E]/55">
            {current.enabled ? "On" : "Off"}
          </span>
          <Switch
            checked={current.enabled}
            onCheckedChange={(enabled) => onChange({ ...current, enabled })}
            aria-label={`${item.label} notifications`}
          />
        </label>
      </header>

      <div
        className={
          current.enabled ? "mt-4 space-y-3" : "mt-4 space-y-3 opacity-45"
        }
      >
        <div className="space-y-1.5">
          <Label className="text-[12px] text-[#0A261E]/70">Title</Label>
          <Input
            value={current.title}
            disabled={!current.enabled}
            onFocus={(e) => (lastFocused.current = e.currentTarget)}
            onChange={(e) => onChange({ ...current, title: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] text-[#0A261E]/70">Message</Label>
          <Textarea
            rows={2}
            value={current.body}
            disabled={!current.enabled}
            onFocus={(e) => (lastFocused.current = e.currentTarget)}
            onChange={(e) => onChange({ ...current, body: e.target.value })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-[#0A261E]/45">Insert:</span>
          {item.variables.map((v) => (
            <button
              key={v.name}
              type="button"
              disabled={!current.enabled}
              onClick={() => insertVariable(v.name)}
              title={v.description}
              className="rounded-full border border-[#0A261E]/12 px-2.5 py-1 font-mono text-[11px] text-[#0A261E]/70 transition-colors hover:border-[var(--mosque-accent,#B8922A)] hover:text-[#0A261E] disabled:cursor-not-allowed"
            >
              {`{{${v.name}}}`}
            </button>
          ))}
        </div>

        {/* What actually lands on a phone, with the example values filled in. */}
        <div className="rounded-xl bg-[#0A261E]/[0.03] p-3">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[var(--mosque-primary,#0A261E)]">
              <Bell size={13} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-[#0A261E]">
                {preview.title || "—"}
              </p>
              <p className="text-[12px] leading-snug text-[#0A261E]/60">
                {preview.body || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-4 flex items-center justify-between gap-3">
        {item.customized ? (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-[11.5px] text-[#0A261E]/50 transition-colors hover:text-[#0A261E]"
          >
            <RotateCcw size={12} />
            Use the default wording
          </button>
        ) : (
          <span className="text-[11.5px] text-[#0A261E]/40">
            Using the default wording
          </span>
        )}

        <div className="flex items-center gap-2">
          {dirty ? (
            <Button variant="ghost" size="sm" onClick={onDiscard}>
              Discard
            </Button>
          ) : null}
          <Button
            size="sm"
            disabled={!dirty || saving}
            onClick={() => onSave(current)}
          >
            Save
          </Button>
        </div>
      </footer>
    </motion.div>
  );
}
