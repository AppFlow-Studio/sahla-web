import { Toaster } from "sonner";
import AdminSidebar, { SidebarProvider } from "./components/AdminSidebar";
import SmoothScroll from "./components/SmoothScroll";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-sidebar-bg">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-sand p-8">{children}</main>
    </div>
    <SidebarProvider>
      <div className="flex h-screen bg-[#fffbf2]">
        <SmoothScroll />
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
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
