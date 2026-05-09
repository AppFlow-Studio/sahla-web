export type NotificationTemplate = {
  id: string;
  name: string;
  title: string;
  body: string;
  audience: "all" | "program" | "event" | "tag";
  audienceLabel: string;
  /** ISO 8601 */
  lastUsedAt: string | null;
  usageCount: number;
};

export type NotificationHistoryItem = {
  id: string;
  title: string;
  body: string;
  /** ISO 8601 */
  sentAt: string;
  audienceLabel: string;
  recipientCount: number;
  /** Open rate as a fraction 0..1 */
  openRate: number;
};

export const seedTemplates: NotificationTemplate[] = [
  {
    id: "tpl_01",
    name: "Jummah reminder",
    title: "Jummah today, in shaa Allah",
    body: "Khutbah at 1:15pm. Prayer at 1:45pm. Park in the back lot — front is reserved for elders.",
    audience: "all",
    audienceLabel: "Everyone",
    lastUsedAt: "2026-05-02T14:00:00Z",
    usageCount: 18,
  },
  {
    id: "tpl_02",
    name: "Iqamah change",
    title: "Iqamah times have shifted",
    body: "Updated for the next 4 weeks. Check the app for the latest schedule.",
    audience: "all",
    audienceLabel: "Everyone",
    lastUsedAt: "2026-04-10T11:00:00Z",
    usageCount: 6,
  },
  {
    id: "tpl_03",
    name: "Program reminder (24h)",
    title: "Tomorrow: {{program_name}}",
    body: "See you tomorrow at {{program_time}}. Bring a notebook.",
    audience: "program",
    audienceLabel: "Program RSVPs",
    lastUsedAt: "2026-05-06T20:00:00Z",
    usageCount: 32,
  },
  {
    id: "tpl_04",
    name: "Event ticket released",
    title: "New event: {{event_name}}",
    body: "RSVPs open now. {{seats_remaining}} seats left.",
    audience: "all",
    audienceLabel: "Everyone",
    lastUsedAt: "2026-04-30T09:30:00Z",
    usageCount: 9,
  },
  {
    id: "tpl_05",
    name: "Donation thank-you",
    title: "Jazak Allah khair",
    body: "Your contribution to {{fund_name}} has been received. May Allah accept it.",
    audience: "tag",
    audienceLabel: "Recent donors",
    lastUsedAt: "2026-05-04T16:00:00Z",
    usageCount: 41,
  },
  {
    id: "tpl_06",
    name: "Sister's circle reminder",
    title: "Sister's halaqa tonight",
    body: "Tonight after Maghrib. Tea and dates provided.",
    audience: "tag",
    audienceLabel: "Sisters' tag",
    lastUsedAt: "2026-05-01T18:00:00Z",
    usageCount: 14,
  },
  {
    id: "tpl_07",
    name: "Volunteer call",
    title: "Need 4 volunteers Saturday",
    body: "We're setting up for the fundraiser at 2pm. Reply if you can help — barakallahu feekum.",
    audience: "tag",
    audienceLabel: "Active volunteers",
    lastUsedAt: "2026-04-25T10:00:00Z",
    usageCount: 5,
  },
  {
    id: "tpl_08",
    name: "Eid Mubarak",
    title: "Eid Mubarak from {{mosque_name}}",
    body: "May Allah accept all our deeds. Eid prayer at 8:00am — please bring a prayer rug.",
    audience: "all",
    audienceLabel: "Everyone",
    lastUsedAt: "2026-03-30T07:00:00Z",
    usageCount: 2,
  },
];

const NOW = new Date("2026-05-08T12:00:00Z").getTime();
const DAY = 86_400_000;

export const seedHistory: NotificationHistoryItem[] = [
  {
    id: "ntf_01",
    title: "Jummah today, in shaa Allah",
    body: "Khutbah at 1:15pm. Prayer at 1:45pm.",
    sentAt: new Date(NOW - 3 * DAY).toISOString(),
    audienceLabel: "Everyone",
    recipientCount: 1247,
    openRate: 0.62,
  },
  {
    id: "ntf_02",
    title: "Tomorrow: Friday Halaqa",
    body: "See you tomorrow at 8pm. Bring a notebook.",
    sentAt: new Date(NOW - 4 * DAY).toISOString(),
    audienceLabel: "Program RSVPs (84)",
    recipientCount: 84,
    openRate: 0.78,
  },
  {
    id: "ntf_03",
    title: "Jazak Allah khair",
    body: "Your contribution to Sadaqah has been received.",
    sentAt: new Date(NOW - 5 * DAY).toISOString(),
    audienceLabel: "Recent donors (42)",
    recipientCount: 42,
    openRate: 0.71,
  },
  {
    id: "ntf_04",
    title: "Iqamah times have shifted",
    body: "Updated for the next 4 weeks.",
    sentAt: new Date(NOW - 9 * DAY).toISOString(),
    audienceLabel: "Everyone",
    recipientCount: 1238,
    openRate: 0.55,
  },
  {
    id: "ntf_05",
    title: "Sister's halaqa tonight",
    body: "Tonight after Maghrib.",
    sentAt: new Date(NOW - 12 * DAY).toISOString(),
    audienceLabel: "Sisters' tag (118)",
    recipientCount: 118,
    openRate: 0.69,
  },
  {
    id: "ntf_06",
    title: "Need 4 volunteers Saturday",
    body: "We're setting up for the fundraiser at 2pm.",
    sentAt: new Date(NOW - 18 * DAY).toISOString(),
    audienceLabel: "Active volunteers (38)",
    recipientCount: 38,
    openRate: 0.84,
  },
];
