import PlaceholderPage from "../../_components/PlaceholderPage";

export default function NotificationSettingsPage() {
  return (
    <PlaceholderPage
      section="Mosque Setup"
      title="Notification settings"
      description="Master notification toggles per category — control what your members can opt out of."
      comingSoon
      shipTarget="Q3 2026"
      bullets={[
        "Per-category send/no-send defaults",
        "Member opt-out controls",
        "Reminder cadence",
      ]}
    />
  );
}
