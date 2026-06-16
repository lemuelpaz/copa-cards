"use client";
import { useEffect, useState } from "react";
import StatCard from "@/components/admin/StatCard";

const fmt = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 });
const statusColor: Record<string,string> = { pending:"#ffd700", approved:"#00e676", rejected:"#ff5252" };
const statusLabel: Record<string,string> = { pending:"Pendente", approved:"Aprovado", rejected:"Rejeitado" };

export default function AdminFinancial() {
  const [data, setData]             = useState<any>(null);
  const [withdrawals, setWDs]       = useState<any[]>([]);
  const [tab, setTab]               = useState<"transactions"|"withdrawals">("withdrawals");
  const [note, setNote]             = useState("");
  const [filter, setFilter]         = useState("all");

  useEffect(() => { load(); }, []);

  async function load() {
    const [td, wd] = await Promise.all([
      fetch("/api/admin/transactions").then(r=>r.json()),
      fetch("/api/admin/withdrawals").then(r=>r.json()),
    ]);
    setData(td);
    setWDs(wd.withdrawals ?? []);
  }

  async function updateWD(id: string, status: string) {
    await fetch("/api/admin/withdrawals", { method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id, status, note: note||undefined }) });
    setNote("");
    load();
  }

  const pendingWDs = withdrawals.filter(w=>w.status==="pending");
  const filteredWDs = filter==="all" ? withdrawals : withdrawals.filter(w=>w.status===filter);
  const typeLabel: Record<string,string> = { pack_open:"Pacote", deposit:"Depósito", withdrawal:"Saque", refund:"Estorno" };

  return (
    <div style={{ padding:"40px" }}>
      <div className="bebas" style={{ fontSize:32, letterSpacing:4, marginBottom:4 }}>Controle Financeiro</div>
      <p style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginBottom:32 }}>Transações e saques da plataforma</p>

      <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:36 }}>
        <StatCard label="Receita (Pack Opens)" value={fmt(data?.totalProfit??0)}    icon="📦" color="#00e676" />
        <StatCard label="Total Saques"         value={fmt(data?.totalWithdrawn??0)} icon="🏦" color="#64b5f6" />
        <StatCard label="Saques Pendentes"     value={pendingWDs.length}            icon="⏳" color="#ffd700" />
        <StatCard label="Total Usuários"       value={data?.userCount??0}           icon="👥" color="#ce93d8" />
      </div>

      {/* tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:24, background:"#0b130b",
        border:"1px solid rgba(0,230,118,.1)", borderRadius:12, padding:4, width:"fit-content" }}>
        {(["withdrawals","transactions"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"9px 24px", border:"none", borderRadius:9, cursor:"pointer",
            background: tab===t?"rgba(0,230,118,.15)":"transparent", color: tab===t?"#00e676":"rgba(255,255,255,.4)",
            fontFamily:"'Bebas Neue',cursive", fontSize:16, letterSpacing:2, transition:"all .15s" }}>
            {t==="withdrawals"?"Saques":"Transações"}
          </button>
        ))}
      </div>

      {/* WITHDRAWALS */}
      {tab === "withdrawals" && (
        <div>
          <div style={{ display:"flex", gap:8, marginBottom:20 }}>
            {["all","pending","approved","rejected"].map(f=>(
              <button key={f} onClick={()=>setFilter(f)} style={{ padding:"6px 16px", borderRadius:20,
                border:`1px solid ${filter===f?"rgba(0,230,118,.5)":"rgba(255,255,255,.1)"}`,
                background: filter===f?"rgba(0,230,118,.1)":"transparent",
                color: filter===f?"#00e676":"rgba(255,255,255,.4)", fontSize:12, cursor:"pointer",
                textTransform:"capitalize" }}>
                {f==="all"?"Todos":statusLabel[f]}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filteredWDs.map((w:any) => (
              <div key={w.id} style={{ background:"#0b130b", border:"1px solid rgba(255,255,255,.06)",
                borderRadius:14, padding:"16px 20px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: w.status==="pending"?12:0 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,.85)", marginBottom:3 }}>
                      {w.user?.name ?? w.user?.phone}
                    </div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,.35)" }}>
                      PIX {w.pixType.toUpperCase()}: {w.pixKey} • {new Date(w.createdAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <span style={{ fontSize:11, padding:"3px 10px", borderRadius:20,
                      background:`${statusColor[w.status]}22`, color:statusColor[w.status],
                      border:`1px solid ${statusColor[w.status]}44` }}>
                      {statusLabel[w.status]}
                    </span>
                    <span className="bebas" style={{ fontSize:24, color:"#64b5f6" }}>{fmt(w.amount)}</span>
                  </div>
                </div>
                {w.status === "pending" && (
                  <div style={{ display:"flex", gap:10, alignItems:"center", paddingTop:12,
                    borderTop:"1px solid rgba(255,255,255,.06)" }}>
                    <input type="text" placeholder="Nota (opcional)" value={note} onChange={e=>setNote(e.target.value)}
                      style={{ flex:1, background:"#111a11", border:"1px solid rgba(255,255,255,.1)", borderRadius:8,
                        padding:"8px 12px", color:"#fff", fontSize:12, outline:"none", fontFamily:"Inter,sans-serif" }} />
                    <button onClick={()=>updateWD(w.id,"approved")} style={{ padding:"8px 20px",
                      background:"rgba(0,230,118,.15)", border:"1px solid rgba(0,230,118,.4)", borderRadius:8,
                      color:"#00e676", fontSize:12, cursor:"pointer", fontWeight:600 }}>
                      Aprovar
                    </button>
                    <button onClick={()=>updateWD(w.id,"rejected")} style={{ padding:"8px 20px",
                      background:"rgba(255,82,82,.12)", border:"1px solid rgba(255,82,82,.35)", borderRadius:8,
                      color:"#ff5252", fontSize:12, cursor:"pointer", fontWeight:600 }}>
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRANSACTIONS */}
      {tab === "transactions" && (
        <div style={{ background:"#0b130b", border:"1px solid rgba(0,230,118,.1)", borderRadius:16, overflow:"hidden" }}>
          {(data?.transactions??[]).map((tx:any, i:number) => (
            <div key={tx.id} style={{ padding:"13px 20px", display:"flex", alignItems:"center", justifyContent:"space-between",
              borderBottom: i<(data.transactions.length-1)?"1px solid rgba(255,255,255,.04)":"none" }}>
              <div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,.8)", marginBottom:2 }}>
                  {tx.user?.name??tx.user?.phone} — {typeLabel[tx.type]??tx.type}
                </div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.3)" }}>
                  {tx.detail} • {new Date(tx.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>
              <span className="bebas" style={{ fontSize:20, color: tx.amount>=0?"#00e676":"#ff5252" }}>
                {tx.amount>=0?"+":""}{fmt(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
