export type TaskBadge = "REQ" | "REC";

export type OnboardingTask = {
  id: string;
  label: string;
  description: string;
  badge: TaskBadge;
  timeEstimate: string;
};

export type TaskCategory = {
  id: string;
  label: string;
  tasks: OnboardingTask[];
};

export const ONBOARDING_CATEGORIES: TaskCategory[] = [
  {
    id: "foundation",
    label: "Foundation",
    tasks: [
      {
        id: "mosque_profile",
        label: "Mosque Profile",
        description: "Name, address, contact info, and timezone",
        badge: "REQ",
        timeEstimate: "5 min",
      },
      {
        id: "app_branding",
        label: "App Branding",
        description: "Logo, colors, and app display name",
        badge: "REQ",
        timeEstimate: "3 min",
      },
    ],
  },
  {
    id: "prayer",
    label: "Prayer & Worship",
    tasks: [
      {
        id: "prayer_times",
        label: "Prayer Times",
        description: "Calculation method, iqamah configuration",
        badge: "REQ",
        timeEstimate: "5 min",
      },
      {
        id: "jummah_setup",
        label: "Jummah Setup",
        description: "Friday prayer times, imams, and capacity",
        badge: "REQ",
        timeEstimate: "3 min",
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    tasks: [
      {
        id: "speakers",
        label: "Speakers",
        description: "Add imam and speaker profiles",
        badge: "REC",
        timeEstimate: "5 min",
      },
      {
        id: "programs",
        label: "Programs",
        description: "Recurring classes, halaqas, and study circles",
        badge: "REC",
        timeEstimate: "10 min",
      },
      {
        id: "events",
        label: "Events",
        description: "One-time events and community gatherings",
        badge: "REC",
        timeEstimate: "5 min",
      },
    ],
  },
  {
    id: "revenue",
    label: "Revenue",
    tasks: [
      {
        id: "stripe_connect",
        label: "Stripe Connect",
        description: "Connect your Stripe account for payments",
        badge: "REQ",
        timeEstimate: "5 min",
      },
      {
        id: "donations",
        label: "Donations",
        description: "Set up donation projects and campaigns",
        badge: "REC",
        timeEstimate: "5 min",
      },
      {
        id: "ads_config",
        label: "Business Ads",
        description: "Configure ad pricing and placements",
        badge: "REC",
        timeEstimate: "3 min",
      },
    ],
  },
  {
    id: "team",
    label: "Team",
    tasks: [
      {
        id: "invite_admins",
        label: "Invite Admins",
        description: "Add team members to manage your app",
        badge: "REC",
        timeEstimate: "2 min",
      },
    ],
  },
  {
    id: "launch",
    label: "Launch",
    tasks: [
      {
        id: "preview_app",
        label: "Preview App",
        description: "See how your app looks before going live",
        badge: "REQ",
        timeEstimate: "2 min",
      },
      {
        id: "launch_materials",
        label: "Launch Materials",
        description: "QR codes, flyers, and announcement templates",
        badge: "REC",
        timeEstimate: "3 min",
      },
      {
        id: "go_live",
        label: "Go Live",
        description: "Submit your app to the App Store and Play Store",
        badge: "REQ",
        timeEstimate: "2 min",
      },
    ],
  },
];

export const ALL_TASKS = ONBOARDING_CATEGORIES.flatMap((c) => c.tasks);
