"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

const fmt = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 });
interface User { balance:number; name:string|null; phone:string; role:string; }

const pixTypes = [
  { value:"cpf",    label:"CPF" },
  { value:"cnpj",   label:"CNPJ" },
  { value:"phone",  label:"Celular" },
  { value:"email",  label:"E-mail" },
  { value:"random", label:"Chave Aleatória" },
];

export default function WithdrawPage() {
  const router  = useRouter();
  const [user,    setUser]    = useState<User | null>(null);
  const [amount,  setAmount]  = useState("");
  const [pixKey,  setPixKey]  = useState("");
  const [pixType, setPixType] = useState("cpf");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(r=>r.json()).then(d => {
      if (!d.user) { router.push("/login"); return; }
      setUser(d.user);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/user/withdraw", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ amount: parseFloat(amount), pixKey, pixType }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    setSuccess(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  if (!user) return null;

  return (
    <>
      <Navbar balance={user.balance} role={user.role} userName={user.name??user.phone} />
      <main style={{ maxWidth:500, margin:"60px auto", padding:"0 24px", position:"relative", zIndex:1 }}>
        <button onClick={()=>router.back()} style={{ fontSize:12, color:"rgba(255,255,255,.4)", background:"none",
          border:"none", cursor:"pointer", letterSpacing:2, textTransform:"uppercase", marginBottom:24, display:"flex", alignItems:"center", gap:8 }}>
          ← Voltar
        </button>

        <div className="bebas" style={{ fontSize:36, letterSpacing:4, marginBottom:4 }}>Solicitar Saque</div>
        <p style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginBottom:32 }}>
          Saldo disponível: <strong style={{ color:"#00e676" }}>{fmt(user.balance)}</strong>
        </p>

        {success ? (
          <div style={{ background:"rgba(0,230,118,.1)", border:"1px solid rgba(0,230,118,.3)", borderRadius:16,
            padding:"32px", textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <div className="bebas" style={{ fontSize:24, color:"#00e676", letterSpacing:3 }}>Saque Solicitado!</div>
            <p style={{ fontSize:13, color:"rgba(255,255,255,.5)", marginTop:8 }}>
              Seu saque está sendo processado. Redirecionando...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background:"#0b130b", border:"1px solid rgba(0,230,118,.12)",
            borderRadius:20, padding:"28px 24px" }}>
            {[
              { id:"amount", label:"Valor do Saque (R$)", type:"number", placeholder:"Ex: 100", value:amount, onChange:(v:string)=>setAmount(v), min:"1" },
            ].map(field => (
              <div key={field.id} style={{ marginBottom:18 }}>
                <label style={{ fontSize:11, color:"rgba(255,255,255,.4)", letterSpacing:2, textTransform:"uppercase", display:"block", marginBottom:8 }}>
                  {field.label}
                </label>
                <input type={field.type} placeholder={field.placeholder} value={field.value}
                  onChange={e=>field.onChange(e.target.value)} min={field.min} required
                  style={{ width:"100%", background:"#111a11", border:"1px solid rgba(0,230,118,.2)",
                    borderRadius:10, padding:"12px 14px", color:"#fff", fontSize:15, outline:"none",
                    fontFamily:"Inter,sans-serif" }}
                  onFocus={e=>(e.target.style.borderColor="rgba(0,230,118,.6)")}
                  onBlur={e=>(e.target.style.borderColor="rgba(0,230,118,.2)")} />
              </div>
            ))}

            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,.4)", letterSpacing:2, textTransform:"uppercase", display:"block", marginBottom:8 }}>
                Tipo de Chave PIX
              </label>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {pixTypes.map(pt => (
                  <button key={pt.value} type="button" onClick={()=>setPixType(pt.value)}
                    style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${pixType===pt.value?"rgba(0,230,118,.6)":"rgba(255,255,255,.1)"}`,
                      background: pixType===pt.value?"rgba(0,230,118,.12)":"transparent",
                      color: pixType===pt.value?"#00e676":"rgba(255,255,255,.5)",
                      fontSize:12, cursor:"pointer", transition:"all .15s" }}>
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,.4)", letterSpacing:2, textTransform:"uppercase", display:"block", marginBottom:8 }}>
                Chave PIX
              </label>
              <input type="text" placeholder="Sua chave PIX" value={pixKey}
                onChange={e=>setPixKey(e.target.value)} required
                style={{ width:"100%", background:"#111a11", border:"1px solid rgba(0,230,118,.2)",
                  borderRadius:10, padding:"12px 14px", color:"#fff", fontSize:15, outline:"none",
                  fontFamily:"Inter,sans-serif" }}
                onFocus={e=>(e.target.style.borderColor="rgba(0,230,118,.6)")}
                onBlur={e=>(e.target.style.borderColor="rgba(0,230,118,.2)")} />
            </div>

            {error && (
              <p style={{ color:"#ff5252", fontSize:13, marginBottom:16, padding:"10px 14px",
                background:"rgba(255,82,82,.1)", borderRadius:8 }}>{error}</p>
            )}

            <button type="submit" disabled={loading}
              style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#00e676,#00b248)",
                border:"none", borderRadius:12, fontFamily:"'Bebas Neue',cursive", fontSize:18,
                letterSpacing:3, color:"#000", cursor: loading?"wait":"pointer", opacity: loading?.7:1 }}>
              {loading ? "Enviando..." : "Confirmar Saque"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
