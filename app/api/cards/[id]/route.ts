import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, unlink } from "fs/promises";
import path from "path";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const formData = await req.formData();
  const data: Record<string, unknown> = {
    name:     formData.get("name"),
    country:  formData.get("country"),
    flag:     formData.get("flag"),
    position: formData.get("position"),
    rating:   parseInt(formData.get("rating") as string),
    rarity:   formData.get("rarity"),
    value:    parseFloat(formData.get("value") as string),
    active:   formData.get("active") === "true",
  };

  const file = formData.get("photo") as File | null;
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext    = file.name.split(".").pop();
    const fname  = `${Date.now()}.${ext}`;
    await writeFile(path.join(process.cwd(), "public/uploads", fname), buffer);
    data.photo = `/uploads/${fname}`;
  }

  const card = await db.card.update({ where: { id: params.id }, data });
  return NextResponse.json({ card });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const card = await db.card.findUnique({ where: { id: params.id } });
  if (card?.photo) {
    try { await unlink(path.join(process.cwd(), "public", card.photo)); } catch {}
  }
  await db.card.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
