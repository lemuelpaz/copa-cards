import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getConfig } from "@/lib/utils";

export const dynamic = 'force-dynamic'


export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { amount, pixKey, pixType } = await req.json();
  const minW = parseFloat((await getConfig("min_withdrawal")) || "50");

  if (!amount || amount < minW) return NextResponse.json({ error: `Valor mínimo de saque: R$ ${minW}` }, { status: 400 });
  if (!pixKey) return NextResponse.json({ error: "Chave PIX obrigatória" }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || user.balance < amount) return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { balance: { decrement: amount } } }),
    db.withdrawal.create({ data: { userId: user.id, amount, pixKey, pixType: pixType ?? "cpf" } }),
    db.transaction.create({ data: { userId: user.id, type: "withdrawal", amount: -amount, detail: `Saque PIX — ${pixKey}` } }),
  ]);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const withdrawals = await db.withdrawal.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ withdrawals });
}
