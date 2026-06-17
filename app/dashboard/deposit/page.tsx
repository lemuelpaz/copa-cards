"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import Navbar from "@/components/Navbar";

const fmt = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface User { balance: number; name: string | null; phone: string; role: string; }

const QUICK_AMOUNTS = [10, 25, 50, 100, 200, 500];
const POLL_INTERVAL = 3000;

const inputStyle: React.CSSProperties = {
  width: "100%", background: "#111a11", border: "1px solid rgba(0,230,118,.2)",
  borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 15,
  outline: "none", fontFamily: "Inter,sans-serif",
};

export default function DepositPage() {
  const router = useRouter();
  const [user,    setUser]    = useState<User | null>(null);
  const [amount,  setAmount]  = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // QR code state
  const [depositId,    setDepositId]    = useState<string | null>(null);
  const [qrcode,       setQrcode]       = useState<string>("");
  const [qrcodeBase64, setQrcodeBase64] = useState<string>("");
  const [qrcodeUrl,    setQrcodeUrl]    = useState<string>("");
  const [expiresAt,    setExpiresAt]    = useState<Date | null>(null);
  const [status,       setStatus]       = useState<"idle" | "pending" | "confirmed" | "expired">("idle");
  const [copied,       setCopied]       = useState(false);
  const [timeLeft,     setTimeLeft]     = useState(0);

  const pollRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.user) { router.push("/login"); return; }
      setUser(d.user);
    });
  }, [router]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt || status !== "pending") return;
    const tick = () => {
      const left = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) setStatus("expired");
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [expiresAt, status]);

  // Generate QR code image from PIX string when the API doesn't return one
  useEffect(() => {
    if (!qrcode || qrcodeBase64 || qrcodeUrl) return;
    QRCode.toDataURL(qrcode, { width: 300, margin: 2, color: { dark: "#000", light: "#fff" } })
      .then(dataUrl => setQrcodeBase64(dataUrl.replace("data:image/png;base64,", "")))
      .catch(() => {});
  }, [qrcode]);

  // Poll deposit status
  useEffect(() => {
    if (!depositId || status !== "pending") return;

    const poll = async () => {
      try {
        const res  = await fetch(`/api/user/deposit/${depositId}`);
        const data = await res.json();
        if (data.deposit?.status === "confirmed") {
          setStatus("confirmed");
          setUser(u => u ? { ...u, balance: u.balance + (amount as number) } : u);
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }
      } catch { /* silent */ }
      pollRef.current = setTimeout(poll, POLL_INTERVAL);
    };

    pollRef.current = setTimeout(poll, POLL_INTERVAL);
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [depositId, status]);

  async function handleGenerate() {
    if (!amount || (amount as number) < 1) { setError("Informe um valor válido"); return; }
    setLoading(true);
    setError("");

    const res  = await fetch("/api/user/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount) }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Erro ao gerar QR Code"); return; }

    setDepositId(data.depositId);
    setQrcode(data.qrcode ?? "");
    setQrcodeBase64(data.qrcodeBase64 ?? "");
    setQrcodeUrl(data.qrcodeUrl ?? "");
    setExpiresAt(data.expiresAt ? new Date(data.expiresAt) : null);
    setStatus("pending");
  }

  function handleCopy() {
    navigator.clipboard.writeText(qrcode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleNew() {
    if (pollRef.current)  clearTimeout(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("idle");
    setDepositId(null);
    setQrcode("");
    setQrcodeBase64("");
    setQrcodeUrl("");
    setExpiresAt(null);
    setAmount("");
    setError("");
  }

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (!user) return null;

  return (
    <>
      <Navbar balance={user.balance} role={user.role} userName={user.name ?? user.phone} />
      <main style={{ maxWidth: 520, margin: "0 auto", padding: "40px 20px 80px", position: "relative", zIndex: 1 }}>

        <button onClick={() => router.back()} style={{
          fontSize: 12, color: "rgba(255,255,255,.4)", background: "none",
          border: "none", cursor: "pointer", letterSpacing: 2, textTransform: "uppercase",
          marginBottom: 24, display: "flex", alignItems: "center", gap: 8,
        }}>
          ← Voltar
        </button>

        <div className="bebas" style={{ fontSize: 36, letterSpacing: 4, marginBottom: 4 }}>
          Depositar
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginBottom: 32 }}>
          Saldo atual: <strong style={{ color: "#00e676" }}>{fmt(user.balance)}</strong>
        </p>

        {/* ── CONFIRMED ── */}
        {status === "confirmed" && (
          <div style={{
            background: "rgba(0,230,118,.1)", border: "1px solid rgba(0,230,118,.3)",
            borderRadius: 20, padding: "40px 32px", textAlign: "center",
            animation: "slideUp .4s ease forwards",
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <div className="bebas" style={{ fontSize: 28, color: "#00e676", letterSpacing: 3 }}>
              Depósito Confirmado!
            </div>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.55)", margin: "12px 0 24px" }}>
              {fmt(amount as number)} adicionados ao seu saldo.
            </p>
            <button onClick={() => router.push("/")} style={{
              padding: "12px 32px", background: "linear-gradient(135deg,#00e676,#00b248)",
              border: "none", borderRadius: 12, fontFamily: "'Bebas Neue',cursive",
              fontSize: 18, letterSpacing: 3, color: "#000", cursor: "pointer",
            }}>
              Comprar Pacotes
            </button>
          </div>
        )}

        {/* ── QR CODE ── */}
        {(status === "pending" || status === "expired") && (
          <div style={{
            background: "#0b130b", border: "1px solid rgba(0,230,118,.12)",
            borderRadius: 20, padding: "28px 24px",
            animation: "slideUp .35s ease forwards",
          }}>
            {/* header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div className="bebas" style={{ fontSize: 20, letterSpacing: 3, color: "#fff" }}>
                  PIX Copia e Cola
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", marginTop: 2 }}>
                  Valor: <strong style={{ color: "#00e676" }}>{fmt(amount as number)}</strong>
                </div>
              </div>
              {status === "pending" && expiresAt && (
                <div style={{
                  textAlign: "center", background: "rgba(0,230,118,.08)",
                  border: "1px solid rgba(0,230,118,.2)", borderRadius: 10, padding: "6px 14px",
                }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.4)", letterSpacing: 2, textTransform: "uppercase" }}>
                    Expira em
                  </div>
                  <div className="bebas" style={{ fontSize: 20, color: timeLeft < 60 ? "#ff5252" : "#00e676" }}>
                    {fmtTime(timeLeft)}
                  </div>
                </div>
              )}
            </div>

            {/* QR code image */}
            {(qrcodeBase64 || qrcodeUrl) && (
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <img
                  src={qrcodeBase64 ? `data:image/png;base64,${qrcodeBase64}` : qrcodeUrl}
                  alt="QR Code PIX"
                  style={{ width: 200, height: 200, borderRadius: 12,
                    border: "2px solid rgba(0,230,118,.25)", background: "#fff", padding: 4 }}
                />
              </div>
            )}

            {/* EMV string */}
            {qrcode && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", letterSpacing: 2,
                  textTransform: "uppercase", marginBottom: 8 }}>
                  Código PIX
                </div>
                <div style={{
                  background: "#111a11", border: "1px solid rgba(0,230,118,.15)",
                  borderRadius: 10, padding: "12px 14px",
                  fontSize: 11, color: "rgba(255,255,255,.6)",
                  wordBreak: "break-all", lineHeight: 1.6,
                  fontFamily: "monospace", maxHeight: 80, overflow: "hidden",
                }}>
                  {qrcode}
                </div>
                <button onClick={handleCopy} style={{
                  marginTop: 10, width: "100%", padding: "12px",
                  background: copied ? "rgba(0,230,118,.2)" : "rgba(255,255,255,.06)",
                  border: `1px solid ${copied ? "rgba(0,230,118,.4)" : "rgba(255,255,255,.12)"}`,
                  borderRadius: 10, color: copied ? "#00e676" : "rgba(255,255,255,.7)",
                  fontSize: 13, cursor: "pointer", letterSpacing: 1, transition: "all .2s",
                  fontFamily: "Inter,sans-serif",
                }}>
                  {copied ? "✓ Copiado!" : "📋 Copiar Código PIX"}
                </button>
              </div>
            )}

            {/* status */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
              background: status === "expired" ? "rgba(255,82,82,.08)" : "rgba(0,230,118,.06)",
              border: `1px solid ${status === "expired" ? "rgba(255,82,82,.2)" : "rgba(0,230,118,.15)"}`,
              borderRadius: 10, marginBottom: 16,
            }}>
              {status === "pending" ? (
                <>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", background: "#00e676",
                    animation: "glowPulse 1s ease-in-out infinite", flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>
                    Aguardando pagamento... verificando automaticamente
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 16 }}>⏰</span>
                  <span style={{ fontSize: 12, color: "#ff5252" }}>QR Code expirado</span>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleNew} style={{
                flex: 1, padding: "12px",
                background: "transparent", border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 10, color: "rgba(255,255,255,.5)", fontSize: 13,
                cursor: "pointer", fontFamily: "Inter,sans-serif",
              }}>
                Gerar novo
              </button>
              {status === "expired" && (
                <button onClick={handleGenerate} style={{
                  flex: 2, padding: "12px",
                  background: "linear-gradient(135deg,#00e676,#00b248)",
                  border: "none", borderRadius: 10,
                  fontFamily: "'Bebas Neue',cursive", fontSize: 16,
                  letterSpacing: 2, color: "#000", cursor: "pointer",
                }}>
                  Tentar novamente
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── FORM ── */}
        {status === "idle" && (
          <div style={{
            background: "#0b130b", border: "1px solid rgba(0,230,118,.12)",
            borderRadius: 20, padding: "28px 24px",
          }}>

            {/* Quick amounts */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", letterSpacing: 2,
                textTransform: "uppercase", marginBottom: 12 }}>
                Valor do Depósito
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
                {QUICK_AMOUNTS.map(v => (
                  <button key={v} onClick={() => setAmount(v)} style={{
                    padding: "10px 8px", borderRadius: 10,
                    border: `1px solid ${amount === v ? "rgba(0,230,118,.6)" : "rgba(255,255,255,.1)"}`,
                    background: amount === v ? "rgba(0,230,118,.12)" : "transparent",
                    color: amount === v ? "#00e676" : "rgba(255,255,255,.55)",
                    fontFamily: "'Bebas Neue',cursive", fontSize: 17, letterSpacing: 1,
                    cursor: "pointer", transition: "all .15s",
                  }}>
                    {fmt(v)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Outro valor (R$)"
                value={amount === "" ? "" : amount}
                onChange={e => setAmount(e.target.value === "" ? "" : parseFloat(e.target.value))}
                min="1"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "rgba(0,230,118,.6)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(0,230,118,.2)")}
              />
            </div>

            {/* Info box */}
            <div style={{
              display: "flex", gap: 10, padding: "12px 14px",
              background: "rgba(0,230,118,.05)", border: "1px solid rgba(0,230,118,.12)",
              borderRadius: 10, marginBottom: 20,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🔐</span>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", lineHeight: 1.5 }}>
                Um <strong style={{ color: "rgba(255,255,255,.7)" }}>QR Code PIX</strong> será gerado. Abra seu
                app bancário, escaneie ou cole o código e confirme o pagamento. O saldo é creditado automaticamente.
              </div>
            </div>

            {error && (
              <p style={{
                color: "#ff5252", fontSize: 13, marginBottom: 16, padding: "10px 14px",
                background: "rgba(255,82,82,.1)", borderRadius: 8,
              }}>
                {error}
              </p>
            )}

            <button onClick={handleGenerate} disabled={loading || !amount} style={{
              width: "100%", padding: "14px",
              background: loading || !amount
                ? "rgba(255,255,255,.08)"
                : "linear-gradient(135deg,#00e676,#00b248)",
              border: "none", borderRadius: 12,
              fontFamily: "'Bebas Neue',cursive", fontSize: 18, letterSpacing: 3,
              color: loading || !amount ? "rgba(255,255,255,.3)" : "#000",
              cursor: loading || !amount ? "not-allowed" : "pointer",
              transition: "all .2s",
            }}>
              {loading ? "Gerando QR Code..." : "Gerar QR Code PIX"}
            </button>
          </div>
        )}
      </main>
    </>
  );
}
