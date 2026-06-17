import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getConfig, setConfig } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });

  const pack = await db.pack.findUnique({ where: { id: "slot" } });
  const multiplier = parseFloat((await getConfig("slot_multiplier")) || "2");

  return NextResponse.json({
    bet:        pack?.price ?? 100,
    multiplier,
    active:     pack?.active ?? true,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });

  const { bet, multiplier, active } = await req.json();

  const betVal  = parseFloat(bet);
  const multVal = parseFloat(multiplier);

  if (isNaN(betVal)  || betVal  <= 0) return NextResponse.json({ error: "Aposta inválida" },      { status: 400 });
  if (isNaN(multVal) || multVal <= 1) return NextResponse.json({ error: "Multiplicador deve ser > 1" }, { status: 400 });

  await Promise.all([
    db.pack.upsert({
      where: { id: "slot" },
      update: { price: betVal, active: active ?? true },
      create: {
        id: "slot", name: "Slot de Jogadores", badge: "CASSINO",
        icon: "🎰", cards: 1, price: betVal,
        wCommon: 1, wRare: 0, wEpic: 0, wLegendary: 0,
        cssClass: "t-slot", active: active ?? true,
      },
    }),
    setConfig("slot_multiplier", String(multVal)),
  ]);

  return NextResponse.json({ ok: true });
}
