"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Wizard, { type WizardStep } from "./Wizard";
import {
  contentSchema,
  defaultContentValues,
  type ContentFormValues,
} from "./contentSchema";
import {
  StepBasics,
  StepCapacity,
  StepImage,
  StepReview,
  StepSchedule,
} from "./Steps";
import { useContent } from "../../_hooks/useContent";

const PROGRAM_STEPS: WizardStep[] = [
  { id: "basics", label: "Basics" },
  { id: "schedule", label: "Schedule" },
  { id: "capacity", label: "Capacity" },
  { id: "image", label: "Image" },
  { id: "review", label: "Review" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "program" | "event";
};

export default function CreateContentWizard({ open, onOpenChange, kind }: Props) {
  const { add } = useContent(kind);

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: defaultContentValues,
    mode: "onChange",
  });

  function reset() {
    form.reset(defaultContentValues);
  }

  async function publish() {
    const ok = await form.trigger();
    if (!ok) {
      toast.error("Some fields still need attention");
      return;
    }
    const v = form.getValues();
    const startsAt = new Date(`${v.startsAtDate}T${v.startsAtTime}:00`).toISOString();
    add({
      kind,
      name: v.name,
      category: v.category,
      description: v.description ?? "",
      speakerId: v.speakerId,
      speakerName: v.speakerName,
      imageUrl: v.imageUrl,
      startsAt,
      durationMin: v.durationMin,
      recurrence: v.recurrence,
      maxCapacity: v.maxCapacity,
      isPaid: v.isPaid,
      priceUsd: v.priceUsd,
    });
    toast.success(
      `${kind === "program" ? "Program" : "Event"} published: ${v.name}`
    );
    onOpenChange(false);
    reset();
  }

  // Wizards step gates
  const stepValidators: Array<keyof ContentFormValues | (keyof ContentFormValues)[]> = [
    ["name", "category", "speakerName"],
    ["startsAtDate", "startsAtTime", "durationMin"],
    ["maxCapacity", "isPaid", "priceUsd"],
    ["imageUrl"],
    [],
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 sm:max-w-[640px]">
        <DialogHeader className="border-b border-[#0A261E]/8 pb-4">
          <DialogTitle className="font-display text-[22px] text-[#0A261E]">
            New {kind}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[#0A261E]/60">
            Five quick steps. Hit &ldquo;Publish&rdquo; when you're ready —
            members can RSVP from the app immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-5">
          <FormProvider {...form}>
            <Wizard
              steps={PROGRAM_STEPS.map((step, i) => ({
                ...step,
                canAdvance: async () => {
                  const fields = stepValidators[i];
                  if (Array.isArray(fields) && fields.length > 0) {
                    const ok = await form.trigger(
                      fields as (keyof ContentFormValues)[],
                      { shouldFocus: true }
                    );
                    if (!ok) {
                      toast.error("Fix the highlighted fields first");
                      return false;
                    }
                  }
                  return true;
                },
              }))}
              onComplete={publish}
              completeLabel={`Publish ${kind}`}
            >
              {(stepIndex) => {
                switch (stepIndex) {
                  case 0:
                    return <StepBasics kind={kind} />;
                  case 1:
                    return <StepSchedule kind={kind} />;
                  case 2:
                    return <StepCapacity kind={kind} />;
                  case 3:
                    return <StepImage kind={kind} />;
                  case 4:
                  default:
                    return <StepReview kind={kind} />;
                }
              }}
            </Wizard>
          </FormProvider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
