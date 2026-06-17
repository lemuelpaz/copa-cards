"use client";
import { useEffect, useState } from "react";

interface Pack {
  id: string; name: string; badge: string; icon: string;
  cards: number; price: number;
  wCommon: number; wRare: number; wEpic: number; wLegendary: number;
  cssClass: string;
}

const RARITIES = [
  { key: "wCommon",    label: "Comum",    color: "#9ca3af" },
  { key: "wRare",      label: "Rara",     color: "#60a5fa" },
  { key: "wEpic",      label: "Épica",    color: "#c084fc" },
  { key: "wLegendary", label: "Lendária", color: "#ffd700" },
] as const;

const PACK_COLOR: Record<string, string> = {
  "t-bronze":    "#cd7f32",
  "t-gold":      "#ffd700",
  "t-legendary": "#a855f7",
};

export default function AdminPacksPage() {
  const [packs,  setPacks]  = useState<Pack[]>([]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [msg,    setMsg]    = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/admin/packs").then(r => r.json()).then(d => {
      if (d.packs) setPacks(d.packs);
    });
  }, []);

  function update(id: string, field: string, value: number) {
    setPacks(ps => ps.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

  async function save(pack: Pack) {
    setSaving(s => ({ ...s, [pack.id]: true }));
    setMsg(m => ({ ...m, [pack.id]: "" }));
    const r = await fetch("/api/admin/packs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: pack.id, price: pack.price, cards: pack.cards,
        wCommon: pack.wCommon, wRare: pack.wRare,
        wEpic: pack.wEpic, wLegendary: pack.wLegendary,
      }),
    });
    const d = await r.json();
    setMsg(m => ({ ...m, [pack.id]: r.ok ? "✅ Salvo!" : (d.error ?? "Erro") }));
    setSaving(s => ({ ...s, [pack.id]: false }));
    setTimeout(() => setMsg(m => ({ ...m, [pack.id]: "" })), 3000);
  }

  return (
    <>
      <style>{`
        .packs-page {
          padding: 40px;
          max-width: 1100px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .packs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          justify-items: stretch;
        }
        .pack-input {
          width: 100%;
          background: #111a11;
          border-radius: 8px;
          padding: 8px 10px;
          color: #fff;
          font-size: 13px;
          outline: none;
          box-sizing: border-box;
        }
        @media (max-width: 1024px) {
          .packs-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .packs-page {
            padding: 20px 16px;
          }
          .packs-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="packs-page">
        <div className="bebas" style={{ fontSize: 32, letterSpacing: 4, marginBottom: 4 }}>Pacotes</div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginBottom: 36 }}>
          Configure preço, quantidade de figurinhas e probabilidade de cada raridade por pacote
        </p>

        <div className="packs-grid">
          {packs.map(pack => {
            const color = PACK_COLOR[pack.cssClass] ?? "#00e676";
            const total = pack.wCommon + pack.wRare + pack.wEpic + pack.wLegendary || 1;

            return (
              <div key={pack.id} style={{
                background: "#0b130b", border: `1px solid ${color}55`,
                borderRadius: 20, padding: "24px 20px",
                display: "flex", flexDirection: "column",
              }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <span style={{ fontSize: 32 }}>{pack.icon}</span>
                  <div>
                    <div className="bebas" style={{ fontSize: 22, letterSpacing: 3, color, lineHeight: 1 }}>
                      {pack.name}
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 3,
                      textTransform: "uppercase", marginTop: 2 }}>
                      {pack.badge}
                    </div>
                  </div>
                </div>

                {/* Price + cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
                  {[
                    { field: "price", label: "Preço (R$)", step: "0.5", min: "1" },
                    { field: "cards", label: "Figurinhas", step: "1",   min: "1" },
                  ].map(f => (
                    <div key={f.field}>
                      <label style={{ fontSize: 9, color: "rgba(255,255,255,.35)", letterSpacing: 2,
                        textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                        {f.label}
                      </label>
                      <input
                        type="number" step={f.step} min={f.min}
                        value={(pack as any)[f.field]}
                        onChange={e => update(pack.id, f.field,
                          f.field === "price" ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 1)}
                        className="pack-input"
                        style={{ border: `1px solid ${color}33` }}
                      />
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", marginBottom: 20 }} />

                {/* Probability label */}
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", letterSpacing: 2,
                  textTransform: "uppercase", marginBottom: 16 }}>
                  Probabilidade por raridade
                </div>

                {/* Sliders */}
                <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 20, flex: 1 }}>
                  {RARITIES.map(({ key, label, color: rc }) => {
                    const w   = (pack as any)[key] as number;
                    const pct = ((w / total) * 100).toFixed(1);
                    return (
                      <div key={key}>
                        <div style={{ display: "flex", justifyContent: "space-between",
                          alignItems: "center", marginBottom: 7 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <div style={{ width: 9, height: 9, borderRadius: "50%", background: rc,
                              boxShadow: `0 0 6px ${rc}88`, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,.75)" }}>{label}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,.25)",
                              fontFamily: "monospace", minWidth: 24, textAlign: "right" }}>
                              {w}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: rc,
                              minWidth: 48, textAlign: "right" }}>
                              {pct}%
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ position: "relative", height: 6, borderRadius: 3,
                          background: "rgba(255,255,255,.06)", marginBottom: 6 }}>
                          <div style={{
                            position: "absolute", left: 0, top: 0, height: "100%",
                            width: `${pct}%`, borderRadius: 3,
                            background: `linear-gradient(90deg, ${rc}66, ${rc})`,
                            transition: "width .15s",
                          }} />
                        </div>

                        <input
                          type="range" min="0" max="100" value={w}
                          onChange={e => update(pack.id, key, parseInt(e.target.value))}
                          style={{ width: "100%", accentColor: rc, cursor: "pointer",
                            height: 4, opacity: 0.85, display: "block" }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Total weight */}
                <div style={{ padding: "8px 14px", borderRadius: 10, marginBottom: 16,
                  background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)",
                  display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>Soma dos pesos</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.6)" }}>{total}</span>
                </div>

                {msg[pack.id] && (
                  <p style={{ fontSize: 12, marginBottom: 10,
                    color: msg[pack.id].startsWith("✅") ? "#00e676" : "#ff5252" }}>
                    {msg[pack.id]}
                  </p>
                )}

                <button
                  onClick={() => save(pack)}
                  disabled={saving[pack.id]}
                  style={{
                    width: "100%", padding: "12px 0",
                    background: `linear-gradient(135deg, ${color}, ${color}99)`,
                    border: "none", borderRadius: 10,
                    fontFamily: "'Bebas Neue',cursive", fontSize: 16, letterSpacing: 3,
                    color: pack.cssClass === "t-gold" ? "#000" : "#fff",
                    cursor: saving[pack.id] ? "wait" : "pointer",
                    opacity: saving[pack.id] ? 0.6 : 1, transition: "opacity .2s",
                  }}
                >
                  {saving[pack.id] ? "Salvando..." : "Salvar Pacote"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
