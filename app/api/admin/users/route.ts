import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" }, select: { id:true, phone:true, name:true, balance:true, role:true, createdAt:true } });
  return NextResponse.json({ users });
}
