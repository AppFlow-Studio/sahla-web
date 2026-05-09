import PlaceholderPage from "../../_components/PlaceholderPage";

export default function EventsPage() {
  return (
    <PlaceholderPage
      section="Content"
      title="Events"
      description="One-off events with RSVPs — fundraisers, dinners, eid prayers, community gatherings."
      bullets={[
        "Same wizard as Programs — Basics → Schedule → Capacity → Image → Review",
        "Per-event detail with attendee list and notifications",
        "Optional paid signup via Stripe Connect",
      ]}
    />
  );
}
