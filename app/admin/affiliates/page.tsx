"use client";
import { useEffect, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";

const fmt = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 });

interface AffiliateRecord {
  id: string;
  code: string;
  percent: number;
  status: string;
  totalEarned: number;
  createdAt: string;
}
interface UserRow {
  id: string;
  phone: string;
  name: string | null;
  balance: number;
  createdAt: string;
  affiliate: AffiliateRecord | null;
  referralCount: number;
}

const statusColor: Record<string, string> = {
  pending: "#ffd700",
  active:  "#00e676",
  paused:  "#ff5252",
};
const statusLabel: Record<string, string> = {
  pending: "Pendente",
  active:  "Ativo",
  paused:  "Pausado",
};

export default function AdminAffiliatesPage() {
  const [users,    setUsers]   = useState<UserRow[]>([]);
  const [loading,  setLoading] = useState(true);
  const [busy,     setBusy]    = useState<Record<string, boolean>>({});
  const [percents, setPercents]= useState<Record<string, string>>({});
  const [search,   setSearch]  = useState("");
  const [filter,   setFilter]  = useState<"all"|"affiliate"|"pending"|"none">("all");
  const [msg,      setMsg]     = useState<{ type:"ok"|"err"; text:string }|null>(null);

  async function load() {
    setLoading(true);
    const res  = await fetch("/api/admin/affiliates");
    const data = await res.json();
    setUsers(data.users ?? []);
    // Pre-fill percent inputs with current values
    const p: Record<string,string> = {};
    (data.users ?? []).forEach((u: UserRow) => {
      if (u.affiliate) p[u.id] = String(u.affiliate.percent);
    });
    setPercents(p);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function doAction(userId: string, action: string, extra?: { percent?: number }) {
    setBusy(b => ({ ...b, [userId]: true }));
    setMsg(null);
    const res  = await fetch("/api/admin/affiliates", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ userId, action, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg({ type:"err", text: data.error ?? "Erro" }); }
    else         { setMsg({ type:"ok",  text: "Atualizado com sucesso" }); }
    setBusy(b => ({ ...b, [userId]: false }));
    load();
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.phone.includes(q) || (u.name ?? "").toLowerCase().includes(q);
    const matchFilter =
      filter === "all"       ? true :
      filter === "affiliate" ? !!u.affiliate && u.affiliate.status !== "pending" :
      filter === "pending"   ? u.affiliate?.status === "pending" :
      !u.affiliate;
    return matchSearch && matchFilter;
  });

  const totals = {
    total:     users.length,
    affiliate: users.filter(u => u.affiliate?.status === "active").length,
    pending:   users.filter(u => u.affiliate?.status === "pending").length,
    none:      users.filter(u => !u.affiliate).length,
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#060e06" }}>
      <AdminSidebar />
      <main style={{ flex:1, padding:"32px", overflowX:"auto" }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <h1 className="bebas" style={{ fontSize:36, letterSpacing:4, color:"rgba(255,255,255,.9)", marginBottom:4 }}>
            Gestão de Afiliados
          </h1>
          <p style={{ fontSize:12, color:"rgba(255,255,255,.35)" }}>
            Aprovar solicitações, ajustar comissões e gerenciar afiliados
          </p>
        </div>

        {/* Toast */}
        {msg && (
          <div style={{ marginBottom:16, padding:"12px 18px", borderRadius:10,
            background: msg.type==="ok" ? "rgba(0,230,118,.1)" : "rgba(255,82,82,.1)",
            border: `1px solid ${msg.type==="ok" ? "rgba(0,230,118,.3)" : "rgba(255,82,82,.3)"}`,
            color: msg.type==="ok" ? "#00e676" : "#ff5252", fontSize:13,
          }}>
            {msg.text}
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
          {[
            { label:"Total Usuários", value:totals.total,     color:"rgba(255,255,255,.7)" },
            { label:"Afiliados Ativos",value:totals.affiliate, color:"#00e676" },
            { label:"Aguardando",     value:totals.pending,   color:"#ffd700" },
            { label:"Sem afiliado",   value:totals.none,      color:"rgba(255,255,255,.35)" },
          ].map(s => (
            <div key={s.label} style={{ background:"#0b130b", border:"1px solid rgba(0,230,118,.08)", borderRadius:14, padding:"16px 18px" }}>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>{s.label}</div>
              <div className="bebas" style={{ fontSize:28, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
          <input
            type="text" placeholder="Buscar por nome ou telefone..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex:1, minWidth:200, background:"#0b130b", border:"1px solid rgba(0,230,118,.15)",
              borderRadius:10, padding:"9px 14px", color:"#fff", fontSize:13, outline:"none" }}
          />
          {(["all","affiliate","pending","none"] as const).map(f => (
            <button key={f} onClick={()=>setFilter(f)} style={{
              padding:"9px 16px", borderRadius:10, border:"none", cursor:"pointer", fontSize:12,
              background: filter===f ? "rgba(0,230,118,.15)" : "rgba(255,255,255,.05)",
              color:       filter===f ? "#00e676"            : "rgba(255,255,255,.45)",
            }}>
              {{ all:"Todos", affiliate:"Afiliados", pending:"Pendentes", none:"Sem afiliado" }[f]}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign:"center", padding:60, color:"rgba(255,255,255,.25)" }}>Carregando...</div>
        ) : (
          <div style={{ background:"#0b130b", border:"1px solid rgba(0,230,118,.08)", borderRadius:16, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid rgba(0,230,118,.08)" }}>
                  {["Usuário","Status","Código","Comissão","Indicados","Ganhos","Ações"].map(h => (
                    <th key={h} style={{ padding:"12px 16px", textAlign:"left",
                      fontSize:10, color:"rgba(255,255,255,.35)", letterSpacing:2, textTransform:"uppercase", fontWeight:500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding:"40px", textAlign:"center", color:"rgba(255,255,255,.2)", fontSize:13 }}>
                    Nenhum usuário encontrado
                  </td></tr>
                )}
                {filtered.map((u, i) => {
                  const isBusy = !!busy[u.id];
                  const pct    = percents[u.id] ?? (u.affiliate?.percent ?? 10).toString();

                  return (
                    <tr key={u.id} style={{ borderBottom: i < filtered.length-1 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
                      {/* Usuário */}
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,.8)" }}>
                          {u.name ?? "—"}
                        </div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:2 }}>{u.phone}</div>
                        <div style={{ fontSize:10, color:"rgba(255,255,255,.2)", marginTop:1 }}>
                          {fmt(u.balance)}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding:"12px 16px" }}>
                        {u.affiliate ? (
                          <span style={{
                            padding:"3px 10px", borderRadius:20, fontSize:11, whiteSpace:"nowrap",
                            background:`${statusColor[u.affiliate.status]}20`,
                            color: statusColor[u.affiliate.status],
                            border:`1px solid ${statusColor[u.affiliate.status]}40`,
                          }}>
                            {statusLabel[u.affiliate.status]}
                          </span>
                        ) : (
                          <span style={{ fontSize:11, color:"rgba(255,255,255,.2)" }}>Não é afiliado</span>
                        )}
                      </td>

                      {/* Código */}
                      <td style={{ padding:"12px 16px" }}>
                        {u.affiliate ? (
                          <span style={{ fontFamily:"monospace", fontSize:12, color:"#ffd700", letterSpacing:1 }}>
                            {u.affiliate.code}
                          </span>
                        ) : <span style={{ color:"rgba(255,255,255,.15)" }}>—</span>}
                      </td>

                      {/* Comissão — input editável */}
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <input
                            type="number" min={0} max={100} step={0.5}
                            value={pct}
                            onChange={e => setPercents(p => ({ ...p, [u.id]: e.target.value }))}
                            disabled={!u.affiliate || isBusy}
                            style={{ width:60, background:"#111a11", border:"1px solid rgba(0,230,118,.15)",
                              borderRadius:6, padding:"4px 8px", color:"#fff", fontSize:13, textAlign:"center",
                              outline:"none", opacity: u.affiliate ? 1 : 0.4 }}
                          />
                          <span style={{ fontSize:11, color:"rgba(255,255,255,.3)" }}>%</span>
                          {u.affiliate && (
                            <button onClick={() => doAction(u.id, "setPercent", { percent: parseFloat(pct) })}
                              disabled={isBusy} title="Salvar percentual"
                              style={{ padding:"4px 8px", background:"rgba(0,230,118,.1)", border:"1px solid rgba(0,230,118,.25)",
                                borderRadius:6, color:"#00e676", fontSize:11, cursor:"pointer" }}>
                              ✓
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Indicados */}
                      <td style={{ padding:"12px 16px", color:"rgba(255,255,255,.6)", fontSize:13 }}>
                        {u.affiliate ? u.referralCount : "—"}
                      </td>

                      {/* Ganhos */}
                      <td style={{ padding:"12px 16px" }}>
                        {u.affiliate ? (
                          <span style={{ fontSize:13, color:"#00e676" }}>{fmt(u.affiliate.totalEarned)}</span>
                        ) : <span style={{ color:"rgba(255,255,255,.15)" }}>—</span>}
                      </td>

                      {/* Ações */}
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {!u.affiliate && (
                            <ActionBtn label="Tornar Afiliado" color="#00e676"
                              onClick={() => doAction(u.id, "make", { percent: parseFloat(pct || "10") })}
                              disabled={isBusy} />
                          )}
                          {u.affiliate?.status === "pending" && (
                            <ActionBtn label="Aprovar" color="#00e676"
                              onClick={() => doAction(u.id, "approve", { percent: parseFloat(pct) })}
                              disabled={isBusy} />
                          )}
                          {u.affiliate?.status === "active" && (
                            <ActionBtn label="Pausar" color="#ffd700"
                              onClick={() => doAction(u.id, "pause")}
                              disabled={isBusy} />
                          )}
                          {u.affiliate?.status === "paused" && (
                            <ActionBtn label="Reativar" color="#00e676"
                              onClick={() => doAction(u.id, "activate")}
                              disabled={isBusy} />
                          )}
                          {u.affiliate && (
                            <ActionBtn label="Remover" color="#ff5252"
                              onClick={() => { if (confirm(`Remover afiliado de ${u.phone}?`)) doAction(u.id, "remove"); }}
                              disabled={isBusy} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function ActionBtn({ label, color, onClick, disabled }: { label:string; color:string; onClick:()=>void; disabled:boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:"5px 10px", borderRadius:8, border:`1px solid ${color}40`, cursor:"pointer", fontSize:11,
      background:`${color}10`, color, opacity: disabled ? .5 : 1, whiteSpace:"nowrap",
    }}>
      {label}
    </button>
  );
}
