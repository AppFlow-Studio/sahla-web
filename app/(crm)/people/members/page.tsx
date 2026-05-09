import PlaceholderPage from "../../_components/PlaceholderPage";

export default function MembersPage() {
  return (
    <PlaceholderPage
      section="People"
      title="Members"
      description="Everyone who has signed in to your mosque app — sortable, searchable, with masked emails."
      bullets={[
        "Sortable columns — name, last active, RSVP count",
        "Click email to reveal (masked by default for privacy)",
        "Filter by signup date or push-notification status",
      ]}
    />
  );
}
