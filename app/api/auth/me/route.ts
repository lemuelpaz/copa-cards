import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { id:true, phone:true, name:true, role:true, balance:true, createdAt:true } });
  return NextResponse.json({ user });
}
