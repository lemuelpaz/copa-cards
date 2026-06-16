import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signToken, setCookie } from "@/lib/auth";
import { formatPhone, getConfig } from "@/lib/utils";

export const dynamic = 'force-dynamic'


export async function POST(req: NextRequest) {
  const { phone, name, refCode } = await req.json();
  const clean = formatPhone(phone ?? "");
  if (clean.length < 10) return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });

  let user = await db.user.findUnique({ where: { phone: clean } });

  if (!user) {
    const initialBalance = parseFloat((await getConfig("initial_balance")) || "1000");

    // Resolve affiliate referral code
    let referredById: string | null = null;
    if (refCode) {
      const affiliate = await db.affiliate.findUnique({
        where: { code: String(refCode).toUpperCase() },
      });
      if (affiliate && affiliate.status === "active") {
        referredById = affiliate.id;
      }
    }

    user = await db.user.create({
      data: { phone: clean, name: name ?? null, balance: initialBalance, referredById },
    });
  } else if (name && !user.name) {
    user = await db.user.update({ where: { id: user.id }, data: { name } });
  }

  const token = await signToken({ userId: user.id, phone: user.phone, role: user.role });
  setCookie(token);

  return NextResponse.json({
    ok: true,
    user: { id: user.id, phone: user.phone, name: user.name, role: user.role, balance: user.balance },
  });
}
