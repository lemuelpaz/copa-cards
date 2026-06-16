import { getConfig } from "./utils";

async function getGatewayConfig() {
  const clientId     = await getConfig("veopag_client_id");
  const clientSecret = await getConfig("veopag_client_secret");
  const baseUrl      = await getConfig("veopag_base_url");

  if (!clientId || !clientSecret || !baseUrl)
    throw new Error("Gateway de pagamento não configurado. Acesse Admin → Gateway.");

  try { new URL(baseUrl); } catch {
    throw new Error("URL do gateway inválida. Configure em Admin → Gateway.");
  }

  return { clientId, clientSecret, baseUrl };
}

async function getAccessToken(): Promise<{ token: string; baseUrl: string }> {
  const { clientId, clientSecret, baseUrl } = await getGatewayConfig();

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/v1/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    });
  } catch (e: any) {
    const code = e?.cause?.code ?? e?.code ?? e?.message ?? "network error";
    const hint =
      code === "ENOTFOUND"    ? "DNS não resolveu — verifique a URL base em Admin → Gateway." :
      code === "ECONNREFUSED" ? "Conexão recusada pelo servidor." :
      code === "CERT_HAS_EXPIRED" ? "Certificado SSL expirado no servidor." : "";
    throw new Error(`Não foi possível conectar ao gateway (${baseUrl}). Código: ${code}. ${hint}`.trim());
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? body.error ?? `Autenticação no gateway falhou (${res.status})`);
  }

  const data = await res.json();
  return { token: data.access_token, baseUrl };
}

export interface PixCharge {
  txid:          string;
  qrcode:        string;  // EMV string (PIX Copia e Cola)
  qrcodeBase64?: string;  // base64 PNG
  qrcodeUrl?:    string;  // hosted image URL
  expiresAt:     string;
}

export async function createPixCharge(params: {
  amount:      number;
  externalId:  string;
  description: string;
}): Promise<PixCharge> {
  const { token, baseUrl } = await getAccessToken();

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/v1/pix/cobrancas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify({
        valor:       params.amount,
        descricao:   params.description,
        external_id: params.externalId,
        expiracao:   3600,
      }),
    });
  } catch (e: any) {
    throw new Error(`Erro ao criar cobrança PIX. (${e?.message ?? "network error"})`);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? err.error ?? `Erro ao criar cobrança PIX (${res.status})`);
  }

  const d = await res.json();
  return {
    txid:         d.id            ?? d.txid         ?? d.e2eId,
    qrcode:       d.qrcode        ?? d.emv          ?? d.payload   ?? d.qr_code,
    qrcodeBase64: d.qrcode_image  ?? d.qrcode_base64 ?? d.image_base64,
    qrcodeUrl:    d.qrcode_url    ?? d.image_url,
    expiresAt:    d.expires_at    ?? d.expiracao     ?? d.expiresAt,
  };
}

export async function verifyWebhookSignature(
  payload:   string,
  signature: string,
): Promise<boolean> {
  const secret = await getConfig("veopag_webhook_secret");
  if (!secret) return true; // sem secret → aceita (dev mode)

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false, ["sign"],
    );
    const sig      = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const expected = Buffer.from(sig).toString("hex");
    // aceita "hex" ou "sha256=hex" (formato GitHub-style)
    return signature === expected || signature === `sha256=${expected}`;
  } catch {
    return false;
  }
}
