import { getSession } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // Página de login: renderiza sem sidebar
  if (session?.role !== "admin") {
    return <>{children}</>;
  }

  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      <AdminSidebar />
      <div style={{ flex:1, overflow:"auto", position:"relative", zIndex:1 }}>
        {children}
      </div>
    </div>
  );
}
