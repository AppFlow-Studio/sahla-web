import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import BottomBar from "../components/BottomBar";
import WaitlistContent, { WaitlistExtras } from "./WaitlistContent";

export const metadata: Metadata = {
  title: "Join the Waitlist — Sahla",
  description:
    "Reserve your mosque's spot on the Sahla waitlist. We onboard new mosques in waves so each community gets the attention it deserves.",
};

export default function WaitlistPage() {
  return (
    <div className="relative">
      <Navbar />
      <WaitlistContent />
      <WaitlistExtras />
      <BottomBar />
    </div>
  );
}
