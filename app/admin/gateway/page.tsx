"use client";
import { useEffect, useState } from "react";
import { ExternalLink, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

interface GatewayConfig {
  veopag_client_id: string;
  veopag_client_secret: string;
  veopag_webhook_secret: string;
  veopag_environment: string;
  veopag_base_url: string;
}

export default function AdminGateway() {
  const [cfg,     setCfg]     = useState<GatewayConfig>({ veopag_client_id:"", veopag_client_secret:"", veopag_webhook_secret:"", veopag_environment:"sandbox", veopag_base_url:"https://api.veopag.com.br" });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg,     setMsg]     = useState("");
  const [testMsg, setTestMsg] = useState<{ok:boolean;text:string}|null>(null);
  const [showSec, setShowSec] = useState<Record<string,boolean>>({});

  useEffect(() => {
    fetch("/api/admin/gateway").then(r=>r.json()).then(d => { if(d.config) setCfg(d.config); });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg("");
    const r = await fetch("/api/admin/gateway", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(cfg) });
    const d = await r.json();
    setMsg(r.ok ? "✅ Configurações salvas!" : (d.error ?? "Erro"));
    setLoading(false);
    setTimeout(()=>setMsg(""),3000);
  }

  async function testConnection() {
    setTesting(true); setTestMsg(null);
    const r = await fetch("/api/admin/gateway", { method:"PUT" });
    const d = await r.json();
    setTestMsg({ ok: r.ok, text: d.message ?? d.error ?? "Erro desconhecido" });
    setTesting(false);
  }

  const inputStyle = { width:"100%", background:"#111a11", border:"1px solid rgba(0,230,118,.2)",
    borderRadius:10, padding:"11px 14px", color:"#fff", fontSize:14, outline:"none", fontFamily:"Inter,sans-serif" };

  const fields: { key: keyof GatewayConfig; label:string; placeholder:string; secret?:boolean; desc?:string }[] = [
    { key:"veopag_client_id",      label:"Client ID",       placeholder:"Seu Client ID do VeoPag",      desc:"Identificador único da sua conta" },
    { key:"veopag_client_secret",  label:"Client Secret",   placeholder:"Seu Client Secret",            secret:true, desc:"Chave secreta de autenticação" },
    { key:"veopag_webhook_secret", label:"Webhook Secret",  placeholder:"Chave do webhook",             secret:true, desc:"Usada para validar eventos recebidos" },
    { key:"veopag_base_url",       label:"URL Base da API", placeholder:"https://api.veopag.com.br",    desc:"URL base do ambiente selecionado" },
  ];

  return (
    <div style={{ padding:"40px", maxWidth:720 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:8 }}>
        <div>
          <div className="bebas" style={{ fontSize:32, letterSpacing:4 }}>Gateway VeoPag</div>
          <p style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginTop:2 }}>
            Configure as credenciais de integração com o VeoPag PIX
          </p>
        </div>
        <a href="https://veopag.readme.io/docs/introducao" target="_blank" rel="noopener noreferrer"
          style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"#00e676",
            textDecoration:"none", padding:"8px 14px", background:"rgba(0,230,118,.08)",
            border:"1px solid rgba(0,230,118,.25)", borderRadius:10, marginTop:4 }}>
          <ExternalLink size={13}/> Documentação
        </a>
      </div>

      {/* environment toggle */}
      <div style={{ display:"flex", gap:8, marginBottom:28, marginTop:24 }}>
        {["sandbox","production"].map(env => (
          <button key={env} onClick={()=>setCfg(c=>({...c, veopag_environment:env,
            veopag_base_url: env==="sandbox"?"https://sandbox.api.veopag.com.br":"https://api.veopag.com.br"}))}
            style={{ padding:"9px 24px", borderRadius:20, cursor:"pointer", fontSize:13, fontWeight:600,
              border: cfg.veopag_environment===env?"1px solid rgba(0,230,118,.5)":"1px solid rgba(255,255,255,.1)",
              background: cfg.veopag_environment===env ? (env==="production"?"rgba(0,230,118,.15)":"rgba(255,215,0,.1)") : "transparent",
              color: cfg.veopag_environment===env ? (env==="production"?"#00e676":"#ffd700") : "rgba(255,255,255,.4)",
              textTransform:"capitalize" }}>
            {env === "sandbox" ? "🧪 Sandbox" : "🚀 Produção"}
          </button>
        ))}
      </div>

      {cfg.veopag_environment === "production" && (
        <div style={{ background:"rgba(255,82,82,.1)", border:"1px solid rgba(255,82,82,.3)", borderRadius:12,
          padding:"12px 16px", marginBottom:20, display:"flex", gap:10, alignItems:"flex-start" }}>
          <span style={{ fontSize:18 }}>⚠️</span>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#ff5252" }}>Ambiente de Produção</div>
            <div style={{ fontSize:12, color:"rgba(255,82,82,.7)" }}>
              Transações reais serão processadas. Certifique-se de que as credenciais estão corretas.
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} style={{ background:"#0b130b", border:"1px solid rgba(0,230,118,.12)",
        borderRadius:20, padding:"28px 24px" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          {fields.map(f => (
            <div key={f.key}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <label style={{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:2, textTransform:"uppercase" }}>{f.label}</label>
                {f.desc && <span style={{ fontSize:10, color:"rgba(255,255,255,.25)" }}>{f.desc}</span>}
              </div>
              <div style={{ position:"relative" }}>
                <input type={f.secret&&!showSec[f.key]?"password":"text"}
                  placeholder={f.placeholder} value={cfg[f.key]}
                  onChange={e=>setCfg(c=>({...c,[f.key]:e.target.value}))}
                  style={{...inputStyle, paddingRight: f.secret?"44px":"14px"}}
                  onFocus={e=>(e.target.style.borderColor="rgba(0,230,118,.6)")}
                  onBlur={e=>(e.target.style.borderColor="rgba(0,230,118,.2)")} />
                {f.secret && (
                  <button type="button" onClick={()=>setShowSec(s=>({...s,[f.key]:!s[f.key]}))}
                    style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                      background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,.4)", display:"flex" }}>
                    {showSec[f.key] ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {msg && (
          <p style={{ fontSize:13, marginTop:16, color: msg.startsWith("✅")?"#00e676":"#ff5252" }}>{msg}</p>
        )}

        <div style={{ display:"flex", gap:10, marginTop:24 }}>
          <button type="button" onClick={testConnection} disabled={testing}
            style={{ flex:1, padding:"12px", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.12)",
              borderRadius:10, color:"rgba(255,255,255,.7)", fontSize:14, cursor: testing?"wait":"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {testing ? "Testando..." : "Testar Conexão"}
          </button>
          <button type="submit" disabled={loading}
            style={{ flex:2, padding:"12px", background:"linear-gradient(135deg,#00e676,#00b248)",
              border:"none", borderRadius:10, fontFamily:"'Bebas Neue',cursive", fontSize:17,
              letterSpacing:2, color:"#000", cursor: loading?"wait":"pointer", opacity: loading?.7:1 }}>
            {loading ? "Salvando..." : "Salvar Credenciais"}
          </button>
        </div>

        {testMsg && (
          <div style={{ marginTop:14, padding:"12px 16px", borderRadius:10, display:"flex", gap:10, alignItems:"center",
            background: testMsg.ok?"rgba(0,230,118,.1)":"rgba(255,82,82,.1)",
            border:`1px solid ${testMsg.ok?"rgba(0,230,118,.3)":"rgba(255,82,82,.3)"}` }}>
            {testMsg.ok ? <CheckCircle size={16} color="#00e676"/> : <XCircle size={16} color="#ff5252"/>}
            <span style={{ fontSize:13, color: testMsg.ok?"#00e676":"#ff5252" }}>{testMsg.text}</span>
          </div>
        )}
      </form>

      {/* Info cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:28 }}>
        {[
          { icon:"🔐", title:"Autenticação OAuth2", desc:"VeoPag usa OAuth2 com Client Credentials. O token é renovado automaticamente a cada requisição." },
          { icon:"📱", title:"PIX Instantâneo",     desc:"Depósitos via QR Code PIX com confirmação em tempo real via webhooks." },
          { icon:"💸", title:"PIX Out (Saques)",    desc:"Saques processados diretamente para a chave PIX do usuário." },
          { icon:"🔔", title:"Webhooks",            desc:"Receba notificações de pagamentos confirmados e saques processados em tempo real." },
        ].map(item => (
          <div key={item.title} style={{ background:"#0b130b", border:"1px solid rgba(255,255,255,.06)",
            borderRadius:14, padding:"16px 18px" }}>
            <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
              <span style={{ fontSize:22 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,.8)", marginBottom:4 }}>{item.title}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", lineHeight:1.5 }}>{item.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
