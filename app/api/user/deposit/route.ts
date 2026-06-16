import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getConfig } from "@/lib/utils";
import { createPixCharge } from "@/lib/veopag";

export const dynamic = 'force-dynamic'


export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { amount } = await req.json();
  const minDeposit = parseFloat((await getConfig("min_deposit")) || "10");

  if (!amount || isNaN(amount) || amount < minDeposit)
    return NextResponse.json(
      { error: `Valor mínimo de depósito: R$ ${minDeposit.toFixed(2)}` },
      { status: 400 },
    );

  // Cria o registro pendente para obter um ID (usado como externalId no VeoPag)
  const deposit = await db.deposit.create({
    data: { userId: session.userId, amount, status: "pending" },
  });

  try {
    const charge = await createPixCharge({
      amount,
      externalId:  deposit.id,
      description: `Depósito Copa 2026 — R$ ${amount.toFixed(2)}`,
    });

    const updated = await db.deposit.update({
      where: { id: deposit.id },
      data: {
        txid:          charge.txid,
        qrcode:        charge.qrcode,
        qrcodeBase64:  charge.qrcodeBase64 ?? null,
        qrcodeUrl:     charge.qrcodeUrl    ?? null,
        expiresAt:     charge.expiresAt ? new Date(charge.expiresAt) : null,
      },
    });

    return NextResponse.json({
      depositId:    updated.id,
      amount:       updated.amount,
      qrcode:       updated.qrcode,
      qrcodeBase64: updated.qrcodeBase64,
      qrcodeUrl:    updated.qrcodeUrl,
      expiresAt:    updated.expiresAt,
    });
  } catch (err: any) {
    await db.deposit.delete({ where: { id: deposit.id } });
    return NextResponse.json({ error: err.message ?? "Erro ao gerar QR Code PIX" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const deposits = await db.deposit.findMany({
    where:   { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take:    20,
  });

  return NextResponse.json({ deposits });
}
