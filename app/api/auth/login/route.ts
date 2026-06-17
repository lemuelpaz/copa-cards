import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signToken, setCookie } from "@/lib/auth";
import { formatPhone, getConfig } from "@/lib/utils";

export const dynamic = 'force-dynamic'


export async function POST(req: NextRequest) {
  try {
    const { phone, name, refCode } = await req.json();
    const clean = formatPhone(phone ?? "");
    if (clean.length < 10) return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });

    let user = await db.user.findUnique({ where: { phone: clean } });

    if (!user) {
      let initialBalance = 0;
      try {
        const cfg = await getConfig("initial_balance");
        if (cfg) initialBalance = parseFloat(cfg);
      } catch { /* SiteConfig table may not exist yet */ }

      let referredById: string | null = null;
      if (refCode) {
        try {
          const affiliate = await db.affiliate.findUnique({
            where: { code: String(refCode).toUpperCase() },
          });
          if (affiliate && affiliate.status === "active") referredById = affiliate.id;
        } catch { /* Affiliate table may not exist yet */ }
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
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
