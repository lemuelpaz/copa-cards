import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const deposit = await db.deposit.findFirst({
    where: { id: params.id, userId: session.userId },
  });

  if (!deposit) return NextResponse.json({ error: "Depósito não encontrado" }, { status: 404 });

  return NextResponse.json({ deposit });
}
