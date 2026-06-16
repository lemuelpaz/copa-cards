import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { setConfig, getConfig } from "@/lib/utils";

export const dynamic = 'force-dynamic'


export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const keys = ["veopag_client_id","veopag_client_secret","veopag_webhook_secret","veopag_environment","veopag_base_url"];
  const result: Record<string,string> = {};
  for (const k of keys) result[k] = await getConfig(k);
  return NextResponse.json({ config: result });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await req.json();
  const allowed = ["veopag_client_id","veopag_client_secret","veopag_webhook_secret","veopag_environment","veopag_base_url"];
  for (const key of allowed) {
    if (body[key] !== undefined) await setConfig(key, String(body[key]));
  }

  return NextResponse.json({ ok: true });
}

// Test VeoPag connection
export async function PUT() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const clientId     = await getConfig("veopag_client_id");
  const clientSecret = await getConfig("veopag_client_secret");
  const baseUrl      = await getConfig("veopag_base_url");

  if (!clientId || !clientSecret) return NextResponse.json({ error: "Credenciais não configuradas" }, { status: 400 });

  try {
    const res = await fetch(`${baseUrl}/v1/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    });
    if (res.ok) return NextResponse.json({ ok: true, message: "Conexão bem-sucedida!" });
    const body = await res.json().catch(() => ({}));
    const msg = body.message ?? body.error ?? `HTTP ${res.status}`;
    return NextResponse.json({ error: `Falha na autenticação: ${msg}` }, { status: 400 });
  } catch (e: any) {
    const code = e?.cause?.code ?? e?.code ?? e?.message ?? "network error";
    const hint =
      code === "ENOTFOUND"    ? " (DNS não resolveu — URL incorreta ou serviço inexistente)" :
      code === "ECONNREFUSED" ? " (conexão recusada pelo servidor)" : "";
    return NextResponse.json({ error: `Falha de rede ao conectar em ${baseUrl}: ${code}${hint}` }, { status: 500 });
  }
}
