"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import PlayerCard, { CardData } from "@/components/PlayerCard";
import { Plus, Edit2, Trash2, X } from "lucide-react";

const rarities = ["common","rare","epic","legendary"];
const positions = ["GOL","LAT","ZAG","VOL","MEI","ATA"];
const fmt = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 });

const emptyForm = { name:"", country:"", flag:"🇧🇷", position:"ATA", rating:"85", rarity:"rare", value:"100", active:"true" };

export default function AdminCards() {
  const [cards,   setCards]   = useState<CardData[]>([]);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState<CardData | null>(null);
  const [form,    setForm]    = useState(emptyForm);
  const [preview, setPreview] = useState<string|null>(null);
  const [filter,  setFilter]  = useState("all");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => { loadCards(); }, []);

  async function loadCards() {
    const r = await fetch("/api/cards");
    const d = await r.json();
    setCards(d.cards ?? []);
  }

  function openCreate() { setEditing(null); setForm(emptyForm); setPreview(null); setModal(true); }
  function openEdit(c: CardData) {
    setEditing(c);
    setForm({ name:c.name, country:c.country, flag:c.flag, position:c.position,
      rating:String(c.rating), rarity:c.rarity, value:String(c.value), active:"true" });
    setPreview(c.photo ?? null);
    setModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg("");
    const fd = new FormData(formRef.current!);
    const url  = editing ? `/api/cards/${editing.id}` : "/api/cards";
    const meth = editing ? "PUT" : "POST";
    const r = await fetch(url, { method:meth, body:fd });
    const d = await r.json();
    if (!r.ok) { setMsg(d.error ?? "Erro"); setLoading(false); return; }
    await loadCards();
    setModal(false); setMsg("");
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este card?")) return;
    await fetch(`/api/cards/${id}`, { method:"DELETE" });
    loadCards();
  }

  const filtered = filter === "all" ? cards : cards.filter(c=>c.rarity===filter);

  const inputStyle = { width:"100%", background:"#111a11", border:"1px solid rgba(0,230,118,.2)",
    borderRadius:10, padding:"10px 12px", color:"#fff", fontSize:14, outline:"none", fontFamily:"Inter,sans-serif" };

  return (
    <div style={{ padding:"40px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
        <div>
          <div className="bebas" style={{ fontSize:32, letterSpacing:4 }}>Figurinhas</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginTop:2 }}>{cards.length} cards cadastrados</div>
        </div>
        <button onClick={openCreate} style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 22px",
          background:"linear-gradient(135deg,#00e676,#00b248)", border:"none", borderRadius:11,
          fontFamily:"'Bebas Neue',cursive", fontSize:16, letterSpacing:2, color:"#000", cursor:"pointer" }}>
          <Plus size={16}/> Novo Card
        </button>
      </div>

      {/* filter tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:28 }}>
        {["all",...rarities].map(r => (
          <button key={r} onClick={()=>setFilter(r)} style={{ padding:"7px 18px", borderRadius:20,
            border:`1px solid ${filter===r?"rgba(0,230,118,.5)":"rgba(255,255,255,.1)"}`,
            background: filter===r?"rgba(0,230,118,.1)":"transparent",
            color: filter===r?"#00e676":"rgba(255,255,255,.5)", fontSize:12, cursor:"pointer", transition:"all .15s",
            textTransform:"capitalize" }}>
            {r === "all" ? "Todos" : r}
          </button>
        ))}
      </div>

      {/* grid */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:14 }}>
        {filtered.map(card => (
          <div key={card.id} style={{ position:"relative" }}>
            <PlayerCard card={card} flipped size="sm" />
            <div style={{ position:"absolute", top:6, left:6, display:"flex", gap:4 }}>
              <button onClick={()=>openEdit(card)} style={{ background:"rgba(0,0,0,.7)", border:"none",
                borderRadius:6, padding:5, cursor:"pointer", color:"rgba(255,255,255,.7)", display:"flex" }}>
                <Edit2 size={12}/>
              </button>
              <button onClick={()=>handleDelete(card.id)} style={{ background:"rgba(255,82,82,.3)", border:"none",
                borderRadius:6, padding:5, cursor:"pointer", color:"#ff5252", display:"flex" }}>
                <Trash2 size={12}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(4,8,4,.96)", zIndex:900,
          display:"flex", alignItems:"center", justifyContent:"center", padding:24, overflowY:"auto" }}>
          <div style={{ background:"#0b130b", border:"1px solid rgba(0,230,118,.15)", borderRadius:20,
            padding:"32px 28px", width:"100%", maxWidth:520, position:"relative" }}>
            <button onClick={()=>setModal(false)} style={{ position:"absolute", top:16, right:16,
              background:"rgba(255,255,255,.08)", border:"none", borderRadius:8, padding:6,
              cursor:"pointer", color:"rgba(255,255,255,.6)", display:"flex" }}>
              <X size={18}/>
            </button>

            <div className="bebas" style={{ fontSize:26, letterSpacing:3, marginBottom:24 }}>
              {editing ? "Editar Card" : "Novo Card"}
            </div>

            <form ref={formRef} onSubmit={handleSave}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                {([
                  { n:"name",    l:"Nome",    p:"Ex: Vinicius Jr", type:"text" },
                  { n:"country", l:"País",    p:"Ex: Brasil",      type:"text" },
                  { n:"flag",    l:"Bandeira (emoji)", p:"🇧🇷",    type:"text" },
                  { n:"rating",  l:"Rating",  p:"85",              type:"number" },
                  { n:"value",   l:"Valor (R$)", p:"200",          type:"number" },
                ] as const).map(f => (
                  <div key={f.n} style={{ gridColumn: f.n==="name"?"1/-1":"auto" }}>
                    <label style={{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:2, textTransform:"uppercase", display:"block", marginBottom:6 }}>{f.l}</label>
                    <input name={f.n} type={f.type} placeholder={f.p}
                      value={(form as any)[f.n]} onChange={e=>setForm(prev=>({...prev,[f.n]:e.target.value}))}
                      required style={inputStyle}
                      onFocus={e=>(e.target.style.borderColor="rgba(0,230,118,.6)")}
                      onBlur={e=>(e.target.style.borderColor="rgba(0,230,118,.2)")} />
                  </div>
                ))}

                <div>
                  <label style={{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Posição</label>
                  <select name="position" value={form.position} onChange={e=>setForm(p=>({...p,position:e.target.value}))}
                    style={{...inputStyle, cursor:"pointer"}}>
                    {positions.map(p=><option key={p} value={p} style={{background:"#111a11"}}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Raridade</label>
                  <select name="rarity" value={form.rarity} onChange={e=>setForm(p=>({...p,rarity:e.target.value}))}
                    style={{...inputStyle, cursor:"pointer"}}>
                    {rarities.map(r=><option key={r} value={r} style={{background:"#111a11",textTransform:"capitalize"}}>{r}</option>)}
                  </select>
                </div>

                {editing && (
                  <div>
                    <label style={{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:2, textTransform:"uppercase", display:"block", marginBottom:6 }}>Status</label>
                    <select name="active" value={form.active} onChange={e=>setForm(p=>({...p,active:e.target.value}))}
                      style={{...inputStyle, cursor:"pointer"}}>
                      <option value="true" style={{background:"#111a11"}}>Ativo</option>
                      <option value="false" style={{background:"#111a11"}}>Inativo</option>
                    </select>
                  </div>
                )}
              </div>

              {/* photo upload */}
              <div style={{ marginTop:18 }}>
                <label style={{ fontSize:10, color:"rgba(255,255,255,.4)", letterSpacing:2, textTransform:"uppercase", display:"block", marginBottom:8 }}>Foto do Jogador</label>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  {preview && (
                    <div style={{ width:60, height:60, borderRadius:10, overflow:"hidden", border:"1px solid rgba(0,230,118,.2)", flexShrink:0, position:"relative" }}>
                      <Image src={preview} alt="preview" fill style={{objectFit:"cover"}} />
                    </div>
                  )}
                  <button type="button" onClick={()=>fileRef.current?.click()}
                    style={{ padding:"10px 18px", background:"rgba(0,230,118,.08)", border:"1px dashed rgba(0,230,118,.3)",
                      borderRadius:10, color:"#00e676", fontSize:12, cursor:"pointer", letterSpacing:1 }}>
                    {preview ? "Trocar foto" : "Adicionar foto"}
                  </button>
                  <input ref={fileRef} name="photo" type="file" accept="image/*" style={{display:"none"}}
                    onChange={e=>{
                      const f=e.target.files?.[0];
                      if(f) setPreview(URL.createObjectURL(f));
                    }} />
                </div>
              </div>

              {msg && <p style={{ color:"#ff5252", fontSize:12, marginTop:12 }}>{msg}</p>}

              <div style={{ display:"flex", gap:10, marginTop:24 }}>
                <button type="button" onClick={()=>setModal(false)} style={{ flex:1, padding:"12px",
                  background:"transparent", border:"1px solid rgba(255,255,255,.1)", borderRadius:10,
                  color:"rgba(255,255,255,.5)", fontSize:14, cursor:"pointer" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading} style={{ flex:2, padding:"12px",
                  background:"linear-gradient(135deg,#00e676,#00b248)", border:"none", borderRadius:10,
                  fontFamily:"'Bebas Neue',cursive", fontSize:17, letterSpacing:2, color:"#000",
                  cursor: loading?"wait":"pointer", opacity: loading?.7:1 }}>
                  {loading ? "Salvando..." : "Salvar Card"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
