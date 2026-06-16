"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res  = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Credenciais inválidas");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  const field: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(0,230,118,.18)",
    borderRadius: 10,
    padding: "13px 16px",
    color: "#fff",
    fontSize: 15,
    outline: "none",
    fontFamily: "Inter, sans-serif",
    transition: "border-color .2s",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060c06",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Grid de fundo */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "repeating-linear-gradient(90deg,transparent,transparent 48px,rgba(0,230,118,.025) 48px,rgba(0,230,118,.025) 49px),repeating-linear-gradient(0deg,transparent,transparent 48px,rgba(0,230,118,.025) 48px,rgba(0,230,118,.025) 49px)",
      }} />

      <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }}>
        {/* Cabeçalho */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(0,230,118,.1)", border: "1px solid rgba(0,230,118,.3)",
            marginBottom: 16,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div className="bebas" style={{
            fontSize: 28, letterSpacing: 4, color: "#00e676",
            textShadow: "0 0 30px rgba(0,230,118,.4)",
          }}>
            COPA 2026
          </div>
          <div style={{
            fontSize: 10, letterSpacing: 5, color: "rgba(255,255,255,.3)",
            textTransform: "uppercase", marginTop: 4,
          }}>
            Acesso Administrativo
          </div>
        </div>

        {/* Card do formulário */}
        <div style={{
          background: "rgba(11,19,11,.92)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0,230,118,.12)",
          borderRadius: 20,
          padding: "32px 28px",
        }}>
          <form onSubmit={handleSubmit}>
            {/* Usuário */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                fontSize: 10, color: "rgba(255,255,255,.35)",
                letterSpacing: 2, textTransform: "uppercase",
                display: "block", marginBottom: 8,
              }}>
                Usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                style={field}
                onFocus={e  => (e.target.style.borderColor = "rgba(0,230,118,.6)")}
                onBlur={e   => (e.target.style.borderColor = "rgba(0,230,118,.18)")}
              />
            </div>

            {/* Senha */}
            <div style={{ marginBottom: 20, position: "relative" }}>
              <label style={{
                fontSize: 10, color: "rgba(255,255,255,.35)",
                letterSpacing: 2, textTransform: "uppercase",
                display: "block", marginBottom: 8,
              }}>
                Senha
              </label>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ ...field, paddingRight: 44 }}
                onFocus={e  => (e.target.style.borderColor = "rgba(0,230,118,.6)")}
                onBlur={e   => (e.target.style.borderColor = "rgba(0,230,118,.18)")}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: "absolute", right: 12, bottom: 12,
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,.3)", padding: 2,
                }}
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            {/* Erro */}
            {error && (
              <div style={{
                marginBottom: 16, padding: "10px 14px",
                background: "rgba(255,82,82,.08)",
                border: "1px solid rgba(255,82,82,.25)",
                borderRadius: 10, fontSize: 13, color: "#ff5252",
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "14px",
                background: loading ? "rgba(0,230,118,.4)" : "linear-gradient(135deg,#00e676,#00b248)",
                border: "none", borderRadius: 12,
                fontFamily: "'Bebas Neue', cursive",
                fontSize: 18, letterSpacing: 3, color: "#000",
                cursor: loading ? "wait" : "pointer",
                transition: "opacity .2s",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = ".88"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
            >
              {loading ? "Autenticando..." : "Entrar no Painel"}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: "center", marginTop: 20,
          fontSize: 11, color: "rgba(255,255,255,.15)", letterSpacing: 1,
        }}>
          Acesso restrito a administradores
        </p>
      </div>
    </div>
  );
}
