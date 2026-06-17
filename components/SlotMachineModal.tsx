"use client";
import { useState, useEffect, useRef } from "react";

const fmt = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Dimensões dos cards do slot ───────────────────────────────────────
const SLOT_CARD_W   = 92;
const SLOT_CARD_H   = 114;
const SLOT_GAP      = 6;
const SLOT_STEP     = SLOT_CARD_H + SLOT_GAP; // 120
const REEL_GAP      = 12;
const REEL_WINDOW_H = 3 * SLOT_CARD_H + 2 * SLOT_GAP; // 354

const STRIP_COUNT = 28;
const RESULT_IDX  = 23;

// translateY para o card i ficar no centro da janela (slot central dos 3)
// T = (1 - i) * SLOT_STEP
const INIT_Y  = SLOT_STEP;                       // card 0 no centro: T = 120
const FINAL_Y = (1 - RESULT_IDX) * SLOT_STEP;   // card 23 no centro: T = -2640

const REEL_DURATIONS = [3000, 3600, 4200]; // ms até cada reel parar
const DONE_DELAY     = 4200 + 700;         // ms até mostrar resultado

// ── Tipos ─────────────────────────────────────────────────────────────
interface CardData {
  id: string; name: string; country: string; flag: string;
  position: string; rating: number; rarity: string; value: number;
  photo?: string | null;
}
interface ReelData  { strip: CardData[]; result: CardData; }
interface SlotResult { reels: ReelData[]; win: boolean; bet: number; payout: number; multiplier: number; newBalance: number; }
interface Pack { id: string; name: string; icon: string; cssClass: string; price: number; }
interface Props { pack: Pack | null; onClose: () => void; onResult: (balance: number) => void; }

const RARITY_COLORS: Record<string, string> = {
  legendary: "#ffd700",
  epic:      "#b44fff",
  rare:      "#2196f3",
  common:    "#9e9e9e",
};

// ── Mini-card para cada slot ──────────────────────────────────────────
function SlotCard({ card }: { card: CardData }) {
  const color = RARITY_COLORS[card.rarity] ?? "#9e9e9e";
  const shortName = card.name.split(" ").slice(-1)[0].substring(0, 10);
  return (
    <div style={{
      width: SLOT_CARD_W, height: SLOT_CARD_H,
      borderRadius: 10,
      border: `2px solid ${color}`,
      background: "linear-gradient(145deg,#0a1628,#060e1a)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 4, flexShrink: 0,
      boxShadow: `0 0 8px ${color}44`,
    }}>
      {card.photo ? (
        <img src={card.photo} alt={card.name}
          style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 6 }} />
      ) : (
        <div style={{ fontSize: 30 }}>{card.flag}</div>
      )}
      <div style={{
        fontSize: 8, fontWeight: 700, color: "#fff", textAlign: "center",
        lineHeight: 1.2, padding: "0 4px", maxWidth: "100%",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {shortName}
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color, fontFamily: "'Bebas Neue',cursive", lineHeight: 1 }}>
        {card.rating}
      </div>
    </div>
  );
}

// ── Funções de áudio ──────────────────────────────────────────────────
function playReelStop(ctx: AudioContext, idx: number) {
  const now  = ctx.currentTime;
  const freq = [440, 520, 620][idx];
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain); gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc.start(now); osc.stop(now + 0.36);
}

function playWinSound(ctx: AudioContext) {
  const now = ctx.currentTime;
  const notes: [number, number][] = [[523,0],[659,.12],[784,.25],[1047,.40],[784,.55],[1047,.68]];
  notes.forEach(([f, d]) => {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "triangle"; osc.frequency.value = f;
    osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.18, now + d);
    gain.gain.exponentialRampToValueAtTime(0.001, now + d + 0.45);
    osc.start(now + d); osc.stop(now + d + 0.46);
  });
}

function playLoseSound(ctx: AudioContext) {
  const now = ctx.currentTime;
  const notes: [number, number][] = [[523,0],[494,.18],[440,.36],[392,.54]];
  notes.forEach(([f, d]) => {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "sine"; osc.frequency.value = f;
    osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.10, now + d);
    gain.gain.exponentialRampToValueAtTime(0.001, now + d + 0.28);
    osc.start(now + d); osc.stop(now + d + 0.29);
  });
}

// ── Componente principal ──────────────────────────────────────────────
export default function SlotMachineModal({ pack, onClose, onResult }: Props) {
  const [step,            setStep]           = useState<"pre" | "spinning" | "done">("pre");
  const [result,          setResult]         = useState<SlotResult | null>(null);
  const [loading,         setLoading]        = useState(false);
  const [error,           setError]          = useState("");
  const [multiplier,      setMultiplier]     = useState(2);

  useEffect(() => {
    fetch("/api/admin/slot").then(r => r.json()).then(d => {
      if (d.multiplier) setMultiplier(d.multiplier);
    }).catch(() => {});
  }, []);
  const [reelY,           setReelY]          = useState([INIT_Y, INIT_Y, INIT_Y]);
  const [reelTransition,  setReelTransition] = useState([false, false, false]);
  const [reelStopped,     setReelStopped]    = useState([false, false, false]);
  const [flashColor,      setFlashColor]     = useState<string | null>(null);

  const spinFiredRef = useRef(false);
  const audioCtxRef  = useRef<AudioContext | null>(null);

  function ensureAudio(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (pack) {
      setStep("pre"); setResult(null); setError("");
      setReelY([INIT_Y, INIT_Y, INIT_Y]);
      setReelTransition([false, false, false]);
      setReelStopped([false, false, false]);
      setFlashColor(null);
      spinFiredRef.current = false;
    }
  }, [pack]);

  // Dispara animação das rodinhas quando step vira "spinning"
  useEffect(() => {
    if (step !== "spinning" || !result || spinFiredRef.current) return;
    spinFiredRef.current = true;

    // Ativa transições e define posição final em um único flush
    setReelTransition([true, true, true]);
    setReelY([FINAL_Y, FINAL_Y, FINAL_Y]);

    // Para cada reel no seu tempo
    REEL_DURATIONS.forEach((dur, i) => {
      setTimeout(() => {
        setReelStopped(prev => { const n = [...prev]; n[i] = true; return n; });
        const ctx = audioCtxRef.current;
        if (ctx) playReelStop(ctx, i);
      }, dur);
    });

    // Mostra resultado
    setTimeout(() => {
      setStep("done");
      onResult(result.newBalance);
    }, DONE_DELAY);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, result]);

  // Flash + partículas + som no resultado
  useEffect(() => {
    if (step !== "done" || !result) return;
    const ctx = audioCtxRef.current;
    if (result.win) {
      setFlashColor("rgba(255,215,0,.35)");
      setTimeout(() => setFlashColor(null), 600);
      if (ctx) playWinSound(ctx);
      spawnParticles();
    } else {
      if (ctx) playLoseSound(ctx);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (!pack) return null;

  async function handleSpin() {
    if (loading) return;
    setLoading(true); setError("");
    const ctx = ensureAudio();
    if (ctx?.state === "suspended") await ctx.resume();
    try {
      const res  = await fetch("/api/packs/slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack!.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao girar"); setLoading(false); return; }
      setResult(data);
      setStep("spinning");
    } catch {
      setError("Erro de conexão");
    }
    setLoading(false);
  }

  function handleReset() {
    setStep("pre"); setResult(null); setError("");
    setReelY([INIT_Y, INIT_Y, INIT_Y]);
    setReelTransition([false, false, false]);
    setReelStopped([false, false, false]);
    setFlashColor(null);
    spinFiredRef.current = false;
  }

  function spawnParticles() {
    if (typeof window === "undefined") return;
    const palette = ["#ffd700","#ffe44d","#ffb300","#00e676","#fff176"];
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    for (let i = 0; i < 70; i++) {
      const p     = document.createElement("div");
      const angle = Math.random() * Math.PI * 2;
      const dist  = 130 + Math.random() * 220;
      const size  = 5 + Math.random() * 9;
      const color = palette[Math.floor(Math.random() * palette.length)];
      p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;
        background:${color};border-radius:50%;pointer-events:none;z-index:9999;
        box-shadow:0 0 6px ${color};
        animation:particleFly ${0.8 + Math.random() * 0.7}s ease-out forwards;
        --dx:${Math.cos(angle) * dist}px;--dy:${Math.sin(angle) * dist}px`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1700);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(4,10,22,0.98)",
      zIndex: 800,
      display: "flex", flexDirection: "column",
      overflowY: "auto",
    }}>
      {/* Flash de vitória */}
      {flashColor && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 900, pointerEvents: "none",
          background: flashColor,
          animation: "flashReveal 0.6s ease-out forwards",
        }} />
      )}

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(4,10,22,0.94)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,215,0,.18)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span className="bebas" style={{ fontSize: 20, letterSpacing: 3, color: "#ffd700" }}>
            SLOT DE JOGADORES
          </span>
          <span style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,215,0,.5)" }}>
            O CASSINO DOS CRAQUES
          </span>
        </div>
        <button onClick={onClose} style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
          color: "rgba(255,255,255,.7)", fontSize: 18, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .15s", flexShrink: 0,
        }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,82,82,.2)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.08)")}
        >✕</button>
      </div>

      {/* ── PRE ── */}
      {step === "pre" && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 28, padding: "32px 24px 40px", textAlign: "center",
          minHeight: "calc(100dvh - 69px)",
        }}>
          <div style={{ fontSize: 72, animation: "floatY 2.4s ease-in-out infinite" }}>🎰</div>

          <div>
            <div className="bebas" style={{
              fontSize: 38, letterSpacing: 4, color: "#ffd700",
              textShadow: "0 0 30px rgba(255,215,0,.5)",
            }}>SLOT DE JOGADORES</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)", marginTop: 8, letterSpacing: 2 }}>
              Alinhe 3 jogadores do Brasil e dobre sua aposta!
            </div>
          </div>

          {/* Regras */}
          <div style={{
            background: "rgba(255,215,0,.07)", border: "1px solid rgba(255,215,0,.22)",
            borderRadius: 14, padding: "16px 20px",
            display: "flex", flexDirection: "column", gap: 12, maxWidth: 310, width: "100%",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>🇧🇷🇧🇷🇧🇷</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>3 Jogadores do Brasil</div>
                <div style={{ fontSize: 10, color: "#00e676", marginTop: 2 }}>
                  {multiplier}× a aposta — {fmt(pack.price * multiplier)}
                </div>
              </div>
            </div>
            <div style={{ height: 1, background: "rgba(255,215,0,.12)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>❌</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 700 }}>Qualquer outro resultado</div>
                <div style={{ fontSize: 10, color: "#ff5252", marginTop: 2 }}>Perde a aposta</div>
              </div>
            </div>
          </div>

          {error && (
            <p style={{ color: "#ff5252", fontSize: 13, padding: "10px 16px",
              background: "rgba(255,82,82,.1)", borderRadius: 10, border: "1px solid rgba(255,82,82,.3)" }}>
              {error}
            </p>
          )}

          {/* Aposta + botão */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 12, padding: "12px 18px",
            }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>Aposta</span>
              <span className="bebas" style={{ fontSize: 26, color: "#ffd700" }}>{fmt(pack.price)}</span>
            </div>
            <button
              onClick={handleSpin}
              disabled={loading}
              style={{
                width: "100%", padding: "18px",
                background: loading
                  ? "rgba(255,215,0,.25)"
                  : "linear-gradient(135deg,#ffd700,#ff8c00)",
                border: "none", borderRadius: 14,
                fontFamily: "'Bebas Neue',cursive",
                fontSize: 26, letterSpacing: 5, color: "#000",
                cursor: loading ? "wait" : "pointer",
                transition: "all .2s",
                boxShadow: "0 0 32px rgba(255,215,0,.3)",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = ".85"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {loading ? "GIRANDO..." : "🎰  GIRAR"}
            </button>
          </div>
        </div>
      )}

      {/* ── SPINNING + DONE ── */}
      {step !== "pre" && result && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 20, padding: "20px 16px 32px",
          minHeight: "calc(100dvh - 69px)",
        }}>
          {/* Status */}
          {step === "spinning" && (
            <p className="bebas" style={{
              fontSize: 15, letterSpacing: 6,
              color: "rgba(255,215,0,.75)",
              animation: "glowPulse 0.6s ease-in-out infinite",
            }}>
              GIRANDO...
            </p>
          )}
          {step === "done" && (
            <div style={{ textAlign: "center", animation: "slideUp .5s ease-out" }}>
              {result.win ? (
                <>
                  <div className="bebas" style={{
                    fontSize: 46, color: "#ffd700", letterSpacing: 4,
                    textShadow: "0 0 40px rgba(255,215,0,.8)",
                    animation: "floatY 1s ease-in-out infinite",
                  }}>
                    🏆 JACKPOT!
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 4, letterSpacing: 2 }}>
                    3 JOGADORES DO BRASIL — {result.multiplier ?? multiplier}×
                  </div>
                </>
              ) : (
                <>
                  <div className="bebas" style={{ fontSize: 30, color: "rgba(255,255,255,.5)", letterSpacing: 4 }}>
                    SEM PRÊMIO
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginTop: 4 }}>
                    Tente novamente!
                  </div>
                </>
              )}
            </div>
          )}

          {/* Máquina de slot */}
          <div style={{
            background: "linear-gradient(160deg,#0c1e3a,#060e1a)",
            border: `2px solid ${step === "done" && result.win ? "rgba(255,215,0,.6)" : "rgba(255,215,0,.22)"}`,
            borderRadius: 20,
            padding: "18px 14px 14px",
            boxShadow: step === "done" && result.win
              ? "0 0 50px rgba(255,215,0,.3), inset 0 0 30px rgba(0,0,30,.6)"
              : "0 0 30px rgba(255,215,0,.1), inset 0 0 30px rgba(0,0,30,.6)",
            transition: "border-color .4s, box-shadow .4s",
          }}>
            {/* Setas top */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
              {result.reels.map((_, i) => (
                <div key={i} style={{
                  width: SLOT_CARD_W,
                  marginRight: i < 2 ? REEL_GAP : 0,
                  display: "flex", justifyContent: "center",
                }}>
                  <div style={{
                    width: 0, height: 0,
                    borderLeft: "8px solid transparent",
                    borderRight: "8px solid transparent",
                    borderTop: `12px solid ${reelStopped[i] ? "#ffd700" : "rgba(255,215,0,.35)"}`,
                    filter: reelStopped[i] ? "drop-shadow(0 0 6px #ffd700)" : "none",
                    transition: "all .3s",
                  }} />
                </div>
              ))}
            </div>

            {/* Três reels */}
            <div style={{ display: "flex", gap: REEL_GAP }}>
              {result.reels.map((reel, reelIdx) => (
                <div key={reelIdx} style={{
                  width: SLOT_CARD_W,
                  height: REEL_WINDOW_H,
                  overflow: "hidden",
                  borderRadius: 10,
                  position: "relative",
                  border: `2px solid ${
                    step === "done" && reel.result.country === "Brasil"
                      ? "#00e676"
                      : reelStopped[reelIdx]
                        ? "rgba(255,255,255,.3)"
                        : "rgba(255,255,255,.1)"
                  }`,
                  transition: "border-color .3s",
                }}>
                  {/* Destaque do centro */}
                  <div style={{
                    position: "absolute",
                    top: SLOT_CARD_H + SLOT_GAP,
                    left: 0, right: 0,
                    height: SLOT_CARD_H,
                    background: "rgba(255,215,0,.05)",
                    zIndex: 2, pointerEvents: "none",
                    borderTop: "1px solid rgba(255,215,0,.15)",
                    borderBottom: "1px solid rgba(255,215,0,.15)",
                  }} />
                  {/* Fade topo/fundo */}
                  <div style={{
                    position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
                    background: "linear-gradient(to bottom,rgba(6,14,26,1) 0%,transparent 22%,transparent 78%,rgba(6,14,26,1) 100%)",
                  }} />
                  {/* Strip de cards */}
                  <div style={{
                    display: "flex", flexDirection: "column", gap: SLOT_GAP,
                    transform: `translateY(${reelY[reelIdx]}px)`,
                    transition: reelTransition[reelIdx]
                      ? `transform ${REEL_DURATIONS[reelIdx]}ms cubic-bezier(0.12,0.8,0.32,1)`
                      : "none",
                    willChange: "transform",
                  }}>
                    {reel.strip.map((card, ci) => (
                      <div key={ci} style={{ flexShrink: 0 }}>
                        <SlotCard card={card} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Setas bottom */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
              {result.reels.map((_, i) => (
                <div key={i} style={{
                  width: SLOT_CARD_W,
                  marginRight: i < 2 ? REEL_GAP : 0,
                  display: "flex", justifyContent: "center",
                }}>
                  <div style={{
                    width: 0, height: 0,
                    borderLeft: "8px solid transparent",
                    borderRight: "8px solid transparent",
                    borderBottom: `12px solid ${reelStopped[i] ? "#ffd700" : "rgba(255,215,0,.35)"}`,
                    filter: reelStopped[i] ? "drop-shadow(0 0 6px #ffd700)" : "none",
                    transition: "all .3s",
                  }} />
                </div>
              ))}
            </div>

            {/* Flag dos resultados */}
            <div style={{ display: "flex", gap: REEL_GAP, justifyContent: "center", marginTop: 10 }}>
              {result.reels.map((reel, i) => (
                <div key={i} style={{
                  width: SLOT_CARD_W, textAlign: "center",
                  fontSize: 20, lineHeight: 1,
                  opacity: reelStopped[i] ? 1 : 0,
                  transition: "opacity .4s",
                  animation: step === "done" && reel.result.country === "Brasil"
                    ? "floatY 1.2s ease-in-out infinite"
                    : "none",
                }}>
                  {reel.result.flag}
                </div>
              ))}
            </div>
          </div>

          {/* Resultado financeiro (só quando done) */}
          {step === "done" && (
            <div style={{
              width: "100%", maxWidth: 360,
              animation: "slideUp .5s ease-out .1s both",
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              <div style={{
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 16, overflow: "hidden",
              }}>
                {[
                  { label: "Aposta",    value: fmt(result.bet),             color: "rgba(255,255,255,.8)" },
                  {
                    label: result.win ? "Prêmio recebido" : "Resultado",
                    value: result.win ? fmt(result.payout) : "-" + fmt(result.bet),
                    color: result.win ? "#00e676" : "#ff5252",
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
                    <span className="bebas" style={{ fontSize: 22, color: row.color }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <button onClick={handleReset} style={{
                width: "100%", padding: "16px",
                background: "linear-gradient(135deg,#ffd700,#ff8c00)",
                border: "none", borderRadius: 14,
                fontFamily: "'Bebas Neue',cursive",
                fontSize: 22, letterSpacing: 4, color: "#000",
                cursor: "pointer", transition: "opacity .2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = ".85")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Girar Novamente
              </button>
              <button onClick={onClose} style={{
                width: "100%", padding: "13px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 14,
                fontFamily: "'Bebas Neue',cursive",
                fontSize: 17, letterSpacing: 3, color: "rgba(255,255,255,.45)",
                cursor: "pointer", transition: "opacity .2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = ".7")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
