"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import PlayerCard, { CardData } from "@/components/PlayerCard";

const fmt = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface AlbumEntry { card: CardData; count: number; }
interface Stats { legendary: number; epic: number; rare: number; common: number; }
interface User  { id: string; name: string | null; phone: string; role: string; balance: number; }

const RARITY_ORDER = ["legendary", "epic", "rare", "common"] as const;
const RARITY_LABEL: Record<string, string> = {
  legendary: "🌟 Lendárias",
  epic:      "💜 Épicas",
  rare:      "🔵 Raras",
  common:    "⚪ Comuns",
};
const RARITY_COLOR: Record<string, string> = {
  legendary: "#ffd700",
  epic:      "#b44fff",
  rare:      "#2196f3",
  common:    "#9e9e9e",
};

export default function AlbumPage() {
  const router = useRouter();
  const [user,    setUser]    = useState<User | null>(null);
  const [entries, setEntries] = useState<AlbumEntry[]>([]);
  const [stats,   setStats]   = useState<Stats>({ legendary: 0, epic: 0, rare: 0, common: 0 });
  const [total,   setTotal]   = useState(0);
  const [unique,  setUnique]  = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<string>("all");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.user) { router.push("/login"); return; }
      setUser(d.user);
    });
    fetch("/api/user/album").then(r => r.json()).then(d => {
      setEntries(d.cards ?? []);
      setStats(d.stats ?? { legendary: 0, epic: 0, rare: 0, common: 0 });
      setTotal(d.total ?? 0);
      setUnique(d.unique ?? 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  if (!user) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="bebas" style={{ fontSize: 32, color: "#00e676", letterSpacing: 4 }}>Carregando...</div>
    </div>
  );

  const filtered = filter === "all"
    ? entries
    : entries.filter(e => e.card.rarity === filter);

  const groupedByRarity = RARITY_ORDER
    .map(r => ({
      rarity: r,
      items:  (filter === "all" ? entries : filtered).filter(e => e.card.rarity === r),
    }))
    .filter(g => g.items.length > 0);

  return (
    <>
      <Navbar balance={user.balance} role={user.role} userName={user.name ?? user.phone} />

      {/* Tab strip */}
      <div style={{
        background: "#0b130b",
        borderBottom: "1px solid rgba(0,230,118,.1)",
        display: "flex", alignItems: "center",
        padding: "0 24px", gap: 4,
      }}>
        {[
          { label: "🏪 Loja",  href: "/" },
          { label: "📒 Álbum", href: "/album" },
        ].map(tab => {
          const active = tab.href === "/album";
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              style={{
                padding: "14px 20px",
                background: "none", border: "none",
                borderBottom: `2px solid ${active ? "#00e676" : "transparent"}`,
                color: active ? "#00e676" : "rgba(255,255,255,.4)",
                fontFamily: "'Bebas Neue',cursive", fontSize: 16, letterSpacing: 3,
                cursor: "pointer", transition: "color .15s",
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 16px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div>
            <div className="bebas" style={{ fontSize: 28, letterSpacing: 5, color: "rgba(255,255,255,.9)" }}>
              Meu Álbum
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginTop: 4 }}>
              Coleção pessoal de figurinhas
            </div>
          </div>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,rgba(0,230,118,.3),transparent)" }} />
        </div>

        {/* Stats bar */}
        <div style={{
          display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32,
        }}>
          {[
            { label: "Total",      value: total,            color: "#fff",    icon: "🃏" },
            { label: "Únicas",     value: unique,           color: "#00e676", icon: "✨" },
            { label: "Lendárias",  value: stats.legendary,  color: "#ffd700", icon: "🌟" },
            { label: "Épicas",     value: stats.epic,       color: "#b44fff", icon: "💜" },
            { label: "Raras",      value: stats.rare,       color: "#2196f3", icon: "🔵" },
            { label: "Comuns",     value: stats.common,     color: "#9e9e9e", icon: "⚪" },
          ].map(s => (
            <div key={s.label} style={{
              background: "#0b130b",
              border: `1px solid ${s.color}22`,
              borderRadius: 12, padding: "12px 18px",
              display: "flex", flexDirection: "column", gap: 2, minWidth: 80,
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", letterSpacing: 2, textTransform: "uppercase" }}>
                {s.icon} {s.label}
              </div>
              <div className="bebas" style={{ fontSize: 26, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs por raridade */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {[
            { key: "all",       label: "Todas" },
            { key: "legendary", label: "Lendárias" },
            { key: "epic",      label: "Épicas" },
            { key: "rare",      label: "Raras" },
            { key: "common",    label: "Comuns" },
          ].map(f => {
            const active = filter === f.key;
            const color  = f.key === "all" ? "#00e676" : RARITY_COLOR[f.key] ?? "#fff";
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  padding: "7px 18px", borderRadius: 20,
                  border: `1px solid ${active ? color + "88" : "rgba(255,255,255,.1)"}`,
                  background: active ? color + "18" : "transparent",
                  color: active ? color : "rgba(255,255,255,.5)",
                  fontSize: 12, cursor: "pointer", transition: "all .15s",
                }}
              >
                {f.label}
                {f.key !== "all" && (
                  <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>
                    ({f.key === "legendary" ? stats.legendary
                      : f.key === "epic" ? stats.epic
                      : f.key === "rare" ? stats.rare
                      : stats.common})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Estado vazio */}
        {!loading && entries.length === 0 && (
          <div style={{
            textAlign: "center", padding: "80px 24px",
            background: "#0b130b", border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 20,
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📒</div>
            <div className="bebas" style={{ fontSize: 28, letterSpacing: 4, color: "rgba(255,255,255,.5)" }}>
              Álbum Vazio
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.3)", marginTop: 8, marginBottom: 28 }}>
              Abra pacotes na loja para começar sua coleção!
            </div>
            <button
              onClick={() => router.push("/")}
              style={{
                padding: "14px 32px",
                background: "linear-gradient(135deg,#00e676,#00b248)",
                border: "none", borderRadius: 12,
                fontFamily: "'Bebas Neue',cursive", fontSize: 18, letterSpacing: 3,
                color: "#000", cursor: "pointer",
              }}
            >
              Ir para a Loja
            </button>
          </div>
        )}

        {/* Carregando */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div className="bebas" style={{ fontSize: 20, color: "rgba(0,230,118,.5)", letterSpacing: 4 }}>
              Carregando álbum...
            </div>
          </div>
        )}

        {/* Cards agrupados por raridade */}
        {!loading && groupedByRarity.map(group => (
          <div key={group.rarity} style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div className="bebas" style={{ fontSize: 22, letterSpacing: 4, color: RARITY_COLOR[group.rarity] }}>
                {RARITY_LABEL[group.rarity]}
              </div>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${RARITY_COLOR[group.rarity]}44,transparent)` }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>
                {group.items.length} tipo{group.items.length > 1 ? "s" : ""}
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
              {group.items.map(({ card, count }) => (
                <div key={card.id} style={{ position: "relative" }}>
                  <PlayerCard card={card} flipped size="sm" />

                  {/* Badge de quantidade */}
                  {count > 1 && (
                    <div style={{
                      position: "absolute", top: 6, right: 6,
                      background: "#00e676", color: "#000",
                      fontSize: 10, fontWeight: 900,
                      width: 22, height: 22, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 0 8px rgba(0,230,118,.6)",
                      border: "2px solid #060c06",
                    }}>
                      ×{count}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </>
  );
}
