import AdminSidebar from "./components/AdminSidebar";

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
  );
}
