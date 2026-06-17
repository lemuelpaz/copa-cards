"use client";
import { useEffect, useRef, useState } from "react";

const fmt = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminSlotPage() {
  // ── config ──────────────────────────────────────────────────────────
  const [bet,        setBet]        = useState("100");
  const [multiplier, setMultiplier] = useState("2");
  const [active,     setActive]     = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [cfgMsg,     setCfgMsg]     = useState("");
  const [loading,    setLoading]    = useState(true);

  // ── imagem ──────────────────────────────────────────────────────────
  const [imgSrc,      setImgSrc]      = useState("/packs/pack-slot.png");
  const [imgPreview,  setImgPreview]  = useState<string | null>(null);
  const [imgFile,     setImgFile]     = useState<File | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [imgMsg,      setImgMsg]      = useState("");
  const [dragOver,    setDragOver]    = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  // ── upload foto ──────────────────────────────────────────────────────
  function handleFileSelect(file: File) {
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
    setImgMsg("");
  }

  async function uploadImage() {
    if (!imgFile) return;
    setUploading(true);
    setImgMsg("");
    const fd = new FormData();
    fd.append("image", imgFile);
    const r = await fetch("/api/admin/slot/image", { method: "POST", body: fd });
    const d = await r.json();
    if (r.ok) {
      // força re-render com versão nova para contornar cache do browser
      setImgSrc("/packs/pack-slot.png?v=" + Date.now());
      setImgPreview(null);
      setImgFile(null);
      setImgMsg("✅ Foto atualizada!");
    } else {
      setImgMsg(d.error ?? "Erro ao enviar");
    }
    setUploading(false);
    setTimeout(() => setImgMsg(""), 4000);
  }

  // ── salvar config ────────────────────────────────────────────────────
  async function saveConfig() {
    setSaving(true);
    setCfgMsg("");
    const r = await fetch("/api/admin/slot", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bet: parseFloat(bet), multiplier: parseFloat(multiplier), active }),
    });
    const d = await r.json();
    setCfgMsg(r.ok ? "✅ Configurações salvas!" : (d.error ?? "Erro ao salvar"));
    setSaving(false);
    setTimeout(() => setCfgMsg(""), 4000);
  }

  const betNum  = parseFloat(bet)  || 0;
  const multNum = parseFloat(multiplier) || 2;
  const displaySrc = imgPreview ?? imgSrc;

  const inputBase: React.CSSProperties = {
    width: "100%", background: "#0b130b",
    borderRadius: 10, padding: "12px 16px",
    color: "#fff", fontSize: 15, outline: "none",
    boxSizing: "border-box", fontFamily: "Inter,sans-serif",
    transition: "border-color .15s",
  };

  return (
    <div style={{ padding: "40px", maxWidth: 960, margin: "0 auto", boxSizing: "border-box" }}>
      <div className="bebas" style={{ fontSize: 32, letterSpacing: 4, marginBottom: 4, color: "#ffd700" }}>
        Slot de Jogadores
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginBottom: 40 }}>
        Configure a imagem do pacote, valor da aposta e multiplicador de ganho
      </p>

      <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* ── COLUNA ESQUERDA: foto ─────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 210, flexShrink: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,.4)", textTransform: "uppercase" }}>
            Imagem do Pacote
          </div>

          {/* Preview atual */}
          <div style={{
            borderRadius: 14, overflow: "hidden",
            border: `2px solid ${imgPreview ? "rgba(255,215,0,.6)" : "rgba(255,215,0,.25)"}`,
            boxShadow: imgPreview ? "0 0 30px rgba(255,215,0,.2)" : "none",
            transition: "border-color .3s, box-shadow .3s",
            background: "#060e1a",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displaySrc}
              alt="Slot Pack"
              style={{ width: "100%", display: "block", objectFit: "contain" }}
            />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f && f.type.startsWith("image/")) handleFileSelect(f);
            }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? "rgba(255,215,0,.8)" : "rgba(255,215,0,.3)"}`,
              borderRadius: 12,
              padding: "20px 12px",
              textAlign: "center",
              cursor: "pointer",
              background: dragOver ? "rgba(255,215,0,.06)" : "rgba(255,215,0,.03)",
              transition: "all .2s",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>🖼️</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.4 }}>
              {imgFile ? imgFile.name : "Clique ou arraste\numa imagem aqui"}
            </div>
            {imgFile && (
              <div style={{ fontSize: 10, color: "rgba(255,215,0,.6)", marginTop: 6 }}>
                {(imgFile.size / 1024).toFixed(0)} KB
              </div>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
          />

          {imgMsg && (
            <p style={{
              fontSize: 12, padding: "8px 12px", borderRadius: 8, margin: 0,
              color: imgMsg.startsWith("✅") ? "#00e676" : "#ff5252",
              background: imgMsg.startsWith("✅") ? "rgba(0,230,118,.08)" : "rgba(255,82,82,.08)",
              border: `1px solid ${imgMsg.startsWith("✅") ? "rgba(0,230,118,.2)" : "rgba(255,82,82,.2)"}`,
            }}>
              {imgMsg}
            </p>
          )}

          <button
            onClick={uploadImage}
            disabled={!imgFile || uploading}
            style={{
              width: "100%", padding: "12px",
              background: imgFile
                ? "linear-gradient(135deg,#ffd700,#ff8c00)"
                : "rgba(255,255,255,.06)",
              border: `1px solid ${imgFile ? "transparent" : "rgba(255,255,255,.1)"}`,
              borderRadius: 10,
              fontFamily: "'Bebas Neue',cursive", fontSize: 16, letterSpacing: 3,
              color: imgFile ? "#000" : "rgba(255,255,255,.25)",
              cursor: imgFile && !uploading ? "pointer" : "not-allowed",
              opacity: uploading ? 0.6 : 1,
              transition: "all .2s",
            }}
          >
            {uploading ? "Enviando..." : "Salvar Foto"}
          </button>
        </div>

        {/* ── COLUNA DIREITA: config ────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 22 }}>

          {/* Aposta */}
          <div>
            <label style={{ fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,.4)",
              textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Valor da Aposta (R$)
            </label>
            <input
              type="number" min="1" step="0.5" value={bet}
              onChange={e => setBet(e.target.value)}
              style={{ ...inputBase, border: "1px solid rgba(255,215,0,.3)", color: "#ffd700",
                fontSize: 22, fontFamily: "'Bebas Neue',cursive", letterSpacing: 2 }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,215,0,.7)")}
              onBlur={e  => (e.currentTarget.style.borderColor = "rgba(255,215,0,.3)")}
            />
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 5 }}>
              Custo de cada giro para o usuário
            </div>
          </div>

          {/* Multiplicador */}
          <div>
            <label style={{ fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,.4)",
              textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Multiplicador de Ganho (×)
            </label>
            <input
              type="number" min="1.1" step="0.1" value={multiplier}
              onChange={e => setMultiplier(e.target.value)}
              style={{ ...inputBase, border: "1px solid rgba(0,230,118,.3)", color: "#00e676",
                fontSize: 22, fontFamily: "'Bebas Neue',cursive", letterSpacing: 2 }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(0,230,118,.7)")}
              onBlur={e  => (e.currentTarget.style.borderColor = "rgba(0,230,118,.3)")}
            />
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 5 }}>
              Fator aplicado ao ganhar (ex: 2 = dobra a aposta)
            </div>
          </div>

          {/* Toggle ativo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#0b130b", border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 10, padding: "12px 16px" }}>
            <div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.8)", fontWeight: 600 }}>Slot ativo na loja</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 2 }}>
                Exibir ou ocultar da loja de pacotes
              </div>
            </div>
            <button onClick={() => setActive(a => !a)} style={{
              width: 48, height: 26, borderRadius: 13,
              background: active ? "#00e676" : "rgba(255,255,255,.12)",
              border: "none", cursor: "pointer", position: "relative", transition: "background .2s",
            }}>
              <div style={{
                position: "absolute", top: 3, left: active ? 25 : 3,
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff", transition: "left .2s",
              }} />
            </button>
          </div>

          {/* Prévia de ganho */}
          <div style={{
            background: "rgba(255,215,0,.06)", border: "1px solid rgba(255,215,0,.18)",
            borderRadius: 14, padding: "16px 18px",
          }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "rgba(255,215,0,.5)",
              textTransform: "uppercase", marginBottom: 14 }}>
              Prévia de Ganho
            </div>
            {[
              { label: "Aposta do usuário",  value: fmt(betNum),              color: "rgba(255,255,255,.8)" },
              { label: "Retorno ao ganhar",  value: fmt(betNum * multNum),    color: "#00e676" },
              { label: "Lucro do usuário",   value: "+" + fmt(betNum * multNum - betNum), color: "#00e676" },
              { label: "Casa perde",         value: "-" + fmt(betNum * multNum - betNum), color: "#ff5252" },
            ].map(row => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,.04)",
              }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>{row.label}</span>
                <span className="bebas" style={{ fontSize: 18, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>

          {cfgMsg && (
            <p style={{
              fontSize: 13, padding: "10px 16px", borderRadius: 10, margin: 0,
              color: cfgMsg.startsWith("✅") ? "#00e676" : "#ff5252",
              background: cfgMsg.startsWith("✅") ? "rgba(0,230,118,.08)" : "rgba(255,82,82,.08)",
              border: `1px solid ${cfgMsg.startsWith("✅") ? "rgba(0,230,118,.2)" : "rgba(255,82,82,.2)"}`,
            }}>
              {cfgMsg}
            </p>
          )}

          <button
            onClick={saveConfig}
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
