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

const RARITY_FLASH: Record<string, string> = {
  legendary: "rgba(255,215,0,.35)",
  epic:      "rgba(180,0,255,.28)",
  rare:      "rgba(33,150,243,.22)",
  common:    "rgba(255,255,255,.10)",
};

const CARD_W = 130;
const CARD_H = 183;
const GAP    = 12;
const STEP   = CARD_W + GAP;
const WIN_IDX       = 23;
const SPIN_DURATION = 4200;

// ── Web Audio helpers ──────────────────────────────────────────────

function playTick(ctx: AudioContext, t: number, vol = 0.14, pitch = 1) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = 580 * pitch;
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
  osc.start(t);
  osc.stop(t + 0.06);
}

function scheduleSpinTicks(ctx: AudioContext) {
  const now = ctx.currentTime;
  // Tick times (seconds): slow start → fast middle → deceleration
  const times = [
    0.14, 0.31, 0.50, 0.69, 0.88,        // arranque lento
    1.03, 1.17, 1.30, 1.42, 1.53,        // acelerando
    1.63, 1.73, 1.83, 1.93, 2.03,        // máxima velocidade
    2.14, 2.26, 2.39,                     // começando a frear
    2.55, 2.74, 2.97,                     // desacelerando
    3.28, 3.68, 4.05,                     // quase parando
  ];
  times.forEach((t, i) => {
    const prog  = i / (times.length - 1);
    const vol   = 0.09 + Math.sin(prog * Math.PI) * 0.11; // mais alto no meio
    const pitch = 0.78 + Math.sin(prog * Math.PI) * 0.44; // tom sobe e desce
    playTick(ctx, now + t, vol, pitch);
  });
}

function playResultSound(ctx: AudioContext, rarity: string) {
  const now = ctx.currentTime;

  function tone(freq: number, t: number, dur: number, vol: number, type: OscillatorType = "sine") {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  }

  if (rarity === "legendary") {
    // Fanfarra ascendente
    [[523, 0], [659, 0.05], [784, 0.13], [1047, 0.24], [784, 0.38], [1047, 0.50]].forEach(([f, d]) =>
      tone(f, now + d, 0.75, 0.18)
    );
    tone(2093, now + 0.52, 0.5, 0.07); // shimmer agudo
  } else if (rarity === "epic") {
    // Varredura mágica ascendente
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(860, now + 0.42);
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    osc.start(now);
    osc.stop(now + 0.53);
    tone(680, now + 0.22, 0.4, 0.1);
  } else if (rarity === "rare") {
    // Dois tons ascendentes
    tone(622, now,       0.38, 0.14);
    tone(831, now + 0.16, 0.44, 0.14);
  } else {
    // Ding simples
    tone(523, now, 0.32, 0.12);
  }
}
// ──────────────────────────────────────────────────────────────────

export default function PackOpenModal({ pack, onClose, onResult }: Props) {
  const [step,       setStep]       = useState<"pre" | "spinning" | "done">("pre");
  const [result,     setResult]     = useState<Result | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [translateX, setTranslateX] = useState(0);
  const [spinning,   setSpinning]   = useState(false);
  const [spinBlur,   setSpinBlur]   = useState(0);
  const [flashColor, setFlashColor] = useState<string | null>(null);

  const containerRef  = useRef<HTMLDivElement>(null);
  const winnerCardRef = useRef<HTMLDivElement>(null);
  const spinFiredRef  = useRef(false);
  const audioCtxRef   = useRef<AudioContext | null>(null);

  function ensureAudio(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }

  function handleReset() {
    setStep("pre");
    setResult(null);
    setError("");
    setTranslateX(0);
    setSpinning(false);
    setSpinBlur(0);
    setFlashColor(null);
    spinFiredRef.current = false;
  }

  useEffect(() => {
    if (pack) {
      setStep("pre");
      setResult(null);
      setError("");
      setTranslateX(0);
      setSpinning(false);
      setSpinBlur(0);
      setFlashColor(null);
      spinFiredRef.current = false;
    }
  }, [pack]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Roulette spin logic + ticks
  useEffect(() => {
    if (step !== "spinning" || !result || spinFiredRef.current) return;
    spinFiredRef.current = true;

    const w = containerRef.current?.clientWidth ?? 360;
    setTranslateX(w / 2 - CARD_W / 2);
    setSpinning(false);
    setSpinBlur(0);

    const t1 = setTimeout(() => {
      const finalX = w / 2 - (WIN_IDX * STEP + CARD_W / 2);
      setSpinning(true);
      setSpinBlur(3); // blur durante giro rápido
      setTranslateX(finalX);

      // Som de roleta
      const ctx = audioCtxRef.current;
      if (ctx) scheduleSpinTicks(ctx);

      // Remove blur conforme desacelera
      setTimeout(() => setSpinBlur(0), 2700);

      // Revelação
      setTimeout(() => {
        setStep("done");
        onResult(result.newBalance);
      }, SPIN_DURATION + 400);
    }, 80);

    return () => clearTimeout(t1);
  }, [step, result]);

  // Partículas + som + flash na revelação
  useEffect(() => {
    if (step === "done" && result) {
      const ctx = audioCtxRef.current;

      setTimeout(() => {
        spawnParticles(winnerCardRef.current, result.card.rarity);
        if (ctx) playResultSound(ctx, result.card.rarity);
      }, 120);

      // Flash de cor conforme raridade
      setFlashColor(RARITY_FLASH[result.card.rarity] ?? RARITY_FLASH.common);
      setTimeout(() => setFlashColor(null), 450);
    }
  }, [step]);

  if (!pack) return null;
  const pStyle = packGradients[pack.cssClass] ?? packGradients["t-bronze"];

  async function handleOpen() {
    if (loading) return;
    setLoading(true);
    setError("");

    // Inicializa/resume AudioContext no gesto do usuário
    const ctx = ensureAudio();
    if (ctx?.state === "suspended") await ctx.resume();

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
    const count = rarity === "legendary" ? 50 : rarity === "epic" ? 35 : rarity === "rare" ? 24 : 14;
    for (let i = 0; i < count; i++) {
      const p     = document.createElement("div");
      const angle = Math.random() * Math.PI * 2;
      const dist  = 90 + Math.random() * 180;
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
      {/* Flash de revelação */}
      {flashColor && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 900, pointerEvents: "none",
          background: flashColor,
          animation: "flashReveal 0.45s ease-out forwards",
        }} />
      )}

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
              animation: "glowPulse 0.6s ease-in-out infinite",
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
              {/* Seta superior */}
              <div style={{
                position: "absolute", left: "50%", top: 0,
                transform: "translateX(-50%)",
                width: 0, height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "14px solid #00e676",
                zIndex: 5,
                filter: "drop-shadow(0 0 8px #00e676)",
              }} />
              {/* Seta inferior */}
              <div style={{
                position: "absolute", left: "50%", bottom: 0,
                transform: "translateX(-50%)",
                width: 0, height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderBottom: "14px solid #00e676",
                zIndex: 5,
                filter: "drop-shadow(0 0 8px #00e676)",
              }} />
              {/* Linha central com glow pulsante */}
              <div className="spin-center-line" style={{
                position: "absolute", left: "50%", top: 0, bottom: 0,
                width: 2, background: "#00e676",
                transform: "translateX(-50%)",
                zIndex: 4,
              }} />

              {/* Strip de cards com blur durante giro rápido */}
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
                filter: `blur(${spinBlur}px)`,
                // transição suave do blur saindo
                ...(spinBlur === 0 ? { transition: `transform ${SPIN_DURATION}ms cubic-bezier(0.12, 0.8, 0.32, 1), filter 1.2s ease` } : {}),
              }}>
                {result.strip.map((card, i) => (
                  <div key={i} style={{ flexShrink: 0 }}>
                    <PlayerCard card={card} flipped={true} size="sm" />
                  </div>
                ))}
              </div>

              {/* Fade nas bordas */}
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
