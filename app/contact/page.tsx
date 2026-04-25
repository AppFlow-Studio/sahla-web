import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import DemoContent from "../demo/DemoContent";
import BottomBar from "../components/BottomBar";
import ContactContent from "./ContactContent";

export const metadata: Metadata = {
  title: "Contact — Sahla",
  description: "Get in touch with the Sahla team. We'd love to hear about your mosque and answer your questions.",
};

export default function ContactPage() {
  return (
    <div className="relative">
      <Navbar />
      <ContactContent />
      <DemoContent />
      <BottomBar />
    </div>
  );
}
