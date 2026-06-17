import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const rows = await db.userCard.findMany({
    where: { userId: session.userId },
    include: { card: true },
    orderBy: { obtainedAt: "desc" },
  });

  // Agrupar por cardId somando quantidade
  const map = new Map<string, { card: (typeof rows)[0]["card"]; count: number }>();
  for (const row of rows) {
    const entry = map.get(row.cardId);
    if (entry) {
      entry.count++;
    } else {
      map.set(row.cardId, { card: row.card, count: 1 });
    }
  }

  const cards  = Array.from(map.values());
  const total  = rows.length;
  const unique = cards.length;

  const byRarity = (r: string) => cards.filter(c => c.card.rarity === r).length;

  return NextResponse.json({
    cards,
    total,
    unique,
    stats: {
      legendary: byRarity("legendary"),
      epic:      byRarity("epic"),
      rare:      byRarity("rare"),
      common:    byRarity("common"),
    },
  });
}
