import { z } from "zod";

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const contentSchema = z
  .object({
    name: z.string().trim().min(2, "Add a name"),
    speakerName: z.string().min(1, "Pick a speaker"),
    speakerId: z.string().optional(),
    description: z
      .string()
      .trim()
      .max(800, "Keep it under 800 characters")
      .optional(),
    startDate: z.string().min(1, "Pick a start date"),
    endDate: z.string().optional().nullable(),
    startTime: z.string().min(1, "Pick a start time"),
    days: z.array(z.enum(WEEKDAYS)),
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
  )
  .refine(
    (v) => {
      if (!v.endDate) return true;
      return new Date(v.endDate) >= new Date(v.startDate);
    },
    {
      message: "End date must be on or after the start date",
      path: ["endDate"],
    }
  );

export type ContentFormValues = z.infer<typeof contentSchema>;

const todayIso = () => new Date().toISOString().slice(0, 10);

export const defaultContentValues: ContentFormValues = {
  name: "",
  speakerName: "",
  speakerId: undefined,
  description: "",
  startDate: todayIso(),
  endDate: null,
  startTime: "19:00",
  days: [],
  maxCapacity: 50,
  isPaid: false,
  priceUsd: undefined,
  enableWaitlist: true,
  imageUrl: "",
};

export { WEEKDAYS };
