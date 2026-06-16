"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const refCode      = searchParams.get("ref") ?? "";

  const [phone,   setPhone]   = useState("");
  const [name,    setName]    = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState<"phone"|"name">("phone");

  function maskPhone(v: string) {
    const d = v.replace(/\D/g,"").slice(0,11);
    if (d.length <= 2)  return d;
    if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  }

  async function handlePhone(e: React.FormEvent) {
    e.preventDefault();
    if (phone.replace(/\D/g,"").length < 10) { setError("Informe um número válido (DDD + número)"); return; }
    setStep("name"); setError("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/login", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ phone: phone.replace(/\D/g,""), name: name || undefined, refCode: refCode || undefined }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Erro ao entrar"); setLoading(false); return; }
    router.push(data.user.role === "admin" ? "/admin" : "/");
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    width:"100%", background:"rgba(255,255,255,.06)", border:"1px solid rgba(0,230,118,.2)",
    borderRadius:10, padding:"13px 16px", color:"#fff", fontSize:15, outline:"none",
    fontFamily:"Inter, sans-serif", transition:"border-color .2s",
  };

  return (
    <div className="login-root">
      {/* ── PAINEL ESQUERDO — imagem ── */}
      <div className="login-image-panel">
        <Image
          src="/images/banner-login.webp"
          alt="Copa 2026"
          fill
          priority
          style={{ objectFit:"cover", objectPosition:"center" }}
        />
        {/* overlay escuro suave para dar profundidade */}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(135deg, rgba(0,0,0,.45) 0%, rgba(6,12,6,.2) 100%)" }} />

        {/* logotipo flutuante sobre a imagem */}
        <div style={{ position:"absolute", bottom:40, left:40, right:40 }}>
          <div className="bebas" style={{
            fontSize:"clamp(48px,6vw,80px)", lineHeight:.9,
            background:"linear-gradient(140deg,#fff 0%,#a8ffcf 40%,#00e676 70%,#009944 100%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
            filter:"drop-shadow(0 0 40px rgba(0,230,118,.6))",
          }}>
            COPA<br/>2026
          </div>
          <p style={{ fontSize:12, color:"rgba(255,255,255,.5)", letterSpacing:4,
            textTransform:"uppercase", marginTop:10 }}>
            Colecione os Craques do Mundo
          </p>
        </div>
      </div>

      {/* ── PAINEL DIREITO — formulário ── */}
      <div className="login-form-panel">
        {/* grid de fundo */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none",
          backgroundImage:"repeating-linear-gradient(90deg,transparent,transparent 48px,rgba(0,230,118,.03) 48px,rgba(0,230,118,.03) 49px),repeating-linear-gradient(0deg,transparent,transparent 48px,rgba(0,230,118,.03) 48px,rgba(0,230,118,.03) 49px)",
        }} />

        <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:400 }}>

          {/* logo mobile (só aparece quando o painel esquerdo some) */}
          <div className="login-mobile-logo">
            <div className="bebas" style={{ fontSize:52, lineHeight:.9,
              background:"linear-gradient(140deg,#fff 0%,#a8ffcf 40%,#00e676 70%,#009944 100%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
              filter:"drop-shadow(0 0 24px rgba(0,230,118,.5))", marginBottom:6,
            }}>COPA 2026</div>
            <p style={{ fontSize:11, color:"rgba(255,255,255,.35)", letterSpacing:4, textTransform:"uppercase" }}>
              Colecione os Craques
            </p>
          </div>

          {refCode && (
            <div style={{ marginBottom:16, padding:"10px 16px", background:"rgba(0,230,118,.08)",
              border:"1px solid rgba(0,230,118,.25)", borderRadius:12, textAlign:"center" }}>
              <span style={{ fontSize:12, color:"#00e676" }}>
                🎯 Você foi convidado com o código <strong>{refCode}</strong>
              </span>
            </div>
          )}

          <div style={{ background:"rgba(11,19,11,.9)", backdropFilter:"blur(20px)",
            border:"1px solid rgba(0,230,118,.15)", borderRadius:20, padding:"32px 28px" }}>

            <h2 className="bebas" style={{ fontSize:28, letterSpacing:3, marginBottom:4,
              color:"rgba(255,255,255,.9)" }}>
              {step === "phone" ? "Acessar conta" : "Qual seu nome?"}
            </h2>
            <p style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginBottom:24, letterSpacing:.5 }}>
              {step === "phone" ? "Use seu número de celular para entrar" : "Opcional — pode pular"}
            </p>

            <form onSubmit={step === "phone" ? handlePhone : handleLogin}>
              {step === "phone" ? (
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:2,
                    textTransform:"uppercase", display:"block", marginBottom:8 }}>
                    Celular (WhatsApp)
                  </label>
                  <input type="tel" placeholder="(11) 99999-9999" value={phone}
                    onChange={e => setPhone(maskPhone(e.target.value))} style={inputStyle}
                    onFocus={e=>(e.target.style.borderColor="rgba(0,230,118,.6)")}
                    onBlur={e=>(e.target.style.borderColor="rgba(0,230,118,.2)")} />
                </div>
              ) : (
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:2,
                    textTransform:"uppercase", display:"block", marginBottom:8 }}>
                    Seu nome
                  </label>
                  <input type="text" placeholder="Ex: João Silva" value={name}
                    onChange={e => setName(e.target.value)} style={inputStyle}
                    onFocus={e=>(e.target.style.borderColor="rgba(0,230,118,.6)")}
                    onBlur={e=>(e.target.style.borderColor="rgba(0,230,118,.2)")} />
                  <p style={{ fontSize:11, color:"rgba(255,255,255,.25)", marginTop:6 }}>
                    Número: {phone}
                    <button type="button" onClick={()=>setStep("phone")}
                      style={{ marginLeft:8, color:"#00e676", background:"none", border:"none",
                        cursor:"pointer", fontSize:11 }}>
                      Alterar
                    </button>
                  </p>
                </div>
              )}

              {error && (
                <p style={{ fontSize:12, color:"#ff5252", marginBottom:12, padding:"8px 12px",
                  background:"rgba(255,82,82,.1)", borderRadius:8, border:"1px solid rgba(255,82,82,.2)" }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading} style={{
                width:"100%", padding:"14px",
                background:"linear-gradient(135deg,#00e676,#00b248)", border:"none", borderRadius:12,
                fontFamily:"'Bebas Neue',cursive", fontSize:18, letterSpacing:3, color:"#000",
                cursor:loading?"wait":"pointer", transition:"opacity .2s, transform .1s",
                opacity: loading ? .7 : 1 }}
                onMouseEnter={e=>{ if(!loading) e.currentTarget.style.transform="translateY(-1px)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform=""; }}>
                {loading ? "Entrando..." : step === "phone" ? "Continuar" : "Entrar"}
              </button>
            </form>
          </div>

          <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,.18)", marginTop:20 }}>
            Ao entrar, você concorda com os Termos de Uso.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
