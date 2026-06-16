"use client";
import { useEffect, useState } from "react";

const fmt = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 });

export default function AdminUsers() {
  const [users, setUsers]   = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users").then(r=>r.json()).then(d=>setUsers(d.users??[]));
  }, []);

  const filtered = users.filter(u => (u.name??u.phone).toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search));

  return (
    <div style={{ padding:"40px" }}>
      <div className="bebas" style={{ fontSize:32, letterSpacing:4, marginBottom:4 }}>Usuários</div>
      <p style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginBottom:28 }}>{users.length} usuários cadastrados</p>

      <input type="text" placeholder="Buscar por nome ou telefone..." value={search}
        onChange={e=>setSearch(e.target.value)}
        style={{ width:"100%", maxWidth:400, background:"#0b130b", border:"1px solid rgba(0,230,118,.2)",
          borderRadius:12, padding:"12px 16px", color:"#fff", fontSize:14, outline:"none",
          fontFamily:"Inter,sans-serif", marginBottom:24 }}
        onFocus={e=>(e.target.style.borderColor="rgba(0,230,118,.5)")}
        onBlur={e=>(e.target.style.borderColor="rgba(0,230,118,.2)")} />

      <div style={{ background:"#0b130b", border:"1px solid rgba(0,230,118,.1)", borderRadius:16, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 100px", gap:0,
          padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,.06)",
          fontSize:10, color:"rgba(255,255,255,.35)", letterSpacing:2, textTransform:"uppercase" }}>
          <span>Usuário</span><span>Telefone</span><span>Saldo</span><span>Cadastro</span><span>Role</span>
        </div>
        {filtered.map((u,i) => (
          <div key={u.id} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 100px",
            padding:"14px 20px", borderBottom: i<filtered.length-1?"1px solid rgba(255,255,255,.04)":"none",
            alignItems:"center" }}>
            <span style={{ fontSize:13, color:"rgba(255,255,255,.85)", fontWeight:500 }}>{u.name ?? "—"}</span>
            <span style={{ fontSize:13, color:"rgba(255,255,255,.5)" }}>{u.phone}</span>
            <span className="bebas" style={{ fontSize:18, color:"#00e676" }}>{fmt(u.balance)}</span>
            <span style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>{new Date(u.createdAt).toLocaleDateString("pt-BR")}</span>
            <span style={{ fontSize:10, padding:"3px 10px", borderRadius:20, textAlign:"center",
              background: u.role==="admin"?"rgba(255,215,0,.15)":"rgba(0,230,118,.08)",
              color: u.role==="admin"?"#ffd700":"#00e676",
              border:`1px solid ${u.role==="admin"?"rgba(255,215,0,.3)":"rgba(0,230,118,.2)"}` }}>
              {u.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
