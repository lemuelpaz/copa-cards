"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";

export default function AdminBanner() {
  const [form, setForm] = useState({ banner_title:"", banner_subtitle:"", banner_eyebrow:"" });
  const [preview, setPreview] = useState<string|null>(null);
  const [currentImg, setCurrentImg] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch("/api/admin/banner").then(r=>r.json()).then(d => {
      if (d.configs) {
        setForm({ banner_title: d.configs.banner_title||"", banner_subtitle: d.configs.banner_subtitle||"", banner_eyebrow: d.configs.banner_eyebrow||"" });
        setCurrentImg(d.configs.banner_image || null);
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg("");
    const fd = new FormData(formRef.current!);
    const r = await fetch("/api/admin/banner", { method:"POST", body:fd });
    const d = await r.json();
    setMsg(r.ok ? "✅ Banner atualizado!" : (d.error ?? "Erro"));
    setLoading(false);
    setTimeout(()=>setMsg(""), 3000);
  }

  const inputStyle = { width:"100%", background:"#111a11", border:"1px solid rgba(0,230,118,.2)",
    borderRadius:10, padding:"12px 14px", color:"#fff", fontSize:15, outline:"none", fontFamily:"Inter,sans-serif" };

  return (
    <div style={{ padding:"40px" }}>
      <div className="bebas" style={{ fontSize:32, letterSpacing:4, marginBottom:4 }}>Banner do Site</div>
      <p style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginBottom:36 }}>
        Configure os textos e imagem exibidos no topo do site
      </p>

      {/* PREVIEW */}
      <div style={{ marginBottom:36, borderRadius:16, overflow:"hidden", border:"1px solid rgba(0,230,118,.15)" }}>
        <div style={{ height:160, position:"relative", background:"linear-gradient(135deg,#060c06,#0c1c0c,#060c06)",
          display:"flex", alignItems:"center", padding:"0 48px",
          backgroundImage:"repeating-linear-gradient(90deg,transparent,transparent 48px,rgba(0,230,118,.025) 48px,rgba(0,230,118,.025) 49px)" }}>
          {(preview || currentImg) && (
            <div style={{ position:"absolute", inset:0 }}>
              <Image src={preview ?? currentImg!} alt="banner" fill style={{ objectFit:"cover", opacity:.3 }} />
            </div>
          )}
          <div style={{ position:"relative", zIndex:1 }}>
            <div style={{ fontSize:9, letterSpacing:6, color:"#00e676", marginBottom:4 }}>{form.banner_eyebrow || "Preview"}</div>
            <div className="bebas" style={{ fontSize:64, lineHeight:.9,
              background:"linear-gradient(140deg,#fff,#a8ffcf,#00e676)", WebkitBackgroundClip:"text",
              WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              {form.banner_title || "COPA 2026"}
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", letterSpacing:3, marginTop:10, textTransform:"uppercase" }}>
              {form.banner_subtitle || "Subtítulo aqui"}
            </div>
          </div>
          <div style={{ position:"absolute", right:40, top:"50%", transform:"translateY(-50%)",
            fontSize:90, opacity:.12, animation:"floatY 5s ease-in-out infinite" }}>🏆</div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSave} style={{ background:"#0b130b",
        border:"1px solid rgba(0,230,118,.12)", borderRadius:20, padding:"32px 28px" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          {([
            { n:"banner_eyebrow",  l:"Texto Pequeno (Eyebrow)", p:"iGaming • Edição Especial" },
            { n:"banner_title",    l:"Título Principal",        p:"COPA 2026" },
            { n:"banner_subtitle", l:"Subtítulo",               p:"Colecione os Craques do Mundo" },
          ] as const).map(f => (
            <div key={f.n}>
              <label style={{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:2, textTransform:"uppercase", display:"block", marginBottom:8 }}>{f.l}</label>
              <input name={f.n} type="text" placeholder={f.p}
                value={(form as any)[f.n]} onChange={e=>setForm(p=>({...p,[f.n]:e.target.value}))}
                style={inputStyle}
                onFocus={e=>(e.target.style.borderColor="rgba(0,230,118,.6)")}
                onBlur={e=>(e.target.style.borderColor="rgba(0,230,118,.2)")} />
            </div>
          ))}

          <div>
            <label style={{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:2, textTransform:"uppercase", display:"block", marginBottom:8 }}>
              Imagem de Fundo
            </label>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              {(preview || currentImg) && (
                <div style={{ width:80, height:50, borderRadius:8, overflow:"hidden", border:"1px solid rgba(0,230,118,.2)", position:"relative", flexShrink:0 }}>
                  <Image src={preview ?? currentImg!} alt="bg" fill style={{objectFit:"cover"}} />
                </div>
              )}
              <button type="button" onClick={()=>fileRef.current?.click()}
                style={{ padding:"10px 18px", background:"rgba(0,230,118,.08)", border:"1px dashed rgba(0,230,118,.3)",
                  borderRadius:10, color:"#00e676", fontSize:12, cursor:"pointer", letterSpacing:1 }}>
                {(preview||currentImg) ? "Trocar imagem" : "Adicionar imagem"}
              </button>
              <input ref={fileRef} name="banner_image" type="file" accept="image/*" style={{display:"none"}}
                onChange={e=>{ const f=e.target.files?.[0]; if(f) setPreview(URL.createObjectURL(f)); }} />
            </div>
          </div>
        </div>

        {msg && <p style={{ fontSize:13, marginTop:16, color: msg.startsWith("✅")?"#00e676":"#ff5252" }}>{msg}</p>}

        <button type="submit" disabled={loading} style={{ marginTop:24, padding:"13px 40px",
          background:"linear-gradient(135deg,#00e676,#00b248)", border:"none", borderRadius:12,
          fontFamily:"'Bebas Neue',cursive", fontSize:17, letterSpacing:2, color:"#000",
          cursor: loading?"wait":"pointer", opacity: loading?.7:1 }}>
          {loading ? "Salvando..." : "Salvar Banner"}
        </button>
      </form>
    </div>
  );
}
