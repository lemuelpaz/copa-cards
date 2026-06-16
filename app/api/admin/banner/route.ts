import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { setConfig, getAllConfigs } from "@/lib/utils";
import { writeFile } from "fs/promises";
import path from "path";

export const dynamic = 'force-dynamic'


export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const configs = await getAllConfigs();
  return NextResponse.json({ configs });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const formData = await req.formData();
  const title    = formData.get("banner_title") as string;
  const subtitle = formData.get("banner_subtitle") as string;
  const eyebrow  = formData.get("banner_eyebrow") as string;
  const file     = formData.get("banner_image") as File | null;

  if (title)    await setConfig("banner_title", title);
  if (subtitle) await setConfig("banner_subtitle", subtitle);
  if (eyebrow)  await setConfig("banner_eyebrow", eyebrow);

  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext    = file.name.split(".").pop();
    const fname  = `banner.${ext}`;
    await writeFile(path.join(process.cwd(), "public/uploads", fname), buffer);
    await setConfig("banner_image", `/uploads/${fname}`);
  }

  return NextResponse.json({ ok: true });
}
