"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import PlayerCard, { CardData } from "@/components/PlayerCard";
import PackOpenModal from "@/components/PackOpenModal";
import SlotMachineModal from "@/components/SlotMachineModal";

const fmt = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 });

interface Pack { id:string; name:string; badge:string; icon:string; cards:number; price:number; cssClass:string; }
interface User  { id:string; name:string|null; phone:string; role:string; balance:number; }

const packColors: Record<string,{shadow:string}> = {
  "t-bronze":    { shadow:"rgba(205,127,50,.25)" },
  "t-silver":    { shadow:"rgba(150,150,200,.2)" },
  "t-gold":      { shadow:"rgba(255,215,0,.25)"  },
  "t-legendary": { shadow:"rgba(180,0,255,.25)"  },
  "t-slot":      { shadow:"rgba(255,215,0,.35)"  },
};

const packImages: Record<string, string> = {
  "t-bronze":    "/packs/pack-basico.webp",
  "t-silver":    "/packs/pack-basico.webp",
  "t-gold":      "/packs/pack-raro.webp",
  "t-legendary": "/packs/pack-lendario.webp",
};

export default function HomePage() {
  const router  = useRouter();
  const [user,   setUser]   = useState<User | null>(null);
  const [packs,  setPacks]  = useState<Pack[]>([]);
  const [cards,  setCards]  = useState<CardData[]>([]);
  const [banner, setBanner] = useState({ title:"COPA 2026", subtitle:"Colecione os Craques do Mundo", eyebrow:"iGaming • Edição Especial • 2026" });
  const [activePack, setActivePack] = useState<Pack | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r=>r.json()).then(d => {
      if (!d.user) { router.push("/login"); return; }
      setUser(d.user);
    });
    fetch("/api/packs").then(r=>r.json()).then(d => setPacks(d.packs ?? []));
    fetch("/api/cards").then(r=>r.json()).then(d => setCards(d.cards ?? []));
    fetch("/api/admin/banner").then(r=>r.json()).then(d => {
      if (d.configs) setBanner({ title: d.configs.banner_title||"COPA 2026", subtitle: d.configs.banner_subtitle||"Colecione os Craques do Mundo", eyebrow: d.configs.banner_eyebrow||"" });
    }).catch(()=>{});
  }, [router]);

  if (!user) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="bebas" style={{ fontSize:32, color:"#00e676", letterSpacing:4 }}>Carregando...</div>
    </div>
  );

  const rarityOrder = ["legendary","epic","rare","common"];
  const byRarity = rarityOrder.map(r => ({ rarity:r, items: cards.filter(c=>c.rarity===r) })).filter(g=>g.items.length>0);

  return (
    <>
      <Navbar balance={user.balance} role={user.role} userName={user.name??user.phone} />

      {/* BANNER */}
      <header style={{ position:"relative", borderBottom:"1px solid rgba(0,230,118,.15)", overflow:"hidden" }}>
        <div className="banner-inner" style={{ position:"relative", overflow:"hidden" }}>
          {/* imagem de fundo */}
          <div style={{ position:"absolute", inset:0, zIndex:0 }}>
            <Image
              src="/images/banner-login.webp"
              alt="Copa 2026 Banner"
              fill
              priority
              sizes="100vw"
              style={{ objectFit:"cover", objectPosition:"center 30%" }}
            />
            <div style={{ position:"absolute", inset:0,
              background:"linear-gradient(90deg, rgba(6,12,6,.92) 0%, rgba(6,12,6,.7) 50%, rgba(6,12,6,.4) 100%)" }} />
          </div>

          {/* conteúdo sobre a imagem */}
          <div style={{ position:"relative", zIndex:2, display:"flex", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:7, color:"#00e676", textTransform:"uppercase", fontWeight:700, marginBottom:6 }}>
                {banner.eyebrow}
              </div>
              <div className="bebas banner-title" style={{
                background:"linear-gradient(140deg,#fff 0%,#a8ffcf 40%,#00e676 70%,#009944 100%)",
                WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
                filter:"drop-shadow(0 0 40px rgba(0,230,118,.5))" }}>
                {banner.title}
              </div>
              <div style={{ marginTop:14, fontSize:12, color:"rgba(255,255,255,.5)", letterSpacing:4, textTransform:"uppercase" }}>
                {banner.subtitle}
              </div>
            </div>
          </div>
        </div>

        {/* balance bar */}
        <div className="balance-bar" style={{ background:"#0b130b", borderTop:"1px solid rgba(0,230,118,.08)",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div>
              <div style={{ fontSize:10, letterSpacing:3, color:"rgba(255,255,255,.35)", textTransform:"uppercase" }}>Saldo Virtual</div>
              <div className="bebas" style={{ fontSize:34, color:"#00e676", textShadow:"0 0 24px rgba(0,230,118,.35)" }}>
                {fmt(user.balance)}
              </div>
            </div>
          </div>
          <button onClick={()=>router.push("/dashboard/withdraw")} style={{ padding:"10px 24px",
            background:"rgba(0,230,118,.1)", border:"1px solid rgba(0,230,118,.3)", borderRadius:10,
            color:"#00e676", fontFamily:"'Bebas Neue',cursive", fontSize:16, letterSpacing:2, cursor:"pointer" }}>
            Sacar
          </button>
        </div>
      </header>

      <main className="page-main" style={{ maxWidth:1280, margin:"0 auto", position:"relative", zIndex:1 }}>
        {/* PACK SHOP */}
        <div style={{ marginBottom:60 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:32 }}>
            <div>
              <div className="bebas" style={{ fontSize:28, letterSpacing:5, color:"rgba(255,255,255,.9)" }}>Loja de Pacotes</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.35)", marginTop:4 }}>Escolha seu pacote e descubra suas figurinhas</div>
            </div>
            <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(0,230,118,.3),transparent)" }} />
          </div>

          <div className="packs-grid">
            {packs.map(pack => {
              const ps  = packColors[pack.cssClass] ?? packColors["t-bronze"];

              /* ── Card especial: Slot de Jogadores ── */
              if (pack.cssClass === "t-slot") {
                return (
                  <div key={pack.id}
                    style={{
                      borderRadius:20, overflow:"hidden", cursor:"pointer",
                      background:"linear-gradient(160deg,#0c1e3a,#06101f)",
                      border:"1px solid rgba(255,215,0,.35)",
                      display:"flex", flexDirection:"column",
                      transition:"transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .35s",
                    }}
                    onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-8px) scale(1.02)"; e.currentTarget.style.boxShadow="0 20px 60px rgba(255,215,0,.3)"; }}
                    onMouseLeave={e=>{ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>

                    {/* Imagem de referência do slot */}
                    <div style={{ position:"relative", width:"100%", aspectRatio:"747 / 1347" }}>
                      <Image
                        src="/packs/pack-slot.png"
                        alt={pack.name}
                        fill
                        sizes="(max-width:768px) 50vw, 25vw"
                        style={{ objectFit:"contain" }}
                      />
                    </div>

                    {/* Info abaixo */}
                    <div style={{ padding:"14px 16px 16px", display:"flex", flexDirection:"column", gap:10 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{
                          fontSize:9, fontWeight:800, letterSpacing:3, textTransform:"uppercase",
                          padding:"3px 10px", borderRadius:20, whiteSpace:"nowrap",
                          background:"rgba(255,215,0,.12)", color:"#ffd700", border:"1px solid rgba(255,215,0,.35)",
                        }}>
                          {pack.badge}
                        </span>
                        <span className="bebas" style={{ fontSize:17, letterSpacing:2, color:"#fff" }}>
                          {pack.name}
                        </span>
                      </div>

                      <div style={{ fontSize:10, color:"rgba(255,255,255,.35)", letterSpacing:1 }}>
                        3 jogadores Brasil = 2× aposta
                      </div>

                      <button onClick={()=>setActivePack(pack)}
                        style={{
                          width:"100%", padding:"12px 8px", border:"none", borderRadius:10,
                          fontFamily:"'Bebas Neue',cursive", fontSize:17, letterSpacing:2, cursor:"pointer",
                          transition:"opacity .2s",
                          background:"linear-gradient(135deg,#ffd700,#ff8c00)",
                          color:"#000",
                          boxShadow:"0 0 20px rgba(255,215,0,.25)",
                        }}
                        onMouseEnter={e=>(e.currentTarget.style.opacity=".85")}
                        onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
                        Girar — {fmt(pack.price)}
                      </button>
                    </div>
                  </div>
                );
              }

              /* ── Cards padrão ── */
              const img = packImages[pack.cssClass] ?? "/packs/pack-basico.webp";
              const accentColor =
                pack.cssClass==="t-legendary" ? "#cf6fff" :
                pack.cssClass==="t-gold"      ? "#ffd700" :
                pack.cssClass==="t-silver"    ? "#b8b8e8" : "#cd7f32";
              const accentBg =
                pack.cssClass==="t-legendary" ? "rgba(180,0,255,.18)" :
                pack.cssClass==="t-gold"      ? "rgba(255,215,0,.15)"  :
                pack.cssClass==="t-silver"    ? "rgba(150,150,200,.15)":"rgba(205,127,50,.15)";

              return (
                <div key={pack.id}
                  style={{
                    borderRadius:20, overflow:"hidden", cursor:"pointer",
                    background:"#0b130b",
                    border:`1px solid ${accentColor}33`,
                    display:"flex", flexDirection:"column",
                    transition:"transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .35s",
                  }}
                  onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-8px) scale(1.02)"; e.currentTarget.style.boxShadow=`0 20px 60px ${ps.shadow.replace(".25",".5")}`; }}
                  onMouseLeave={e=>{ e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}>

                  {/* imagem completa sem corte */}
                  <div style={{ position:"relative", width:"100%", aspectRatio:"747 / 1347" }}>
                    <Image
                      src={img}
                      alt={pack.name}
                      fill
                      sizes="(max-width:768px) 50vw, 25vw"
                      style={{ objectFit:"contain" }}
                    />
                  </div>

                  {/* info abaixo da imagem */}
                  <div style={{ padding:"14px 16px 16px", display:"flex", flexDirection:"column", gap:10 }}>
                    {/* badge + nome */}
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{
                        fontSize:9, fontWeight:800, letterSpacing:3, textTransform:"uppercase",
                        padding:"3px 10px", borderRadius:20, whiteSpace:"nowrap",
                        background:accentBg, color:accentColor, border:`1px solid ${accentColor}55`,
                      }}>
                        {pack.badge}
                      </span>
                      <span className="bebas" style={{ fontSize:17, letterSpacing:2, color:"#fff" }}>
                        {pack.name}
                      </span>
                    </div>

                    <div style={{ fontSize:10, color:"rgba(255,255,255,.35)", letterSpacing:1 }}>
                      {pack.cards} figurinha{pack.cards>1?"s":""} por pacote
                    </div>

                    <button onClick={()=>setActivePack(pack)}
                      className={`btn-${pack.cssClass?.replace("t-","")}`}
                      style={{ width:"100%", padding:"12px 8px", border:"none", borderRadius:10,
                        fontFamily:"'Bebas Neue',cursive", fontSize:17, letterSpacing:2, cursor:"pointer",
                        transition:"opacity .2s" }}
                      onMouseEnter={e=>(e.currentTarget.style.opacity=".85")}
                      onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
                      Abrir — {fmt(pack.price)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CARD GALLERY */}
        {byRarity.map(group => (
          <div key={group.rarity} style={{ marginBottom:48 }}>
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24 }}>
              <div className="bebas" style={{ fontSize:22, letterSpacing:4, color:"rgba(255,255,255,.8)", textTransform:"capitalize" }}>
                {group.rarity === "legendary" ? "🌟 Lendários" : group.rarity === "epic" ? "💜 Épicos" : group.rarity === "rare" ? "🔵 Raros" : "⚪ Comuns"}
              </div>
              <div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(255,255,255,.1),transparent)" }} />
              <span style={{ fontSize:11, color:"rgba(255,255,255,.3)" }}>{group.items.length} cards</span>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:12, justifyContent:"center" }}>
              {group.items.map(card => <PlayerCard key={card.id} card={card} flipped size="sm" />)}
            </div>
          </div>
        ))}
      </main>

      {/* MODAIS */}
      {activePack && activePack.cssClass === "t-slot" && (
        <SlotMachineModal
          pack={activePack}
          onClose={() => setActivePack(null)}
          onResult={(bal) => setUser(u => u ? { ...u, balance:bal } : u)}
        />
      )}
      {activePack && activePack.cssClass !== "t-slot" && (
        <PackOpenModal
          pack={activePack}
          onClose={() => setActivePack(null)}
          onResult={(bal) => setUser(u => u ? { ...u, balance:bal } : u)}
        />
      )}
    </>
  );
}
