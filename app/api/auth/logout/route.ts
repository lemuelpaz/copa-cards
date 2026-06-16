import { NextResponse } from "next/server";
import { clearCookie } from "@/lib/auth";

export const dynamic = 'force-dynamic'


export async function POST() {
  clearCookie();
  return NextResponse.json({ ok: true });
}
