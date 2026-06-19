import { dark } from "@clerk/themes";

const CREAM = "#fffbf2";
const GREEN = "#0A261E";
// Card surface, one step lighter than the navbar rail so the two panes read
// as distinct planes inside the modal.
const SURFACE = "#103127";
const RAIL = "#0c2620";
const GOLD = "#C2A23E";

/**
 * Appearance for the Clerk `<UserProfile>` modal as opened from inside the CRM
 * (TopBar avatar + sidebar footer). The global ClerkProvider theme in the root
 * layout still drives the auth pages — this is layered on top only for the
 * in-app account modal so it reads as a polished, branded surface:
 *  - an opaque card with a real border + shadow (the default blended into the
 *    dark backdrop and let the page texture bleed through)
 *  - a dimmed, blurred backdrop so the modal pops
 *  - the left nav rail darker than the content pane for plane separation
 *  - gold accents tying it to the CRM's brand
 */
export const crmProfileAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: GOLD,
    colorBackground: SURFACE,
    colorText: CREAM,
    colorTextSecondary: "rgba(255,251,242,0.6)",
    colorInputBackground: "rgba(255,251,242,0.06)",
    colorInputText: CREAM,
    colorNeutral: CREAM,
    colorTextOnPrimaryBackground: GREEN,
    borderRadius: "0.75rem",
  },
  elements: {
    modalBackdrop: {
      backgroundColor: "rgba(6,18,14,0.6)",
      backdropFilter: "blur(6px)",
    },
    // Opaque card with a defined edge + elevation so it stops blending into
    // the backdrop and the page texture no longer shows through.
    card: {
      backgroundColor: SURFACE,
      border: "1px solid rgba(255,251,242,0.1)",
      boxShadow: "0 24px 60px -12px rgba(0,0,0,0.55)",
    },
    modalContent: {
      borderRadius: "1rem",
      overflow: "hidden",
    },
    navbar: {
      backgroundColor: RAIL,
      borderRight: "1px solid rgba(255,251,242,0.08)",
    },
    // Active tab gets a subtle gold-tinted pill instead of a flat label.
    navbarButton: {
      color: "rgba(255,251,242,0.7)",
      borderRadius: "0.5rem",
      "&:hover": { backgroundColor: "rgba(255,251,242,0.05)", color: CREAM },
      "&[data-active='true']": {
        backgroundColor: "rgba(194,162,62,0.14)",
        color: CREAM,
      },
    },
    navbarButtonText: { color: "#fffbf2" },
    navbarButtonIcon: { color: "#fffbf2" },
    closeButton: {
      color: "rgba(255,251,242,0.65)",
      borderRadius: "0.5rem",
      "&:hover": { backgroundColor: "rgba(255,251,242,0.08)", color: CREAM },
      "&:focus": { boxShadow: "none" },
    },
    headerTitle: { color: "#fffbf2" },
    headerSubtitle: { color: "rgba(255,251,242,0.7)" },
    profileSectionTitleText: { color: "#fffbf2" },
    profileSectionPrimaryButton: { color: GOLD },
    profileSectionContent: { color: "#fffbf2" },
    accordionTriggerButton: { color: "#fffbf2" },
    breadcrumbsItem: { color: "rgba(255,251,242,0.7)" },
    breadcrumbsItemDivider: { color: "rgba(255,251,242,0.4)" },
    menuButton: { color: "#fffbf2" },
    formFieldLabel: { color: "#fffbf2" },
    // Rows + dividers get a faint hairline so the sections don't run together.
    profileSection: { borderColor: "rgba(255,251,242,0.08)" },
    badge: {
      backgroundColor: "rgba(194,162,62,0.16)",
      color: GOLD,
    },
  },
} as const;
