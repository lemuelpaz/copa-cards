"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const fmt = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 });

interface Props { balance?: number; role?: string; userName?: string; }

export default function Navbar({ balance, role, userName }: Props) {
  const router  = useRouter();
  const [open,    setOpen]    = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dropRef  = useRef<HTMLDivElement>(null);

  function toggleMusic() {
    if (!audioRef.current) {
      audioRef.current      = new Audio("/music/pais-do-futebol.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.35;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  }

  useEffect(() => {
    function close(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method:"POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="copa-nav" style={{ background:"#0b130b", borderBottom:"1px solid rgba(0,230,118,.12)",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      position:"sticky", top:0, zIndex:100 }}>

      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <span className="bebas" style={{ fontSize:22, color:"#00e676", letterSpacing:3 }}>COPA 2026</span>
        {role === "admin" && (
          <span style={{ fontSize:10, background:"rgba(255,215,0,.15)", color:"#ffd700",
            border:"1px solid rgba(255,215,0,.3)", padding:"2px 10px", borderRadius:20, letterSpacing:2 }}>
            ADMIN
          </span>
        )}
      </div>

      {/* Direita */}
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>

        {/* Saldo — sempre visível */}
        {balance !== undefined && (
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.35)", letterSpacing:2, textTransform:"uppercase" }}>Saldo</div>
            <div className="bebas" style={{ fontSize:20, color:"#00e676", textShadow:"0 0 20px rgba(0,230,118,.3)", lineHeight:1 }}>
              {fmt(balance)}
            </div>
          </div>
        )}

        {/* Links visíveis só no desktop */}
        <div className="nav-desktop-links">
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

        {/* Botão de música */}
        <button onClick={toggleMusic} aria-label={playing ? "Pausar música" : "Tocar música"} style={{
          width:36, height:36, borderRadius:"50%", flexShrink:0,
          background: playing ? "rgba(0,230,118,.15)" : "transparent",
          border: `1px solid ${playing ? "rgba(0,230,118,.4)" : "rgba(255,255,255,.12)"}`,
          color: playing ? "#00e676" : "rgba(255,255,255,.35)",
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          transition:"all .2s" }}>
          {playing ? (
            /* Volume com ondas */
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          ) : (
            /* Volume com traço (mudo) */
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          )}
        </button>

        {/* Botão Depositar */}
        <button onClick={() => router.push("/dashboard/deposit")} style={{
          padding:"7px 14px", background:"linear-gradient(135deg,#00e676,#00b248)",
          border:"none", borderRadius:8, fontFamily:"'Bebas Neue',cursive",
          fontSize:14, letterSpacing:2, color:"#000", cursor:"pointer", whiteSpace:"nowrap" }}>
          Depositar
        </button>

        {/* Ícone de usuário com dropdown */}
        <div ref={dropRef} style={{ position:"relative" }}>
          <button onClick={() => setOpen(v => !v)} aria-label="Menu do usuário" style={{
            width:36, height:36, borderRadius:"50%", flexShrink:0,
            background: open ? "rgba(0,230,118,.2)" : "rgba(0,230,118,.08)",
            border:"1px solid rgba(0,230,118,.3)", color:"#00e676",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            transition:"background .15s" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>

          {open && (
            <div style={{ position:"absolute", right:0, top:"calc(100% + 8px)", minWidth:190,
              background:"#0b130b", border:"1px solid rgba(0,230,118,.18)", borderRadius:12,
              boxShadow:"0 8px 32px rgba(0,0,0,.6)", overflow:"hidden", zIndex:200 }}>

              {/* Nome do usuário */}
              {userName && (
                <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,.06)",
                  fontSize:12, color:"rgba(255,255,255,.45)",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {userName}
                </div>
              )}

              <DropItem label="Dashboard" onClick={() => { router.push("/dashboard"); setOpen(false); }} />
              {role === "admin" && (
                <DropItem label="Admin" color="#ffd700" onClick={() => { router.push("/admin"); setOpen(false); }} />
              )}
              <DropItem label="Sair" color="rgba(255,100,100,.85)" onClick={() => { logout(); setOpen(false); }} />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function DropItem({ label, color = "#fff", onClick }: { label: string; color?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width:"100%", padding:"12px 16px", background:"none", border:"none",
      borderBottom:"1px solid rgba(255,255,255,.04)", textAlign:"left",
      color, fontSize:13, cursor:"pointer", transition:"background .12s" }}
      onMouseEnter={e=>(e.currentTarget.style.background="rgba(0,230,118,.07)")}
      onMouseLeave={e=>(e.currentTarget.style.background="none")}>
      {label}
    </button>
  );
}
