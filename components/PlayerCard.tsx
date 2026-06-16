"use client";
import Image from "next/image";

export interface CardData {
  id: string; name: string; country: string; flag: string;
  position: string; rating: number; rarity: string; value: number; photo?: string | null;
}

interface Props { card: CardData; flipped?: boolean; size?: "sm" | "md"; }

const fmt = (v: number) => "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 });

const rarityBorder: Record<string, string> = {
  legendary: "2px solid #ffd700",
  epic:      "2px solid #b44fff",
  rare:      "2px solid #2196f3",
  common:    "1px solid rgba(255,255,255,.18)",
};
const rarityGlow: Record<string, string> = {
  legendary: "0 0 22px #ffd70066, 0 0 6px #ffd70044",
  epic:      "0 0 18px #b44fff55, 0 0 5px #b44fff44",
  rare:      "0 0 14px #2196f344",
  common:    "none",
};
const rarityDot: Record<string, string> = {
  legendary: "#ffd700", epic: "#b44fff", rare: "#2196f3", common: "#757575",
};

export default function PlayerCard({ card, flipped = false, size = "md" }: Props) {
  const w = size === "sm" ? 130 : 154;
  const h = size === "sm" ? 183 : 218;
  const hasPhoto = !!card.photo;

  return (
    <div style={{ width: w, height: h, perspective: 1000, flexShrink: 0 }}>
      <div style={{
        width: "100%", height: "100%", position: "relative",
        transformStyle: "preserve-3d",
        transform: flipped ? "rotateY(0deg)" : "rotateY(180deg)",
        transition: "transform 0.75s cubic-bezier(.4,0,.2,1)",
      }}>

        {/* ── VERSO ── */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 16, backfaceVisibility: "hidden",
          background: "linear-gradient(145deg,#0b160b,#060c06)", border: "2px solid rgba(0,230,118,.25)",
          transform: "rotateY(180deg)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 40, opacity: .3 }}>⚽</span>
        </div>

        {/* ── FRENTE ── */}
        <div className={`card-${card.rarity}`} style={{
          position: "absolute", inset: 0, borderRadius: 16,
          backfaceVisibility: "hidden", overflow: "hidden",
          border: rarityBorder[card.rarity] ?? rarityBorder.common,
          boxShadow: rarityGlow[card.rarity] ?? "none",
        }}>

          {/* Foto de fundo cobrindo o card inteiro */}
          {hasPhoto && (
            <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
              <Image
                src={card.photo!}
                alt={card.name}
                fill
                sizes={`${w}px`}
                style={{ objectFit: "cover", objectPosition: "top center" }}
              />
              {/* gradiente superior leve para não queimar o rating */}
              <div style={{ position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(0,0,0,.45) 0%, transparent 30%, transparent 50%, rgba(0,0,0,.88) 100%)" }} />
            </div>
          )}

          {/* Sem foto: fundo com emoji de bandeira desfocado */}
          {!hasPhoto && (
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 90, overflow: "hidden", opacity: .18, zIndex: 0 }}>
              <span style={{
                fontSize: size === "sm" ? 110 : 130,
                position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", filter: "blur(10px)",
              }}>
                {card.flag}
              </span>
            </div>
          )}

          {/* Ponto de raridade */}
          <div style={{
            position: "absolute", top: 9, right: 9, width: 8, height: 8, borderRadius: "50%", zIndex: 3,
            background: rarityDot[card.rarity] ?? "#757575",
            boxShadow: card.rarity !== "common" ? `0 0 8px ${rarityDot[card.rarity]}` : "none",
          }} />

          {/* Conteúdo sobre a foto */}
          <div style={{
            position: "relative", zIndex: 2,
            padding: size === "sm" ? 8 : 10,
            height: "100%", display: "flex", flexDirection: "column",
          }}>

            {/* Topo: rating + posição */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <span style={{
                fontFamily: "'Bebas Neue',cursive", fontSize: size === "sm" ? 22 : 28,
                lineHeight: 1, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,.9)",
              }}>
                {card.rating}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 1,
                color: "rgba(255,255,255,.9)",
                background: "rgba(0,0,0,.55)", backdropFilter: "blur(4px)",
                padding: "2px 6px", borderRadius: 5, marginTop: 2,
              }}>
                {card.position}
              </span>
            </div>

            {/* Meio — emoji de bandeira quando sem foto */}
            {!hasPhoto && (
              <>
                <span style={{ fontSize: size === "sm" ? 20 : 26, display: "block", textAlign: "center", margin: "6px 0 3px" }}>
                  {card.flag}
                </span>
                <div style={{
                  fontFamily: "'Bebas Neue',cursive", fontSize: size === "sm" ? 13 : 15.5,
                  letterSpacing: 1, color: "#fff", textAlign: "center", lineHeight: 1.1, marginBottom: 2,
                }}>
                  {card.name}
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.38)", textAlign: "center", marginBottom: "auto" }}>
                  {card.country}
                </div>
              </>
            )}

            {/* Espaçador — empurra info para o fundo quando tem foto */}
            {hasPhoto && <div style={{ flex: 1 }} />}

            {/* Rodapé com nome quando tem foto */}
            {hasPhoto && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <div style={{
                    fontFamily: "'Bebas Neue',cursive", fontSize: size === "sm" ? 13 : 15.5,
                    letterSpacing: 1, color: "#fff", lineHeight: 1.1,
                    textShadow: "0 1px 5px rgba(0,0,0,1)",
                  }}>
                    {card.name}
                  </div>
                  <span style={{ fontSize: size === "sm" ? 16 : 20 }}>{card.flag}</span>
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.45)", textShadow: "0 1px 4px rgba(0,0,0,.9)" }}>
                  {card.country}
                </div>
              </div>
            )}

            {/* Badge de valor */}
            <div style={{
              background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 9, padding: size === "sm" ? "5px 6px" : "7px 8px", textAlign: "center",
            }}>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,.45)", letterSpacing: 1, textTransform: "uppercase" }}>Valor</div>
              <div className={`value-${card.rarity} bebas`} style={{ fontSize: size === "sm" ? 15 : 18 }}>
                {fmt(card.value)}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
