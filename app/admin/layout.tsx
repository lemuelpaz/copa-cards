import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      <AdminSidebar />
      <div style={{ flex:1, overflow:"auto", position:"relative", zIndex:1 }}>
        {children}
      </div>
    </div>
  );
}
