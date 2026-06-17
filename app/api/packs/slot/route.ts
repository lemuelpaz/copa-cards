import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const STRIP_COUNT  = 28;
const RESULT_IDX   = 23;
const BRAZIL_CHANCE = 0.40; // 40% de chance por reel de sair jogador do Brasil

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { packId } = await req.json();
  const pack = await db.pack.findUnique({ where: { id: packId } });
  if (!pack || !pack.active) return NextResponse.json({ error: "Pacote inválido" }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  if (user.balance < pack.price) return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });

  const allCards    = await db.card.findMany({ where: { active: true } });
  const brazilCards = allCards.filter(c => c.country === "Brasil");
  const otherCards  = allCards.filter(c => c.country !== "Brasil");

  if (brazilCards.length === 0 || otherCards.length === 0) {
    return NextResponse.json({ error: "Cartas insuficientes no banco" }, { status: 500 });
  }

  function pickResult() {
    const isBrazil = Math.random() < BRAZIL_CHANCE;
    const pool = isBrazil ? brazilCards : otherCards;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function buildStrip(result: typeof allCards[0]) {
    return Array.from({ length: STRIP_COUNT }, (_, i) => {
      if (i === RESULT_IDX) return result;
      return allCards[Math.floor(Math.random() * allCards.length)];
    });
  }

  const results = [pickResult(), pickResult(), pickResult()];
  const strips  = results.map(r => buildStrip(r));
  const win     = results.every(r => r.country === "Brasil");

  const bet        = pack.price;
  const payout     = win ? bet * 2 : 0;
  const newBalance = user.balance - bet + payout;

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { balance: newBalance } }),
    db.transaction.create({ data: {
      userId: user.id,
      type:   "pack_open",
      amount: payout - bet,
      detail: `Slot de Jogadores — ${win ? "JACKPOT 🎰" : "Sem prêmio"}`,
    }}),
  ]);

  return NextResponse.json({
    reels: strips.map((strip, i) => ({ strip, result: results[i] })),
    win,
    bet,
    payout,
    newBalance,
  });
}
