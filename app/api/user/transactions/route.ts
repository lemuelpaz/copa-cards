import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic'


export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const transactions = await db.transaction.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ transactions });
}
