import { NextRequest, NextResponse } from "next/server";
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
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, phone: true, name: true, balance: true, createdAt: true,
      affiliate: true,
    },
  });

  // Attach referral counts
  const affiliateIds = users.flatMap(u => u.affiliate ? [u.affiliate.id] : []);
  const counts = affiliateIds.length > 0
    ? await db.user.groupBy({
        by: ["referredById"],
        where: { referredById: { in: affiliateIds } },
        _count: { id: true },
      })
    : [];

  const countMap = Object.fromEntries(counts.map(c => [c.referredById!, c._count.id]));

  const result = users.map(u => ({
    ...u,
    referralCount: u.affiliate ? (countMap[u.affiliate.id] ?? 0) : 0,
  }));

  return NextResponse.json({ users: result });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const { userId, action, percent } = await req.json();

  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

  // "make" — create affiliate for a user that didn't request
  if (action === "make") {
    const existing = await db.affiliate.findUnique({ where: { userId } });
    if (existing) return NextResponse.json({ error: "Usuário já é afiliado" }, { status: 400 });

    let code = genCode();
    while (await db.affiliate.findUnique({ where: { code } })) code = genCode();

    const affiliate = await db.affiliate.create({
      data: { userId, code, status: "active", percent: percent ?? 10 },
    });
    return NextResponse.json({ affiliate });
  }

  const affiliate = await db.affiliate.findUnique({ where: { userId } });
  if (!affiliate) return NextResponse.json({ error: "Afiliado não encontrado" }, { status: 404 });

  if (action === "approve") {
    const updated = await db.affiliate.update({
      where: { id: affiliate.id },
      data: { status: "active", ...(percent != null ? { percent } : {}) },
    });
    return NextResponse.json({ affiliate: updated });
  }

  if (action === "pause") {
    const updated = await db.affiliate.update({
      where: { id: affiliate.id },
      data: { status: "paused" },
    });
    return NextResponse.json({ affiliate: updated });
  }

  if (action === "activate") {
    const updated = await db.affiliate.update({
      where: { id: affiliate.id },
      data: { status: "active" },
    });
    return NextResponse.json({ affiliate: updated });
  }

  if (action === "setPercent") {
    if (percent == null || percent < 0 || percent > 100)
      return NextResponse.json({ error: "Percentual inválido (0–100)" }, { status: 400 });

    const updated = await db.affiliate.update({
      where: { id: affiliate.id },
      data: { percent },
    });
    return NextResponse.json({ affiliate: updated });
  }

  if (action === "remove") {
    await db.affiliate.delete({ where: { id: affiliate.id } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
