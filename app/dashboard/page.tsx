"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const fmt = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 });

interface User        { id:string; name:string|null; phone:string; role:string; balance:number; createdAt:string; }
interface Transaction { id:string; type:string; amount:number; detail:string|null; createdAt:string; }
interface Withdrawal  { id:string; amount:number; pixKey:string; pixType:string; status:string; createdAt:string; }
interface Affiliate   { id:string; code:string; percent:number; status:string; totalEarned:number; createdAt:string; }

const typeLabel:   Record<string,string> = {
  pack_open:"Pacote Aberto", deposit:"Depósito", withdrawal:"Saque",
  refund:"Estorno", bonus:"Bônus", affiliate_commission:"Comissão Afiliado",
};
const statusColor: Record<string,string> = { pending:"#ffd700", approved:"#00e676", rejected:"#ff5252" };
const statusLabel: Record<string,string> = { pending:"Pendente", approved:"Aprovado", rejected:"Rejeitado" };
const affColor:    Record<string,string> = { pending:"#ffd700", active:"#00e676", paused:"#ff5252" };
const affLabel:    Record<string,string> = { pending:"Aguardando aprovação", active:"Ativo", paused:"Pausado" };

export default function DashboardPage() {
  const router = useRouter();
  const [user,         setUser]     = useState<User | null>(null);
  const [transactions, setTxs]     = useState<Transaction[]>([]);
  const [withdrawals,  setWds]     = useState<Withdrawal[]>([]);
  const [affiliate,    setAffiliate]= useState<Affiliate | null>(null);
  const [refCount,     setRefCount] = useState(0);
  const [affLoading,   setAffLoading] = useState(false);
  const [affMsg,       setAffMsg]   = useState("");
  const [copied,       setCopied]   = useState(false);
  const [tab, setTab]               = useState<"transactions"|"withdrawals"|"affiliate">("transactions");

  useEffect(() => {
    fetch("/api/auth/me").then(r=>r.json()).then(d => {
      if (!d.user) { router.push("/login"); return; }
      setUser(d.user);
    });
    fetch("/api/user/transactions").then(r=>r.json()).then(d => setTxs(d.transactions ?? [])).catch(()=>{});
    fetch("/api/user/withdraw").then(r=>r.json()).then(d => setWds(d.withdrawals ?? [])).catch(()=>{});
    fetch("/api/user/affiliate").then(r=>r.json()).then(d => {
      if (d.affiliate) { setAffiliate(d.affiliate); setRefCount(d.referralCount ?? 0); }
    }).catch(()=>{});
  }, [router]);

  if (!user) return null;

  const stats = [
    { label:"Saldo Atual",     value: fmt(user.balance), icon:"💰", color:"#00e676" },
    { label:"Saques Aprovados",value: withdrawals.filter(w=>w.status==="approved").length, icon:"🏦", color:"#64b5f6" },
    { label:"Pacotes Abertos", value: transactions.filter(t=>t.type==="pack_open").length, icon:"📦", color:"#ce93d8" },
  ];

  const refLink = typeof window !== "undefined" && affiliate
    ? `${window.location.origin}/login?ref=${affiliate.code}`
    : "";

  async function handleRequestAffiliate() {
    setAffLoading(true); setAffMsg("");
    const res  = await fetch("/api/user/affiliate", { method:"POST" });
    const data = await res.json();
    if (!res.ok) { setAffMsg(data.error ?? "Erro"); setAffLoading(false); return; }
    setAffiliate(data.affiliate);
    setAffMsg("Solicitação enviada! Aguarde a aprovação do administrador.");
    setAffLoading(false);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(refLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const tabs = [
    { key:"transactions", label:"Histórico" },
    { key:"withdrawals",  label:"Saques"   },
    { key:"affiliate",    label:"Afiliado" },
  ] as const;

  return (
    <>
      <Navbar balance={user.balance} role={user.role} userName={user.name??user.phone} />
      <main className="dash-main" style={{ maxWidth:960, margin:"0 auto", position:"relative", zIndex:1 }}>

        {/* header */}
        <div className="dash-header">
          <div>
            <div className="bebas" style={{ fontSize:32, letterSpacing:4, color:"rgba(255,255,255,.9)" }}>
              Meu Dashboard
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.35)", letterSpacing:1, marginTop:2 }}>
              {user.name ?? user.phone} • Desde {new Date(user.createdAt).toLocaleDateString("pt-BR")}
            </div>
          </div>
          <div style={{ display:"flex", gap:10, flexShrink:0 }}>
            <Link href="/dashboard/deposit" style={{
              padding:"11px 20px", background:"linear-gradient(135deg,#00e676,#00b248)", borderRadius:12,
              fontFamily:"'Bebas Neue',cursive", fontSize:16, letterSpacing:2, color:"#000",
              textDecoration:"none", display:"inline-block",
            }}>Depositar</Link>
            <Link href="/dashboard/withdraw" style={{
              padding:"11px 20px", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)", borderRadius:12,
              fontFamily:"'Bebas Neue',cursive", fontSize:16, letterSpacing:2, color:"rgba(255,255,255,.7)",
              textDecoration:"none", display:"inline-block",
            }}>Sacar</Link>
          </div>
        </div>

        {/* stats */}
        <div className="dash-stats">
          {stats.map(s => (
            <div key={s.label} className="dash-stat">
              <div className="dash-stat-top">
                <span className="dash-stat-label">{s.label}</span>
                <span className="dash-stat-icon">{s.icon}</span>
              </div>
              <div className="bebas dash-stat-val" style={{ color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:20, background:"#0b130b",
          border:"1px solid rgba(0,230,118,.1)", borderRadius:12, padding:4 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)} style={{
              flex:1, padding:"10px", border:"none", borderRadius:9, cursor:"pointer",
              background: tab===t.key ? "rgba(0,230,118,.15)" : "transparent",
              color: tab===t.key ? "#00e676" : "rgba(255,255,255,.4)",
              fontFamily:"'Bebas Neue',cursive", fontSize:15, letterSpacing:2, transition:"all .15s",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── HISTÓRICO ── */}
        {tab === "transactions" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {transactions.length === 0 && (
              <div style={{ textAlign:"center", padding:"40px", color:"rgba(255,255,255,.25)", fontSize:14 }}>
                Nenhuma transação ainda
              </div>
            )}
            {transactions.map(tx => (
              <div key={tx.id} className="dash-tx-row">
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,.85)", marginBottom:2 }}>
                    {typeLabel[tx.type] ?? tx.type}
                  </div>
                  <div className="dash-tx-detail">
                    {tx.detail} • {new Date(tx.createdAt).toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="dash-tx-amount" style={{ color: tx.amount>=0 ? "#00e676" : "#ff5252" }}>
                  {tx.amount>=0?"+":""}{fmt(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── SAQUES ── */}
        {tab === "withdrawals" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {withdrawals.length === 0 && (
              <div style={{ textAlign:"center", padding:"40px", color:"rgba(255,255,255,.25)", fontSize:14 }}>
                Nenhum saque solicitado
              </div>
            )}
            {withdrawals.map(w => (
              <div key={w.id} className="dash-tx-row">
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,.85)", marginBottom:2 }}>
                    PIX — {w.pixKey}
                  </div>
                  <div className="dash-tx-detail">
                    {w.pixType.toUpperCase()} • {new Date(w.createdAt).toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="dash-wd-right">
                  <span style={{ fontSize:11, padding:"3px 8px", borderRadius:20, whiteSpace:"nowrap",
                    background:`${statusColor[w.status]}22`, color:statusColor[w.status],
                    border:`1px solid ${statusColor[w.status]}44` }}>
                    {statusLabel[w.status]}
                  </span>
                  <div className="dash-tx-amount" style={{ color:"#64b5f6" }}>{fmt(w.amount)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── AFILIADO ── */}
        {tab === "affiliate" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Sem solicitação */}
            {!affiliate && (
              <div style={{ background:"#0b130b", border:"1px solid rgba(0,230,118,.12)", borderRadius:20, padding:"32px 24px" }}>
                <div style={{ textAlign:"center", marginBottom:28 }}>
                  <div style={{ fontSize:52, marginBottom:12 }}>🤝</div>
                  <div className="bebas" style={{ fontSize:26, letterSpacing:3, color:"#fff", marginBottom:6 }}>
                    Programa de Afiliados
                  </div>
                  <p style={{ fontSize:13, color:"rgba(255,255,255,.45)", lineHeight:1.6 }}>
                    Indique amigos e ganhe comissão toda vez que eles abrirem pacotes.
                  </p>
                </div>

                {/* Benefícios */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:28 }}>
                  {[
                    { icon:"💸", title:"Comissão por pacote", desc:"Ganhe % de cada pacote aberto pelos seus indicados" },
                    { icon:"🔗", title:"Link exclusivo",       desc:"Link personalizado para compartilhar nas redes sociais" },
                    { icon:"📊", title:"Acompanhe em tempo real", desc:"Veja seus ganhos e indicados no dashboard" },
                    { icon:"💰", title:"Saque automático",    desc:"Comissões caem direto no seu saldo" },
                  ].map(b => (
                    <div key={b.title} style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, padding:"14px 14px" }}>
                      <div style={{ fontSize:22, marginBottom:6 }}>{b.icon}</div>
                      <div style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,.8)", marginBottom:3 }}>{b.title}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", lineHeight:1.4 }}>{b.desc}</div>
                    </div>
                  ))}
                </div>

                {affMsg && (
                  <p style={{ fontSize:13, color:"#00e676", padding:"10px 14px",
                    background:"rgba(0,230,118,.08)", borderRadius:8, marginBottom:16, textAlign:"center" }}>
                    {affMsg}
                  </p>
                )}

                <button onClick={handleRequestAffiliate} disabled={affLoading} style={{
                  width:"100%", padding:"15px", background:"linear-gradient(135deg,#00e676,#00b248)",
                  border:"none", borderRadius:12, fontFamily:"'Bebas Neue',cursive",
                  fontSize:18, letterSpacing:3, color:"#000",
                  cursor: affLoading ? "wait" : "pointer", opacity: affLoading ? .7 : 1,
                }}>
                  {affLoading ? "Enviando..." : "Solicitar ser Afiliado"}
                </button>
              </div>
            )}

            {/* Pendente */}
            {affiliate?.status === "pending" && (
              <div style={{ background:"#0b130b", border:"1px solid rgba(255,215,0,.2)", borderRadius:20, padding:"32px 24px", textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:14 }}>⏳</div>
                <div className="bebas" style={{ fontSize:24, letterSpacing:3, color:"#ffd700", marginBottom:8 }}>
                  Solicitação em Análise
                </div>
                <p style={{ fontSize:13, color:"rgba(255,255,255,.45)", lineHeight:1.6 }}>
                  Sua solicitação foi recebida. O administrador irá revisar e configurar seu percentual em breve.
                </p>
              </div>
            )}

            {/* Ativo ou Pausado */}
            {affiliate && affiliate.status !== "pending" && (
              <>
                {/* Status badge */}
                <div style={{
                  background:"#0b130b", border:`1px solid ${affColor[affiliate.status]}33`,
                  borderRadius:16, padding:"18px 20px",
                  display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
                }}>
                  <div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Status</div>
                    <div className="bebas" style={{ fontSize:22, color: affColor[affiliate.status] }}>
                      {affLabel[affiliate.status]}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Comissão</div>
                    <div className="bebas" style={{ fontSize:28, color:"#00e676" }}>{affiliate.percent}%</div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                  {[
                    { label:"Indicados",     value: refCount,                      icon:"👥", color:"#64b5f6" },
                    { label:"Total Ganho",   value: fmt(affiliate.totalEarned),    icon:"💸", color:"#00e676" },
                    { label:"Código",        value: affiliate.code,                icon:"🎯", color:"#ffd700" },
                  ].map(s => (
                    <div key={s.label} style={{ background:"#0b130b", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, padding:"14px 12px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <span style={{ fontSize:9, color:"rgba(255,255,255,.35)", letterSpacing:1, textTransform:"uppercase" }}>{s.label}</span>
                        <span style={{ fontSize:16 }}>{s.icon}</span>
                      </div>
                      <div className="bebas" style={{ fontSize:18, color:s.color, wordBreak:"break-all" }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Link de indicação */}
                {affiliate.status === "active" && (
                  <div style={{ background:"#0b130b", border:"1px solid rgba(0,230,118,.15)", borderRadius:16, padding:"20px" }}>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", letterSpacing:2, textTransform:"uppercase", marginBottom:10 }}>
                      Seu link de indicação
                    </div>
                    <div style={{ background:"#111a11", border:"1px solid rgba(0,230,118,.15)", borderRadius:10,
                      padding:"10px 14px", fontSize:12, color:"rgba(255,255,255,.55)", wordBreak:"break-all",
                      fontFamily:"monospace", marginBottom:10 }}>
                      {refLink}
                    </div>
                    <button onClick={handleCopyLink} style={{
                      width:"100%", padding:"12px",
                      background: copied ? "rgba(0,230,118,.2)" : "rgba(0,230,118,.08)",
                      border:`1px solid ${copied ? "rgba(0,230,118,.5)" : "rgba(0,230,118,.2)"}`,
                      borderRadius:10, color: copied ? "#00e676" : "rgba(255,255,255,.6)",
                      fontSize:13, cursor:"pointer", letterSpacing:1, fontFamily:"Inter,sans-serif",
                      transition:"all .2s",
                    }}>
                      {copied ? "✓ Link copiado!" : "📋 Copiar link"}
                    </button>
                  </div>
                )}

                {affiliate.status === "paused" && (
                  <div style={{ padding:"14px 18px", background:"rgba(255,82,82,.08)", border:"1px solid rgba(255,82,82,.2)", borderRadius:12, textAlign:"center" }}>
                    <span style={{ fontSize:13, color:"rgba(255,82,82,.8)" }}>
                      Sua conta de afiliado está pausada. Entre em contato com o suporte.
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </main>
    </>
  );
}
