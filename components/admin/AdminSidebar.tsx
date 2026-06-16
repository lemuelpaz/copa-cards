"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CreditCard, Image, DollarSign, Zap, Settings, Users, LogOut, Users2 } from "lucide-react";

const nav = [
  { href:"/admin",              label:"Dashboard",    icon:LayoutDashboard },
  { href:"/admin/cards",        label:"Figurinhas",   icon:CreditCard },
  { href:"/admin/banner",       label:"Banner",       icon:Image },
  { href:"/admin/financial",    label:"Financeiro",   icon:DollarSign },
  { href:"/admin/gateway",      label:"VeoPag",       icon:Zap },
  { href:"/admin/settings",     label:"Configurações",icon:Settings },
  { href:"/admin/users",        label:"Usuários",     icon:Users },
  { href:"/admin/affiliates",   label:"Afiliados",    icon:Users2 },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method:"POST" });
    router.push("/login");
  }

  return (
    <aside style={{ width:220, background:"#0b130b", borderRight:"1px solid rgba(0,230,118,.1)",
      minHeight:"100vh", display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ padding:"24px 20px", borderBottom:"1px solid rgba(0,230,118,.08)" }}>
        <div className="bebas" style={{ fontSize:24, color:"#00e676", letterSpacing:3, lineHeight:1 }}>COPA 2026</div>
        <div style={{ fontSize:9, color:"rgba(255,255,255,.3)", letterSpacing:3, marginTop:2, textTransform:"uppercase" }}>Painel Admin</div>
      </div>

      <nav style={{ flex:1, padding:"16px 10px" }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} style={{
              display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
              borderRadius:10, marginBottom:2, textDecoration:"none",
              background: active ? "rgba(0,230,118,.1)" : "transparent",
              color: active ? "#00e676" : "rgba(255,255,255,.5)",
              fontSize:13, fontWeight:500, transition:"all .15s",
            }}
            onMouseEnter={e=>{ if (!active) (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,.04)"; }}
            onMouseLeave={e=>{ if (!active) (e.currentTarget as HTMLElement).style.background="transparent"; }}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding:"16px 10px", borderTop:"1px solid rgba(0,230,118,.08)" }}>
        <button onClick={logout} style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
          padding:"10px 12px", borderRadius:10, background:"none", border:"none", cursor:"pointer",
          color:"rgba(255,255,255,.3)", fontSize:13, transition:"color .15s" }}
          onMouseEnter={e=>(e.currentTarget.style.color="rgba(255,82,82,.8)")}
          onMouseLeave={e=>(e.currentTarget.style.color="rgba(255,255,255,.3)")}>
          <LogOut size={16} /> Sair
        </button>
      </div>
    </aside>
  );
}
