import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const [transactions, users, totalDeposited, totalWithdrawn] = await Promise.all([
    db.transaction.findMany({ include: { user: { select: { name: true, phone: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.user.count(),
    db.transaction.aggregate({ where: { type: "pack_open", amount: { gt: 0 } }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { type: "withdrawal" }, _sum: { amount: true } }),
  ]);

  return NextResponse.json({ transactions, userCount: users, totalProfit: totalDeposited._sum.amount ?? 0, totalWithdrawn: Math.abs(totalWithdrawn._sum.amount ?? 0) });
}
