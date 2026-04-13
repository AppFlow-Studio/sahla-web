import { Toaster } from "sonner";
import AdminSidebar, { SidebarProvider } from "./components/AdminSidebar";
import PageTransition from "@/app/components/PageTransition";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-[#fffbf2]">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <Toaster
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.06)",
              color: "#0D0D12",
            },
          }}
        />
      </div>
    </SidebarProvider>
  );
}
