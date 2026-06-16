import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const packs = await db.pack.findMany({ where: { active: true }, orderBy: { price: "asc" } });
  return NextResponse.json({ packs });
}
