"use client";
import { useState, useEffect, useRef } from "react";
import PlayerCard, { CardData } from "./PlayerCard";

const fmt = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Pack   { id: string; name: string; icon: string; cssClass: string; price: number; }
interface Result { card: CardData; strip: CardData[]; packCost: number; totalValue: number; delta: number; newBalance: number; }
interface Props  { pack: Pack | null; onClose: () => void; onResult: (balance: number) => void; }

const packGradients: Record<string, { bg: string; glow: string }> = {
  "t-bronze":    { bg: "linear-gradient(155deg,#e8943a,#7a3a10)", glow: "rgba(205,127,50,.55)" },
  "t-silver":    { bg: "linear-gradient(155deg,#c8c8e8,#6868a0)", glow: "rgba(150,150,200,.55)" },
  "t-gold":      { bg: "linear-gradient(155deg,#ffe44d,#b07c00)", glow: "rgba(255,215,0,.6)"   },
  "t-legendary": { bg: "linear-gradient(155deg,#b44fff,#3a0068)", glow: "rgba(180,0,255,.6)"   },
};

const CARD_W = 130;
const CARD_H = 183;
const GAP    = 12;
const STEP   = CARD_W + GAP; // 142px per slot
const WIN_IDX        = 23;
const SPIN_DURATION  = 4200;

export default function PackOpenModal({ pack, onClose, onResult }: Props) {
  const [step,       setStep]       = useState<"pre" | "spinning" | "done">("pre");
  const [result,     setResult]     = useState<Result | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [translateX, setTranslateX] = useState(0);
  const [spinning,   setSpinning]   = useState(false);

  const containerRef  = useRef<HTMLDivElement>(null);
  const winnerCardRef = useRef<HTMLDivElement>(null);
  const spinFiredRef  = useRef(false);

  function handleReset() {
    setStep("pre");
    setResult(null);
    setError("");
    setTranslateX(0);
    setSpinning(false);
    spinFiredRef.current = false;
  }

  useEffect(() => {
    if (pack) {
      setStep("pre");
      setResult(null);
      setError("");
      setTranslateX(0);
      setSpinning(false);
      spinFiredRef.current = false;
    }
  }, [pack]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Roulette spin logic
  useEffect(() => {
    if (step !== "spinning" || !result || spinFiredRef.current) return;
    spinFiredRef.current = true;

    const w = containerRef.current?.clientWidth ?? 360;
    // Place card 0 at center initially (no transition)
    setTranslateX(w / 2 - CARD_W / 2);
    setSpinning(false);

    // One frame later, fire the spin with transition
    const t1 = setTimeout(() => {
      const finalX = w / 2 - (WIN_IDX * STEP + CARD_W / 2);
      setSpinning(true);
      setTranslateX(finalX);

      // After spin ends, show result
      setTimeout(() => {
        setStep("done");
        onResult(result.newBalance);
      }, SPIN_DURATION + 400);
    }, 80);

    return () => clearTimeout(t1);
  }, [step, result]);

  // Particles when winner is revealed
  useEffect(() => {
    if (step === "done" && result) {
      setTimeout(() => spawnParticles(winnerCardRef.current, result.card.rarity), 120);
    }
  }, [step]);

  if (!pack) return null;
  const pStyle = packGradients[pack.cssClass] ?? packGradients["t-bronze"];

  async function handleOpen() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/packs/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack!.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao abrir pacote"); setLoading(false); return; }
      setResult(data);
      setStep("spinning");
    } catch {
      setError("Erro de conexão");
    }
    setLoading(false);
  }

  function spawnParticles(el: HTMLElement | null, rarity: string) {
    if (!el || typeof window === "undefined") return;
    const palettes: Record<string, string[]> = {
      legendary: ["#ffd700", "#ffe44d", "#ffb300", "#fff176"],
      epic:      ["#ce93d8", "#b44fff", "#e040fb", "#9c27b0"],
      rare:      ["#64b5f6", "#42a5f5", "#1e88e5", "#90caf9"],
      common:    ["#9e9e9e", "#bdbdbd", "#e0e0e0", "#757575"],
    };
    const palette = palettes[rarity] ?? palettes.common;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const count = rarity === "legendary" ? 45 : rarity === "epic" ? 32 : rarity === "rare" ? 22 : 12;
    for (let i = 0; i < count; i++) {
      const p     = document.createElement("div");
      const angle = Math.random() * Math.PI * 2;
      const dist  = 90 + Math.random() * 170;
      const size  = 5 + Math.random() * 8;
      const color = palette[Math.floor(Math.random() * palette.length)];
      p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;
        background:${color};border-radius:50%;pointer-events:none;z-index:9999;
        box-shadow:0 0 6px ${color};
        animation:particleFly ${0.7 + Math.random() * 0.6}s ease-out forwards;
        --dx:${Math.cos(angle) * dist}px;--dy:${Math.sin(angle) * dist}px`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1400);
    }
  }

  const Header = ({ title }: { title: string }) => (
    <div style={{
      position: "sticky", top: 0, zIndex: 10,
      background: "rgba(4,8,4,0.92)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(0,230,118,.12)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 20px",
    }}>
      <span className="bebas" style={{ fontSize: 20, letterSpacing: 3, color: "rgba(255,255,255,.85)" }}>
        {title}
      </span>
      <button
        onClick={onClose}
        aria-label="Fechar"
        style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
          color: "rgba(255,255,255,.7)", fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .15s", flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,82,82,.2)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.08)")}
      >
        ✕
      </button>
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(4,8,4,0.97)",
      zIndex: 800,
      display: "flex", flexDirection: "column",
      overflowY: "auto",
    }}>

      {/* ── PRE-OPEN ── */}
      {step === "pre" && (
        <>
          <Header title={pack.name.toUpperCase()} />
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 28, padding: "32px 24px 40px", textAlign: "center",
            minHeight: "calc(100dvh - 69px)",
          }}>
            <div onClick={handleOpen} style={{ cursor: loading ? "wait" : "pointer" }}>
              <div style={{
                width: 170, height: 240, borderRadius: 22,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 10,
                background: pStyle.bg,
                boxShadow: `0 0 60px ${pStyle.glow}, 0 0 100px ${pStyle.glow.replace("0.6","0.2")}`,
                animation: "glowPulse 2.2s ease-in-out infinite",
              }}>
                <span style={{ fontSize: 72, animation: "floatY 2.4s ease-in-out infinite" }}>
                  {pack.icon}
                </span>
                <span className="bebas" style={{ fontSize: 12, letterSpacing: 3, color: "rgba(0,0,0,.45)" }}>
                  COPA 2026
                </span>
              </div>
            </div>

            {error ? (
              <p style={{ color: "#ff5252", fontSize: 13, padding: "10px 16px",
                background: "rgba(255,82,82,.1)", borderRadius: 10, border: "1px solid rgba(255,82,82,.3)" }}>
                {error}
              </p>
            ) : (
              <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", letterSpacing: 3,
                textTransform: "uppercase", animation: "glowPulse 1.6s ease-in-out infinite" }}>
                {loading ? "Abrindo..." : "Toque no pacote para abrir"}
              </p>
            )}

            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 12, padding: "12px 20px",
            }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>Custo</span>
              <span className="bebas" style={{ fontSize: 22, color: "#fff" }}>{fmt(pack.price)}</span>
              <span style={{ width: 1, height: 20, background: "rgba(255,255,255,.1)" }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>1 figurinha</span>
            </div>
          </div>
        </>
      )}

      {/* ── SPINNING (roleta) ── */}
      {step === "spinning" && result && (
        <>
          <Header title={pack.name.toUpperCase()} />
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 28, padding: "32px 0",
            minHeight: "calc(100dvh - 69px)",
          }}>
            <p className="bebas" style={{
              fontSize: 14, letterSpacing: 5,
              color: "rgba(255,255,255,.35)",
              textTransform: "uppercase",
            }}>
              Sorteando sua figurinha...
            </p>

            {/* Roulette track */}
            <div
              ref={containerRef}
              style={{
                position: "relative",
                width: "100%",
                height: CARD_H + 28,
                overflow: "hidden",
              }}
            >
              {/* Top selector arrow */}
              <div style={{
                position: "absolute", left: "50%", top: 0,
                transform: "translateX(-50%)",
                width: 0, height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "14px solid #00e676",
                zIndex: 5,
                filter: "drop-shadow(0 0 6px #00e676)",
              }} />
              {/* Bottom selector arrow */}
              <div style={{
                position: "absolute", left: "50%", bottom: 0,
                transform: "translateX(-50%)",
                width: 0, height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderBottom: "14px solid #00e676",
                zIndex: 5,
                filter: "drop-shadow(0 0 6px #00e676)",
              }} />
              {/* Center selection line */}
              <div style={{
                position: "absolute", left: "50%", top: 0, bottom: 0,
                width: 2, background: "#00e676",
                transform: "translateX(-50%)",
                zIndex: 4,
                boxShadow: "0 0 10px #00e676, 0 0 22px rgba(0,230,118,0.4)",
              }} />

              {/* Scrolling card strip */}
              <div style={{
                display: "flex",
                gap: GAP,
                position: "absolute",
                top: "50%",
                left: 0,
                transform: `translateX(${translateX}px) translateY(-50%)`,
                transition: spinning
                  ? `transform ${SPIN_DURATION}ms cubic-bezier(0.12, 0.8, 0.32, 1)`
                  : "none",
                willChange: "transform",
              }}>
                {result.strip.map((card, i) => (
                  <div key={i} style={{ flexShrink: 0 }}>
                    <PlayerCard card={card} flipped={true} size="sm" />
                  </div>
                ))}
              </div>

              {/* Edge fade overlays */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3,
                background: "linear-gradient(to right, rgba(4,8,4,1) 0%, transparent 20%, transparent 80%, rgba(4,8,4,1) 100%)",
              }} />
            </div>
          </div>
        </>
      )}

      {/* ── DONE ── */}
      {step === "done" && result && (
        <>
          <Header title="Sua Figurinha!" />
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 24,
            padding: "28px 16px 40px", minHeight: "calc(100dvh - 69px)",
          }}>

            {/* Winner card */}
            <div
              ref={winnerCardRef}
              style={{
                animation: "cardFlipIn 0.5s ease-out",
                filter:
                  result.card.rarity === "legendary" ? "drop-shadow(0 0 28px #ffd700)" :
                  result.card.rarity === "epic"       ? "drop-shadow(0 0 22px #b44fff)" :
                  result.card.rarity === "rare"       ? "drop-shadow(0 0 16px #2196f3)" :
                  "none",
              }}
            >
              <PlayerCard card={result.card} flipped={true} size="md" />
            </div>

            {/* Result summary */}
            <div style={{
              width: "100%", maxWidth: 400,
              background: "rgba(255,255,255,.04)",
              border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 16, overflow: "hidden",
            }}>
              {[
                { label: "Custo do pacote", value: fmt(result.packCost),   color: "rgba(255,255,255,.8)" },
                { label: "Valor recebido",  value: fmt(result.totalValue), color: "rgba(255,255,255,.8)" },
                {
                  label: "Resultado",
                  value: (result.delta >= 0 ? "+" : "") + fmt(result.delta),
                  color: result.delta >= 0 ? "#00e676" : "#ff5252",
                },
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 18px",
                  borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none",
                  background: i === arr.length - 1 ? "rgba(255,255,255,.03)" : "transparent",
                }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)", letterSpacing: 1 }}>
                    {row.label}
                  </span>
                  <span className="bebas" style={{ fontSize: 20, color: row.color }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={handleReset}
                style={{
                  width: "100%", padding: "16px",
                  background: "linear-gradient(135deg,#00e676,#00b248)",
                  border: "none", borderRadius: 14,
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: 20, letterSpacing: 4, color: "#000",
                  cursor: "pointer", transition: "opacity .2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = ".85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Abrir um novo Pacote
              </button>
              <button
                onClick={onClose}
                style={{
                  width: "100%", padding: "13px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 14,
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: 17, letterSpacing: 3, color: "rgba(255,255,255,.45)",
                  cursor: "pointer", transition: "opacity .2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = ".7")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Fechar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
