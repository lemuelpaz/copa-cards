import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const affiliate = await db.affiliate.findUnique({
    where: { userId: session.userId },
    include: { user: { select: { name: true, phone: true } } },
  });

  // Count users referred by this affiliate
  const referralCount = affiliate
    ? await db.user.count({ where: { referredById: affiliate.id } })
    : 0;

  return NextResponse.json({ affiliate, referralCount });
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const existing = await db.affiliate.findUnique({ where: { userId: session.userId } });
  if (existing) return NextResponse.json({ error: "Você já tem uma solicitação de afiliado" }, { status: 400 });

  // Generate unique code
  let code = genCode();
  while (await db.affiliate.findUnique({ where: { code } })) {
    code = genCode();
  }

  const affiliate = await db.affiliate.create({
    data: { userId: session.userId, code, status: "pending" },
  });

  return NextResponse.json({ affiliate });
}
