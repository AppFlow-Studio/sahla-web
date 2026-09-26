import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import WaitlistContent from "../waitlist/WaitlistContent";
import BottomBar from "../components/BottomBar";
import ContactContent from "./ContactContent";
import { BreadcrumbJsonLd } from "../components/JsonLd";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Sahla team. We'd love to hear about your mosque and answer your questions.",
};

export default function ContactPage() {
  return (
    <div className="relative">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "https://sahla.co/" },
          { name: "Contact", url: "https://sahla.co/contact" },
        ]}
      />
      <Navbar />
      <ContactContent />
      <WaitlistContent />
      <BottomBar />
    </div>
  );
}
