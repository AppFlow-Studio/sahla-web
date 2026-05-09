import PlaceholderPage from "../_components/PlaceholderPage";

export default function HomePage() {
  return (
    <PlaceholderPage
      section="Home"
      title="Mosque dashboard"
      description="At-a-glance view of donations, members, RSVPs, and the next-best things to focus on."
      bullets={[
        "KPI strip — Donations MTD, active members, RSVPs this week, ad revenue",
        "Activity feed — recent signups, RSVPs, donations, notifications",
        "Top-3 nudges — capacity warnings, donation receipts, push-token reminders",
      ]}
    />
  );
}
