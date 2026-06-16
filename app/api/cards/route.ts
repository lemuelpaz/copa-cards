import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile } from "fs/promises";
import path from "path";

export async function GET() {
  const cards = await db.card.findMany({ where: { active: true }, orderBy: { rarity: "asc" } });
  return NextResponse.json({ cards });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const formData = await req.formData();
  const name     = formData.get("name") as string;
  const country  = formData.get("country") as string;
  const flag     = formData.get("flag") as string;
  const position = formData.get("position") as string;
  const rating   = parseInt(formData.get("rating") as string);
  const rarity   = formData.get("rarity") as string;
  const value    = parseFloat(formData.get("value") as string);
  const file     = formData.get("photo") as File | null;

  let photoPath: string | undefined;
  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext    = file.name.split(".").pop();
    const fname  = `${Date.now()}.${ext}`;
    await writeFile(path.join(process.cwd(), "public/uploads", fname), buffer);
    photoPath = `/uploads/${fname}`;
  }

  const card = await db.card.create({ data: { name, country, flag, position, rating, rarity, value, photo: photoPath } });
  return NextResponse.json({ card });
}
