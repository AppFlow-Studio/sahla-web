import PlaceholderPage from "../../_components/PlaceholderPage";

export default function TeamPage() {
  return (
    <PlaceholderPage
      section="Settings"
      title="Team"
      description="Add other admins from your mosque board so they can co-manage the CRM."
      bullets={[
        "Invite team members by email",
        "Roles: Owner, Admin, Editor, Viewer",
        "Activity log per teammate",
      ]}
    />
  );
}
