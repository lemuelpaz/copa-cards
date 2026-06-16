"use client";
import { useRouter } from "next/navigation";

const fmt = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 });

interface Props { balance?: number; role?: string; userName?: string; }

export default function Navbar({ balance, role, userName }: Props) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method:"POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav style={{ background:"#0b130b", borderBottom:"1px solid rgba(0,230,118,.12)",
      padding:"12px 40px", display:"flex", alignItems:"center", justifyContent:"space-between",
      position:"sticky", top:0, zIndex:100 }}>
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        <span className="bebas" style={{ fontSize:22, color:"#00e676", letterSpacing:3 }}>COPA 2026</span>
        {role === "admin" && (
          <span style={{ fontSize:10, background:"rgba(255,215,0,.15)", color:"#ffd700",
            border:"1px solid rgba(255,215,0,.3)", padding:"2px 10px", borderRadius:20, letterSpacing:2 }}>
            ADMIN
          </span>
        )}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:20 }}>
        {balance !== undefined && (
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.35)", letterSpacing:2, textTransform:"uppercase" }}>Saldo</div>
            <div className="bebas" style={{ fontSize:22, color:"#00e676", textShadow:"0 0 20px rgba(0,230,118,.35)" }}>
              {fmt(balance)}
            </div>
          </div>
        )}
        {userName && <span style={{ fontSize:13, color:"rgba(255,255,255,.55)" }}>{userName}</span>}
        <button onClick={() => router.push("/dashboard/deposit")} style={{
          padding:"7px 16px", background:"linear-gradient(135deg,#00e676,#00b248)",
          border:"none", borderRadius:8, fontFamily:"'Bebas Neue',cursive",
          fontSize:14, letterSpacing:2, color:"#000", cursor:"pointer" }}>
          Depositar
        </button>
        <button onClick={() => router.push("/dashboard")} style={{ fontSize:12, color:"rgba(255,255,255,.5)",
          background:"none", border:"none", cursor:"pointer", letterSpacing:1, textTransform:"uppercase" }}>
          Dashboard
        </button>
        {role === "admin" && (
          <button onClick={() => router.push("/admin")} style={{ fontSize:12, color:"#ffd700",
            background:"none", border:"none", cursor:"pointer", letterSpacing:1, textTransform:"uppercase" }}>
            Admin
          </button>
        )}
        <button onClick={logout} style={{ fontSize:12, color:"rgba(255,255,255,.35)",
          background:"none", border:"none", cursor:"pointer", letterSpacing:1, textTransform:"uppercase" }}>
          Sair
        </button>
      </div>
    </nav>
  );
}
