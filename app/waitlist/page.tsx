import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import WaitlistContent, { WaitlistExtras } from "./WaitlistContent";
import { BreadcrumbJsonLd } from "../components/JsonLd";

export const metadata: Metadata = {
  title: "Join the Waitlist",
  description:
    "Reserve your mosque's spot on the Sahla waitlist. We onboard new mosques in waves so each community gets the attention it deserves.",
};

export default function WaitlistPage() {
  return (
    <div className="relative">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://sahla.co/" },
          { name: "Waitlist", url: "https://sahla.co/waitlist" },
        ]}
      />
      <Navbar />
      <WaitlistContent asH1 />
      <WaitlistExtras />
      <BottomBar />
    </div>
  );
}
