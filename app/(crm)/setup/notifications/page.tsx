import { Suspense } from "react";
import NotificationsClient from "./NotificationsClient";

export const metadata = {
  title: "Notifications · Mosque CRM",
};

export default function NotificationsPage() {
  return (
    <Suspense fallback={null}>
      <NotificationsClient />
    </Suspense>
  );
}
