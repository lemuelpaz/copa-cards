import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signToken, setCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Credenciais obrigatórias" }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: { phone: String(username), role: "admin" },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const valid = await verifyPassword(String(password), user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, phone: user.phone, role: user.role });
    setCookie(token);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/auth/login]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
