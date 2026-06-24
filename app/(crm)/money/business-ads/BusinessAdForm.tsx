"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import HelpButton from "../../_components/HelpButton";
import BusinessAdImageInput from "./BusinessAdImageInput";
import type { BusinessAd } from "../../_hooks/useBusinessAds";

const PLACEMENTS = [
  { value: "feed", label: "In-feed (between content)" },
  { value: "home_banner", label: "Home banner" },
  { value: "details_page", label: "Inside content details" },
] as const;

const DURATIONS = [1, 3, 6, 12];

const adSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required"),
  businessAddress: z.string().trim().optional(),
  contactName: z.string().trim().optional(),
  contactEmail: z
    .string()
    .trim()
    .email("Enter a valid email")
    .or(z.literal(""))
    .optional(),
  contactPhone: z.string().trim().optional(),
  placement: z.string().optional(),
  durationMonths: z.number().int().positive().optional(),
  imageUrl: z.string().url("Upload a 16:9 ad image"),
});

export type BusinessAdFormValues = z.infer<typeof adSchema>;

type Props = {
  defaultValues?: Partial<BusinessAd>;
  onSubmit: (values: BusinessAdFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
};

export default function BusinessAdForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Save ad",
}: Props) {
  const form = useForm<BusinessAdFormValues>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      businessName: defaultValues?.businessName ?? "",
      businessAddress: defaultValues?.businessAddress ?? "",
      contactName: defaultValues?.contactName ?? "",
      contactEmail: defaultValues?.contactEmail ?? "",
      contactPhone: defaultValues?.contactPhone ?? "",
      placement: defaultValues?.placement ?? "feed",
      durationMonths: defaultValues?.durationMonths ?? 1,
      imageUrl: defaultValues?.imageUrl ?? "",
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Left column — ad image */}
        <Field
          label="Ad image"
          helpText="16:9 aspect ratio required (e.g. 1920×1080, 1600×900). Shown across in-app placements."
          required
          error={form.formState.errors.imageUrl?.message}
        >
          <Controller
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <BusinessAdImageInput
                value={field.value || null}
                onChange={(url) => field.onChange(url ?? "")}
                error={form.formState.errors.imageUrl?.message}
              />
            )}
          />
        </Field>

        {/* Right column — business details */}
        <div className="space-y-4">
          <Field
            label="Business name"
            required
            error={form.formState.errors.businessName?.message}
          >
            <Input
              placeholder="Atlas Halal Market"
              {...form.register("businessName")}
            />
          </Field>

          <Field
            label="Business address"
            helpText="Optional — surfaced in the ad's details view."
          >
            <Textarea
              rows={2}
              placeholder="123 Main St, Brooklyn, NY"
              {...form.register("businessAddress")}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration">
              <Controller
                control={form.control}
                name="durationMonths"
                render={({ field }) => (
                  <select
                    className="h-10 w-full rounded-md border border-[#0A261E]/15 bg-white px-3 text-[13px] text-[#0A261E] outline-none transition-colors hover:border-[#0A261E]/30 focus:border-[#0A261E]/45"
                    value={field.value ?? 1}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  >
                    {DURATIONS.map((m) => (
                      <option key={m} value={m}>
                        {m} {m === 1 ? "month" : "months"}
                      </option>
                    ))}
                  </select>
                )}
              />
            </Field>

            <Field label="Placement">
              <Controller
                control={form.control}
                name="placement"
                render={({ field }) => (
                  <select
                    className="h-10 w-full rounded-md border border-[#0A261E]/15 bg-white px-3 text-[13px] text-[#0A261E] outline-none transition-colors hover:border-[#0A261E]/30 focus:border-[#0A261E]/45"
                    value={field.value ?? "feed"}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    {PLACEMENTS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Contact info — full width row beneath */}
      <div className="grid grid-cols-1 gap-3 border-t border-[#0A261E]/8 pt-4 md:grid-cols-3">
        <Field label="Contact name" helpText="Who at the business owns this ad.">
          <Input placeholder="Yusuf Khan" {...form.register("contactName")} />
        </Field>

        <Field
          label="Contact email"
          error={form.formState.errors.contactEmail?.message}
        >
          <Input
            type="email"
            placeholder="yusuf@atlas.example"
            {...form.register("contactEmail")}
          />
        </Field>

        <Field label="Contact phone">
          <Input
            type="tel"
            placeholder="(555) 123-4567"
            {...form.register("contactPhone")}
          />
        </Field>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
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

export const PLACEMENT_LABELS: Record<string, string> = Object.fromEntries(
  PLACEMENTS.map((p) => [p.value, p.label])
);
