import PlaceholderPage from "../../_components/PlaceholderPage";

export default function SubscriptionPage() {
  return (
    <PlaceholderPage
      section="Settings"
      title="Subscription"
      description="Your current Sahla plan, next billing date, and a one-click portal to update payment or cancel."
      bullets={[
        "Current tier and price",
        "Next billing date and most recent invoice",
        "Manage card, address, and tax details via Stripe",
      ]}
    />
  );
}
