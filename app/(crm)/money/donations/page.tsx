import PlaceholderPage from "../../_components/PlaceholderPage";

export default function DonationsPage() {
  return (
    <PlaceholderPage
      section="Money"
      title="Donations"
      description="Real-time donations dashboard — totals, trends, anonymized top donors, and a direct link to Stripe."
      bullets={[
        "MTD and YTD totals with trend deltas",
        "90-day area chart with daily breakdown",
        "Anonymized top donors (privacy-first)",
        "One-click into your Stripe Dashboard for refunds and disputes",
      ]}
    />
  );
}
