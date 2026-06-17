import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const packs = await db.pack.findMany({ orderBy: { price: "asc" } });
  return NextResponse.json({ packs });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id, wCommon, wRare, wEpic, wLegendary, price, cards } = await req.json();
  if (!id) return NextResponse.json({ error: "ID do pacote obrigatório" }, { status: 400 });

  const total = (wCommon ?? 0) + (wRare ?? 0) + (wEpic ?? 0) + (wLegendary ?? 0);
  if (total <= 0)
    return NextResponse.json({ error: "A soma dos pesos deve ser maior que zero" }, { status: 400 });

  const pack = await db.pack.update({
    where: { id },
    data: {
      wCommon:    Math.max(0, Math.round(wCommon    ?? 0)),
      wRare:      Math.max(0, Math.round(wRare      ?? 0)),
      wEpic:      Math.max(0, Math.round(wEpic      ?? 0)),
      wLegendary: Math.max(0, Math.round(wLegendary ?? 0)),
      ...(price !== undefined && { price: Math.max(0.01, parseFloat(price)) }),
      ...(cards !== undefined && { cards: Math.max(1,    Math.round(cards))  }),
    },
  });

  return NextResponse.json({ ok: true, pack });
}
