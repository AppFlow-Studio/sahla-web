"use client";

import { useFormContext } from "react-hook-form";
import {
  Calendar,
  Clock,
  ImageIcon,
  Users,
  DollarSign,
  Mic2,
  Repeat,
} from "lucide-react";
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
import HelpButton from "../../_components/HelpButton";
import { useSpeakers } from "../../_hooks/useSpeakers";
import { useMosque } from "../../_lib/mock-mosque";
import { formatUsd } from "../../_lib/format";
import { WEEKDAYS, type ContentFormValues, type Weekday } from "./contentSchema";
import { cn } from "@/lib/utils";

type StepProps = {
  kind: "program" | "event";
};

const WEEKDAY_LABELS: Record<Weekday, string> = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
};

export function StepBasics({ kind }: StepProps) {
  const form = useFormContext<ContentFormValues>();
  const { data: speakers } = useSpeakers();
  const errs = form.formState.errors;

  return (
    <Section
      title={`Tell us about your ${kind}`}
      description={`A clear name and short description helps members decide whether to ${kind === "program" ? "attend the next session" : "RSVP"}.`}
    >
      <Field
        label="Name"
        required
        error={errs.name?.message}
        helpText={`The name that appears in your app's ${kind === "program" ? "Programs" : "Events"} list.`}
      >
        <Input
          placeholder={
            kind === "program" ? "Friday Halaqa" : "Annual Fundraiser Dinner"
          }
          {...form.register("name")}
        />
      </Field>

      <Field label="Speaker" required error={errs.speakerName?.message}>
        <Select
          value={form.watch("speakerName")}
          onValueChange={(v) => {
            const next = v ?? "";
            const speaker = speakers.find((s) => s.name === next);
            form.setValue("speakerName", next, { shouldValidate: true });
            form.setValue("speakerId", speaker?.id);
          }}
        >
          <SelectTrigger>
            <Mic2 size={13} className="text-[#0A261E]/45" />
            <SelectValue placeholder="From your speaker registry" />
          </SelectTrigger>
          <SelectContent>
            {speakers.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-[#0A261E]/55">
                No speakers yet — add one in People &gt; Speakers.
              </div>
            ) : (
              speakers.map((s) => (
                <SelectItem key={s.id} value={s.name}>
                  {s.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label="Description"
        helpText="Optional. One or two sentences."
        error={errs.description?.message}
      >
        <Textarea
          rows={3}
          placeholder="What will members get out of attending?"
          {...form.register("description")}
        />
      </Field>
    </Section>
  );
}

export function StepSchedule({ kind }: StepProps) {
  const form = useFormContext<ContentFormValues>();
  const errs = form.formState.errors;
  const days = form.watch("days") ?? [];
  const endDate = form.watch("endDate");
  const indefinite = !endDate;

  function toggleDay(day: Weekday) {
    const next = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day];
    form.setValue("days", next as Weekday[], { shouldValidate: true });
  }

  return (
    <Section
      title="When does it happen?"
      description={
        kind === "program"
          ? "Programs run on the days you pick, between a start date and (optionally) an end date."
          : "Events are one-off. Pick the date and start time."
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Start date" required error={errs.startDate?.message}>
          <div className="relative">
            <Calendar
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0A261E]/40"
            />
            <Input
              type="date"
              className="pl-9"
              {...form.register("startDate")}
            />
          </div>
        </Field>
        <Field label="Start time" required error={errs.startTime?.message}>
          <div className="relative">
            <Clock
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0A261E]/40"
            />
            <Input
              type="time"
              className="pl-9"
              {...form.register("startTime")}
            />
          </div>
        </Field>
      </div>

      {kind === "program" ? (
        <>
          <Field
            label="Repeats on"
            required
            helpText="Pick one or more weekdays. Leave empty for a one-off session."
          >
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => {
                const active = days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors",
                      active
                        ? "border-[#0A261E] bg-[#0A261E] text-[#fffbf2]"
                        : "border-[#0A261E]/15 bg-white text-[#0A261E]/65 hover:border-[#0A261E]/30"
                    )}
                  >
                    {WEEKDAY_LABELS[d]}
                  </button>
                );
              })}
            </div>
          </Field>

          <ToggleRow
            title="Runs indefinitely"
            description="Leave on if the program has no planned end date."
            checked={indefinite}
            onChange={(c) => form.setValue("endDate", c ? null : new Date().toISOString().slice(0, 10))}
            icon={<Repeat size={13} />}
          />

          {!indefinite ? (
            <Field label="End date" error={errs.endDate?.message}>
              <div className="relative">
                <Calendar
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0A261E]/40"
                />
                <Input
                  type="date"
                  className="pl-9"
                  value={endDate ?? ""}
                  onChange={(e) =>
                    form.setValue("endDate", e.target.value || null, {
                      shouldValidate: true,
                    })
                  }
                />
              </div>
            </Field>
          ) : null}
        </>
      ) : null}
    </Section>
  );
}

export function StepCapacity({ kind: _kind }: StepProps) {
  const form = useFormContext<ContentFormValues>();
  const errs = form.formState.errors;
  const isPaid = form.watch("isPaid");
  const enableWaitlist = form.watch("enableWaitlist");
  const mosque = useMosque();

  return (
    <Section
      title="Capacity & price"
      description="Set how many people can attend and whether RSVP requires payment."
    >
      <Field
        label="Max capacity"
        required
        error={errs.maxCapacity?.message}
        helpText="The hard cap. Once reached, new RSVPs join the waitlist if enabled."
      >
        <div className="relative">
          <Users
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0A261E]/40"
          />
          <Input
            type="number"
            min={1}
            className="pl-9"
            {...form.register("maxCapacity", { valueAsNumber: true })}
          />
        </div>
      </Field>

      <ToggleRow
        title="Enable waitlist"
        description="When you hit capacity, new RSVPs join the queue and are auto-promoted on cancel."
        checked={enableWaitlist}
        onChange={(c) => form.setValue("enableWaitlist", c)}
      />

      <ToggleRow
        title="Charge for RSVP"
        description="Members pay via Stripe Connect (your existing donations setup)."
        checked={isPaid}
        onChange={(c) => form.setValue("isPaid", c, { shouldValidate: true })}
      />

      {isPaid ? (
        <Field label="Price (USD)" required error={errs.priceUsd?.message}>
          <div className="relative">
            <DollarSign
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#0A261E]/40"
            />
            <Input
              type="number"
              min={0}
              step={5}
              className="pl-9"
              placeholder="25"
              {...form.register("priceUsd", { valueAsNumber: true })}
            />
          </div>
          <p className="mt-1 text-[11.5px] text-[#0A261E]/45">
            Stripe fees (~3%) + Sahla platform fee deducted automatically.
            Funds land in {mosque.name}'s connected Stripe account.
          </p>
        </Field>
      ) : null}
    </Section>
  );
}

export function StepImage({ kind }: StepProps) {
  const form = useFormContext<ContentFormValues>();
  const errs = form.formState.errors;
  const imageUrl = form.watch("imageUrl");

  return (
    <Section
      title={`Pick a cover image for your ${kind}`}
      description="Optional but recommended — it shows up on the discover tab and the detail page."
    >
      <Field
        label="Image URL"
        helpText="Paste any public image link. Upload from your device is coming soon."
        error={errs.imageUrl?.message}
      >
        <Input
          type="url"
          placeholder="https://..."
          {...form.register("imageUrl")}
        />
      </Field>

      <div className="mt-2 flex aspect-[4/3] max-w-md items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#0A261E]/15 bg-[#fffbf2]">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="text-center text-[#0A261E]/35">
            <ImageIcon size={32} className="mx-auto" />
            <p className="mt-2 text-[12px]">Image preview will appear here</p>
          </div>
        )}
      </div>
    </Section>
  );
}

export function StepReview({ kind }: StepProps) {
  const form = useFormContext<ContentFormValues>();
  const v = form.watch();
  const startDateTime = new Date(`${v.startDate}T${v.startTime}:00`);

  const daysLabel =
    !v.days || v.days.length === 0
      ? kind === "event"
        ? "Once"
        : "Not scheduled"
      : v.days.length === 7
      ? "Every day"
      : v.days
          .map((d) => WEEKDAY_LABELS[d])
          .join(", ");

  return (
    <Section
      title="Review and publish"
      description="One last look. After publishing, members can RSVP from your app."
    >
      <div className="overflow-hidden rounded-2xl border border-[#0A261E]/8 bg-white">
        {v.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={v.imageUrl} alt="" className="h-40 w-full object-cover" />
        ) : null}
        <div className="space-y-3 p-5">
          <div>
            <h3 className="mt-1 font-display text-[22px] leading-tight text-[#0A261E]">
              {v.name || "Untitled"}
            </h3>
            <p className="mt-1 text-[12.5px] text-[#0A261E]/60">
              with {v.speakerName || "—"}
            </p>
          </div>

          {v.description ? (
            <p className="text-[13px] leading-relaxed text-[#0A261E]/75">
              {v.description}
            </p>
          ) : null}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#0A261E]/6 pt-3 text-[12.5px]">
            <Detail
              label="First session"
              value={
                Number.isNaN(startDateTime.getTime())
                  ? "—"
                  : startDateTime.toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
              }
            />
            <Detail label="Repeats" value={daysLabel} />
            <Detail
              label="Until"
              value={
                v.endDate
                  ? new Date(v.endDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : kind === "program"
                  ? "No end date"
                  : "—"
              }
            />
            <Detail label="Capacity" value={`${v.maxCapacity} seats`} />
            <Detail label="Waitlist" value={v.enableWaitlist ? "On" : "Off"} />
            <Detail
              label="Price"
              value={v.isPaid && v.priceUsd ? formatUsd(v.priceUsd) : "Free"}
            />
          </dl>
        </div>
      </div>
    </Section>
  );
}

/* ─── tiny shared bits ─── */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-[22px] leading-tight text-[#0A261E]">
          {title}
        </h2>
        <p className="mt-1 text-[13px] text-[#0A261E]/60">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  helpText,
  error,
  required,
  children,
}: {
  label: string;
  helpText?: string;
  error?: string;
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
      {error ? (
        <p className="text-[12px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  icon,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (c: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-[#0A261E]/8 bg-white p-3.5">
      <div className="flex items-start gap-2.5">
        {icon ? (
          <span className="mt-0.5 text-[#0A261E]/45" aria-hidden>
            {icon}
          </span>
        ) : null}
        <div>
          <p className="text-[13px] font-semibold text-[#0A261E]">{title}</p>
          <p className="text-[12px] text-[#0A261E]/55">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#0A261E]/45">
        {label}
      </dt>
      <dd className="mt-0.5 text-[#0A261E]">{value}</dd>
    </div>
  );
}
