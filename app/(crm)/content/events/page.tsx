import ContentListClient from "../_components/ContentListClient";

export const metadata = {
  title: "Events · Mosque CRM",
};

export default function EventsPage() {
  return <ContentListClient kind="event" />;
}
