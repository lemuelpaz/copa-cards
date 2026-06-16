"use client";
import { useEffect, useState } from "react";

interface Config {
  win_rate: string; initial_balance: string; min_withdrawal: string;
  site_name: string; maintenance_mode: string;
}

export default function AdminSettings() {
  const [cfg,     setCfg]     = useState<Config>({ win_rate:"50", initial_balance:"1000", min_withdrawal:"50", site_name:"Copa 2026 iGaming", maintenance_mode:"false" });
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");

  useEffect(() => {
    fetch("/api/admin/settings").then(r=>r.json()).then(d => {
      if (d.configs) setCfg(c => ({ ...c, ...d.configs }));
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg("");
    const r = await fetch("/api/admin/settings", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(cfg) });
    const d = await r.json();
    setMsg(r.ok ? "✅ Configurações salvas!" : (d.error ?? "Erro"));
    setLoading(false);
    setTimeout(()=>setMsg(""),3000);
  }

  const winRate = parseInt(cfg.win_rate) || 50;
  const winColor = winRate < 30 ? "#ff5252" : winRate < 60 ? "#ffd700" : "#00e676";

  const inputStyle = { background:"#111a11", border:"1px solid rgba(0,230,118,.2)", borderRadius:10,
    padding:"11px 14px", color:"#fff", fontSize:14, outline:"none", fontFamily:"Inter,sans-serif" };

  return (
    <div style={{ padding:"40px", maxWidth:680 }}>
      <div className="bebas" style={{ fontSize:32, letterSpacing:4, marginBottom:4 }}>Configurações</div>
      <p style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginBottom:36 }}>
        Controle geral da plataforma
      </p>

      <form onSubmit={handleSave} style={{ display:"flex", flexDirection:"column", gap:24 }}>

        {/* WIN RATE - highlighted */}
        <div style={{ background:"#0b130b", border:`1px solid ${winColor}44`, borderRadius:20, padding:"28px 24px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <div>
              <div className="bebas" style={{ fontSize:22, letterSpacing:3, color:"rgba(255,255,255,.9)", marginBottom:4 }}>
                🎯 Controle de Ganhos
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.4)" }}>
                Define a probabilidade de cartas valiosas nos pacotes
              </div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div className="bebas" style={{ fontSize:48, color: winColor, lineHeight:1 }}>{winRate}%</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.3)", letterSpacing:1, textTransform:"uppercase" }}>Taxa de Acerto</div>
            </div>
          </div>

          <input type="range" min="0" max="100" value={winRate}
            onChange={e=>setCfg(c=>({...c,win_rate:e.target.value}))}
            style={{ width:"100%", accentColor: winColor, height:6, cursor:"pointer" }} />

          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:11, color:"rgba(255,255,255,.3)" }}>
            <span>0% — Casa sempre ganha</span>
            <span>50% — Balanceado</span>
            <span>100% — Usuário favorecido</span>
          </div>

          {/* descriptors */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:20 }}>
            {[
              { range:"0–29%",  label:"Conservador",  color:"#ff5252", desc:"Alto ganho para a casa. Cards raros quase impossíveis." },
              { range:"30–59%", label:"Balanceado",    color:"#ffd700", desc:"RTP equilibrado. Boa experiência com margem saudável." },
              { range:"60–100%",label:"Liberal",       color:"#00e676", desc:"Alta chance de cards valiosos. Menor margem para a casa." },
            ].map(item => (
              <div key={item.range} style={{ padding:"12px 14px", borderRadius:12,
                background: `${item.color}11`, border:`1px solid ${item.color}33` }}>
                <div style={{ fontSize:12, fontWeight:700, color:item.color, marginBottom:3 }}>{item.label}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,.35)", letterSpacing:.5 }}>{item.range}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", marginTop:6, lineHeight:1.4 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* OTHER SETTINGS */}
        <div style={{ background:"#0b130b", border:"1px solid rgba(0,230,118,.12)", borderRadius:20, padding:"28px 24px" }}>
          <div className="bebas" style={{ fontSize:20, letterSpacing:3, marginBottom:20 }}>Configurações Gerais</div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {([
              { key:"site_name",        label:"Nome do Site",          type:"text",   placeholder:"Copa 2026 iGaming" },
              { key:"initial_balance",  label:"Saldo Inicial (R$)",    type:"number", placeholder:"1000" },
              { key:"min_withdrawal",   label:"Saque Mínimo (R$)",     type:"number", placeholder:"50" },
            ] as const).map(f => (
              <div key={f.key} style={{ gridColumn: f.key==="site_name"?"1/-1":"auto" }}>
                <label style={{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:2, textTransform:"uppercase", display:"block", marginBottom:8 }}>
                  {f.label}
                </label>
                <input type={f.type} placeholder={f.placeholder} value={(cfg as any)[f.key]}
                  onChange={e=>setCfg(c=>({...c,[f.key]:e.target.value}))}
                  style={{...inputStyle, width:"100%"}}
                  onFocus={e=>(e.target.style.borderColor="rgba(0,230,118,.6)")}
                  onBlur={e=>(e.target.style.borderColor="rgba(0,230,118,.2)")} />
              </div>
            ))}
          </div>

          {/* maintenance mode */}
          <div style={{ marginTop:20, padding:"16px 18px", background:"rgba(255,255,255,.03)",
            border:"1px solid rgba(255,255,255,.08)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,.8)" }}>Modo Manutenção</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.35)", marginTop:2 }}>
                Exibe aviso de manutenção e bloqueia novos acessos
              </div>
            </div>
            <button type="button"
              onClick={()=>setCfg(c=>({...c,maintenance_mode:c.maintenance_mode==="true"?"false":"true"}))}
              style={{ width:52, height:28, borderRadius:14, cursor:"pointer", border:"none", position:"relative",
                background: cfg.maintenance_mode==="true"?"#ff5252":"rgba(255,255,255,.15)", transition:"background .2s" }}>
              <div style={{ width:20, height:20, borderRadius:10, background:"#fff", position:"absolute",
                top:4, transition:"left .2s", left: cfg.maintenance_mode==="true"?"28px":"4px" }} />
            </button>
          </div>
        </div>

        {msg && <p style={{ fontSize:13, color: msg.startsWith("✅")?"#00e676":"#ff5252" }}>{msg}</p>}

        <button type="submit" disabled={loading} style={{ padding:"14px 40px", alignSelf:"flex-start",
          background:"linear-gradient(135deg,#00e676,#00b248)", border:"none", borderRadius:12,
          fontFamily:"'Bebas Neue',cursive", fontSize:18, letterSpacing:3, color:"#000",
          cursor: loading?"wait":"pointer", opacity: loading?.7:1 }}>
          {loading ? "Salvando..." : "Salvar Configurações"}
        </button>
      </form>
    </div>
  );
}
