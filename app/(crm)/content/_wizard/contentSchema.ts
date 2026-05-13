import { z } from "zod";

export const contentSchema = z
  .object({
    name: z.string().trim().min(2, "Add a name"),
    category: z.string().min(1, "Pick a category"),
    speakerName: z.string().min(1, "Pick a speaker"),
    speakerId: z.string().optional(),
    description: z.string().trim().max(800, "Keep it under 800 characters").optional(),
    startsAtDate: z.string().min(1, "Pick a date"),
    startsAtTime: z.string().min(1, "Pick a start time"),
    durationMin: z.number().int().min(15, "Minimum 15 minutes").max(480),
    recurrence: z.enum(["none", "weekly", "monthly"]),
    maxCapacity: z.number().int().min(1, "Need at least 1 seat"),
    isPaid: z.boolean(),
    priceUsd: z.number().min(0).optional(),
    enableWaitlist: z.boolean(),
    imageUrl: z
      .string()
      .url("Use a valid image URL")
      .or(z.literal(""))
      .optional(),
  })
  .refine(
    (v) => !v.isPaid || (v.priceUsd !== undefined && v.priceUsd > 0),
    {
      message: "Set a price (or untoggle paid)",
      path: ["priceUsd"],
    }
  );

export type ContentFormValues = z.infer<typeof contentSchema>;

export const defaultContentValues: ContentFormValues = {
  name: "",
  category: "",
  speakerName: "",
  speakerId: undefined,
  description: "",
  startsAtDate: new Date().toISOString().slice(0, 10),
  startsAtTime: "19:00",
  durationMin: 60,
  recurrence: "weekly",
  maxCapacity: 50,
  isPaid: false,
  priceUsd: undefined,
  enableWaitlist: true,
  imageUrl: "",
};
