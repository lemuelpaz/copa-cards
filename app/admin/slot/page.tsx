"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

const fmt = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminSlotPage() {
  const [bet,        setBet]        = useState<string>("100");
  const [multiplier, setMultiplier] = useState<string>("2");
  const [active,     setActive]     = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState("");
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    fetch("/api/admin/slot")
      .then(r => r.json())
      .then(d => {
        setBet(String(d.bet ?? 100));
        setMultiplier(String(d.multiplier ?? 2));
        setActive(d.active ?? true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    const r = await fetch("/api/admin/slot", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bet: parseFloat(bet), multiplier: parseFloat(multiplier), active }),
    });
    const d = await r.json();
    setMsg(r.ok ? "✅ Configurações salvas!" : (d.error ?? "Erro ao salvar"));
    setSaving(false);
    setTimeout(() => setMsg(""), 4000);
  }

  const betNum  = parseFloat(bet)  || 0;
  const multNum = parseFloat(multiplier) || 2;
  const profit  = betNum * multNum - betNum;

  return (
    <div style={{ padding: "40px", maxWidth: 900, margin: "0 auto", boxSizing: "border-box" }}>
      <div className="bebas" style={{ fontSize: 32, letterSpacing: 4, marginBottom: 4, color: "#ffd700" }}>
        Slot de Jogadores
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginBottom: 36 }}>
        Configure o valor da aposta e o multiplicador de ganho
      </p>

      <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* Imagem de referência */}
        <div style={{
          flexShrink: 0, width: 180,
          borderRadius: 16, overflow: "hidden",
          border: "1px solid rgba(255,215,0,.3)",
          boxShadow: "0 0 40px rgba(255,215,0,.12)",
        }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "747 / 1347" }}>
            <Image
              src="/packs/pack-slot.png"
              alt="Slot de Jogadores"
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Configurações */}
        <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Aposta */}
          <div>
            <label style={{
              fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,.4)",
              textTransform: "uppercase", display: "block", marginBottom: 8,
            }}>
              Valor da Aposta (R$)
            </label>
            <input
              type="number" min="1" step="0.5"
              value={bet}
              onChange={e => setBet(e.target.value)}
              style={{
                width: "100%", background: "#0b130b",
                border: "1px solid rgba(255,215,0,.3)",
                borderRadius: 10, padding: "12px 16px",
                color: "#ffd700", fontSize: 22,
                fontFamily: "'Bebas Neue',cursive", letterSpacing: 2,
                outline: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 6 }}>
              Custo de cada giro para o usuário
            </div>
          </div>

          {/* Multiplicador */}
          <div>
            <label style={{
              fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,.4)",
              textTransform: "uppercase", display: "block", marginBottom: 8,
            }}>
              Multiplicador de Ganho (×)
            </label>
            <input
              type="number" min="1.1" step="0.1"
              value={multiplier}
              onChange={e => setMultiplier(e.target.value)}
              style={{
                width: "100%", background: "#0b130b",
                border: "1px solid rgba(0,230,118,.3)",
                borderRadius: 10, padding: "12px 16px",
                color: "#00e676", fontSize: 22,
                fontFamily: "'Bebas Neue',cursive", letterSpacing: 2,
                outline: "none", boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 6 }}>
              Fator de multiplicação ao ganhar (ex: 2 = dobra a aposta)
            </div>
          </div>

          {/* Toggle ativo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#0b130b", border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 10, padding: "12px 16px" }}>
            <div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.8)", fontWeight: 600 }}>Slot ativo</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 2 }}>
                Exibir ou ocultar da loja
              </div>
            </div>
            <button onClick={() => setActive(a => !a)} style={{
              width: 48, height: 26, borderRadius: 13,
              background: active ? "#00e676" : "rgba(255,255,255,.12)",
              border: "none", cursor: "pointer", position: "relative",
              transition: "background .2s",
            }}>
              <div style={{
                position: "absolute", top: 3, left: active ? 25 : 3,
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff", transition: "left .2s",
              }} />
            </button>
          </div>

          {/* Prévia do cálculo */}
          <div style={{
            background: "rgba(255,215,0,.06)",
            border: "1px solid rgba(255,215,0,.18)",
            borderRadius: 14, padding: "16px 18px",
          }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "rgba(255,215,0,.5)",
              textTransform: "uppercase", marginBottom: 14 }}>
              Prévia de Ganho
            </div>
            {[
              { label: "Aposta do usuário", value: fmt(betNum),  color: "rgba(255,255,255,.8)" },
              { label: "Retorno ao ganhar", value: fmt(betNum * multNum), color: "#00e676" },
              { label: "Lucro do usuário",  value: "+" + fmt(profit), color: "#00e676" },
              { label: "Casa perde",        value: "-" + fmt(profit), color: "#ff5252" },
            ].map(row => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "7px 0",
                borderBottom: "1px solid rgba(255,255,255,.04)",
              }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>{row.label}</span>
                <span className="bebas" style={{ fontSize: 18, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Feedback */}
          {msg && (
            <p style={{
              fontSize: 13, padding: "10px 16px", borderRadius: 10,
              color: msg.startsWith("✅") ? "#00e676" : "#ff5252",
              background: msg.startsWith("✅") ? "rgba(0,230,118,.08)" : "rgba(255,82,82,.08)",
              border: `1px solid ${msg.startsWith("✅") ? "rgba(0,230,118,.2)" : "rgba(255,82,82,.2)"}`,
            }}>
              {msg}
            </p>
          )}

          {/* Botão salvar */}
          <button
            onClick={save}
            disabled={saving || loading}
            style={{
              width: "100%", padding: "14px",
              background: "linear-gradient(135deg,#ffd700,#ff8c00)",
              border: "none", borderRadius: 12,
              fontFamily: "'Bebas Neue',cursive", fontSize: 20, letterSpacing: 4,
              color: "#000", cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.6 : 1, transition: "opacity .2s",
            }}
          >
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </div>
    </div>
  );
}
