import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/veopag";

export async function POST(req: NextRequest) {
  const payload   = await req.text();
  const signature = req.headers.get("x-veopag-signature") ??
                    req.headers.get("x-webhook-signature") ?? "";

  const valid = await verifyWebhookSignature(payload, signature);
  if (!valid) return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });

  let event: any;
  try { event = JSON.parse(payload); }
  catch { return NextResponse.json({ error: "Payload inválido" }, { status: 400 }); }

  const type = event.type ?? event.evento;

  if (
    type === "pix.received"       ||
    type === "payment.confirmed"  ||
    type === "cobranca.paga"      ||
    type === "PAGAMENTO_RECEBIDO"
  ) {
    const externalId =
      event.data?.external_id ?? event.external_id ??
      event.data?.externalId  ?? event.externalId;

    if (!externalId) return NextResponse.json({ ok: true });

    const deposit = await db.deposit.findUnique({ where: { id: externalId } });

    // Idempotência — ignorar se já confirmado
    if (!deposit || deposit.status !== "pending")
      return NextResponse.json({ ok: true });

    await db.$transaction([
      db.deposit.update({
        where: { id: deposit.id },
        data:  { status: "confirmed" },
      }),
      db.user.update({
        where: { id: deposit.userId },
        data:  { balance: { increment: deposit.amount } },
      }),
      db.transaction.create({
        data: {
          userId: deposit.userId,
          type:   "deposit",
          amount: deposit.amount,
          detail: `Depósito PIX confirmado — R$ ${deposit.amount.toFixed(2)}`,
        },
      }),
    ]);
  }

  return NextResponse.json({ ok: true });
}
