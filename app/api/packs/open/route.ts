import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getConfig, applyWinRate, weightedPick, PackWeights } from "@/lib/utils";

export const dynamic = 'force-dynamic'


const STRIP_COUNT = 30;
const WIN_IDX = 23;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { packId } = await req.json();
  const pack = await db.pack.findUnique({ where: { id: packId } });
  if (!pack || !pack.active) return NextResponse.json({ error: "Pacote inválido" }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  if (user.balance < pack.price) return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });

  const winRate = parseFloat((await getConfig("win_rate")) || "50");
  const baseWeights: PackWeights = { common: pack.wCommon, rare: pack.wRare, epic: pack.wEpic, legendary: pack.wLegendary };
  const weights = applyWinRate(baseWeights, winRate);

  const allCards = await db.card.findMany({ where: { active: true } });
  const byRarity = (r: string) => allCards.filter((c) => c.rarity === r);

  // Draw the single winning card
  const rarity = weightedPick(weights);
  const pool = byRarity(rarity);
  const winner = pool.length > 0
    ? pool[Math.floor(Math.random() * pool.length)]
    : (() => {
        const fallback = byRarity("common");
        return fallback[Math.floor(Math.random() * fallback.length)];
      })();

  // Build roulette strip (winner at WIN_IDX, rest are random filler)
  const strip = Array.from({ length: STRIP_COUNT }, (_, i) => {
    if (i === WIN_IDX) return winner;
    const r = weightedPick(weights);
    const p = byRarity(r);
    const src = p.length > 0 ? p : byRarity("common");
    return src[Math.floor(Math.random() * src.length)];
  });

  const totalValue = winner.value;
  const newBalance = user.balance - pack.price + totalValue;

  const ops: any[] = [
    db.user.update({ where: { id: user.id }, data: { balance: newBalance } }),
    db.transaction.create({ data: {
      userId: user.id,
      type: "pack_open",
      amount: totalValue - pack.price,
      detail: `${pack.name} — ${winner.name}`,
    }}),
    db.userCard.create({ data: { userId: user.id, cardId: winner.id } }),
  ];

  // Comissão de afiliado: se o usuário foi referido por um afiliado ativo
  if (user.referredById) {
    const affiliate = await db.affiliate.findUnique({ where: { id: user.referredById } });
    if (affiliate && affiliate.status === "active") {
      const commission = parseFloat((pack.price * (affiliate.percent / 100)).toFixed(2));
      ops.push(
        db.affiliate.update({ where: { id: affiliate.id }, data: { totalEarned: { increment: commission } } }),
        db.user.update({ where: { id: affiliate.userId }, data: { balance: { increment: commission } } }),
        db.transaction.create({ data: {
          userId: affiliate.userId,
          type: "affiliate_commission",
          amount: commission,
          detail: `Comissão ${affiliate.percent}% — ${pack.name} de ${user.phone}`,
        }}),
      );
    }
  }

  await db.$transaction(ops);

  return NextResponse.json({ card: winner, strip, packCost: pack.price, totalValue, delta: totalValue - pack.price, newBalance });
}
