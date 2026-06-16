import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic'


export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const withdrawals = await db.withdrawal.findMany({
    include: { user: { select: { name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ withdrawals });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { id, status, note } = await req.json();
  const withdrawal = await db.withdrawal.findUnique({ where: { id } });
  if (!withdrawal) return NextResponse.json({ error: "Saque não encontrado" }, { status: 404 });

  // If rejecting, refund balance
  if (status === "rejected" && withdrawal.status === "pending") {
    await db.user.update({ where: { id: withdrawal.userId }, data: { balance: { increment: withdrawal.amount } } });
    await db.transaction.create({ data: { userId: withdrawal.userId, type: "refund", amount: withdrawal.amount, detail: `Saque #${id} rejeitado — estornado` } });
  }

  await db.withdrawal.update({ where: { id }, data: { status, note: note ?? undefined } });
  return NextResponse.json({ ok: true });
}
