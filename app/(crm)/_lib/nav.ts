import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  HeartHandshake,
  Settings2,
  Cog,
  UserCircle2,
  Mic2,
  CalendarDays,
  Film,
  BookOpenText,
  DollarSign,
  Megaphone,
  Clock,
  Palette,
  Tags,
  BellRing,
  UserCog,
  CreditCard,
  LifeBuoy,
  Building2,
} from "lucide-react";

export type CrmRoute = {
  href: string;
  label: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  /** Short blurb for cmdk + page headers */
  description?: string;
};

export type CrmSection = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** When undefined the section is itself a leaf page */
  children?: CrmRoute[];
};

export const CRM_NAV: CrmSection[] = [
  {
    id: "home",
    label: "Home",
    href: "/home",
    icon: LayoutDashboard,
  },
  {
    id: "people",
    label: "People",
    href: "/people",
    icon: Users,
    children: [
      {
        href: "/people/members",
        label: "Members",
        icon: UserCircle2,
        description: "Everyone signed in to your mosque app",
      },
      {
        href: "/people/speakers",
        label: "Speakers",
        icon: Mic2,
        description: "Reusable speaker registry",
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    href: "/content",
    icon: Calendar,
    children: [
      {
        href: "/content/programs",
        label: "Programs",
        icon: BookOpenText,
        description: "Recurring classes, halaqas, study circles",
      },
      {
        href: "/content/events",
        label: "Events",
        icon: CalendarDays,
        description: "One-off events with RSVPs",
      },
      {
        href: "/content/reels",
        label: "Reels",
        icon: Film,
        comingSoon: true,
        description: "Short-form vertical videos for the Discover tab",
      },
      {
        href: "/content/jummah",
        label: "Jummah",
        icon: BookOpenText,
        description: "Friday prayer slots — time, khateeb, topic",
      },
    ],
  },
  {
    id: "money",
    label: "Money",
    href: "/money",
    icon: HeartHandshake,
    children: [
      {
        href: "/money/donations",
        label: "Donations",
        icon: DollarSign,
        description: "Donations dashboard with anonymized donors",
      },
      {
        href: "/money/business-ads",
        label: "Business Ads",
        icon: Megaphone,
        comingSoon: true,
        description: "Pricing config + submissions queue",
      },
    ],
  },
  {
    id: "setup",
    label: "Mosque Setup",
    href: "/setup",
    icon: Settings2,
    children: [
      {
        href: "/setup/prayer-times",
        label: "Prayer Times",
        icon: Clock,
        description: "Calculation method + iqamah configuration",
      },
      {
        href: "/setup/theme",
        label: "Theme",
        icon: Palette,
        description: "Brand colors and accent",
      },
      {
        href: "/setup/categories",
        label: "Categories",
        icon: Tags,
        comingSoon: true,
        description: "Rename program and event categories",
      },
      {
        href: "/setup/notifications",
        label: "Notifications",
        icon: BellRing,
        description: "Compose, send, schedule, save templates",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: Cog,
    children: [
      {
        href: "/settings/profile",
        label: "Profile",
        icon: Building2,
        description: "Mosque name, app branding name, contact info, timezone",
      },
      {
        href: "/settings/team",
        label: "Team",
        icon: UserCog,
        description: "Team members and roles",
      },
      {
        href: "/settings/subscription",
        label: "Subscription",
        icon: CreditCard,
        description: "Tier, billing, invoices",
      },
      {
        href: "/settings/sahla-support",
        label: "Sahla Support",
        icon: LifeBuoy,
        description: "Direct line to the Sahla team",
      },
    ],
  },
];

/** Flattens nav into a list of every reachable leaf route. */
export function flattenRoutes(nav: CrmSection[] = CRM_NAV): CrmRoute[] {
  const out: CrmRoute[] = [];
  for (const section of nav) {
    if (!section.children) {
      out.push({
        href: section.href,
        label: section.label,
        icon: section.icon,
      });
      continue;
    }
    for (const child of section.children) {
      out.push(child);
    }
  }
  return out;
}

/** Build breadcrumb trail for a pathname like "/content/programs". */
export function breadcrumbFor(pathname: string): { label: string; href: string }[] {
  for (const section of CRM_NAV) {
    if (!section.children) {
      if (pathname === section.href) return [{ label: section.label, href: section.href }];
      continue;
    }
    for (const child of section.children) {
      if (pathname === child.href || pathname.startsWith(child.href + "/")) {
        return [
          { label: section.label, href: section.href },
          { label: child.label, href: child.href },
        ];
      }
    }
  }
  return [];
}
