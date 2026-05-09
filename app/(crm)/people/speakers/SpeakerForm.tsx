"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import HelpButton from "../../_components/HelpButton";
import type { Speaker } from "../../_mock/speakers";

const speakerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  credentials: z
    .string()
    .trim()
    .min(2, "Add a credential — degree, institution, or role"),
  bio: z.string().trim().max(500, "Keep the bio under 500 characters").optional(),
  photoUrl: z
    .string()
    .trim()
    .url("Paste a valid image URL")
    .or(z.literal(""))
    .optional(),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .or(z.literal(""))
    .optional(),
});

export type SpeakerFormValues = z.infer<typeof speakerSchema>;

type Props = {
  defaultValues?: Partial<Speaker>;
  onSubmit: (values: SpeakerFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
};

export default function SpeakerForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Save speaker",
}: Props) {
  const form = useForm<SpeakerFormValues>({
    resolver: zodResolver(speakerSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      credentials: defaultValues?.credentials ?? "",
      bio: defaultValues?.bio ?? "",
      photoUrl: defaultValues?.photoUrl ?? "",
      email: defaultValues?.email ?? "",
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
    >
      <Field
        label="Full name"
        error={form.formState.errors.name?.message}
        required
      >
        <Input placeholder="Sheikh Omar Suleiman" {...form.register("name")} />
      </Field>

      <Field
        label="Credentials"
        helpText="Their public title — institution, degree, or role. Shown on the program detail page."
        error={form.formState.errors.credentials?.message}
        required
      >
        <Input
          placeholder="President, Yaqeen Institute · PhD Islamic Studies"
          {...form.register("credentials")}
        />
      </Field>

      <Field
        label="Photo URL"
        helpText="Paste a public image URL. Upload from your device is coming soon."
        error={form.formState.errors.photoUrl?.message}
      >
        <Input
          type="url"
          placeholder="https://example.com/headshot.jpg"
          {...form.register("photoUrl")}
        />
      </Field>

      <Field
        label="Short bio"
        helpText="One or two sentences. Optional."
        error={form.formState.errors.bio?.message}
      >
        <Textarea
          placeholder="What's their focus? What did they speak on most recently?"
          rows={3}
          {...form.register("bio")}
        />
      </Field>

      <Field
        label="Email (private)"
        helpText="Only visible to your team — for scheduling reminders."
        error={form.formState.errors.email?.message}
      >
        <Input
          type="email"
          placeholder="omar@example.org"
          {...form.register("email")}
        />
      </Field>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
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
