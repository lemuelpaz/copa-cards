import { getConfig } from "./utils";

async function getGatewayConfig() {
  const clientId     = await getConfig("veopag_client_id");
  const clientSecret = await getConfig("veopag_client_secret");
  const baseUrl      = (await getConfig("veopag_base_url")) || "https://api.veopag.com";

  if (!clientId || !clientSecret)
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
    res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    });
  } catch (e: any) {
    const code = e?.cause?.code ?? e?.code ?? e?.message ?? "network error";
    const hint =
      code === "ENOTFOUND"    ? " (DNS não resolveu — verifique a URL em Admin → Gateway)" :
      code === "ECONNREFUSED" ? " (conexão recusada pelo servidor)" : "";
    throw new Error(`Não foi possível conectar ao gateway (${baseUrl}): ${code}${hint}`);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? body.error ?? `Autenticação falhou (HTTP ${res.status})`);
  }

  const data  = await res.json();
  const token = data.token ?? data.access_token;
  if (!token) throw new Error("Gateway não retornou token de autenticação.");

  return { token, baseUrl };
}

export interface PixCharge {
  txid:          string;
  qrcode:        string;
  qrcodeBase64?: string;
  qrcodeUrl?:    string;
  expiresAt:     string;
}

export async function createPixCharge(params: {
  amount:      number;  // em reais (BRL)
  externalId:  string;
  description: string;
  payer?: {
    document?: string;  // CPF (11 dígitos) ou CNPJ (14 dígitos)
    name?:     string;
    email?:    string;
  };
  callbackUrl?: string;
}): Promise<PixCharge> {
  const { token, baseUrl } = await getAccessToken();

  const siteUrl = await getConfig("site_url");

  const body: Record<string, unknown> = {
    amount:      params.amount, // reais (float)
    external_id: params.externalId,
  };

  if (params.payer) {
    const doc = params.payer.document?.replace(/\D/g, "");
    body.payer = {
      ...(doc ? { document: doc } : {}),
      name:  params.payer.name  ?? "Usuário",
      email: params.payer.email ?? `deposito_${params.externalId}@copa.cards`,
    };
  }

  const cbUrl = params.callbackUrl ?? (siteUrl ? `${siteUrl}/api/webhooks/veopag` : undefined);
  if (cbUrl) body.clientCallbackUrl = cbUrl;

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/payments/deposit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    throw new Error(`Erro de rede ao criar cobrança PIX: ${e?.message ?? "network error"}`);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? err.error ?? `Erro ao criar cobrança (HTTP ${res.status})`);
  }

  const d = await res.json();
  const r = d.qrCodeResponse ?? d;
  return {
    txid:         r.transactionId  ?? r.transaction_id ?? r.txid ?? r.id ?? params.externalId,
    qrcode:       r.qrcode         ?? r.emv ?? r.payload ?? r.qr_code ?? "",
    qrcodeBase64: r.qrcode_image   ?? r.qrcode_base64  ?? r.image_base64,
    qrcodeUrl:    r.qrcode_url     ?? r.image_url,
    expiresAt:    r.expires_at     ?? r.expiracao ?? r.expiresAt
                    ?? new Date(Date.now() + 3_600_000).toISOString(),
  };
}

export async function verifyWebhookSignature(
  payload:   string,
  signature: string,
): Promise<boolean> {
  const secret = await getConfig("veopag_webhook_secret");
  if (!secret) return true;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false, ["sign"],
    );
    const sig      = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const expected = Buffer.from(sig).toString("hex");
    return signature === expected || signature === `sha256=${expected}`;
  } catch {
    return false;
  }
}
