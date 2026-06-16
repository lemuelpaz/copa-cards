import { getConfig } from "./utils";

async function getAccessToken(): Promise<string> {
  const clientId     = await getConfig("veopag_client_id");
  const clientSecret = await getConfig("veopag_client_secret");
  const baseUrl      = await getConfig("veopag_base_url");

  if (!clientId || !clientSecret)
    throw new Error("Credenciais VeoPag não configuradas. Configure em Admin → Gateway.");

  const res = await fetch(`${baseUrl}/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
  });

  if (!res.ok) throw new Error(`Autenticação VeoPag falhou (${res.status})`);
  const data = await res.json();
  return data.access_token;
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
  const token   = await getAccessToken();
  const baseUrl = await getConfig("veopag_base_url");

  const res = await fetch(`${baseUrl}/v1/pix/cobrancas`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      Authorization:   `Bearer ${token}`,
    },
    body: JSON.stringify({
      valor:       params.amount,
      descricao:   params.description,
      external_id: params.externalId,
      expiracao:   3600,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? err.error ?? `Erro VeoPag ${res.status}`);
  }

  const d = await res.json();
  return {
    txid:          d.id        ?? d.txid        ?? d.e2eId,
    qrcode:        d.qrcode    ?? d.emv         ?? d.payload ?? d.qr_code,
    qrcodeBase64:  d.qrcode_image ?? d.qrcode_base64 ?? d.image_base64,
    qrcodeUrl:     d.qrcode_url   ?? d.image_url,
    expiresAt:     d.expires_at   ?? d.expiracao ?? d.expiresAt,
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
