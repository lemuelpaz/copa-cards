"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatCard from "@/components/admin/StatCard";

const fmt = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 });

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/auth/me").then(r=>r.json()).then(d => {
      if (!d.user || d.user.role !== "admin") router.push("/login");
    });
    fetch("/api/admin/transactions").then(r=>r.json()).then(setData).catch(()=>{});
    fetch("/api/admin/users").then(r=>r.json()).then(d=>setUsers(d.users??[])).catch(()=>{});
  }, [router]);

  const totalBalance = users.reduce((s,u)=>s+u.balance,0);
  const recent = data?.transactions?.slice(0,10) ?? [];
  const typeLabel: Record<string,string> = { pack_open:"Pacote", deposit:"Depósito", withdrawal:"Saque", refund:"Estorno" };

  return (
    <div style={{ padding:"40px 40px" }}>
      <div className="bebas" style={{ fontSize:32, letterSpacing:4, marginBottom:4 }}>Dashboard</div>
      <p style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginBottom:36 }}>Visão geral da plataforma</p>

      <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:40 }}>
        <StatCard label="Usuários"          value={data?.userCount ?? users.length}   icon="👥" color="#00e676" />
        <StatCard label="Receita Total"     value={fmt(data?.totalProfit??0)}          icon="💹" color="#00e676" />
        <StatCard label="Saques Realizados" value={fmt(data?.totalWithdrawn??0)}       icon="🏦" color="#64b5f6" />
        <StatCard label="Saldo Usuários"    value={fmt(totalBalance)}                  icon="💰" color="#ce93d8" />
      </div>

      <div className="bebas" style={{ fontSize:20, letterSpacing:3, marginBottom:16, color:"rgba(255,255,255,.8)" }}>
        Últimas Transações
      </div>
      <div style={{ background:"#0b130b", border:"1px solid rgba(0,230,118,.1)", borderRadius:16, overflow:"hidden" }}>
        {recent.length === 0 && (
          <div style={{ padding:"32px", textAlign:"center", color:"rgba(255,255,255,.25)", fontSize:13 }}>
            Nenhuma transação ainda
          </div>
        )}
        {recent.map((tx: any, i: number) => (
          <div key={tx.id} style={{ padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between",
            borderBottom: i<recent.length-1?"1px solid rgba(255,255,255,.04)":"none" }}>
            <div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.8)", marginBottom:2 }}>
                {tx.user?.name ?? tx.user?.phone} — {typeLabel[tx.type]??tx.type}
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.3)" }}>{tx.detail}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <span style={{ fontSize:10, color:"rgba(255,255,255,.3)" }}>
                {new Date(tx.createdAt).toLocaleString("pt-BR")}
              </span>
              <span className="bebas" style={{ fontSize:20, color: tx.amount>=0?"#00e676":"#ff5252" }}>
                {tx.amount>=0?"+":""}{fmt(tx.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
