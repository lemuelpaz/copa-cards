import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllConfigs, setConfig } from "@/lib/utils";

export const dynamic = 'force-dynamic'


export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const configs = await getAllConfigs();
  return NextResponse.json({ configs });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    await setConfig(key, String(value));
  }
  return NextResponse.json({ ok: true });
}
