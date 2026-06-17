import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("image") as File | null;

  if (!file || file.size === 0)
    return NextResponse.json({ error: "Nenhuma imagem enviada" }, { status: 400 });

  const buffer   = Buffer.from(await file.arrayBuffer());
  const destPath = path.join(process.cwd(), "public", "packs", "pack-slot.png");

  await writeFile(destPath, buffer);

  return NextResponse.json({ ok: true });
}
