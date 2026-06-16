import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("copa_token")?.value;

  // Página de login admin: se já autenticado como admin, redireciona para /admin
  if (pathname === "/admin/login") {
    if (token) {
      const payload = await verifyJWT(token);
      if (payload?.role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }
    return NextResponse.next();
  }

  // Demais rotas /admin/*: exige autenticação com role=admin
  if (pathname.startsWith("/admin")) {
    if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));
    const payload = await verifyJWT(token);
    if (!payload || payload.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
